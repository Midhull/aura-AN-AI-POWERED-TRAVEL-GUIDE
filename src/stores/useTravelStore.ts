import { create } from "zustand";
import type { Trip, Itinerary } from "../types/travel";
import { dbService } from "../services/supabase/database";

interface TravelState {
  trips: Trip[];
  activeTrip: Trip | null;
  activeItinerary: Itinerary | null;
  loading: boolean;
  error: string | null;
  isLocalMode: boolean;
  setLocalMode: (enabled: boolean) => void;
  fetchTrips: (userId: string) => Promise<void>;
  setActiveTrip: (trip: Trip | null) => Promise<void>;
  createTrip: (trip: Omit<Trip, "id" | "createdAt" | "updatedAt">, itineraryDays?: any) => Promise<Trip>;
  saveItinerary: (tripId: string, days: any) => Promise<Itinerary>;
  deleteTrip: (tripId: string) => Promise<void>;
  archiveTrip: (tripId: string) => Promise<void>;
  duplicateTrip: (trip: Trip) => Promise<Trip>;
  clearError: () => void;
}

// Helpers for localStorage fallback
const getLocalTrips = (): Trip[] => {
  try {
    const raw = localStorage.getItem("aria_local_trips");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalTrips = (trips: Trip[]) => {
  localStorage.setItem("aria_local_trips", JSON.stringify(trips));
};

const getLocalItinerary = (tripId: string): Itinerary | null => {
  try {
    const raw = localStorage.getItem(`aria_local_itinerary_${tripId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const saveLocalItinerary = (tripId: string, itinerary: Itinerary) => {
  localStorage.setItem(`aria_local_itinerary_${tripId}`, JSON.stringify(itinerary));
};

export const useTravelStore = create<TravelState>((set, get) => ({
  trips: [],
  activeTrip: null,
  activeItinerary: null,
  loading: false,
  error: null,
  isLocalMode: false,

  setLocalMode(enabled) {
    set({ isLocalMode: enabled });
  },

  async fetchTrips(userId) {
    set({ loading: true });
    
    // Automatically fallback to local storage if user is a guest, or if isLocalMode is enabled
    const guestSession = localStorage.getItem("aria_guest_session");
    if (guestSession || get().isLocalMode || userId === "00000000-0000-0000-0000-000000000000") {
      set({ trips: getLocalTrips(), error: null, loading: false });
      return;
    }

    try {
      const trips = await dbService.getUserTrips(userId);
      set({ trips, error: null });
    } catch (err: any) {
      console.warn("Supabase fetchTrips failed, falling back to local mode:", err.message);
      // Auto-fallback on table missing or network error
      set({ 
        trips: getLocalTrips(), 
        isLocalMode: true, 
        error: "Supabase table not found or unconfigured. Switched to Local Demo Mode."
      });
    } finally {
      set({ loading: false });
    }
  },

  async setActiveTrip(trip) {
    if (!trip) {
      set({ activeTrip: null, activeItinerary: null });
      return;
    }
    
    set({ activeTrip: trip, loading: true });
    
    const guestSession = localStorage.getItem("aria_guest_session");
    if (guestSession || get().isLocalMode || trip.userId === "00000000-0000-0000-0000-000000000000") {
      const itinerary = getLocalItinerary(trip.id);
      set({ activeItinerary: itinerary, error: null, loading: false });
      return;
    }

    try {
      const itinerary = await dbService.getTripItinerary(trip.id);
      set({ activeItinerary: itinerary, error: null });
    } catch (err: any) {
      console.warn("Supabase getTripItinerary failed, checking local storage:", err.message);
      const itinerary = getLocalItinerary(trip.id);
      set({ activeItinerary: itinerary, error: null });
    } finally {
      set({ loading: false });
    }
  },

  async createTrip(tripData, itineraryDays) {
    set({ loading: true });
    const guestSession = localStorage.getItem("aria_guest_session");
    const isLocal = guestSession || get().isLocalMode || tripData.userId === "00000000-0000-0000-0000-000000000000";

    if (isLocal) {
      const newTrip: Trip = {
        ...tripData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedTrips = [newTrip, ...getLocalTrips()];
      saveLocalTrips(updatedTrips);

      if (itineraryDays) {
        const newItinerary: Itinerary = {
          id: crypto.randomUUID(),
          tripId: newTrip.id,
          days: itineraryDays,
          version: 1,
          isCurrent: true,
          createdAt: new Date().toISOString(),
        };
        saveLocalItinerary(newTrip.id, newItinerary);
        set({ activeItinerary: newItinerary });
      }

      set((state) => ({
        trips: updatedTrips,
        activeTrip: newTrip,
        error: null,
      }));
      set({ loading: false });
      return newTrip;
    }

    try {
      const newTrip = await dbService.createTrip(tripData);
      
      if (itineraryDays) {
        try {
          const newItinerary = await dbService.saveItinerary({
            tripId: newTrip.id,
            days: itineraryDays,
            version: 1,
            isCurrent: true,
          });
          set({ activeItinerary: newItinerary });
        } catch (itinErr) {
          console.error("Failed to save itinerary on Supabase, saving locally:", itinErr);
          const localItin: Itinerary = {
            id: crypto.randomUUID(),
            tripId: newTrip.id,
            days: itineraryDays,
            version: 1,
            isCurrent: true,
            createdAt: new Date().toISOString(),
          };
          saveLocalItinerary(newTrip.id, localItin);
          set({ activeItinerary: localItin });
        }
      }

      set((state) => ({
        trips: [newTrip, ...state.trips],
        activeTrip: newTrip,
        error: null,
      }));
      return newTrip;
    } catch (err: any) {
      console.warn("Supabase createTrip failed, falling back to local:", err.message);
      // Fallback
      const newTrip: Trip = {
        ...tripData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedTrips = [newTrip, ...getLocalTrips()];
      saveLocalTrips(updatedTrips);

      if (itineraryDays) {
        const newItinerary: Itinerary = {
          id: crypto.randomUUID(),
          tripId: newTrip.id,
          days: itineraryDays,
          version: 1,
          isCurrent: true,
          createdAt: new Date().toISOString(),
        };
        saveLocalItinerary(newTrip.id, newItinerary);
        set({ activeItinerary: newItinerary });
      }

      set((state) => ({
        trips: updatedTrips,
        activeTrip: newTrip,
        isLocalMode: true,
        error: "Supabase error. Saved trip locally instead.",
      }));
      return newTrip;
    } finally {
      set({ loading: false });
    }
  },

  async saveItinerary(tripId, days) {
    set({ loading: true });
    const localItin: Itinerary = {
      id: crypto.randomUUID(),
      tripId,
      days,
      version: 1,
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };

    const guestSession = localStorage.getItem("aria_guest_session");
    if (guestSession || get().isLocalMode) {
      saveLocalItinerary(tripId, localItin);
      set({ activeItinerary: localItin, loading: false });
      return localItin;
    }

    try {
      const newItinerary = await dbService.saveItinerary({
        tripId,
        days,
        version: 1,
        isCurrent: true,
      });
      set({ activeItinerary: newItinerary });
      return newItinerary;
    } catch (err: any) {
      console.warn("Supabase saveItinerary failed, saving locally:", err.message);
      saveLocalItinerary(tripId, localItin);
      set({ activeItinerary: localItin });
      return localItin;
    } finally {
      set({ loading: false });
    }
  },

  async deleteTrip(tripId) {
    set({ loading: true });
    const guestSession = localStorage.getItem("aria_guest_session");
    if (guestSession || get().isLocalMode) {
      const remaining = getLocalTrips().filter((t) => t.id !== tripId);
      saveLocalTrips(remaining);
      localStorage.removeItem(`aria_local_itinerary_${tripId}`);
      
      const newActive = get().activeTrip?.id === tripId ? null : get().activeTrip;
      const newActiveItinerary = get().activeTrip?.id === tripId ? null : get().activeItinerary;
      
      set({ trips: remaining, activeTrip: newActive, activeItinerary: newActiveItinerary });
      set({ loading: false });
      return;
    }

    try {
      await dbService.deleteTrip(tripId);
      set((state) => {
        const remaining = state.trips.filter((t) => t.id !== tripId);
        const newActive = state.activeTrip?.id === tripId ? null : state.activeTrip;
        const newActiveItinerary = state.activeTrip?.id === tripId ? null : state.activeItinerary;
        return {
          trips: remaining,
          activeTrip: newActive,
          activeItinerary: newActiveItinerary,
        };
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to delete trip." });
    } finally {
      set({ loading: false });
    }
  },

  async archiveTrip(tripId) {
    set({ loading: true });
    const guestSession = localStorage.getItem("aria_guest_session");
    if (guestSession || get().isLocalMode) {
      const updated = getLocalTrips().map((t) => 
        t.id === tripId ? { ...t, status: "completed" as const, updatedAt: new Date().toISOString() } : t
      );
      saveLocalTrips(updated);
      
      const newActiveTrip = get().activeTrip?.id === tripId 
        ? { ...get().activeTrip!, status: "completed" as const } 
        : get().activeTrip;
      
      set({ trips: updated, activeTrip: newActiveTrip });
      set({ loading: false });
      return;
    }

    try {
      await dbService.archiveTrip(tripId);
      set((state) => {
        const updated = state.trips.map((t) => 
          t.id === tripId ? { ...t, status: "completed" as const } : t
        );
        const newActiveTrip = state.activeTrip?.id === tripId 
          ? { ...state.activeTrip!, status: "completed" as const } 
          : state.activeTrip;
        return { trips: updated, activeTrip: newActiveTrip };
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to archive trip." });
    } finally {
      set({ loading: false });
    }
  },

  async duplicateTrip(trip) {
    set({ loading: true });
    const guestSession = localStorage.getItem("aria_guest_session");
    if (guestSession || get().isLocalMode) {
      const duplicatedTrip: Trip = {
        ...trip,
        id: crypto.randomUUID(),
        title: `Copy of ${trip.title}`,
        status: "planning",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedTrips = [duplicatedTrip, ...getLocalTrips()];
      saveLocalTrips(updatedTrips);

      const itin = getLocalItinerary(trip.id);
      if (itin) {
        const dupItin: Itinerary = {
          ...itin,
          id: crypto.randomUUID(),
          tripId: duplicatedTrip.id,
          createdAt: new Date().toISOString(),
        };
        saveLocalItinerary(duplicatedTrip.id, dupItin);
      }

      set((state) => ({
        trips: updatedTrips,
        activeTrip: duplicatedTrip,
        activeItinerary: itin ? { ...itin, tripId: duplicatedTrip.id } : null,
      }));
      set({ loading: false });
      return duplicatedTrip;
    }

    try {
      const dup = await dbService.duplicateTrip(trip);
      set((state) => ({
        trips: [dup, ...state.trips],
        activeTrip: dup,
      }));
      // Load itinerary of duplicated trip
      const itin = await dbService.getTripItinerary(dup.id);
      set({ activeItinerary: itin });
      return dup;
    } catch (err: any) {
      set({ error: err.message || "Failed to duplicate trip." });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  clearError() {
    set({ error: null });
  },
}));
