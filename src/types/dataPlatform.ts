export type UserActionType = "viewed" | "clicked" | "saved" | "ignored" | "deleted";
export type TripOutcomeType = "completed" | "partially_completed" | "cancelled";

export interface AnalyticsEvent {
  id: string;
  userId: string;
  tripId?: string;
  eventType: UserActionType;
  itemType: string; // destination, hotel, activity, itinerary
  itemId: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface UserBehaviorLog {
  id: string;
  userId: string;
  tripId: string;
  originalPlan: any;
  modifiedPlan: any;
  removedItems: string[];
  addedItems: string[];
  createdAt: string;
}

export interface TripOutcome {
  id: string;
  userId: string;
  tripId: string;
  outcome: TripOutcomeType;
  completedActivitiesCount: number;
  totalActivitiesCount: number;
  updatedAt: string;
}

export interface BudgetAccuracyLog {
  id: string;
  userId: string;
  tripId: string;
  estimatedBudget: number;
  plannedBudget: number;
  actualSpend: number;
  overspendAmount: number;
  actualFlightCost: number;
  actualHotelCost: number;
  actualFoodCost: number;
  actualTransportCost: number;
  actualActivityCost: number;
  accuracyScore: number;
  predictionError: number;
  correctionFactors: Record<string, number>;
  createdAt: string;
}
