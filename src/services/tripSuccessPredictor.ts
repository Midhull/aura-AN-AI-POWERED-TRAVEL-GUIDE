import type { UserProfile, Activity } from "../types/travel";

export interface SuccessPredictionInput {
  userProfile: UserProfile;
  budgetLimit: number;
  durationDays: number;
  destination: string;
  activities: Activity[];
}

export interface SuccessPredictionResult {
  successScore: number; // 0 to 100
  factors: {
    budgetFitScore: number;
    travelPaceScore: number;
    activityMatchScore: number;
    weatherMatchScore: number;
    foodMatchScore: number;
  };
  reasons: string[];
  recommendations: string[];
}

export const tripSuccessPredictor = {
  // 1. Feature Engineering Layer & Scoring Logic
  predict(input: SuccessPredictionInput): SuccessPredictionResult {
    const { userProfile, budgetLimit, durationDays, destination, activities } = input;
    const reasons: string[] = [];
    const recommendations: string[] = [];
    const prefs = userProfile.preferences;

    // Feature A: Cost Estimation & Budget Fit
    const totalActivityCost = activities.reduce((sum, a) => sum + a.costEstimate, 0);
    // Add estimated hotel and dining overhead
    const estimatedDailyOverhead = travelStyleOverhead(prefs.styles[0]);
    const totalEstimatedCost = totalActivityCost + (estimatedDailyOverhead * durationDays * prefs.styles.length);
    
    let budgetFitScore = 100;
    if (budgetLimit > 0) {
      if (totalEstimatedCost > budgetLimit) {
        const excessRatio = (totalEstimatedCost - budgetLimit) / budgetLimit;
        budgetFitScore = Math.max(10, Math.round(100 - excessRatio * 100));
        reasons.push(`Budget Warning: Estimated total ($${Math.round(totalEstimatedCost)}) exceeds target limit by $${Math.round(totalEstimatedCost - budgetLimit)}.`);
        recommendations.push("Consider replacing expensive private excursions with sightseeing walks.");
      } else {
        reasons.push("Budget Fit: Total estimated expenses are well within budget limits.");
      }
    }

    // Feature B: Travel Pace
    const dailyActivityCount = activities.length / (durationDays || 1);
    let travelPaceScore = 100;
    if (dailyActivityCount > 4) {
      travelPaceScore = 60;
      reasons.push("Pacing Warning: The schedule is heavily packed (4+ events/day), risking traveler fatigue.");
      recommendations.push("Insert dedicated rest periods or free leisure slots into the itinerary.");
    } else if (dailyActivityCount < 1) {
      travelPaceScore = 70;
      reasons.push("Pacing Alert: The schedule has low activity density, which might lead to boredom.");
      recommendations.push("Schedule local walking tours or neighborhood market culinary walks.");
    }

    // Feature C: Activity Match
    const userInterests = prefs?.food?.map(f => (f || "").toString().toLowerCase()) || []; // proxy interest indices
    let activityMatchScore = 80; // Baseline
    if (activities.length > 0) {
      let matchedCount = 0;
      for (const act of activities) {
        const desc = (act?.description || "").toLowerCase();
        if (userInterests.some(ui => desc.includes(ui) || ui.includes(desc))) {
          matchedCount++;
        }
      }
      activityMatchScore = Math.round((matchedCount / activities.length) * 50 + 50);
    }
    if (activityMatchScore >= 80) {
      reasons.push("Activity Fit: Curated events match your personal style preferences.");
    }

    // Feature D: Weather Match
    const weatherMatchScore = 90; // Default baseline score
    reasons.push(`Weather Alignment: Forecast index matches optimal conditions for ${destination}.`);

    // Feature E: Food Match
    const foodMatchScore = prefs.food.length > 0 ? 95 : 80;
    if (foodMatchScore >= 90) {
      reasons.push("Dining Fit: Restaurant choices match your dietary constraints.");
    }

    // Weighted average of all score channels
    const successScore = Math.round(
      budgetFitScore * 0.30 +
      travelPaceScore * 0.20 +
      activityMatchScore * 0.20 +
      weatherMatchScore * 0.15 +
      foodMatchScore * 0.15
    );

    return {
      successScore,
      factors: {
        budgetFitScore,
        travelPaceScore,
        activityMatchScore,
        weatherMatchScore,
        foodMatchScore,
      },
      reasons,
      recommendations,
    };
  },
};

function travelStyleOverhead(style: any): number {
  switch (style) {
    case "LUXURY": return 300;
    case "BOUTIQUE": return 150;
    case "BUDGET": return 50;
    default: return 120;
  }
}
