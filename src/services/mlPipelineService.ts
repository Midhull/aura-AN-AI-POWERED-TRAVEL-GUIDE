import { supabase } from "./supabase/client";
import type { RawMLPipelineInput, EngineeredFeatures, TrainingDatasetRecord } from "../types/mlPipeline";
import { TravelStyle } from "../types/travel";
import type { Trip } from "../types/travel";

export const mlPipelineService = {
  // 1. Data Cleaning Pipeline
  clean(input: RawMLPipelineInput): boolean {
    if (!input.userProfile || !input.trip) return false;
    if (input.trip.durationDays <= 0) return false;
    if (input.rating < 1 || input.rating > 5) return false;
    return true;
  },

  // 2. Feature Engineering Pipeline
  engineerFeatures(input: RawMLPipelineInput): EngineeredFeatures {
    const { userProfile, trip, generatedItinerary } = input;

    // Encoded travel styles indices
    let styleVal = 1;
    const prefStyle = userProfile.preferences.styles[0] || TravelStyle.BOUTIQUE;
    if (prefStyle === TravelStyle.LUXURY) styleVal = 3;
    if (prefStyle === TravelStyle.BUDGET || prefStyle === TravelStyle.BACKPACKING) styleVal = 0;

    const budgetLimitNormalized = trip.budgetLimit / (trip.durationDays || 1);
    
    // Count activities
    let activityCount = 0;
    let diningCount = 0;
    if (generatedItinerary?.days) {
      for (const day of generatedItinerary.days) {
        activityCount += day.activities.length;
        diningCount += day.activities.filter(a => a.category === "dining").length;
      }
    }

    const diningRatio = activityCount > 0 ? parseFloat((diningCount / activityCount).toFixed(2)) : 0.0;
    const isLuxuryPref = userProfile.preferences.styles.includes(TravelStyle.LUXURY) ? 1 : 0;

    return {
      travelerStyleEncoded: styleVal,
      budgetLimitNormalized: Math.round(budgetLimitNormalized),
      durationDays: trip.durationDays,
      travelersCount: trip.travelersCount,
      activityCount,
      diningRatio,
      isLuxuryPref,
      ratingWeight: input.rating * 0.2, // scaled between 0.2 and 1.0
    };
  },

  // Process and ingest record to Supabase
  async processAndIngest(input: RawMLPipelineInput): Promise<void> {
    if (!this.clean(input)) {
      console.warn("ML Pipeline warning: Input record rejected during cleaning stage.");
      return;
    }

    const features = this.engineerFeatures(input);
    const targetCostVariance = input.actualSpend - tripEstimatedBudget(input.trip);

    const { error } = await supabase.from("training_dataset").insert({
      user_id: input.userProfile.uid,
      trip_id: input.trip.id,
      features,
      target_rating: input.rating,
      target_cost_variance: targetCostVariance,
      raw_data: input,
    });

    if (error) throw error;
  },

  // 3. Export Service (JSON, CSV formats)
  async exportDataset(format: "json" | "csv" | "parquet"): Promise<string> {
    const { data, error } = await supabase
      .from("training_dataset")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const records: TrainingDatasetRecord[] = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      tripId: row.trip_id,
      features: row.features as EngineeredFeatures,
      targetRating: row.target_rating,
      targetCostVariance: parseFloat(row.target_cost_variance),
      rawData: row.raw_data as RawMLPipelineInput,
      createdAt: row.created_at,
    }));

    if (format === "json") {
      return JSON.stringify(records, null, 2);
    }

    if (format === "csv") {
      const headers = [
        "id",
        "travelerStyleEncoded",
        "budgetLimitNormalized",
        "durationDays",
        "travelersCount",
        "activityCount",
        "diningRatio",
        "isLuxuryPref",
        "targetRating",
        "targetCostVariance",
      ];
      
      const rows = records.map((r) => [
        r.id,
        r.features.travelerStyleEncoded,
        r.features.budgetLimitNormalized,
        r.features.durationDays,
        r.features.travelersCount,
        r.features.activityCount,
        r.features.diningRatio,
        r.features.isLuxuryPref,
        r.targetRating,
        r.targetCostVariance,
      ]);

      return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    }

    if (format === "parquet") {
      // In web/TypeScript contexts, full Parquet compression requires binary bindings (like duckdb or parquet-wasm).
      // We return a structured JSON-LD column schema mapping metadata so that downstream python loaders
      // can convert the exported dataset directly to parquet formats.
      return JSON.stringify({
        schema: "ArrowSchemaTable",
        columns: {
          features: "StructType(travelerStyleEncoded: int32, budgetLimitNormalized: int32, durationDays: int32, travelersCount: int32, activityCount: int32, diningRatio: float32, isLuxuryPref: int8)",
          targetRating: "Int32",
          targetCostVariance: "Float64",
        },
        records,
      }, null, 2);
    }

    return "";
  },
};

function tripEstimatedBudget(trip: Trip): number {
  return trip.budgetBreakdown?.total || 0;
}
