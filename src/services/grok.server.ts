import { z } from "zod";
import process from "node:process";
import { GeminiItinerarySchema, type GeminiItinerary } from "./gemini.server";

// Rate limiting configurations (max requests per minute bucket for Grok)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const requestTimestamps: number[] = [];

function checkRateLimit() {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new Error("Rate limit exceeded: Too many requests to Grok. Please wait.");
  }
  requestTimestamps.push(now);
}

// Retry logic wrapper with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (res.status === 429 && retries > 0) {
      console.warn(`Grok rate limited (429). Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    if (!res.ok) {
      throw new Error(`Grok API returned status ${res.status}: ${await res.text()}`);
    }
    return res;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch failed, retrying in ${delayMs}ms...`, error);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

export const grokService = {
  async generateItinerary(context: {
    travelerProfile: any;
    budgetResult: any;
    feasibilityResult: any;
    recommendedDestinations: any[];
    prompt: string;
  }): Promise<GeminiItinerary> {
    checkRateLimit();

    const apiKey = process.env.GROK_API_KEY || "";
    if (!apiKey) {
      throw new Error("GROK_API_KEY environment variable is not configured on the server.");
    }

    const isGroq = apiKey.startsWith("gsk_");
    const endpoint = isGroq ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.x.ai/v1/chat/completions";
    const model = isGroq ? "llama-3.3-70b-versatile" : "grok-2";

    const systemPrompt = `You are Aria, an expert cinematic travel concierge.
You are tasked with generating a detailed, day-by-day travel itinerary content.

CRITICAL INSTRUCTIONS:
1. DO NOT calculate costs or estimate prices under any circumstances. The budget engine handles all calculations.
2. DO NOT output currency amounts, price estimates, or cost breakdown statements.
3. Focus entirely on rich, descriptive copy: locations, culinary highlights, schedules, landmarks, and travel pacing.`;

    const userPrompt = `
CONTEXT BINDINGS:
- Traveler Profile: ${JSON.stringify(context.travelerProfile)}
- Pre-calculated Budget Metrics: ${JSON.stringify(context.budgetResult)}
- Feasibility Analysis: ${JSON.stringify(context.feasibilityResult)}
- Recommended Destination Selection: ${JSON.stringify(context.recommendedDestinations)}

USER PREFERENCE GUIDELINES:
"${context.prompt}"

Return your output strictly as a structured JSON object complying with this JSON schema:
{
  "title": "String (itinerary title)",
  "destination": "String (selected destination name)",
  "days": [
    {
      "dayNumber": Integer,
      "theme": "String (theme of the day)",
      "activities": [
        {
          "title": "String (activity name)",
          "description": "String (rich description)",
          "timeSlot": "String (must be in HH:MM format, e.g., '09:00', '14:30')",
          "locationName": "String (landmark/place name)",
          "category": "sightseeing" | "dining" | "transport" | "accommodation" | "other"
        }
      ]
    }
  ]
}
`;

    const requestBody = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    };

    const response = await fetchWithRetry(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
    });

    const responseJson = await response.json();
    const rawText = responseJson.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error("Empty or malformed content response from Grok.");
    }

    try {
      const parsedData = JSON.parse(rawText.trim());
      const validatedItinerary = GeminiItinerarySchema.parse(parsedData);
      return validatedItinerary;
    } catch (parseError: any) {
      console.error("Grok response parsing/validation failed:", rawText);
      throw new Error(`Failed to validate itinerary schema: ${parseError.message}`);
    }
  },
};
