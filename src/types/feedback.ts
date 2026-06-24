export type FeedbackItemType = "destination" | "activity" | "hotel" | "restaurant" | "itinerary";

export interface ItemFeedback {
  id: string;
  userId: string;
  tripId?: string;
  itemType: FeedbackItemType;
  itemId: string;
  rating: number; // 1 to 5
  review?: string;
  createdAt: string;
}

export interface FeedbackAggregation {
  itemId: string;
  itemType: FeedbackItemType;
  averageRating: number;
  totalReviews: number;
}

export interface MLTrainingFeedbackRecord {
  userId: string;
  tripContext: {
    destination: string;
    travelStyle: string;
    durationDays: number;
  };
  feedback: {
    itemType: FeedbackItemType;
    itemId: string;
    rating: number;
    reviewLength: number;
  };
}
