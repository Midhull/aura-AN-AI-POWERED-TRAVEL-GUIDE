import type { UserProfile, Trip, Itinerary, Destination, Activity } from "./travel";

export interface MLTripFeatures {
  ageNormalized: number;
  isLuxuryStyle: number; // 0 or 1
  isBudgetStyle: number; // 0 or 1
  durationDays: number;
  travelersCount: number;
  activityDensity: number;
}

export interface MLBudgetFeatures {
  durationDays: number;
  travelersCount: number;
  estimatedFlights: number;
  estimatedAccommodation: number;
  estimatedDining: number;
}

export interface MLDestinationFeatures {
  userAge: number;
  matchScore: number;
  weatherTemperature: number;
  safetyIndex: number;
}

export interface MLActivityFeatures {
  userAge: number;
  costEstimate: number;
  durationMinutes: number;
  styleScoreMatch: number;
}

// Raw Ingestion Inputs
export interface RawTripInput {
  userProfile: UserProfile;
  trip: Trip;
  itinerary: Itinerary | null;
  rating: number;
}

export interface RawBudgetInput {
  userProfile: UserProfile;
  trip: Trip;
  actualSpend: number;
}

export interface RawDestinationInput {
  userProfile: UserProfile;
  destination: Destination;
  matchScore: number;
  weatherTemperature: number;
  safetyIndex: number;
  selected: number; // 0 or 1
}

export interface RawActivityInput {
  userProfile: UserProfile;
  activity: Activity;
  styleScoreMatch: number;
  rating: number;
}

// Database Record schemas
export interface MLTripDatasetRecord {
  id: string;
  user_id: string;
  trip_id: string;
  features: MLTripFeatures;
  raw_data: RawTripInput;
  target_rating: number;
  created_at: string;
}

export interface MLBudgetDatasetRecord {
  id: string;
  user_id: string;
  trip_id: string;
  features: MLBudgetFeatures;
  raw_data: RawBudgetInput;
  target_actual_spend: number;
  created_at: string;
}

export interface MLDestinationDatasetRecord {
  id: string;
  user_id: string;
  destination_id: string;
  features: MLDestinationFeatures;
  raw_data: RawDestinationInput;
  target_selected: number;
  created_at: string;
}

export interface MLActivityDatasetRecord {
  id: string;
  user_id: string;
  activity_id: string;
  features: MLActivityFeatures;
  raw_data: RawActivityInput;
  target_rating: number;
  created_at: string;
}
