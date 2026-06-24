import { TravelStyle } from "./travel";

export interface BudgetHistoryRecord {
  id: string;
  userId?: string;
  destination: string;
  travelersCount: number;
  durationDays: number;
  travelStyle: TravelStyle;
  estimatedBudget: number;
  actualBudget: number;
  createdAt: string;
}

export interface PredictionInput {
  destination: string;
  travelersCount: number;
  durationDays: number;
  travelStyle: TravelStyle;
  month: number; // 1 to 12
  isHolidayPeriod: boolean;
}

export interface BudgetPrediction {
  baseEstimate: number;
  adjustedEstimate: number;
  confidenceScore: number; // 0 to 100
  accuracyTracking: {
    meanAbsoluteErrorPercentage: number;
    historicalRecordsCount: number;
  };
  varianceAnalysis: {
    averageVariance: number; // actual - estimated
    variancePercentage: number;
    trend: "under_budget" | "on_track" | "over_budget";
  };
}
