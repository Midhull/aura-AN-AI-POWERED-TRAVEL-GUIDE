import { TravelStyle } from "../types/travel";

export interface ConsultantInput {
  destination: string;
  durationDays: number;
  budgetAmount: number; // in INR (₹)
  travelStyle: TravelStyle;
}

export interface OptionAlternative {
  optionName: string;
  description: string;
  estimatedCost: number; // in INR
}

export interface ConsultationResponse {
  isRealistic: boolean;
  reasoning: string;
  decisionExplanation: string;
  alternatives: OptionAlternative[];
  followUpQuestions: string[];
}

// Destination baseline daily costs in INR
const DAILY_COST_INDEX: Record<string, Record<TravelStyle, number>> = {
  japan: {
    [TravelStyle.LUXURY]: 35000,
    [TravelStyle.BOUTIQUE]: 15000,
    [TravelStyle.BUDGET]: 5000,
    [TravelStyle.BACKPACKING]: 3500,
    [TravelStyle.ADVENTURE]: 12000,
    [TravelStyle.RELAXING]: 14000,
    [TravelStyle.CULTURAL]: 11000,
  },
  bali: {
    [TravelStyle.LUXURY]: 18000,
    [TravelStyle.BOUTIQUE]: 8000,
    [TravelStyle.BUDGET]: 2200,
    [TravelStyle.BACKPACKING]: 1500,
    [TravelStyle.ADVENTURE]: 6000,
    [TravelStyle.RELAXING]: 7000,
    [TravelStyle.CULTURAL]: 5500,
  },
  switzerland: {
    [TravelStyle.LUXURY]: 50000,
    [TravelStyle.BOUTIQUE]: 25000,
    [TravelStyle.BUDGET]: 9000,
    [TravelStyle.BACKPACKING]: 6500,
    [TravelStyle.ADVENTURE]: 22000,
    [TravelStyle.RELAXING]: 24000,
    [TravelStyle.CULTURAL]: 20000,
  },
};

function getDailyCost(destination: string, style: TravelStyle): number {
  const norm = destination.toLowerCase().trim();
  for (const [key, costMap] of Object.entries(DAILY_COST_INDEX)) {
    if (norm.includes(key)) {
      return costMap[style];
    }
  }
  // Default fallback rates
  const fallbackRates: Record<TravelStyle, number> = {
    [TravelStyle.LUXURY]: 25000,
    [TravelStyle.BOUTIQUE]: 12000,
    [TravelStyle.BUDGET]: 4000,
    [TravelStyle.BACKPACKING]: 2500,
    [TravelStyle.ADVENTURE]: 10000,
    [TravelStyle.RELAXING]: 11000,
    [TravelStyle.CULTURAL]: 9000,
  };
  return fallbackRates[style];
}

export const travelConsultantAgent = {
  consult(input: ConsultantInput): ConsultationResponse {
    const { destination, durationDays, budgetAmount, travelStyle } = input;
    
    // 1. Consultation Engine & Reasoning Layer
    const dailyRate = getDailyCost(destination, travelStyle);
    const flightMultiplier = travelStyle === TravelStyle.LUXURY ? 80000 : 35000;
    const requiredMinBudget = (dailyRate * durationDays) + flightMultiplier;

    const isRealistic = budgetAmount >= requiredMinBudget;

    let reasoning = "";
    let decisionExplanation = "";
    const alternatives: OptionAlternative[] = [];
    const followUpQuestions: string[] = [];

    if (!isRealistic) {
      reasoning = `This budget (₹${budgetAmount.toLocaleString()}) is highly unlikely to support a ${travelStyle.toLowerCase()} ${durationDays}-day trip to ${destination}.`;
      
      decisionExplanation = `Japan/Switzerland flight indices and high-tier hospitality services have set a hard minimum floor of approx. ₹${dailyRate.toLocaleString()}/day for ${travelStyle.toLowerCase()} classes. To survive on ₹${budgetAmount.toLocaleString()}, you would exceed constraints in the first 3 days.`;

      // Recommendation Layer
      // Alternative A: Shorten stay
      const maxDaysForStyle = Math.floor((budgetAmount - flightMultiplier) / dailyRate);
      if (maxDaysForStyle > 0) {
        alternatives.push({
          optionName: "Option A (Shorten Duration)",
          description: `Shorten the trip to ${maxDaysForStyle} days of ${travelStyle.toLowerCase()} experiences.`,
          estimatedCost: (dailyRate * maxDaysForStyle) + flightMultiplier,
        });
      } else {
        alternatives.push({
          optionName: "Option A (Shorten Duration)",
          description: `Shorten the trip to a weekend gateway (3 days) of ${travelStyle.toLowerCase()} experiences.`,
          estimatedCost: (dailyRate * 3) + flightMultiplier,
        });
      }

      // Alternative B: Downgrade Travel Style
      const fallbackStyle = travelStyle === TravelStyle.LUXURY ? TravelStyle.BOUTIQUE : TravelStyle.BUDGET;
      const lowerDailyRate = getDailyCost(destination, fallbackStyle);
      const lowerFlightMult = 35000;
      alternatives.push({
        optionName: "Option B (Downgrade Style)",
        description: `Maintain the ${durationDays}-day duration but adjust expectations to ${fallbackStyle.toLowerCase()} tier.`,
        estimatedCost: (lowerDailyRate * durationDays) + lowerFlightMult,
      });


      // Alternative C: Increase Budget
      alternatives.push({
        optionName: "Option C (Raise Budget Limit)",
        description: `Increase your budget limits to support your requested ${travelStyle.toLowerCase()} travel requirements.`,
        estimatedCost: requiredMinBudget,
      });

      // Follow-up Questions
      followUpQuestions.push("Would you prefer to shorten the stay or adjust the luxury expectations?");
      followUpQuestions.push(`Are you open to alternative, high-value destinations like Bali where ₹${budgetAmount.toLocaleString()} supports a full luxury itinerary?`);
    } else {
      reasoning = `Your budget of ₹${budgetAmount.toLocaleString()} is fully aligned for a ${travelStyle.toLowerCase()} ${durationDays}-day trip to ${destination}.`;
      
      decisionExplanation = `The estimated total required is ₹${requiredMinBudget.toLocaleString()} ($${Math.round(requiredMinBudget/83)}), leaving a comfortable cushion of ₹${(budgetAmount - requiredMinBudget).toLocaleString()} for extra activities, dining bookings, and premium transfers.`;

      // Optimize budget allocations
      alternatives.push({
        optionName: "Recommended Allocation",
        description: "Proceed with requested itinerary. Buffer can be assigned to premium excursions.",
        estimatedCost: requiredMinBudget,
      });

      followUpQuestions.push("Should we proceed with creating a structured day-by-day itinerary matching this style?");
      followUpQuestions.push("Do you have specific dining preferences or flight timing constraints?");
    }

    return {
      isRealistic,
      reasoning,
      decisionExplanation,
      alternatives,
      followUpQuestions,
    };
  },
};
