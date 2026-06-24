import { supabase } from "./supabase/client";
import type { UserProfile, Itinerary, Trip, BudgetResult } from "../types/travel";

export interface ItineraryGenerationMLRecord {
  userPreferences: UserProfile["preferences"];
  prompt: string;
  generatedItinerary: Itinerary;
  budgetResult: BudgetResult;
}

export interface ItineraryModificationMLRecord {
  itineraryId: string;
  activityId: string;
  modificationType: "add" | "remove" | "edit" | "reorder";
  previousState: any;
  newState: any;
}

export interface SpendingComparisonMLRecord {
  tripId: string;
  budgetBreakdown: Trip["budgetBreakdown"];
  actualExpenses: Array<{
    amount: number;
    category: string;
    description: string;
  }>;
}

export interface RatingMLRecord {
  tripId: string;
  rating: number;
  feedback?: string;
  itineraryId?: string;
}

export const learningService = {
  async logItineraryGeneration(userId: string, record: ItineraryGenerationMLRecord): Promise<void> {
    const { error } = await supabase.from("learning_data").insert({
      user_id: userId,
      interaction_type: "ml_itinerary_generation",
      metadata: {
        timestamp: new Date().toISOString(),
        ...record,
      },
    });

    if (error) {
      console.error("Failed to log ML learning generation event:", error);
    }
  },

  async logItineraryModification(userId: string, record: ItineraryModificationMLRecord): Promise<void> {
    const { error } = await supabase.from("learning_data").insert({
      user_id: userId,
      interaction_type: "ml_itinerary_modification",
      metadata: {
        timestamp: new Date().toISOString(),
        ...record,
      },
    });

    if (error) {
      console.error("Failed to log ML modification event:", error);
    }
  },

  async logSpendingComparison(userId: string, record: SpendingComparisonMLRecord): Promise<void> {
    const { error } = await supabase.from("learning_data").insert({
      user_id: userId,
      interaction_type: "ml_spending_comparison",
      metadata: {
        timestamp: new Date().toISOString(),
        ...record,
      },
    });

    if (error) {
      console.error("Failed to log ML spending comparison event:", error);
    }
  },

  async logTripRating(userId: string, record: RatingMLRecord): Promise<void> {
    // Also save directly to trip_ratings table for active operational metrics
    const { error: ratingErr } = await supabase.from("trip_ratings").insert({
      trip_id: record.tripId,
      user_id: userId,
      rating: record.rating,
      feedback: record.feedback,
    });

    if (ratingErr) {
      console.error("Failed to write operational trip rating:", ratingErr);
    }

    const { error: mlErr } = await supabase.from("learning_data").insert({
      user_id: userId,
      interaction_type: "ml_trip_rating",
      metadata: {
        timestamp: new Date().toISOString(),
        ...record,
      },
    });

    if (mlErr) {
      console.error("Failed to log ML rating event:", mlErr);
    }
  },
};
