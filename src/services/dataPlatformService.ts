import { supabase } from "./supabase/client";
import type { AnalyticsEvent, UserBehaviorLog, TripOutcome, BudgetAccuracyLog } from "../types/dataPlatform";

export const dataPlatformService = {
  // 1. Event Tracking API
  async trackEvent(event: Omit<AnalyticsEvent, "id" | "createdAt">): Promise<void> {
    const { error } = await supabase.from("analytics_events").insert({
      user_id: event.userId,
      trip_id: event.tripId || null,
      event_type: event.eventType,
      item_type: event.itemType,
      item_id: event.itemId,
      metadata: event.metadata,
    });

    if (error) {
      console.error("Failed to track analytics event:", error);
    }
  },

  async logItineraryEdits(log: Omit<UserBehaviorLog, "id" | "createdAt">): Promise<void> {
    const { error } = await supabase.from("user_behavior").insert({
      user_id: log.userId,
      trip_id: log.tripId,
      original_plan: log.originalPlan,
      modified_plan: log.modifiedPlan,
      removed_items: log.removedItems,
      added_items: log.addedItems,
    });

    if (error) {
      console.error("Failed to log itinerary modification behavior:", error);
    }
  },

  async logTripOutcome(outcome: Omit<TripOutcome, "id" | "updatedAt">): Promise<void> {
    const { error } = await supabase.from("trip_outcomes").upsert({
      user_id: outcome.userId,
      trip_id: outcome.tripId,
      outcome: outcome.outcome,
      completed_activities_count: outcome.completedActivitiesCount,
      total_activities_count: outcome.totalActivitiesCount,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to log trip completion outcome:", error);
    }
  },

  async logBudgetAccuracy(log: Omit<BudgetAccuracyLog, "id" | "createdAt">): Promise<void> {
    const { error } = await supabase.from("budget_accuracy").upsert({
      user_id: log.userId,
      trip_id: log.tripId,
      estimated_budget: log.estimatedBudget,
      planned_budget: log.plannedBudget,
      actual_spend: log.actualSpend,
      overspend_amount: log.overspendAmount,
      actual_flight_cost: log.actualFlightCost || 0.00,
      actual_hotel_cost: log.actualHotelCost || 0.00,
      actual_food_cost: log.actualFoodCost || 0.00,
      actual_transport_cost: log.actualTransportCost || 0.00,
      actual_activity_cost: log.actualActivityCost || 0.00,
      accuracy_score: log.accuracyScore || 0.00,
      prediction_error: log.predictionError || 0.00,
      correction_factors: log.correctionFactors || {},
    }, { onConflict: "trip_id" });

    if (error) {
      console.error("Failed to log budget accuracy metadata:", error);
    }
  },

  async trackBudgetAccuracy(
    userId: string,
    tripId: string,
    estimatedBudget: number,
    plannedBudget: number,
    actualSpend: number,
    categoryActuals: {
      flights: number;
      accommodation: number;
      dining: number;
      transport: number;
      activities: number;
    },
    categoryEstimates: {
      flights: number;
      accommodation: number;
      dining: number;
      transport: number;
      activities: number;
    }
  ): Promise<BudgetAccuracyLog> {
    const predictionError = actualSpend - estimatedBudget;
    const overspendAmount = Math.max(0, actualSpend - plannedBudget);
    
    // Accuracy score percentage: 100 - absolute percentage error
    const percentageError = estimatedBudget > 0 ? (Math.abs(predictionError) / estimatedBudget) * 100 : 0;
    const accuracyScore = parseFloat(Math.max(0, Math.min(100, 100 - percentageError)).toFixed(2));

    // Calculate correction factors: actual / estimated
    const correctionFactors: Record<string, number> = {};
    const keys = ["flights", "accommodation", "dining", "transport", "activities"] as const;
    for (const key of keys) {
      const est = categoryEstimates[key] || 0;
      const act = categoryActuals[key] || 0;
      correctionFactors[key] = est > 0 ? parseFloat((act / est).toFixed(3)) : (act > 0 ? act : 1.0);
    }

    const { data, error } = await supabase
      .from("budget_accuracy")
      .upsert({
        user_id: userId,
        trip_id: tripId,
        estimated_budget: estimatedBudget,
        planned_budget: plannedBudget,
        actual_spend: actualSpend,
        overspend_amount: overspendAmount,
        actual_flight_cost: categoryActuals.flights,
        actual_hotel_cost: categoryActuals.accommodation,
        actual_food_cost: categoryActuals.dining,
        actual_transport_cost: categoryActuals.transport,
        actual_activity_cost: categoryActuals.activities,
        accuracy_score: accuracyScore,
        prediction_error: predictionError,
        correction_factors: correctionFactors,
      }, { onConflict: "trip_id" })
      .select()
      .single();

    if (error) {
      console.error("Failed to log budget accuracy tracking:", error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      tripId: data.trip_id,
      estimatedBudget: parseFloat(data.estimated_budget),
      plannedBudget: parseFloat(data.planned_budget),
      actualSpend: parseFloat(data.actual_spend),
      overspendAmount: parseFloat(data.overspend_amount),
      actualFlightCost: parseFloat(data.actual_flight_cost),
      actualHotelCost: parseFloat(data.actual_hotel_cost),
      actualFoodCost: parseFloat(data.actual_food_cost),
      actualTransportCost: parseFloat(data.actual_transport_cost),
      actualActivityCost: parseFloat(data.actual_activity_cost),
      accuracyScore: parseFloat(data.accuracy_score),
      predictionError: parseFloat(data.prediction_error),
      correctionFactors: data.correction_factors,
      createdAt: data.created_at,
    };
  },

  // 2. Data Pipeline & Aggregation Services
  async getUserEngagementSummary(userId: string): Promise<{ views: number; clicks: number; saves: number }> {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("event_type")
      .eq("user_id", userId);

    if (error) throw error;

    const list = data || [];
    return {
      views: list.filter(e => e.event_type === "viewed").length,
      clicks: list.filter(e => e.event_type === "clicked").length,
      saves: list.filter(e => e.event_type === "saved").length,
    };
  },

  async getBudgetAccuracyMetrics(): Promise<{ averageOverspend: number; accuracyRatio: number }> {
    const { data, error } = await supabase
      .from("budget_accuracy")
      .select("estimated_budget, actual_spend, overspend_amount");

    if (error) throw error;

    const list = data || [];
    if (list.length === 0) return { averageOverspend: 0, accuracyRatio: 1.0 };

    const totalOverspend = list.reduce((sum, r) => sum + parseFloat(r.overspend_amount as any), 0);
    const sumAbsoluteError = list.reduce((sum, r) => {
      const est = parseFloat(r.estimated_budget as any) || 1;
      const act = parseFloat(r.actual_spend as any);
      return sum + (Math.abs(est - act) / est);
    }, 0);

    return {
      averageOverspend: Math.round(totalOverspend / list.length),
      accuracyRatio: parseFloat((1 - sumAbsoluteError / list.length).toFixed(3)),
    };
  },
};
