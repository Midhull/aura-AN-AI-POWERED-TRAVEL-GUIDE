import type { UserProfile, Trip } from "../types/travel";
import { TravelStyle, FoodPreference } from "../types/travel";
import type { TravelDNA } from "./personalizationEngine";

export enum TravelerArchetype {
  ADVENTURE_EXPLORER = "Adventure Explorer",
  LUXURY_ESCAPIST = "Luxury Escapist",
  FOOD_ENTHUSIAST = "Food Enthusiast",
  BUDGET_BACKPACKER = "Budget Backpacker",
  FAMILY_PLANNER = "Family Planner",
}

export interface TravelDNAProfile {
  userId: string;
  archetype: TravelerArchetype;
  dnaScores: {
    adventureScore: number; // 0 to 100
    luxuryScore: number;    // 0 to 100
    foodScore: number;      // 0 to 100
    budgetScore: number;    // 0 to 100
    familyScore: number;    // 0 to 100
  };
  pacingPreference: "relaxed" | "moderate" | "fast-paced";
  explanations: string[];
}

export const travelDNASystem = {
  // 1. Scoring Engine & Profile Generation System
  calculate(userProfile: UserProfile, pastTrips: Trip[]): TravelDNAProfile {
    const prefs = userProfile.preferences;
    const explanations: string[] = [];

    // Base scores extracted from profile static preferences
    let adventureScore = prefs.styles.includes(TravelStyle.ADVENTURE) ? 70 : 30;
    let luxuryScore = prefs.styles.includes(TravelStyle.LUXURY) ? 70 : 30;
    let budgetScore = (prefs.styles.includes(TravelStyle.BUDGET) || prefs.styles.includes(TravelStyle.BACKPACKING)) ? 70 : 30;
    let foodScore = prefs.food.filter(f => f !== FoodPreference.NO_RESTRICTIONS).length * 15 + 30;
    let familyScore = 30; // base default

    // Parse past trip structures to adjust DNA scores
    for (const trip of pastTrips) {
      if (trip.travelersCount > 2) {
        familyScore += 15;
      }
      if (trip.budgetLimit > 3500) {
        luxuryScore += 10;
        budgetScore -= 10;
      } else if (trip.budgetLimit < 1000) {
        budgetScore += 15;
        luxuryScore -= 10;
      }
      if (trip.destination.toLowerCase().includes("bali") || trip.destination.toLowerCase().includes("alps")) {
        adventureScore += 10;
      }
    }

    // Clamp values (0 to 100)
    adventureScore = Math.min(100, Math.max(0, adventureScore));
    luxuryScore = Math.min(100, Math.max(0, luxuryScore));
    foodScore = Math.min(100, Math.max(0, foodScore));
    budgetScore = Math.min(100, Math.max(0, budgetScore));
    familyScore = Math.min(100, Math.max(0, familyScore));

    // 2. Traveler Archetype Assignment Logic
    let archetype = TravelerArchetype.FAMILY_PLANNER;
    const scores = { adventureScore, luxuryScore, foodScore, budgetScore, familyScore };
    
    const maxScore = Math.max(adventureScore, luxuryScore, foodScore, budgetScore, familyScore);

    if (maxScore === adventureScore) {
      archetype = TravelerArchetype.ADVENTURE_EXPLORER;
      explanations.push("You thrive on physical challenges, hiking, and exploring uncharted nature trails.");
    } else if (maxScore === luxuryScore) {
      archetype = TravelerArchetype.LUXURY_ESCAPIST;
      explanations.push("You prioritize comfort, premium lodgings, private transit, and curated spa/wellness retreats.");
    } else if (maxScore === foodScore) {
      archetype = TravelerArchetype.FOOD_ENTHUSIAST;
      explanations.push("Your travel routes are led by culinary reviews, local food markets, and high-quality dining bookings.");
    } else if (maxScore === budgetScore) {
      archetype = TravelerArchetype.BUDGET_BACKPACKER;
      explanations.push("You seek maximum value, choosing local transit passes and authentic budget homestays.");
    } else {
      archetype = TravelerArchetype.FAMILY_PLANNER;
      explanations.push("You structure plans around group dynamics, choosing family-friendly sites with low difficulty thresholds.");
    }

    let pacingPreference: "relaxed" | "moderate" | "fast-paced" = "moderate";
    if (adventureScore > 75) pacingPreference = "fast-paced";
    else if (luxuryScore > 75) pacingPreference = "relaxed";

    return {
      userId: userProfile.uid,
      archetype,
      dnaScores: scores,
      pacingPreference,
      explanations,
    };
  },

  // 3. Recommendation Personalizer Filter matching Travel DNA
  applyDNAScores(
    overallScore: number,
    dnaProfile: TravelDNAProfile,
    destinationScores: {
      isAdventure: boolean;
      isLuxury: boolean;
      isFoodScene: boolean;
      isBudgetFriendly: boolean;
      isFamilyOriented: boolean;
    }
  ): number {
    let bonus = 0;

    if (destinationScores.isAdventure) bonus += (dnaProfile.dnaScores.adventureScore / 100) * 8;
    if (destinationScores.isLuxury) bonus += (dnaProfile.dnaScores.luxuryScore / 100) * 8;
    if (destinationScores.isFoodScene) bonus += (dnaProfile.dnaScores.foodScore / 100) * 8;
    if (destinationScores.isBudgetFriendly) bonus += (dnaProfile.dnaScores.budgetScore / 100) * 8;
    if (destinationScores.isFamilyOriented) bonus += (dnaProfile.dnaScores.familyScore / 100) * 8;

    return Math.min(100, Math.round(overallScore + bonus));
  },
};
