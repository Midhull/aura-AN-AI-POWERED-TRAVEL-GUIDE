import { TravelStyle } from "../types/travel";

export interface PlanDetails {
  style: TravelStyle;
  totalCostINR: number;
  hotelName: string;
  activities: string[];
  transportation: string;
}

export interface MultiPlanResult {
  destination: string;
  durationDays: number;
  plans: {
    budget: PlanDetails;
    balanced: PlanDetails;
    premium: PlanDetails;
  };
}

export interface PlanComparison {
  totalCostDifferenceINR: {
    balancedVsBudget: number;
    premiumVsBalanced: number;
  };
  valueRatings: {
    budget: number; // 0 to 10
    balanced: number;
    premium: number;
  };
  summaryRecommendation: string;
}

const DESTINATION_PLANS: Record<string, {
  budget: Omit<PlanDetails, "totalCostINR">;
  balanced: Omit<PlanDetails, "totalCostINR">;
  premium: Omit<PlanDetails, "totalCostINR">;
}> = {
  kerala: {
    budget: {
      style: TravelStyle.BUDGET,
      hotelName: "Backwater Heritage Homestay",
      activities: ["Local canoe boat canal ride", "Varkala beach sunset walk", "Traditional clay pottery workshop"],
      transportation: "State KSRTC buses & local auto-rickshaws",
    },
    balanced: {
      style: TravelStyle.BOUTIQUE,
      hotelName: "Munnar Tea Valley Resort",
      activities: ["Guided spice plantation trek", "Kathakali cultural center dance show", "Houseboat day cruise with lunch"],
      transportation: "Private air-conditioned sedan transfer",
    },
    premium: {
      style: TravelStyle.LUXURY,
      hotelName: "The Kumarakom Lake Resort (Luxury Villa)",
      activities: ["Overnight luxury houseboat cruise", "Premium Ayurvedic massage treatments", "Private Kathakali performance & dining"],
      transportation: "Private SUV chauffeur & airport pick-up",
    },
  },
};

export const multiPlanGenerator = {
  generate(destination: string, durationDays: number): MultiPlanResult {
    const norm = destination.toLowerCase().trim();
    
    // Default fallback templates if destination is not in mapping catalog
    let templates = DESTINATION_PLANS.kerala; // default fallback
    for (const [key, value] of Object.entries(DESTINATION_PLANS)) {
      if (norm.includes(key)) {
        templates = value;
        break;
      }
    }

    // Dynamic cost multiplier depending on duration
    const budgetCost = 5000 * durationDays;
    const balancedCost = 9000 * durationDays;
    const premiumCost = 16000 * durationDays;

    return {
      destination,
      durationDays,
      plans: {
        budget: {
          ...templates.budget,
          totalCostINR: budgetCost,
        },
        balanced: {
          ...templates.balanced,
          totalCostINR: balancedCost,
        },
        premium: {
          ...templates.premium,
          totalCostINR: premiumCost,
        },
      },
    };
  },

  compare(result: MultiPlanResult): PlanComparison {
    const budget = result.plans.budget.totalCostINR;
    const balanced = result.plans.balanced.totalCostINR;
    const premium = result.plans.premium.totalCostINR;

    const balancedVsBudget = balanced - budget;
    const premiumVsBalanced = premium - balanced;

    // Value Ratings (subjective scale mapping amenities to cost indices)
    const valueRatings = {
      budget: 7.2, // Good price-to-experience index
      balanced: 9.0, // Sweet spot for comfort and cost
      premium: 8.5, // Premium luxury but higher cost threshold
    };

    let summaryRecommendation = "The Balanced Plan offers the optimal price-to-value ratio, matching comfortable private transit with authentic local plantation activities.";
    if (result.durationDays <= 3) {
      summaryRecommendation = "Since your trip is short (3 days or less), upgrading to the Premium Plan maximizes comfort and saves transit overhead times.";
    }

    return {
      totalCostDifferenceINR: {
        balancedVsBudget,
        premiumVsBalanced,
      },
      valueRatings,
      summaryRecommendation,
    };
  },
};
