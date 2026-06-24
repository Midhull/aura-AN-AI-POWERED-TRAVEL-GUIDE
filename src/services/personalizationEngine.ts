import { supabase } from "./supabase/client";
import { TravelStyle } from "../types/travel";
import type { UserProfile, Trip } from "../types/travel";
import type { ItemFeedback } from "../types/feedback";

export interface TravelDNA {
  luxuryIndex: number;       // 0 to 100
  adventureIntensity: number; // 0 to 100
  cultureFocus: number;       // 0 to 100
  averageBudgetSpend: number; // average total spent per trip
  preferredPace: "relaxed" | "moderate" | "fast-paced";
}

export interface TravelerPreferenceProfile {
  userId: string;
  dna: TravelDNA;
  learnedStyles: TravelStyle[];
  topInterests: string[];
  lastUpdated: string;
}

export const personalizationEngine = {
  async learnPreferences(userId: string): Promise<TravelerPreferenceProfile> {
    // 1. Fetch user's historical context (Trips and Feedback)
    const [tripsRes, feedbackRes] = await Promise.all([
      supabase.from("trips").select(`
        *,
        budgets (
          limit_amount
        )
      `).eq("user_id", userId),
      supabase.from("item_feedback").select("*").eq("user_id", userId),
    ]);

    const trips = tripsRes.data || [];
    const feedback: ItemFeedback[] = (feedbackRes.data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      tripId: row.trip_id,
      itemType: row.item_type,
      itemId: row.item_id,
      rating: row.rating,
      review: row.review,
      createdAt: row.created_at,
    }));

    // 2. Base baseline calculations
    let luxuryCount = 0;
    let adventureCount = 0;
    let cultureCount = 0;
    let totalSpendSum = 0;
    const styleFrequency: Record<string, number> = {};
    const interestFrequency: Record<string, number> = {};

    // Analyze trips
    for (const trip of trips) {
      const budgetLimit = trip.budgets?.[0]?.limit_amount 
        ? parseFloat(trip.budgets[0].limit_amount) 
        : 0;
      totalSpendSum += budgetLimit;

      // Extract style tags from title/destination
      const destLower = trip.destination.toLowerCase();
      if (destLower.includes("bali") || destLower.includes("alps") || destLower.includes("iceland")) {
        adventureCount++;
        interestFrequency["nature"] = (interestFrequency["nature"] || 0) + 1;
        interestFrequency["adventure"] = (interestFrequency["adventure"] || 0) + 1;
      }
      if (destLower.includes("kyoto") || destLower.includes("greece")) {
        cultureCount++;
        interestFrequency["culture"] = (interestFrequency["culture"] || 0) + 1;
        interestFrequency["history"] = (interestFrequency["history"] || 0) + 1;
      }
      if (budgetLimit > 3000) {
        luxuryCount++;
        styleFrequency[TravelStyle.LUXURY] = (styleFrequency[TravelStyle.LUXURY] || 0) + 1;
      } else {
        styleFrequency[TravelStyle.BUDGET] = (styleFrequency[TravelStyle.BUDGET] || 0) + 1;
      }
    }

    // Analyze high rating feedback (> 3 stars)
    const positiveReviews = feedback.filter(f => f.rating >= 4);
    for (const f of positiveReviews) {
      if (f.itemType === "activity") {
        if (f.itemId.includes("scuba") || f.itemId.includes("hike")) {
          adventureCount += 2;
          interestFrequency["adventure"] = (interestFrequency["adventure"] || 0) + 2;
        }
        if (f.itemId.includes("tea") || f.itemId.includes("temple")) {
          cultureCount += 2;
          interestFrequency["culture"] = (interestFrequency["culture"] || 0) + 2;
        }
        if (f.itemId.includes("michelin")) {
          luxuryCount += 2;
          interestFrequency["food"] = (interestFrequency["food"] || 0) + 2;
        }
      }
    }

    const totalTrips = trips.length || 1;
    const totalPositives = positiveReviews.length || 1;

    // Calculate Travel DNA ratios
    const luxuryIndex = Math.round(Math.min(100, (luxuryCount / (totalTrips + totalPositives)) * 100));
    const adventureIntensity = Math.round(Math.min(100, (adventureCount / (totalTrips + totalPositives)) * 100));
    const cultureFocus = Math.round(Math.min(100, (cultureFocusRatio(cultureCount, totalTrips, totalPositives)) * 100));
    const averageBudgetSpend = Math.round(totalSpendSum / totalTrips);

    // Determine pacing preference
    let preferredPace: "relaxed" | "moderate" | "fast-paced" = "moderate";
    if (adventureIntensity > 70) {
      preferredPace = "fast-paced";
    } else if (luxuryIndex > 60) {
      preferredPace = "relaxed";
    }

    // Sort learned styles and top interests by occurrence frequency
    const learnedStyles = Object.entries(styleFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([style]) => style as TravelStyle)
      .slice(0, 3);

    const topInterests = Object.entries(interestFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([interest]) => interest)
      .slice(0, 5);

    // 3. Write learned preferences back to User profile preferences table
    if (trips.length > 0) {
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("preferences")
          .eq("uid", userId)
          .single();

        if (profile) {
          const updatedPrefs = {
            ...profile.preferences,
            styles: learnedStyles.length > 0 ? learnedStyles : profile.preferences.styles,
          };
          await supabase
            .from("users")
            .update({ preferences: updatedPrefs, updated_at: new Date().toISOString() })
            .eq("uid", userId);
        }
      } catch (dbErr) {
        console.error("Failed to persist learned user preferences:", dbErr);
      }
    }

    return {
      userId,
      dna: {
        luxuryIndex,
        adventureIntensity,
        cultureFocus,
        averageBudgetSpend,
        preferredPace,
      },
      learnedStyles,
      topInterests,
      lastUpdated: new Date().toISOString(),
    };
  },
};

function cultureFocusRatio(cultureCount: number, totalTrips: number, totalPositives: number): number {
  return cultureCount / (totalTrips + totalPositives);
}
