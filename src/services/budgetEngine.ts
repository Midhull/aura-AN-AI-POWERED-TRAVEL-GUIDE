import type { BudgetBreakdown, BudgetResult } from "../types/travel";
import { supabase } from "./supabase/client";
import latestModel from "../assets/models/budget_xgboost_latest.json";

export type BudgetTier = "budget" | "mid-range" | "luxury";

export interface BudgetCalculationInput {
  destination: string;
  durationDays: number;
  travelersCount: number;
  tier: BudgetTier;
  userLimit: number;
  season?: string;
  travelStyle?: string;
}

export interface GranularBudget {
  flights: number;
  hotels: number;
  food: number;
  transport: number;
  activities: number;
  visa: number;
  insurance: number;
  airportTransfers: number;
  simEsim: number;
  shoppingBuffer: number;
  emergencyBuffer: number;
}

export interface CompleteBudgetResult extends BudgetResult {
  granular: GranularBudget;
  budgetScore: number; // 0 to 100 (100 means well under limit, low scores mean exceeding limit)
}

// Deterministic cost indexes relative to target regions
const DESTINATION_MULTIPLIERS: Record<string, number> = {
  bali: 0.6,
  indonesia: 0.6,
  kyoto: 1.2,
  japan: 1.2,
  switzerland: 1.8,
  alps: 1.8,
  iceland: 1.7,
  santorini: 1.5,
  greece: 1.3,
  usa: 1.5,
  europe: 1.4,
};

function getMultiplier(destination: string): number {
  const normalized = destination.toLowerCase().trim();
  for (const [key, value] of Object.entries(DESTINATION_MULTIPLIERS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return 1.0; // Default baseline multiplier
}

// --- Native GBDT Tree Interpreter for Shadow Mode Predictions ---
interface ModelTreeNode {
  nodeid: number;
  depth: number;
  split?: string;
  split_condition?: number;
  yes?: number;
  no?: number;
  missing?: number;
  leaf?: number;
  children?: ModelTreeNode[];
}

function evaluateTree(node: ModelTreeNode, features: Record<string, number>): number {
  if (node.leaf !== undefined) {
    return node.leaf;
  }
  const splitFeature = node.split;
  const splitThreshold = node.split_condition;
  if (
    splitFeature === undefined ||
    splitThreshold === undefined ||
    node.yes === undefined ||
    node.no === undefined ||
    !node.children
  ) {
    return 0;
  }
  const val = features[splitFeature] !== undefined ? features[splitFeature] : 0;
  const targetId = val < splitThreshold ? node.yes : node.no;
  const child = node.children.find((c) => c.nodeid === targetId);
  return child ? evaluateTree(child, features) : 0;
}

function predictMLBudget(
  destination: string,
  duration: number,
  travelers: number,
  travelStyle: string,
  season: string
): number {
  const styleMap: Record<string, number> = {
    BUDGET: 0,
    BACKPACKING: 1,
    RELAXING: 2,
    CULTURAL: 3,
    BOUTIQUE: 4,
    ADVENTURE: 5,
    LUXURY: 6,
  };
  const seasonMap: Record<string, number> = {
    Spring: 0,
    Summer: 1,
    Autumn: 2,
    Winter: 3,
    Peak: 1,
    Shoulder: 0,
    "Off-Peak": 3,
  };
  const destinationMap: Record<string, number> = {
    "Tokyo, Japan": 0,
    "Paris, France": 1,
    "New York, USA": 2,
    "Rome, Italy": 3,
    "London, UK": 4,
    "Sydney, Australia": 5,
    "Cape Town, South Africa": 6,
    "Rio de Janeiro, Brazil": 7,
    "Reykjavik, Iceland": 8,
    "Bangkok, Thailand": 9,
    "Kyoto, Japan": 10,
    "Barcelona, Spain": 11,
    "Cairo, Egypt": 12,
    "Machu Picchu, Peru": 13,
    "Amsterdam, Netherlands": 14,
  };

  const features: Record<string, number> = {
    dest_encoded: destinationMap[destination] !== undefined ? destinationMap[destination] : 0,
    duration,
    travelers,
    style_encoded: styleMap[travelStyle] !== undefined ? styleMap[travelStyle] : 2,
    season_encoded: seasonMap[season] !== undefined ? seasonMap[season] : 0,
  };

  let prediction = (latestModel as any).base_score;
  for (const tree of (latestModel as any).trees) {
    prediction += evaluateTree(tree, features);
  }
  return Math.round(prediction);
}

export const budgetEngine = {
  calculate(input: BudgetCalculationInput): CompleteBudgetResult {
    const { destination, durationDays, travelersCount, tier, userLimit } = input;
    const mult = getMultiplier(destination);

    // 1. Define base rates per traveler per day (in USD)
    let flightBase = 600;
    let hotelBase = 120;
    let foodBase = 40;
    let transportBase = 15;
    let activityBase = 30;
    let visaBase = 50;
    let insuranceBase = 40;
    let transferBase = 30;
    let simBase = 20;
    let shoppingBase = 100;

    if (tier === "budget") {
      flightBase = 400;
      hotelBase = 40;
      foodBase = 18;
      transportBase = 6;
      activityBase = 10;
      transferBase = 15;
      shoppingBase = 40;
    } else if (tier === "luxury") {
      flightBase = 1800;
      hotelBase = 450;
      foodBase = 150;
      transportBase = 60;
      activityBase = 120;
      transferBase = 100;
      shoppingBase = 400;
    }

    // 2. Perform strictly deterministic calculations
    const flights = flightBase * travelersCount * (mult * 0.9);
    const hotels = hotelBase * durationDays * mult * Math.ceil(travelersCount / 2); // assuming double sharing
    const food = foodBase * durationDays * travelersCount * mult;
    const transport = transportBase * durationDays * travelersCount * (mult * 0.8);
    const activities = activityBase * durationDays * travelersCount * mult;
    const visa = visaBase * travelersCount;
    const insurance = insuranceBase * travelersCount;
    const airportTransfers = transferBase * 2 * Math.ceil(travelersCount / 4); // round trip, assuming 4 per cab
    const simEsim = simBase * travelersCount;
    const shoppingBuffer = shoppingBase * travelersCount;

    // Emergency buffer is 10% of subtotal
    const subtotal =
      flights +
      hotels +
      food +
      transport +
      activities +
      visa +
      insurance +
      airportTransfers +
      simEsim +
      shoppingBuffer;
    const emergencyBuffer = Math.round(subtotal * 0.1);

    const total = Math.round(subtotal + emergencyBuffer);

    // 3. Map into the generic BudgetBreakdown structure
    const breakdown: BudgetBreakdown = {
      flights: Math.round(flights),
      accommodation: Math.round(hotels),
      activities: Math.round(activities),
      dining: Math.round(food),
      transport: Math.round(transport + airportTransfers),
      other: Math.round(visa + insurance + simEsim + shoppingBuffer + emergencyBuffer),
      total,
    };

    const granular: GranularBudget = {
      flights: Math.round(flights),
      hotels: Math.round(hotels),
      food: Math.round(food),
      transport: Math.round(transport),
      activities: Math.round(activities),
      visa: Math.round(visa),
      insurance: Math.round(insurance),
      airportTransfers: Math.round(airportTransfers),
      simEsim: Math.round(simEsim),
      shoppingBuffer: Math.round(shoppingBuffer),
      emergencyBuffer: Math.round(emergencyBuffer),
    };

    // 4. Calculate alignment score (0 - 100)
    let budgetScore = 100;
    if (userLimit > 0) {
      if (total <= userLimit) {
        const ratio = total / userLimit;
        budgetScore = Math.round(100 - ratio * 40); // 60 to 100
      } else {
        const ratio = total / userLimit;
        budgetScore = Math.max(0, Math.round(60 - (ratio - 1) * 60)); // slides to 0
      }
    }

    const isWithinBudget = userLimit > 0 ? total <= userLimit : true;

    // 5. Detect and list savings opportunities deterministically
    const savingsOpportunities: string[] = [];
    if (tier !== "budget") {
      savingsOpportunities.push(
        `Opt for 'budget' or 'mid-range' dining tiers to potentially save up to $${Math.round(food * 0.4)}.`
      );
    }
    if (durationDays > 5 && tier !== "budget") {
      savingsOpportunities.push(
        `Consider booking an apartment style accommodation rather than individual luxury rooms.`
      );
    }
    if (transport > 100) {
      savingsOpportunities.push("Use local public transit passes instead of taxi bookings.");
    }

    // --- 6. GBDT Budget Prediction Model in Shadow Mode ---
    // Executed asynchronously in the background so it does not affect user experience or block main flow
    const duration = durationDays;
    const travelers = travelersCount;
    const resolvedStyle = input.travelStyle || (tier === "luxury" ? "LUXURY" : tier === "budget" ? "BUDGET" : "BOUTIQUE");
    const resolvedSeason = input.season || "Summer";
    const ruleBudget = total;

    try {
      const mlBudget = predictMLBudget(destination, duration, travelers, resolvedStyle, resolvedSeason);
      const difference = ruleBudget - mlBudget;

      // Only attempt logging if the user is authenticated (prevents RLS/401 errors for guests)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user) {
          console.log("[Shadow Mode] Bypassing shadow budget analytics logging for guest user.");
          return;
        }

        supabase
          .from("ml_budget_shadow_analytics")
          .insert({
            destination,
            duration,
            travelers,
            travel_style: resolvedStyle,
            season: resolvedSeason,
            rule_budget: ruleBudget,
            ml_budget: mlBudget,
            difference,
          })
          .then(({ error }) => {
            if (error) {
              console.warn("[Shadow Mode] Failed to log shadow budget analytics:", error.message);
            }
          });
      });
    } catch (err: any) {
      console.warn("[Shadow Mode] Failed to predict shadow budget:", err.message);
    }

    return {
      breakdown,
      granular,
      currency: "USD",
      isWithinBudget,
      savingsOpportunities,
      budgetScore,
    };
  },
};
