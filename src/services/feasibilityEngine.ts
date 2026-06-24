import type { TravelerProfile, UserProfile } from "../types/travel";
import type { CompleteBudgetResult } from "./budgetEngine";

export type FeasibilityStatus = "Feasible" | "Borderline" | "Not Feasible";

export interface FeasibilityAnalysis {
  status: FeasibilityStatus;
  score: number; // 0 to 100
  reasons: string[];
  alternatives: string[];
}

export const feasibilityEngine = {
  analyze(
    budgetResult: CompleteBudgetResult,
    userProfile: UserProfile | null,
    travelerProfilesCount: number
  ): FeasibilityAnalysis {
    const reasons: string[] = [];
    const alternatives: string[] = [];
    
    // 1. Calculate base score from budget score
    let score = budgetResult.budgetScore;

    // 2. Perform budget-to-user constraint alignment checks
    const userLimit = userProfile?.preferences.maxDailyBudget 
      ? userProfile.preferences.maxDailyBudget * budgetResult.breakdown.total / (budgetResult.breakdown.total || 1) // proxy calculation
      : 0;

    const isExceeding = !budgetResult.isWithinBudget;

    if (isExceeding) {
      reasons.push(`The estimated total cost ($${budgetResult.breakdown.total}) exceeds your designated budget limit.`);
      score = Math.max(0, score - 15);
    } else {
      reasons.push("The estimated itinerary fits comfortably within your financial parameters.");
    }

    // Check emergency buffer adequacy
    const emergencyBufferRatio = budgetResult.granular.emergencyBuffer / (budgetResult.breakdown.total || 1);
    if (emergencyBufferRatio < 0.08) {
      reasons.push("Safety Warning: The allocated emergency reserve is less than 8% of total expenses.");
      score = Math.max(0, score - 10);
      alternatives.push("Increase the emergency buffer manually to protect against unforeseen transit fluctuations.");
    }

    // Check traveler profiles completeness
    if (travelerProfilesCount === 0) {
      reasons.push("Missing document detail alerts: No traveler profiles or emergency contacts mapped.");
      score = Math.max(0, score - 5);
      alternatives.push("Complete passport details and configure active traveler profiles to enable booking triggers.");
    }

    // 3. Map score to Feasibility Status
    let status: FeasibilityStatus = "Feasible";
    if (score < 45) {
      status = "Not Feasible";
    } else if (score < 75) {
      status = "Borderline";
    }

    // 4. Generate deterministic alternatives based on status
    if (status === "Not Feasible" || status === "Borderline") {
      alternatives.push("Reduce duration days to decrease lodging and daily activities cost index.");
      alternatives.push("Change selection tier to a lower specification (e.g. luxury down to mid-range).");
      alternatives.push("Choose secondary destination terminals or select public transit passes.");
    } else {
      alternatives.push("Opt to upgrade to mid-range or luxury options to utilize the remaining budget headroom.");
    }

    return {
      status,
      score,
      reasons,
      alternatives,
    };
  },
};
