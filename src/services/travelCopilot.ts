import type { Trip, UserProfile } from "../types/travel";
import type { Expense, ExpenseAnalytics } from "../types/expenses";

export interface CopilotAlert {
  id: string;
  type: "budget" | "weather" | "alert" | "tip" | "suggestion";
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

export interface CopilotContext {
  trip: Trip;
  userProfile: UserProfile;
  expenses: Expense[];
  analytics: ExpenseAnalytics;
  currentLatitude?: number;
  currentLongitude?: number;
  forecastTemp?: number;
  forecastRainMm?: number;
}

export interface CopilotOutput {
  alerts: CopilotAlert[];
  dailySuggestions: string[];
  nearbyRecommendations: string[];
  travelTips: string[];
}

export const travelCopilot = {
  analyze(context: CopilotContext): CopilotOutput {
    const { trip, userProfile, analytics, forecastTemp, forecastRainMm } = context;
    const alerts: CopilotAlert[] = [];
    const dailySuggestions: string[] = [];
    const nearbyRecommendations: string[] = [];
    const travelTips: string[] = [];

    // 1. Budget Monitoring & Expense Alerts
    if (analytics.projectedOverrun > 0) {
      alerts.push({
        id: "alert-overrun",
        type: "budget",
        title: "Budget Overrun Projected",
        message: `Your current daily spend rate ($${analytics.dailyBurnRate}/day) is projected to exceed your trip budget by $${analytics.projectedOverrun}.`,
        severity: "warning",
      });
    }

    if (analytics.burnRatePercentage >= 90) {
      alerts.push({
        id: "alert-critical-budget",
        type: "budget",
        title: "Critical Budget Usage",
        message: `You have consumed ${analytics.burnRatePercentage}% of your total budget limit.`,
        severity: "critical",
      });
    }

    // 2. Weather Alerts
    if (forecastRainMm !== undefined && forecastRainMm > 20) {
      alerts.push({
        id: "alert-weather-heavy-rain",
        type: "weather",
        title: "Heavy Rain Forecasted",
        message: "Expect heavy precipitation. Consider swapping outdoor ridge hikes for museum visits today.",
        severity: "warning",
      });
    }

    if (forecastTemp !== undefined && forecastTemp > 38) {
      alerts.push({
        id: "alert-weather-heat",
        type: "weather",
        title: "Extreme Heat Warning",
        message: `Temperatures are expected to reach ${forecastTemp}°C. Stay hydrated and limit mid-day sun exposure.`,
        severity: "warning",
      });
    }

    // 3. Daily Suggestions
    const today = new Date().toISOString().split("T")[0];
    const isDuringTrip = today >= trip.startDate && today <= trip.endDate;

    if (isDuringTrip) {
      dailySuggestions.push("Review today's chronological activity list in your Command Center.");
      dailySuggestions.push("Check restaurant bookings at least 2 hours prior to reservation times.");
    } else {
      dailySuggestions.push("Your trip hasn't started yet. Ensure all traveler passport information is updated.");
    }

    // 4. Nearby Recommendations
    // Simulated nearby places based on destination coordinates
    nearbyRecommendations.push(`Highly-rated local cafés located within 1.5km of your active district in ${trip.destination}.`);
    nearbyRecommendations.push("Atmospheric walking streets loved by photography guides nearby.");

    // 5. Travel Tips
    travelTips.push("Always carry a localized digital offline map when traversing remote or low-signal zones.");
    if (trip.destination.toLowerCase().includes("bali") || trip.destination.toLowerCase().includes("indonesia")) {
      travelTips.push("Tap water is not drinkable. Always purchase sealed mineral water bottles.");
    }
    if (trip.destination.toLowerCase().includes("japan") || trip.destination.toLowerCase().includes("kyoto")) {
      travelTips.push("Keep a small trash bag in your daypack, as public waste bins are extremely rare in city centers.");
    }

    return {
      alerts,
      dailySuggestions,
      nearbyRecommendations,
      travelTips,
    };
  },
};
