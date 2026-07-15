import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DestinationSearchEngine, DestinationService } from "./destinationIntel";

export const queryDestinations = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      query: z.string().optional(),
      maxBudget: z.number().optional(),
      interests: z.array(z.string()).optional(),
      style: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    return await DestinationSearchEngine.search(data);
  });

export const getDestinationInfo = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      destinationId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    return await DestinationService.getFullDestinationData(data.destinationId);
  });

export const getHotelSuggestions = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      location: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GROK_API_KEY || "";
    if (!apiKey) {
      throw new Error("GROK_API_KEY environment variable is not configured on the server.");
    }

    const isGroq = apiKey.startsWith("gsk_");
    const endpoint = isGroq ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.x.ai/v1/chat/completions";
    const model = isGroq ? "llama-3.3-70b-versatile" : "grok-2";

    const systemPrompt = `You are Aria's expert travel concierge.
Given a location, recommend 6 real, highly-rated, and famous luxury or boutique hotels/stays in that city.
Return your output strictly as a structured JSON object complying with this schema:
{
  "hotels": [
    {
      "name": "String (famous real hotel name)",
      "vicinity": "String (actual road name, district, or neighborhood in that city)",
      "rating": Float (realistic rating between 4.3 and 4.9),
      "reviewsCount": Integer (realistic review count between 100 and 3000)
    }
  ]
}`;

    const userPrompt = `Location: ${data.location}`;

    const requestBody = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}: ${await response.text()}`);
    }

    const responseJson = await response.json();
    const rawText = responseJson.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error("Empty content response from Groq.");
    }

    const parsedData = JSON.parse(rawText.trim());
    return (parsedData.hotels || []) as Array<{
      name: string;
      vicinity: string;
      rating: number;
      reviewsCount: number;
    }>;
  });

