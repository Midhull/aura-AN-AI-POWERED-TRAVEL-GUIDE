import { supabase } from "./supabase/client";
import type { ItemFeedback, FeedbackAggregation, FeedbackItemType, MLTrainingFeedbackRecord } from "../types/feedback";

export const feedbackService = {
  async submitFeedback(feedback: Omit<ItemFeedback, "id" | "createdAt">): Promise<ItemFeedback> {
    const { data, error } = await supabase
      .from("item_feedback")
      .insert({
        user_id: feedback.userId,
        trip_id: feedback.tripId || null,
        item_type: feedback.itemType,
        item_id: feedback.itemId,
        rating: feedback.rating,
        review: feedback.review || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      tripId: data.trip_id || undefined,
      itemType: data.item_type as FeedbackItemType,
      itemId: data.item_id,
      rating: data.rating,
      review: data.review || undefined,
      createdAt: data.created_at,
    };
  },

  async getItemAggregation(itemId: string, itemType: FeedbackItemType): Promise<FeedbackAggregation> {
    const { data, error } = await supabase
      .from("item_feedback")
      .select("rating")
      .eq("item_id", itemId)
      .eq("item_type", itemType);

    if (error) throw error;

    const totalReviews = data?.length || 0;
    const totalScore = (data || []).reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalReviews > 0 ? parseFloat((totalScore / totalReviews).toFixed(2)) : 0.0;

    return {
      itemId,
      itemType,
      averageRating,
      totalReviews,
    };
  },

  async getMLFeedbackDataset(): Promise<MLTrainingFeedbackRecord[]> {
    const { data, error } = await supabase
      .from("item_feedback")
      .select(`
        user_id,
        item_type,
        item_id,
        rating,
        review,
        trips (
          destination,
          status,
          duration_days
        )
      `);

    if (error) throw error;

    return (data || []).map((row: any) => {
      const trip = row.trips;
      return {
        userId: row.user_id,
        tripContext: {
          destination: trip?.destination || "unknown",
          travelStyle: "unknown", // can be mapped via joins if user profile preferences are fetched
          durationDays: trip?.duration_days || 0,
        },
        feedback: {
          itemType: row.item_type as FeedbackItemType,
          itemId: row.item_id,
          rating: row.rating,
          reviewLength: row.review ? row.review.length : 0,
        },
      };
    });
  },
};
