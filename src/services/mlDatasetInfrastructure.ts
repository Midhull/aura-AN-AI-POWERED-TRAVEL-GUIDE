import { supabase } from "./supabase/client";
import type {
  MLTripFeatures,
  MLBudgetFeatures,
  MLDestinationFeatures,
  MLActivityFeatures,
  RawTripInput,
  RawBudgetInput,
  RawDestinationInput,
  RawActivityInput
} from "../types/mlDatasetInfrastructure";
import type { UserProfile, Trip, Itinerary, Destination, Activity } from "../types/travel";

// Helper to calculate traveler age
function calculateAge(dob?: string): number {
  if (!dob) return 30;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return isNaN(age) ? 30 : age;
}

// 1. Feature Engineering Service
export const featureEngineeringService = {
  engineerTripFeatures(trip: Trip, user: UserProfile, itinerary: Itinerary | null): MLTripFeatures {
    const age = calculateAge(user.createdAt);
    const styles = (user.preferences?.styles || []).map(s => s.toString().toUpperCase());
    
    let activityCount = 0;
    if (itinerary?.days) {
      activityCount = itinerary.days.reduce((sum, day) => sum + (day.activities?.length || 0), 0);
    }

    return {
      ageNormalized: parseFloat((age / 100).toFixed(2)),
      isLuxuryStyle: styles.includes("LUXURY") ? 1 : 0,
      isBudgetStyle: (styles.includes("BUDGET") || styles.includes("BACKPACKING")) ? 1 : 0,
      durationDays: trip.durationDays,
      travelersCount: trip.travelersCount,
      activityDensity: parseFloat((activityCount / (trip.durationDays || 1)).toFixed(2)),
    };
  },

  engineerBudgetFeatures(trip: Trip): MLBudgetFeatures {
    const breakDown = trip.budgetBreakdown || { flights: 0, accommodation: 0, dining: 0 };
    return {
      durationDays: trip.durationDays,
      travelersCount: trip.travelersCount,
      estimatedFlights: breakDown.flights || 0,
      estimatedAccommodation: breakDown.accommodation || 0,
      estimatedDining: breakDown.dining || 0,
    };
  },

  engineerDestinationFeatures(user: UserProfile, destination: Destination, matchScore: number): MLDestinationFeatures {
    const age = calculateAge(user.createdAt);
    const temp = 22.0; // default temperature
    const safety = 80.0; // default safety score
    return {
      userAge: age,
      matchScore: matchScore,
      weatherTemperature: temp,
      safetyIndex: safety,
    };
  },

  engineerActivityFeatures(user: UserProfile, activity: Activity, styleScoreMatch: number): MLActivityFeatures {
    const age = calculateAge(user.createdAt);
    return {
      userAge: age,
      costEstimate: activity.costEstimate || 0,
      durationMinutes: activity.durationMinutes || 60,
      styleScoreMatch: styleScoreMatch,
    };
  }
};

// 2. Dataset Builder Service
export const datasetBuilderService = {
  validateAndCleanTrip(input: RawTripInput): boolean {
    if (!input.userProfile?.uid || !input.trip?.id) return false;
    if (input.trip.durationDays <= 0 || input.trip.durationDays > 180) return false;
    if (input.trip.budgetLimit < 0) return false;
    if (input.rating < 1 || input.rating > 5) return false;
    return true;
  },

  validateAndCleanBudget(input: RawBudgetInput): boolean {
    if (!input.userProfile?.uid || !input.trip?.id) return false;
    if (input.trip.durationDays <= 0 || input.trip.durationDays > 180) return false;
    if (input.actualSpend < 0) return false;
    return true;
  },

  validateAndCleanDestination(input: RawDestinationInput): boolean {
    if (!input.userProfile?.uid || !input.destination?.id) return false;
    if (input.matchScore < 0 || input.matchScore > 100) return false;
    if (input.selected !== 0 && input.selected !== 1) return false;
    return true;
  },

  validateAndCleanActivity(input: RawActivityInput): boolean {
    if (!input.userProfile?.uid || !input.activity?.id) return false;
    if (input.rating < 1 || input.rating > 5) return false;
    return true;
  },

  async ingestTrip(input: RawTripInput): Promise<void> {
    if (!this.validateAndCleanTrip(input)) {
      console.warn(`[ML Dataset Builder] Trip validation failed: user=${input.userProfile?.uid}, trip=${input.trip?.id}`);
      return;
    }
    const features = featureEngineeringService.engineerTripFeatures(input.trip, input.userProfile, input.itinerary);
    
    const { error } = await supabase.from("ml_trip_dataset").upsert({
      user_id: input.userProfile.uid,
      trip_id: input.trip.id,
      features,
      raw_data: input,
      target_rating: input.rating,
    }, { onConflict: "user_id,trip_id" });

    if (error) throw error;
  },

  async ingestBudget(input: RawBudgetInput): Promise<void> {
    if (!this.validateAndCleanBudget(input)) {
      console.warn(`[ML Dataset Builder] Budget validation failed: user=${input.userProfile?.uid}, trip=${input.trip?.id}`);
      return;
    }
    const features = featureEngineeringService.engineerBudgetFeatures(input.trip);
    
    const { error } = await supabase.from("ml_budget_dataset").upsert({
      user_id: input.userProfile.uid,
      trip_id: input.trip.id,
      features,
      raw_data: input,
      target_actual_spend: input.actualSpend,
    }, { onConflict: "user_id,trip_id" });

    if (error) throw error;
  },

  async ingestDestination(input: RawDestinationInput): Promise<void> {
    if (!this.validateAndCleanDestination(input)) {
      console.warn(`[ML Dataset Builder] Destination validation failed: user=${input.userProfile?.uid}, dest=${input.destination?.id}`);
      return;
    }
    const features = featureEngineeringService.engineerDestinationFeatures(input.userProfile, input.destination, input.matchScore);
    
    const { error } = await supabase.from("ml_destination_dataset").upsert({
      user_id: input.userProfile.uid,
      destination_id: input.destination.id,
      features,
      raw_data: input,
      target_selected: input.selected,
    }, { onConflict: "user_id,destination_id" });

    if (error) throw error;
  },

  async ingestActivity(input: RawActivityInput): Promise<void> {
    if (!this.validateAndCleanActivity(input)) {
      console.warn(`[ML Dataset Builder] Activity validation failed: user=${input.userProfile?.uid}, act=${input.activity?.id}`);
      return;
    }
    const features = featureEngineeringService.engineerActivityFeatures(input.userProfile, input.activity, input.styleScoreMatch);
    
    const { error } = await supabase.from("ml_activity_dataset").upsert({
      user_id: input.userProfile.uid,
      activity_id: input.activity.id,
      features,
      raw_data: input,
      target_rating: input.rating,
    }, { onConflict: "user_id,activity_id" });

    if (error) throw error;
  }
};

// 3. Training Export Service
export const trainingExportService = {
  async exportDataset(
    datasetType: "trip" | "budget" | "destination" | "activity",
    format: "json" | "csv" | "parquet"
  ): Promise<string> {
    const tableName = `ml_${datasetType}_dataset`;
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) throw error;

    const records = data || [];

    if (format === "json") {
      return JSON.stringify(records, null, 2);
    }

    if (format === "csv") {
      if (records.length === 0) return "";
      
      let headers: string[] = [];
      let rows: any[][] = [];

      if (datasetType === "trip") {
        headers = [
          "id", "user_id", "trip_id",
          "ageNormalized", "isLuxuryStyle", "isBudgetStyle", "durationDays", "travelersCount", "activityDensity",
          "target_rating"
        ];
        rows = records.map((r: any) => {
          const f = r.features as MLTripFeatures;
          return [
            r.id, r.user_id, r.trip_id,
            f.ageNormalized, f.isLuxuryStyle, f.isBudgetStyle, f.durationDays, f.travelersCount, f.activityDensity,
            r.target_rating
          ];
        });
      } else if (datasetType === "budget") {
        headers = [
          "id", "user_id", "trip_id",
          "durationDays", "travelersCount", "estimatedFlights", "estimatedAccommodation", "estimatedDining",
          "target_actual_spend"
        ];
        rows = records.map((r: any) => {
          const f = r.features as MLBudgetFeatures;
          return [
            r.id, r.user_id, r.trip_id,
            f.durationDays, f.travelersCount, f.estimatedFlights, f.estimatedAccommodation, f.estimatedDining,
            r.target_actual_spend
          ];
        });
      } else if (datasetType === "destination") {
        headers = [
          "id", "user_id", "destination_id",
          "userAge", "matchScore", "weatherTemperature", "safetyIndex",
          "target_selected"
        ];
        rows = records.map((r: any) => {
          const f = r.features as MLDestinationFeatures;
          return [
            r.id, r.user_id, r.destination_id,
            f.userAge, f.matchScore, f.weatherTemperature, f.safetyIndex,
            r.target_selected
          ];
        });
      } else if (datasetType === "activity") {
        headers = [
          "id", "user_id", "activity_id",
          "userAge", "costEstimate", "durationMinutes", "styleScoreMatch",
          "target_rating"
        ];
        rows = records.map((r: any) => {
          const f = r.features as MLActivityFeatures;
          return [
            r.id, r.user_id, r.activity_id,
            f.userAge, f.costEstimate, f.durationMinutes, f.styleScoreMatch,
            r.target_rating
          ];
        });
      }

      return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    }

    if (format === "parquet") {
      let schemaName = "";
      let featuresLayout: Record<string, string> = {};
      let targetLayout: Record<string, string> = {};

      if (datasetType === "trip") {
        schemaName = "TripFeaturesSchema";
        featuresLayout = {
          ageNormalized: "float32",
          isLuxuryStyle: "int8",
          isBudgetStyle: "int8",
          durationDays: "int32",
          travelersCount: "int32",
          activityDensity: "float32",
        };
        targetLayout = {
          targetRating: "int32",
        };
      } else if (datasetType === "budget") {
        schemaName = "BudgetFeaturesSchema";
        featuresLayout = {
          durationDays: "int32",
          travelersCount: "int32",
          estimatedFlights: "float32",
          estimatedAccommodation: "float32",
          estimatedDining: "float32",
        };
        targetLayout = {
          targetActualSpend: "float64",
        };
      } else if (datasetType === "destination") {
        schemaName = "DestinationFeaturesSchema";
        featuresLayout = {
          userAge: "int32",
          matchScore: "float32",
          weatherTemperature: "float32",
          safetyIndex: "float32",
        };
        targetLayout = {
          targetSelected: "int8",
        };
      } else if (datasetType === "activity") {
        schemaName = "ActivityFeaturesSchema";
        featuresLayout = {
          userAge: "int32",
          costEstimate: "float32",
          durationMinutes: "int32",
          styleScoreMatch: "float32",
        };
        targetLayout = {
          targetRating: "int32",
        };
      }

      return JSON.stringify({
        arrowTableSchema: schemaName,
        featuresLayout,
        targetLayout,
        records,
      }, null, 2);
    }

    return "";
  }
};

// Facade for backward compatibility
export const mlDatasetInfrastructure = {
  validateAndClean(trip: Trip, user: UserProfile): boolean {
    return datasetBuilderService.validateAndCleanTrip({
      userProfile: user,
      trip,
      itinerary: null,
      rating: 5,
    });
  },

  engineerTripFeatures(trip: Trip, user: UserProfile, itinerary: Itinerary | null): MLTripFeatures {
    return featureEngineeringService.engineerTripFeatures(trip, user, itinerary);
  },

  engineerBudgetFeatures(trip: Trip): MLBudgetFeatures {
    return featureEngineeringService.engineerBudgetFeatures(trip);
  },

  async ingestTripMetrics(
    trip: Trip,
    user: UserProfile,
    itinerary: Itinerary | null,
    actualSpend: number,
    rating: number
  ): Promise<void> {
    await Promise.all([
      datasetBuilderService.ingestTrip({
        userProfile: user,
        trip,
        itinerary,
        rating,
      }),
      datasetBuilderService.ingestBudget({
        userProfile: user,
        trip,
        actualSpend,
      }),
    ]);
  },

  async exportMLTripDataset(format: "json" | "csv" | "parquet"): Promise<string> {
    return trainingExportService.exportDataset("trip", format);
  }
};
