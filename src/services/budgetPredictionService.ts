import { supabase } from "./supabase/client";
import type { PredictionInput, BudgetPrediction, BudgetHistoryRecord } from "../types/budgetPrediction";
import { TravelStyle } from "../types/travel";

export const BudgetPredictionService = {
  async predict(input: PredictionInput): Promise<BudgetPrediction> {
    const { destination, travelersCount, durationDays, travelStyle, month, isHolidayPeriod } = input;

    // 1. Fetch matching historical data for variance analysis
    const { data: historyData, error } = await supabase
      .from("budget_history")
      .select("*")
      .ilike("destination", `%${destination}%`)
      .eq("travel_style", travelStyle);

    if (error) {
      console.error("Failed to query budget history:", error);
    }

    const records: BudgetHistoryRecord[] = (historyData || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      destination: row.destination,
      travelersCount: row.travelers_count,
      durationDays: row.duration_days,
      travelStyle: row.travel_style as TravelStyle,
      estimatedBudget: parseFloat(row.estimated_budget),
      actualBudget: parseFloat(row.actual_budget),
      createdAt: row.created_at,
    }));

    // 2. Base estimation calculation logic
    let baseDailyRate = 120;
    if (travelStyle === TravelStyle.LUXURY) baseDailyRate = 450;
    if (travelStyle === TravelStyle.BUDGET || travelStyle === TravelStyle.BACKPACKING) baseDailyRate = 45;

    const baseEstimate = baseDailyRate * durationDays * travelersCount;

    // 3. Apply Multipliers
    let multiplier = 1.0;

    // Seasonal pricing: Peak seasons (Summer: July/August; Spring Cherry Blossom: April)
    if (month === 7 || month === 8) {
      multiplier += 0.25; // Peak Summer +25%
    } else if (month === 4) {
      multiplier += 0.30; // Cherry Blossom Spring +30%
    }

    // Holiday multipliers (e.g. December travel)
    if (isHolidayPeriod || month === 12) {
      multiplier += 0.20; // Holidays +20%
    }

    // Group discounts (lower lodging/sharing transportation per head)
    if (travelersCount === 2) {
      multiplier -= 0.05; // -5% discount
    } else if (travelersCount > 2) {
      multiplier -= 0.10; // -10% discount
    }

    const adjustedEstimate = Math.round(baseEstimate * multiplier);

    // 4. Calculate Accuracy, Confidence, and Variance
    let historicalRecordsCount = records.length;
    let meanAbsoluteErrorPercentage = 0.0;
    let averageVariance = 0;
    let variancePercentage = 0;
    let trend: "under_budget" | "on_track" | "over_budget" = "on_track";

    if (historicalRecordsCount > 0) {
      let absoluteErrorSum = 0;
      let totalVariance = 0;

      for (const rec of records) {
        const errorPercent = Math.abs(rec.actualBudget - rec.estimatedBudget) / rec.estimatedBudget;
        absoluteErrorSum += errorPercent;
        totalVariance += rec.actualBudget - rec.estimatedBudget;
      }

      meanAbsoluteErrorPercentage = Math.round((absoluteErrorSum / historicalRecordsCount) * 100);
      averageVariance = Math.round(totalVariance / historicalRecordsCount);
      
      const avgHistoryEst = records.reduce((acc, r) => acc + r.estimatedBudget, 0) / historicalRecordsCount;
      variancePercentage = Math.round((averageVariance / (avgHistoryEst || 1)) * 100);

      if (variancePercentage > 5) {
        trend = "over_budget";
      } else if (variancePercentage < -5) {
        trend = "under_budget";
      }
    }

    // Confidence Score calculations:
    // Scale base on sample size (up to +50 points) and error rates (deduct points)
    let confidenceScore = 50; // starts at baseline 50
    confidenceScore += Math.min(30, historicalRecordsCount * 5); // +5 per record, up to +30
    confidenceScore -= Math.min(40, meanAbsoluteErrorPercentage); // deduct error percentage, up to -40
    confidenceScore = Math.min(100, Math.max(10, confidenceScore));

    return {
      baseEstimate,
      adjustedEstimate,
      confidenceScore,
      accuracyTracking: {
        meanAbsoluteErrorPercentage,
        historicalRecordsCount,
      },
      varianceAnalysis: {
        averageVariance,
        variancePercentage,
        trend,
      },
    };
  },

  async logActualSpend(record: Omit<BudgetHistoryRecord, "id" | "createdAt">): Promise<void> {
    const { error } = await supabase.from("budget_history").insert({
      user_id: record.userId,
      destination: record.destination,
      travelers_count: record.travelersCount,
      duration_days: record.durationDays,
      travel_style: record.travelStyle,
      estimated_budget: record.estimatedBudget,
      actual_budget: record.actualBudget,
    });

    if (error) throw error;
  },
};
