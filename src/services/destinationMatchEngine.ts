import type { DestinationIntel } from "../types/destinationIntel";
import type { UserProfile } from "../types/travel";
import { supabase } from "./supabase/client";
import latestModel from "../assets/models/destination_lgbm_latest.json";

export interface DestinationScore {
  destination: DestinationIntel;
  overallScore: number; // 0 to 100
  breakdown: {
    budgetMatch: number;      // 0 to 100
    styleMatch: number;       // 0 to 100
    foodMatch: number;        // 0 to 100
    weatherMatch: number;     // 0 to 100
    activityMatch: number;    // 0 to 100
    familyMatch: number;      // 0 to 100
    accessibilityMatch: number; // 0 to 100
  };
  explanations: string[];
}

// --- Native LGBM Tree Interpreter for Shadow Mode Predictions ---
interface LGBMTreeNode {
  split?: string;
  threshold?: number;
  left?: LGBMTreeNode;
  right?: LGBMTreeNode;
  leaf?: number;
}

const LGBM_STYLE_MAP: Record<string, number> = {
  LUXURY: 0,
  BOUTIQUE: 1,
  BUDGET: 2,
  ADVENTURE: 3,
  BACKPACKING: 4,
  RELAXING: 5,
  CULTURAL: 6,
};

function evaluateLGBMTree(node: LGBMTreeNode, features: Record<string, number>): number {
  if (node.leaf !== undefined) {
    return node.leaf;
  }
  const splitFeature = node.split;
  const splitThreshold = node.threshold;
  if (
    splitFeature === undefined ||
    splitThreshold === undefined ||
    node.left === undefined ||
    node.right === undefined
  ) {
    return 0;
  }
  const val = features[splitFeature] !== undefined ? features[splitFeature] : 0;
  return val <= splitThreshold ? evaluateLGBMTree(node.left, features) : evaluateLGBMTree(node.right, features);
}

function predictMLScore(destination: DestinationIntel, userProfile: UserProfile): number {
  const prefs = userProfile.preferences;
  const max_daily_budget = prefs.maxDailyBudget || 200;
  const average_budget = destination.averageBudget;
  const budget_delta = max_daily_budget - average_budget;
  
  const styles = prefs.styles || [];
  const primary_style = styles[0] ? styles[0].toString().toUpperCase() : "BOUTIQUE";
  const primary_style_idx = LGBM_STYLE_MAP[primary_style] !== undefined ? LGBM_STYLE_MAP[primary_style] : 1;
  
  const destStyles = destination.styles || [];
  const style_match = destStyles.some(ds => 
    styles.some(us => us.toString().toUpperCase() === ds.toUpperCase())
  ) ? 1.0 : 0.0;
  
  const userInterests = prefs.food?.map(f => f.toString()) || [];
  const matchingInterests = (destination.interests || []).filter(di => 
    userInterests.some(ui => ui.toLowerCase().includes(di.toLowerCase()) || di.toLowerCase().includes(ui.toLowerCase()))
  );
  const interests_match_count = matchingInterests.length;

  const features: Record<string, number> = {
    max_daily_budget,
    average_budget,
    budget_delta,
    primary_style_idx,
    style_match,
    food_score: destination.foodScore,
    family_friendly_score: destination.familyFriendlyScore,
    travel_difficulty: destination.travelDifficulty,
    interests_match_count,
  };

  let prediction = (latestModel as any).base_score;
  for (const tree of (latestModel as any).trees) {
    prediction += evaluateLGBMTree(tree, features);
  }
  return Math.min(100, Math.max(0, prediction));
}

export const destinationMatchEngine = {
  score(destination: DestinationIntel, userProfile: UserProfile): DestinationScore {
    const explanations: string[] = [];
    const prefs = userProfile.preferences;

    // 1. Budget Match (20% weight)
    const destDailyCost = destination.averageBudget;
    const userDailyLimit = prefs.maxDailyBudget || 200;
    let budgetMatch = 100;
    if (destDailyCost > userDailyLimit) {
      budgetMatch = Math.max(0, Math.round(100 - ((destDailyCost - userDailyLimit) / userDailyLimit) * 100));
    }
    if (budgetMatch >= 90) {
      explanations.push(`Fits comfortably within your daily spending threshold ($${destDailyCost}/day).`);
    } else if (budgetMatch < 50) {
      explanations.push(`Cost warning: average daily cost ($${destDailyCost}/day) is higher than your preference.`);
    }

    // 2. Travel Style Match (15% weight)
    const userStyles = prefs.styles || [];
    let styleMatch = 50; // default baseline
    const matchingStyles = destination.styles.filter(ds => 
      userStyles.some(us => us.toString().toUpperCase() === ds.toUpperCase())
    );
    if (userStyles.length > 0) {
      styleMatch = Math.round((matchingStyles.length / userStyles.length) * 50 + 50);
    }
    if (matchingStyles.length > 0) {
      explanations.push(`Matches your preferred travel styles: ${matchingStyles.join(", ")}.`);
    }

    // 3. Food Match (15% weight)
    const foodMatch = destination.foodScore * 10;
    if (destination.foodScore >= 8) {
      explanations.push(`Renowned culinary scene with a food score of ${destination.foodScore}/10.`);
    }

    // 4. Weather Match (10% weight)
    const weatherMatch = 85; // Baseline default
    explanations.push(`Best season to visit is ${destination.bestSeason}.`);

    // 5. Activity Match (15% weight)
    const userInterests = prefs.food.map(f => f.toString()) || [];
    const matchingInterests = destination.interests.filter(di => 
      userInterests.some(ui => ui.toLowerCase().includes(di.toLowerCase()) || di.toLowerCase().includes(ui.toLowerCase()))
    );
    const activityMatch = userInterests.length > 0 
      ? Math.round((matchingInterests.length / userInterests.length) * 50 + 50) 
      : 80;
    if (matchingInterests.length > 0) {
      explanations.push(`Matches your active interests: ${matchingInterests.join(", ")}.`);
    }

    // 6. Family Compatibility (15% weight)
    const familyMatch = destination.familyFriendlyScore * 10;
    if (destination.familyFriendlyScore >= 8) {
      explanations.push("Highly rated as a family-friendly destination with great infrastructure.");
    }

    // 7. Accessibility (10% weight)
    const accessibilityMatch = (6 - destination.travelDifficulty) * 20;
    if (destination.travelDifficulty <= 2) {
      explanations.push("Excellent accessibility with low travel difficulty and mature transport links.");
    } else if (destination.travelDifficulty >= 4) {
      explanations.push("Pacing Warning: Remote location with higher travel difficulty.");
    }

    // Weighted average sum calculation
    const overallScore = Math.round(
      budgetMatch * 0.20 +
      styleMatch * 0.15 +
      foodMatch * 0.15 +
      weatherMatch * 0.10 +
      activityMatch * 0.15 +
      familyMatch * 0.15 +
      accessibilityMatch * 0.10
    );

    return {
      destination,
      overallScore,
      breakdown: {
        budgetMatch,
        styleMatch,
        foodMatch,
        weatherMatch,
        activityMatch,
        familyMatch,
        accessibilityMatch,
      },
      explanations,
    };
  },

  rank(destinations: DestinationIntel[], userProfile: UserProfile): DestinationScore[] {
    // 1. Calculate rule scores and rank destinations using rule-based recommendation engine
    const ruleScores = destinations
      .map(dest => this.score(dest, userProfile))
      .sort((a, b) => b.overallScore - a.overallScore);

    // 2. Perform GBDT Destination Ranking Model predictions in Shadow Mode
    // Executed asynchronously in the background so it does not affect user experience or block main flow
    try {
      const mlScores = destinations.map(dest => {
        try {
          const score = predictMLScore(dest, userProfile);
          return {
            destination_id: dest.id,
            name: dest.name,
            score: Math.round(score),
          };
        } catch (err: any) {
          // fallback to rule overall score
          const ruleScore = this.score(dest, userProfile);
          return {
            destination_id: dest.id,
            name: dest.name,
            score: ruleScore.overallScore,
          };
        }
      });

      // Sort ML scores descending
      const mlRankingSorted = [...mlScores]
        .sort((a, b) => b.score - a.score)
        .map((item, index) => ({
          rank: index + 1,
          destination_id: item.destination_id,
          name: item.name,
          score: item.score,
        }));

      const ruleRankingSorted = ruleScores.map((item, index) => ({
        rank: index + 1,
        destination_id: item.destination.id,
        name: item.destination.name,
        score: item.overallScore,
      }));

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userProfile.uid || "");
      const dbUserId = isUuid ? userProfile.uid : null;

      // Only attempt logging if the user is authenticated (prevents RLS/401 errors for guests)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user || !dbUserId) {
          console.log("[Shadow Mode] Bypassing shadow destination rankings logging for guest user.");
          return;
        }

        supabase
          .from("ml_destination_shadow_analytics")
          .insert({
            user_id: dbUserId,
            input_destinations: destinations.map(d => ({ id: d.id, name: d.name })),
            rule_ranking: ruleRankingSorted,
            ml_ranking: mlRankingSorted,
          })
          .then(({ error }) => {
            if (error) {
              console.warn("[Shadow Mode] Failed to log destination shadow analytics:", error.message);
            }
          });
      });
    } catch (err: any) {
      console.warn("[Shadow Mode] Failed to log shadow destination rankings:", err.message);
    }

    // 3. Return the rule-based rankings (current recommendation engine remains primary)
    return ruleScores;
  }
};
