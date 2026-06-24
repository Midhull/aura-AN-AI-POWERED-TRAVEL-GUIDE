import type { UserProfile, Activity } from "../types/travel";
import { TravelStyle } from "../types/travel";
import { supabase } from "./supabase/client";
import latestModel from "../assets/models/activity_model_latest.json";

export interface ActivityScore {
  activityId: string;
  overallScore: number; // 0 to 100
  ageScore: number;
  budgetScore: number;
  interestScore: number;
  styleScore: number;
}

export interface ActivityRecommendation {
  activity: Activity;
  score: ActivityScore;
  reasons: string[];
}

export type ActivityFilterType =
  | "Adventure"
  | "Luxury"
  | "Culture"
  | "Food"
  | "Photography"
  | "Nature"
  | "Shopping";

// Catalog of default activities to recommend/rank
const DEFAULT_ACTIVITIES_CATALOG: Array<Omit<Activity, "id"> & {
  id: string;
  minAge: number;
  maxAge: number;
  tags: string[];
  styles: TravelStyle[];
  filterType: ActivityFilterType;
}> = [
  {
    id: "act-scuba-bali",
    title: "Deep Sea Scuba Diving",
    description: "Explore coral reefs and underwater shipwrecks with certified instructors.",
    timeSlot: "09:00",
    durationMinutes: 180,
    costEstimate: 120,
    locationName: "Tulamben USAT Liberty Wreck",
    category: "sightseeing",
    minAge: 12,
    maxAge: 55,
    tags: ["nature", "diving", "ocean", "adventure"],
    styles: [TravelStyle.ADVENTURE],
    filterType: "Adventure",
  },
  {
    id: "act-tea-kyoto",
    title: "Private Zen Tea Ceremony",
    description: "Traditional tea ritual led by a master inside a private wooden garden house.",
    timeSlot: "15:00",
    durationMinutes: 90,
    costEstimate: 80,
    locationName: "Gion Historical District Tea House",
    category: "sightseeing",
    minAge: 6,
    maxAge: 85,
    tags: ["history", "culture", "calm", "traditional"],
    styles: [TravelStyle.BOUTIQUE, TravelStyle.LUXURY, TravelStyle.RELAXING],
    filterType: "Culture",
  },
  {
    id: "act-michelin-tokyo",
    title: "12-Course Omakase Dinner",
    description: "Savor premium seasonal cuts prepared by a Michelin-starred sushi chef.",
    timeSlot: "19:30",
    durationMinutes: 120,
    costEstimate: 300,
    locationName: "Ginza Premium Sushi Counter",
    category: "dining",
    minAge: 16,
    maxAge: 90,
    tags: ["sushi", "dining", "luxury", "food"],
    styles: [TravelStyle.LUXURY],
    filterType: "Luxury",
  },
  {
    id: "act-hike-alps",
    title: "Alpine Peak Ridge Hike",
    description: "Exhilarating trek along alpine meadows with dramatic panorama views.",
    timeSlot: "08:00",
    durationMinutes: 240,
    costEstimate: 15,
    locationName: "Grindelwald First Ridge Path",
    category: "sightseeing",
    minAge: 10,
    maxAge: 60,
    tags: ["hiking", "mountains", "nature", "adventure"],
    styles: [TravelStyle.ADVENTURE, TravelStyle.BACKPACKING],
    filterType: "Nature",
  },
  {
    id: "act-shoot-santorini",
    title: "Golden Hour Photo Shoot",
    description: "A private photography guide takes you through the blue domes and caldera paths.",
    timeSlot: "17:30",
    durationMinutes: 120,
    costEstimate: 150,
    locationName: "Oia Cliffside Walkways",
    category: "sightseeing",
    minAge: 1,
    maxAge: 95,
    tags: ["sunset", "views", "photography", "memories"],
    styles: [TravelStyle.LUXURY, TravelStyle.BOUTIQUE],
    filterType: "Photography",
  },
];

// --- Native GBDT Tree Interpreter for Shadow Mode Predictions ---
interface ActivityModelTreeNode {
  split?: string;
  threshold?: number;
  left?: ActivityModelTreeNode;
  right?: ActivityModelTreeNode;
  leaf?: number;
}

const TRAVELER_TYPE_MAP: Record<string, number> = { Solo: 0, Couple: 1, Family: 2, Group: 3 };
const AGE_GROUP_MAP: Record<string, number> = { "18-25": 0, "26-35": 1, "36-50": 2, "51-65": 3, "66+": 4 };
const BUDGET_TIER_MAP: Record<string, number> = { BUDGET: 0, BOUTIQUE: 1, LUXURY: 2 };
const STYLE_MAP: Record<string, number> = {
  LUXURY: 0,
  BOUTIQUE: 1,
  BUDGET: 2,
  ADVENTURE: 3,
  BACKPACKING: 4,
  RELAXING: 5,
  CULTURAL: 6,
};
const FOOD_MAP: Record<string, number> = {
  VEGETARIAN: 0,
  VEGAN: 1,
  GLUTEN_FREE: 2,
  HALAL: 3,
  KOSHER: 4,
  NO_RESTRICTIONS: 5,
};
const MOBILITY_MAP: Record<string, number> = { Low: 0, Medium: 1, High: 2 };
const SEASON_MAP: Record<string, number> = { Spring: 0, Summer: 1, Autumn: 2, Winter: 3 };
const DEST_MAP: Record<string, number> = { "Tokyo, Japan": 0, "Paris, France": 1, "Reykjavik, Iceland": 2, "Bali, Indonesia": 3, "Kyoto, Japan": 4 };
const ACTIVITY_ID_MAP: Record<string, number> = {
  "act-scuba-bali": 0,
  "act-tea-kyoto": 1,
  "act-michelin-tokyo": 2,
  "act-hike-alps": 3,
  "act-shoot-santorini": 4,
};

function evaluateActivityTree(node: ActivityModelTreeNode, features: Record<string, number>): number {
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
  return val <= splitThreshold ? evaluateActivityTree(node.left, features) : evaluateActivityTree(node.right, features);
}

function predictActivityMLScore(
  activity: any,
  userProfile: UserProfile,
  userAge: number,
  destination: string,
  season: string,
  tripDuration: number
): number {
  const prefs = userProfile.preferences;
  
  // 1. Resolve categorical inputs
  const traveler_type = "Solo";
  
  let age_group = "36-50";
  if (userAge <= 25) age_group = "18-25";
  else if (userAge <= 35) age_group = "26-35";
  else if (userAge <= 65) age_group = "51-65";
  else if (userAge > 65) age_group = "66+";
  
  let budget_tier = "BOUTIQUE";
  if (prefs.maxDailyBudget <= 100) budget_tier = "BUDGET";
  else if (prefs.maxDailyBudget >= 300) budget_tier = "LUXURY";
  
  const primaryStyle = prefs.styles?.[0] ? prefs.styles[0].toString().toUpperCase() : "BOUTIQUE";
  const primaryFood = prefs.food?.[0] ? prefs.food[0].toString().toUpperCase() : "NO_RESTRICTIONS";
  const mobility_level = "Medium";
  
  // 2. Map categoricals
  const traveler_type_encoded = TRAVELER_TYPE_MAP[traveler_type] !== undefined ? TRAVELER_TYPE_MAP[traveler_type] : 0;
  const age_group_encoded = AGE_GROUP_MAP[age_group] !== undefined ? AGE_GROUP_MAP[age_group] : 2;
  const budget_tier_encoded = BUDGET_TIER_MAP[budget_tier] !== undefined ? BUDGET_TIER_MAP[budget_tier] : 1;
  const travel_style_encoded = STYLE_MAP[primaryStyle] !== undefined ? STYLE_MAP[primaryStyle] : 1;
  const food_preference_encoded = FOOD_MAP[primaryFood] !== undefined ? FOOD_MAP[primaryFood] : 5;
  const mobility_level_encoded = MOBILITY_MAP[mobility_level] !== undefined ? MOBILITY_MAP[mobility_level] : 1;
  const dest_encoded = DEST_MAP[destination] !== undefined ? DEST_MAP[destination] : 0;
  const season_encoded = SEASON_MAP[season] !== undefined ? SEASON_MAP[season] : 1;
  const activity_id_encoded = ACTIVITY_ID_MAP[activity.id] !== undefined ? ACTIVITY_ID_MAP[activity.id] : 0;
  
  // 3. Compute derived matches
  const style_match = (activity.styles || []).some((as: any) => 
    (prefs.styles || []).some((us: any) => us.toString().toUpperCase() === as.toString().toUpperCase())
  ) ? 1.0 : 0.0;
  
  const userInterests = prefs.food?.map((f: any) => f.toString().toLowerCase()) || [];
  const matchedInterests = (activity.tags || []).filter((tag: string) =>
    userInterests.some((ui: string) => ui.includes(tag) || tag.includes(ui))
  );
  const interests_match_count = matchedInterests.length;

  const features: Record<string, number> = {
    traveler_type_encoded,
    age_group_encoded,
    budget_tier_encoded,
    travel_style_encoded,
    food_preference_encoded,
    mobility_level_encoded,
    dest_encoded,
    season_encoded,
    trip_duration: tripDuration,
    activity_id_encoded,
    activity_cost: activity.costEstimate,
    style_match,
    interests_match_count,
  };

  let score = (latestModel as any).base_score;
  for (const tree of (latestModel as any).trees) {
    score += evaluateActivityTree(tree, features);
  }
  
  const probability = 1.0 / (1.0 + Math.exp(-score));
  return Math.round(probability * 100);
}

export const activityRecommendationEngine = {
  score(
    activity: typeof DEFAULT_ACTIVITIES_CATALOG[number],
    userProfile: UserProfile,
    userAge = 30
  ): ActivityRecommendation {
    const reasons: string[] = [];
    const prefs = userProfile.preferences;

    // 1. Age Fit (20% weight)
    let ageScore = 100;
    if (userAge < activity.minAge) {
      ageScore = Math.max(0, 100 - (activity.minAge - userAge) * 15);
      reasons.push("This activity might be challenging or restricted for younger age groups.");
    } else if (userAge > activity.maxAge) {
      ageScore = Math.max(0, 100 - (userAge - activity.maxAge) * 8);
      reasons.push("This activity has high physical demands that may exceed your profile comfort level.");
    }

    // 2. Budget Fit (30% weight)
    let budgetScore = 100;
    const dailyLimit = prefs.maxDailyBudget || 200;
    if (activity.costEstimate > dailyLimit * 0.75) {
      budgetScore = Math.max(10, Math.round(100 - (activity.costEstimate / dailyLimit) * 50));
      reasons.push("Alert: Individual activity expense accounts for a high share of your daily budget.");
    } else {
      reasons.push("Pricing aligns comfortably with your wallet constraints.");
    }

    // 3. Interest Fit (30% weight)
    const userInterests = prefs.food.map((f) => f.toString().toLowerCase()) || [];
    const matchedInterests = activity.tags.filter((tag) =>
      userInterests.some((ui) => ui.includes(tag) || tag.includes(ui))
    );
    const interestScore =
      userInterests.length > 0
        ? Math.round((matchedInterests.length / activity.tags.length) * 50 + 50)
        : 80;
    if (matchedInterests.length > 0) {
      reasons.push(`Matches your logged interests in: ${matchedInterests.join(", ")}.`);
    }

    // 4. Style Fit (20% weight)
    const userStyles = prefs.styles || [];
    const matchedStyles = activity.styles.filter((s) => userStyles.includes(s));
    const styleScore =
      userStyles.length > 0
        ? Math.round((matchedStyles.length / userStyles.length) * 50 + 50)
        : 75;
    if (matchedStyles.length > 0) {
      reasons.push(`Fits your preferred travel style (${matchedStyles.join(", ")}).`);
    }

    // Calculate final weighted sum
    const overallScore = Math.round(
      ageScore * 0.2 + budgetScore * 0.3 + interestScore * 0.3 + styleScore * 0.2
    );

    return {
      activity: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        timeSlot: activity.timeSlot,
        durationMinutes: activity.durationMinutes,
        costEstimate: activity.costEstimate,
        locationName: activity.locationName,
        category: activity.category,
      },
      score: {
        activityId: activity.id,
        overallScore,
        ageScore,
        budgetScore,
        interestScore,
        styleScore,
      },
      reasons,
    };
  },

  recommendAndRank(
    userProfile: UserProfile,
    filterCategories?: ActivityFilterType[],
    userAge = 30,
    destination?: string,
    season?: string,
    tripDuration?: number
  ): ActivityRecommendation[] {
    let list = DEFAULT_ACTIVITIES_CATALOG;

    if (filterCategories && filterCategories.length > 0) {
      list = list.filter((act) => filterCategories.includes(act.filterType));
    }

    const ruleRecommendations = list
      .map((act) => this.score(act, userProfile, userAge))
      .sort((a, b) => b.score.overallScore - a.score.overallScore);

    // Run ML predictions in shadow mode in background
    const resolvedDestination = destination || "Tokyo, Japan";
    const resolvedSeason = season || "Summer";
    const resolvedDuration = tripDuration || 5;

    try {
      const mlRecommendations = list
        .map((act) => {
          try {
            const score = predictActivityMLScore(
              act,
              userProfile,
              userAge,
              resolvedDestination,
              resolvedSeason,
              resolvedDuration
            );
            return {
              activity_id: act.id,
              title: act.title,
              score,
            };
          } catch (err) {
            // fallback
            const ruleScore = this.score(act, userProfile, userAge);
            return {
              activity_id: act.id,
              title: act.title,
              score: ruleScore.score.overallScore,
            };
          }
        })
        .sort((a, b) => b.score - a.score);

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userProfile.uid || "");
      const dbUserId = isUuid ? userProfile.uid : null;

      // Only attempt logging if the user is authenticated (prevents RLS/401 errors for guests)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user || !dbUserId) {
          console.log("[Shadow Mode] Bypassing shadow activity predictions logging for guest user.");
          return;
        }

        supabase
          .from("activity_model_predictions")
          .insert({
            user_id: dbUserId,
            destination: resolvedDestination,
            recommended_by_rules: ruleRecommendations.map((r, idx) => ({
              rank: idx + 1,
              activity_id: r.activity.id,
              title: r.activity.title,
              score: r.score.overallScore,
            })),
            recommended_by_model: mlRecommendations.map((m, idx) => ({
              rank: idx + 1,
              activity_id: m.activity_id,
              title: m.title,
              score: m.score,
            })),
            user_selected: [],
            user_rejected: [],
            user_rating: {},
          })
          .then(({ error }) => {
            if (error) {
              console.warn("[Shadow Mode] Failed to log activity shadow predictions:", error.message);
            }
          });
      });
    } catch (err: any) {
      console.warn("[Shadow Mode] Failed to execute activity shadow model prediction:", err.message);
    }

    return ruleRecommendations;
  }
};
