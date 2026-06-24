import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createSupabaseServerClient } from "./supabase/server";

export interface DestinationIntelligenceReport {
  destination: string;
  bestTimeToVisit: string;
  averageDailyCost: number;
  transportationOptions: string[];
  safetyScore: number; // 1 to 10
  foodHighlights: string[];
  culturalHighlights: string[];
  hiddenGems: string[];
  travelWarnings: string[];
}

export const DestinationIntelReportSchema = z.object({
  destination: z.string().min(1),
  bestTimeToVisit: z.string().min(1),
  averageDailyCost: z.number().positive(),
  transportationOptions: z.array(z.string()),
  safetyScore: z.number().int().min(1).max(10),
  foodHighlights: z.array(z.string()),
  culturalHighlights: z.array(z.string()),
  hiddenGems: z.array(z.string()),
  travelWarnings: z.array(z.string()),
});

export const researchDestinationAgent = createServerFn({ method: "POST" })
  .inputValidator(z.object({ destination: z.string().min(1) }))
  .handler(async ({ data }): Promise<DestinationIntelligenceReport> => {
    const supabaseServer = createSupabaseServerClient();
    const targetDest = data.destination.toLowerCase().trim();

    // 1. Repository Lookup Layer
    // Check if we already have this destination structured in our relational tables
    const { data: dbDest, error: dbErr } = await supabaseServer
      .from("destinations")
      .select(`
        name,
        best_season,
        average_budget,
        food_score,
        cities (
          name,
          countries (
            name,
            safety_score
          )
        )
      `)
      .ilike("name", `%${targetDest}%`)
      .maybeSingle();

    if (!dbErr && dbDest) {
      // Safely unpack nested arrays if joined rows return as lists
      const firstCity: any = Array.isArray(dbDest.cities) ? dbDest.cities[0] : dbDest.cities;
      const countryObj: any = Array.isArray(firstCity?.countries) ? firstCity.countries[0] : firstCity?.countries;

      return {
        destination: dbDest.name,
        bestTimeToVisit: dbDest.best_season,
        averageDailyCost: parseFloat(dbDest.average_budget as any),
        transportationOptions: ["Metro system", "Regional trains", "Ride-sharing apps"],
        safetyScore: countryObj?.safety_score || 8,
        foodHighlights: ["Authentic local food markets", "Traditional specialty counters"],
        culturalHighlights: ["Historical temple walks", "Architectural heritage tours"],
        hiddenGems: ["Off-grid scenic viewpoints", "A chef-favored back-alley restaurant"],
        travelWarnings: ["Keep water bottle purchases to sealed brands only."],
      };
    }

    // 2. Fallback Agent Research Logic
    // If not found in the DB, mock a complete research profile of the target destination
    return {
      destination: data.destination,
      bestTimeToVisit: "Spring (April - May) or Autumn (September - October)",
      averageDailyCost: 150,
      transportationOptions: ["Public bus lines", "Ride-hailing cabs", "Bicycle rentals"],
      safetyScore: 8,
      foodHighlights: ["Local market food stalls", "Neighborhood cafés"],
      culturalHighlights: ["Old town heritage walking paths", "Art exhibits"],
      hiddenGems: ["Quiet valley viewpoints", "Family-run bakeries"],
      travelWarnings: ["Watch out for typical pocket picking risks in dense terminal crowds."],
    };
  });
