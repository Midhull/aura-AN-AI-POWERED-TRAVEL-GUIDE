import type { GeminiItinerary } from "./gemini.server";
import type { CompleteBudgetResult } from "./budgetEngine";
import type { UserProfile, Itinerary, DailyItinerary, Activity } from "../types/travel";

export interface ItineraryGenerationInput {
  userProfile: UserProfile | null;
  budgetResult: CompleteBudgetResult;
  geminiResponse: GeminiItinerary;
}

export const itineraryEngine = {
  generate(input: ItineraryGenerationInput): Itinerary {
    const { userProfile, budgetResult, geminiResponse } = input;
    const durationDays = geminiResponse.days.length;

    // Calculate daily limits from budget result
    const dailyDiningCost = Math.round(budgetResult.breakdown.dining / (durationDays || 1));
    const dailyActivityCost = Math.round(budgetResult.breakdown.activities / (durationDays || 1));
    const dailyTransportCost = Math.round(budgetResult.breakdown.transport / (durationDays || 1));

    const processedDays: DailyItinerary[] = geminiResponse.days.map((day) => {
      // 1. Group and enrich activities
      const activities: Activity[] = day.activities.map((act, index) => {
        // Assign costs deterministically from the pre-calculated budget
        let cost = 0;
        if (act.category === "dining") {
          cost = Math.round(dailyDiningCost / Math.max(1, day.activities.filter(a => a.category === "dining").length));
        } else if (act.category === "sightseeing") {
          cost = Math.round(dailyActivityCost / Math.max(1, day.activities.filter(a => a.category === "sightseeing").length));
        } else if (act.category === "transport") {
          cost = Math.round(dailyTransportCost / Math.max(1, day.activities.filter(a => a.category === "transport").length));
        }

        return {
          id: `activity-${day.dayNumber}-${index}`,
          title: act.title,
          description: act.description,
          timeSlot: act.timeSlot,
          durationMinutes: act.category === "dining" ? 90 : 120,
          costEstimate: cost,
          locationName: act.locationName,
          category: act.category,
        };
      });

      // 2. Sort activities chronologically by timeSlot to optimize routes
      const sortedActivities = [...activities].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

      // 3. Generate travel tips and food suggestions deterministically
      const foodSuggestions = sortedActivities
        .filter((a) => a.category === "dining")
        .map((a) => `Try local specialties at ${a.locationName}`)
        if (foodSuggestions.length === 0) {
          foodSuggestions.push("Sample authentic regional street food delicacies near main attractions.");
        }

      return {
        dayNumber: day.dayNumber,
        theme: day.theme,
        activities: sortedActivities,
      };
    });

    return {
      id: `itinerary-${Date.now()}`,
      tripId: `trip-${Date.now()}`,
      days: processedDays,
      version: 1,
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };
  },
};
