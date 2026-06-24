import type { Trip, UserProfile } from "../types/travel";

export interface RiskInput {
  trip: Trip;
  userProfile: UserProfile;
  forecastRainMm?: number;
  forecastTemp?: number;
  isPeakSeason: boolean;
}

export interface RiskFactor {
  name: string;
  score: number; // 0 to 100
  description: string;
}

export interface RiskReport {
  riskScore: number; // 0 to 100 (higher means higher threat level)
  riskFactors: RiskFactor[];
  recommendations: string[];
}

export const travelRiskEngine = {
  analyze(input: RiskInput): RiskReport {
    const { trip, userProfile, forecastRainMm, forecastTemp, isPeakSeason } = input;
    const riskFactors: RiskFactor[] = [];
    const recommendations: string[] = [];

    // 1. Weather Risks
    let weatherScore = 15;
    let weatherDesc = "Weather conditions are stable and optimal for travel.";
    if (forecastRainMm !== undefined && forecastRainMm > 25) {
      weatherScore = 75;
      weatherDesc = "Heavy rainfall and potential flooding risks detected.";
      recommendations.push("Pack waterproof gear and schedule indoor museum tours instead of mountain hikes.");
    } else if (forecastTemp !== undefined && (forecastTemp > 38 || forecastTemp < 0)) {
      weatherScore = 80;
      weatherDesc = `Extreme temperatures (${forecastTemp}°C) forecasted during trip duration.`;
      recommendations.push("Avoid outdoor exposure between 11:00 and 15:00. Carry thermal wear or hydration supplies.");
    }
    riskFactors.push({ name: "Weather Risks", score: weatherScore, description: weatherDesc });

    // 2. Budget Risks
    const expectedCost = trip.budgetBreakdown?.total || 0;
    const limit = trip.budgetLimit || 1;
    let budgetScore = 10;
    let budgetDesc = "Excellent financial safety buffer remaining.";
    if (expectedCost > limit * 0.95) {
      budgetScore = 85;
      budgetDesc = "Critical budget exhaustion risk. Total cost matches or exceeds limit.";
      recommendations.push("Downgrade active lodging selections to 3-star boutique spaces to restore a 15% safety cushion.");
    } else if (expectedCost > limit * 0.85) {
      budgetScore = 50;
      budgetDesc = "Moderate budget constraint risk. Safety buffer is slim.";
      recommendations.push("Cap daily shopping and miscellaneous dining expenditures to avoid overruns.");
    }
    riskFactors.push({ name: "Budget Risks", score: budgetScore, description: budgetDesc });

    // 3. Health & Medical Risks
    let healthScore = 20;
    let healthDesc = "Low medical/health concerns for this travel route.";
    const isRemote = trip.durationDays > 7 && trip.destination.toLowerCase().includes("bali");
    if (isRemote) {
      healthScore = 55;
      healthDesc = "Remote tropical environment. Higher risk of stomach upset or minor insect-borne issues.";
      recommendations.push("Acquire comprehensive travel health insurance and carry basic rehydration packages.");
    }
    riskFactors.push({ name: "Health Risks", score: healthScore, description: healthDesc });

    // 4. Transportation Risks
    let transportScore = 15;
    let transportDesc = "Transit routes are secure with mature public infrastructure.";
    if (trip.destination.toLowerCase().includes("alps") || trip.destination.toLowerCase().includes("iceland")) {
      transportScore = 50;
      transportDesc = "Mountain passes or gravel road navigation requires professional caution.";
      recommendations.push("Select a 4WD vehicle for rural Ring Road navigation, and check daily road condition alerts.");
    }
    riskFactors.push({ name: "Transportation Risks", score: transportScore, description: transportDesc });

    // 5. Overcrowding Risks
    let crowdScore = 20;
    let crowdDesc = "Low tourist density during shoulder/off-peak travel calendar windows.";
    if (isPeakSeason) {
      crowdScore = 80;
      crowdDesc = "Extreme overcrowding indexes during peak holiday weeks. High queue times.";
      recommendations.push("Pre-book attraction tickets online 2 weeks in advance to skip hours of ticketing queues.");
    }
    riskFactors.push({ name: "Overcrowding Risks", score: crowdScore, description: crowdDesc });

    // Average the risk scores
    const riskScore = Math.round(
      (weatherScore + budgetScore + healthScore + transportScore + crowdScore) / 5
    );

    return {
      riskScore,
      riskFactors,
      recommendations,
    };
  },
};
