import type { UserProfile, Trip, Itinerary } from "../types/travel";
import { TravelStyle } from "../types/travel";
import { travelDNASystem } from "./travelDNASystem";
import { budgetEngine, type CompleteBudgetResult } from "./budgetEngine";
import { travelRiskEngine, type RiskReport } from "./travelRiskEngine";
import { DestinationSearchEngine, DestinationService } from "./destinationIntel";
import { destinationMatchEngine, type DestinationScore } from "./destinationMatchEngine";
import { tripSuccessPredictor, type SuccessPredictionResult } from "./tripSuccessPredictor";
import { tripOptimizationEngine, type OptimizedRouteResult } from "./tripOptimizationEngine";
import { aiRouter } from "./ai-router";
import { itineraryEngine } from "./itineraryEngine";
import { activityRecommendationEngine } from "./activityRecommendationEngine";

export interface TravelOSInput {
  userProfile: UserProfile;
  destinationQuery: string;
  durationDays: number;
  travelersCount: number;
  budgetLimitINR: number;
  pastTrips: Trip[];
}

export interface TravelOSResult {
  dnaProfile: any;
  budgetResult: CompleteBudgetResult;
  riskReport: RiskReport;
  selectedDestination: DestinationScore;
  successReport: SuccessPredictionResult;
  optimizationReport: OptimizedRouteResult;
  finalItinerary: Itinerary;
}

export const travelOS = {
  async runOrchestrator(input: TravelOSInput): Promise<TravelOSResult> {
    const { userProfile, destinationQuery, durationDays, travelersCount, budgetLimitINR, pastTrips } = input;

    // Step 1: Traveler Profile → Travel DNA
    const dnaProfile = travelDNASystem.calculate(userProfile, pastTrips);

    // Step 2: Travel DNA → Budget Engine
    const targetStyle = userProfile.preferences.styles[0] || TravelStyle.BOUTIQUE;
    const budgetResult = budgetEngine.calculate({
      destination: destinationQuery,
      durationDays,
      travelersCount,
      tier: targetStyle === TravelStyle.LUXURY ? "luxury" : targetStyle === TravelStyle.BUDGET ? "budget" : "mid-range",
      userLimit: budgetLimitINR / 83, // convert INR to USD estimate for engine
    });

    // Step 3: Destination Intelligence & Match Engine
    // Query destination catalog
    const matchedDests = await DestinationSearchEngine.search({
      query: destinationQuery,
    });
    if (matchedDests.length === 0) {
      throw new Error(`Destination '${destinationQuery}' is not supported in the active intelligence registry.`);
    }
    const rankedDests = destinationMatchEngine.rank(matchedDests, userProfile);
    const selectedDestination = rankedDests[0];

    // Step 4: Budget Result → Risk Engine
    const mockTripHeader: Trip = {
      id: "trip-temp",
      userId: userProfile.uid,
      title: `Plan for ${destinationQuery}`,
      destination: destinationQuery,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      durationDays,
      travelersCount,
      status: "planning",
      budgetLimit: budgetLimitINR / 83,
      budgetBreakdown: budgetResult.breakdown,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const riskReport = travelRiskEngine.analyze({
      trip: mockTripHeader,
      userProfile,
      forecastRainMm: 0,
      forecastTemp: 25,
      isPeakSeason: false,
    });

    // Step 5: Success Prediction
    // Pull activity catalog matching the destination highlights from the database repository
    const destAttractions = await DestinationService.getFullDestinationData(selectedDestination.destination.id);
    
    let rawActivities: any[] = [];
    if (destAttractions) {
      const mappedAttractions = destAttractions.attractions.map((att: any, idx: number) => ({
        id: att.id || `att-${idx}-${selectedDestination.destination.id}`,
        title: att.name,
        description: att.description || `Explore ${att.name} in ${selectedDestination.destination.name}.`,
        timeSlot: idx % 2 === 0 ? "10:00" : "15:00",
        durationMinutes: 120,
        costEstimate: idx % 2 === 0 ? 15 : 25,
        locationName: att.name,
        category: "sightseeing" as const
      }));

      const mappedRestaurants = destAttractions.restaurants.map((res: any, idx: number) => ({
        id: res.id || `res-${idx}-${selectedDestination.destination.id}`,
        title: `Dine at ${res.name}`,
        description: `Savor authentic local cuisine and dining experiences at ${res.name}.`,
        timeSlot: idx % 2 === 0 ? "13:00" : "20:00",
        durationMinutes: 90,
        costEstimate: res.priceRange === "$$$" ? 50 : res.priceRange === "$$" ? 30 : 15,
        locationName: res.name,
        category: "dining" as const
      }));

      rawActivities = [...mappedAttractions, ...mappedRestaurants];
    }

    if (rawActivities.length === 0) {
      // Hard fallback to generic activities to prevent crashes if catalog is empty
      rawActivities = [
        {
          id: `generic-att-1-${selectedDestination.destination.id}`,
          title: "Local Heritage & Walking Tour",
          description: `Discover key landmarks, historical sites, and architectural wonders of ${selectedDestination.destination.name}.`,
          timeSlot: "10:00",
          durationMinutes: 120,
          costEstimate: 20,
          locationName: `${selectedDestination.destination.name} Old Quarter`,
          category: "sightseeing"
        },
        {
          id: `generic-res-1-${selectedDestination.destination.id}`,
          title: "Traditional Culinary Experience",
          description: `Enjoy a curated meal featuring authentic local recipes and traditional dining styles in ${selectedDestination.destination.name}.`,
          timeSlot: "19:30",
          durationMinutes: 90,
          costEstimate: 30,
          locationName: `${selectedDestination.destination.name} Culinary Center`,
          category: "dining"
        }
      ];
    }

    let successReport = tripSuccessPredictor.predict({
      userProfile,
      budgetLimit: budgetLimitINR / 83,
      durationDays,
      destination: destinationQuery,
      activities: rawActivities,
    });

    // Conflict Resolution:
    // If success rate is too low (< 60) due to budget constraints, automatically fallback to a cheaper style
    let finalBudgetResult = budgetResult;
    if (successReport.successScore < 60 && targetStyle === TravelStyle.LUXURY) {
      successReport.reasons.push("[Conflict Resolution] Automatically downgraded target style from Luxury to Boutique to resolve budget deficit.");
      finalBudgetResult = budgetEngine.calculate({
        destination: destinationQuery,
        durationDays,
        travelersCount,
        tier: "mid-range",
        userLimit: budgetLimitINR / 83,
      });
    }

    // Step 6: Trip Optimizer
    const optimizationReport = tripOptimizationEngine.optimize({
      destinations: [destinationQuery],
      activities: rawActivities,
      budgetLimit: finalBudgetResult.breakdown.total,
      durationDays,
    });

    // Step 7: Itinerary Generator (Gemini Server Call)
    // Feasibility summary mapping
    const mockFeasibility = {
      isFeasible: successReport.successScore >= 50,
      warnings: successReport.reasons,
    };

    const geminiResponse = await aiRouter.generateItinerary({
      travelerProfile: userProfile.preferences,
      budgetResult: finalBudgetResult.breakdown,
      feasibilityResult: mockFeasibility,
      recommendedDestinations: [selectedDestination.destination.name],
      prompt: `Generate an optimized plan for ${destinationQuery} utilizing activities: ${optimizationReport.optimizedActivities.map(a => a.title).join(", ")}`,
    }, userProfile.uid);

    // Step 8: Final assembly
    const finalItinerary = itineraryEngine.generate({
      userProfile,
      budgetResult: finalBudgetResult,
      geminiResponse,
    });

    return {
      dnaProfile,
      budgetResult: finalBudgetResult,
      riskReport,
      selectedDestination,
      successReport,
      optimizationReport,
      finalItinerary,
    };
  },
};
