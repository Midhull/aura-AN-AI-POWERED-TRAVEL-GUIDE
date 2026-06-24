import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  UserProfile,
  TravelerProfile,
  Trip,
  BudgetResult,
  FeasibilityResult,
  Itinerary,
  ChatMessage,
} from "../types/travel";
import { dbService } from "../services/supabase/database";
import { supabase } from "../services/supabase/client";

interface AppState {
  // --- States ---
  user: UserProfile | null;
  travelerProfile: TravelerProfile | null;
  currentTrip: Trip | null;
  budgetResult: BudgetResult | null;
  feasibilityResult: FeasibilityResult | null;
  generatedItinerary: Itinerary | null;
  chatMessages: ChatMessage[];
  loading: boolean;
  error: string | null;
  isHydrated: boolean;

  // --- Actions ---
  setHydrated: (state: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  setTravelerProfile: (profile: TravelerProfile | null) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  setBudgetResult: (budget: BudgetResult | null) => void;
  setFeasibilityResult: (feasibility: FeasibilityResult | null) => void;
  setGeneratedItinerary: (itinerary: Itinerary | null) => void;

  // --- Optimistic Updates Actions ---
  updateTripOptimistically: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  addChatMessageOptimistically: (message: ChatMessage, saveFn: (msg: ChatMessage) => Promise<void>) => Promise<void>;
  updateTravelerProfileOptimistically: (profile: TravelerProfile) => Promise<void>;
  clearError: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial States
      user: null,
      travelerProfile: null,
      currentTrip: null,
      budgetResult: null,
      feasibilityResult: null,
      generatedItinerary: null,
      chatMessages: [],
      loading: false,
      error: null,
      isHydrated: false,

      setHydrated(state) {
        set({ isHydrated: state });
      },

      setUser(user) {
        set({ user });
      },

      setTravelerProfile(travelerProfile) {
        set({ travelerProfile });
      },

      setCurrentTrip(currentTrip) {
        set({ currentTrip });
      },

      setBudgetResult(budgetResult) {
        set({ budgetResult });
      },

      setFeasibilityResult(feasibilityResult) {
        set({ feasibilityResult });
      },

      setGeneratedItinerary(generatedItinerary) {
        set({ generatedItinerary });
      },

      // --- Optimistic Update: Trips ---
      async updateTripOptimistically(tripId, updates) {
        const previousTrip = get().currentTrip;

        // 1. Apply changes optimistically to state
        if (previousTrip && previousTrip.id === tripId) {
          const updatedTrip = {
            ...previousTrip,
            ...updates,
            updatedAt: new Date().toISOString(),
          } as Trip;
          set({ currentTrip: updatedTrip });
        }

        const isGuest = !!localStorage.getItem("aria_guest_session");
        if (isGuest) {
          try {
            // Update localStorage trips list
            const rawTrips = localStorage.getItem("aria_local_trips");
            if (rawTrips) {
              const trips = JSON.parse(rawTrips) as Trip[];
              const updatedTrips = trips.map((t) =>
                t.id === tripId
                  ? ({ ...t, ...updates, updatedAt: new Date().toISOString() } as Trip)
                  : t
              );
              localStorage.setItem("aria_local_trips", JSON.stringify(updatedTrips));
            }
          } catch (e) {
            console.error("Local trip update failed:", e);
          }
          return;
        }

        try {
          // 2. Perform remote write to database
          const { error } = await supabase
            .from("trips")
            .update({
              title: updates.title,
              destination: updates.destination,
              start_date: updates.startDate,
              end_date: updates.endDate,
              duration_days: updates.durationDays,
              travelers_count: updates.travelersCount,
              status: updates.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", tripId);

          if (error) throw error;
        } catch (err: any) {
          // 3. Rollback on failure
          set({
            currentTrip: previousTrip,
            error: err.message || "Failed to update trip. Rolled back changes.",
          });
        }
      },

      // --- Optimistic Update: Chat Messages ---
      async addChatMessageOptimistically(message, saveFn) {
        const previousMessages = get().chatMessages;

        // 1. Append message immediately to local state
        set({ chatMessages: [...previousMessages, message] });

        try {
          // 2. Run remote save function
          await saveFn(message);
        } catch (err: any) {
          // 3. Rollback on failure
          set({
            chatMessages: previousMessages,
            error: err.message || "Failed to deliver message. Rolled back state.",
          });
        }
      },

      // --- Optimistic Update: Traveler Profiles ---
      async updateTravelerProfileOptimistically(profile) {
        const previousProfile = get().travelerProfile;

        // 1. Apply changes optimistically
        set({ travelerProfile: profile });

        const isGuest = !!localStorage.getItem("aria_guest_session");
        if (isGuest) {
          localStorage.setItem("aria_local_traveler_profile", JSON.stringify(profile));
          return;
        }

        try {
          // 2. Perform write
          const { error } = await supabase
            .from("traveler_profiles")
            .update({
              full_name: profile.fullName,
              date_of_birth: profile.dateOfBirth,
              passport_number: profile.passportNumber,
              nationality: profile.nationality,
              emergency_contact: profile.emergencyContact,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) throw error;
        } catch (err: any) {
          // 3. Rollback
          set({
            travelerProfile: previousProfile,
            error: err.message || "Failed to update profile. Rolled back changes.",
          });
        }
      },

      clearError() {
        set({ error: null });
      },
    }),
    {
      name: "aria-travel-planner-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist non-transient configuration fields
      partialize: (state) => ({
        user: state.user,
        travelerProfile: state.travelerProfile,
        currentTrip: state.currentTrip,
        budgetResult: state.budgetResult,
        feasibilityResult: state.feasibilityResult,
        generatedItinerary: state.generatedItinerary,
        chatMessages: state.chatMessages,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
