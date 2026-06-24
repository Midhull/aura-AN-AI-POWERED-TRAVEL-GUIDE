import { useState } from "react";
import { useTravelStore } from "../stores/useTravelStore";
import { useAuthStore } from "../stores/useAuthStore";
import { generateTripPlan } from "../services/trips";
import type { Trip } from "../types/travel";

export function useTripPlanner() {
  const { user } = useAuthStore();
  const { activeTrip, activeItinerary, createTrip, loading: storeLoading } = useTravelStore();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planTrip = async (destination: string, prompt: string, durationDays = 5): Promise<Trip | null> => {
    if (!user) {
      setError("You must be logged in to plan a trip.");
      return null;
    }

    setGenerating(true);
    setError(null);

    try {
      // 1. Trigger the server function to call LLM/compute
      const result = await generateTripPlan({
        data: {
          destination,
          prompt,
          durationDays,
          userId: user.uid,
        },
      });

      // 2. Persist the generated trip plan locally to Supabase via Zustand
      const trip = await createTrip({
        userId: user.uid,
        title: `Journey to ${destination}`,
        destination,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        durationDays,
        travelersCount: 1,
        status: "planning",
        budgetLimit: result.budgetBreakdown.total,
        budgetBreakdown: result.budgetBreakdown,
      });

      return trip;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during generation.");
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return {
    planTrip,
    activeTrip,
    activeItinerary,
    generating,
    loading: storeLoading || generating,
    error,
  };
}
