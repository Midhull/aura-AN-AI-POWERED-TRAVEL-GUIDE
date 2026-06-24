import { UserProfile, Trip, Itinerary } from "./travel";

export interface RawMLPipelineInput {
  userProfile: UserProfile;
  trip: Trip;
  generatedItinerary: Itinerary;
  actualSpend: number;
  rating: number;
}

export interface EngineeredFeatures {
  travelerStyleEncoded: number;     // e.g. index mapping
  budgetLimitNormalized: number;    // budget / duration
  durationDays: number;
  travelersCount: number;
  activityCount: number;
  diningRatio: number;              // dining activities / total
  isLuxuryPref: number;             // 0 or 1 indicator
  ratingWeight: number;             // target scaling value
}

export interface TrainingDatasetRecord {
  id: string;
  userId?: string;
  tripId?: string;
  features: EngineeredFeatures;
  targetRating: number;
  targetCostVariance: number;
  rawData: RawMLPipelineInput;
  createdAt: string;
}
