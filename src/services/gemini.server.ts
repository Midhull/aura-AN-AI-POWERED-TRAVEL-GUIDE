import { z } from "zod";
import process from "node:process";

// 1. Define strict Zod validation schemas for Gemini structured outputs
export const ItineraryActivitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  timeSlot: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Must match HH:MM format"),
  locationName: z.string().min(1),
  category: z.enum(["sightseeing", "dining", "transport", "accommodation", "other"]),
});

export const ItineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  theme: z.string().min(1),
  activities: z.array(ItineraryActivitySchema),
});

export const GeminiItinerarySchema = z.object({
  title: z.string().min(1),
  destination: z.string().min(1),
  days: z.array(ItineraryDaySchema),
});

export type GeminiItinerary = z.infer<typeof GeminiItinerarySchema>;

// Rate limiting configurations (max requests per minute bucket)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const requestTimestamps: number[] = [];

function checkRateLimit() {
  const now = Date.now();
  // Clear expired timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new Error("Rate limit exceeded: Too many requests to Gemini. Please wait.");
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
      console.warn(`Gemini rate limited (429). Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}: ${await res.text()}`);
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

export const geminiService = {
  async generateItinerary(context: {
    travelerProfile: any;
    budgetResult: any;
    feasibilityResult: any;
    recommendedDestinations: any[];
    prompt: string;
  }): Promise<GeminiItinerary> {
    checkRateLimit();

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured on the server.");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
You are Aria, an expert cinematic travel concierge.
You are tasked with generating a detailed, day-by-day travel itinerary content.

CRITICAL INSTRUCTIONS:
1. DO NOT calculate costs or estimate prices under any circumstances. The budget engine handles all calculations.
2. DO NOT output currency amounts, price estimates, or cost breakdown statements.
3. Focus entirely on rich, descriptive copy: locations, culinary highlights, schedules, landmarks, and travel pacing.

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

Do not wrap the JSON response in markdown code blocks like \`\`\`json. Return pure JSON text.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: promptText,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    const response = await fetchWithRetry(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseJson = await response.json();
    const rawText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Empty or malformed content response from Gemini.");
    }

    // Parse and validate via Zod schema to guarantee type safety in production
    try {
      const parsedData = JSON.parse(rawText.trim());
      const validatedItinerary = GeminiItinerarySchema.parse(parsedData);
      return validatedItinerary;
    } catch (parseError: any) {
      console.error("Gemini response parsing/validation failed:", rawText);
      throw new Error(`Failed to validate itinerary schema: ${parseError.message}`);
    }
  },
};
