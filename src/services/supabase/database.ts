import { supabase } from "./client";
import type { Trip, UserProfile, Itinerary, TravelerProfile, ChatMessage } from "../../types/travel";

export const dbService = {
  // --- User Profiles ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("uid", uid)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      uid: data.uid,
      email: data.email,
      displayName: data.display_name || "",
      photoURL: data.photo_url || undefined,
      preferences: data.preferences || {},
      isPro: data.is_pro,
      proExpiresAt: data.pro_expires_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateUserPreferences(uid: string, preferences: UserProfile["preferences"]): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ preferences, updated_at: new Date().toISOString() })
      .eq("uid", uid);

    if (error) throw error;
  },

  // --- Traveler Profiles ---
  async getTravelerProfiles(userId: string): Promise<TravelerProfile[]> {
    const { data, error } = await supabase
      .from("traveler_profiles")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      dateOfBirth: row.date_of_birth,
      passportNumber: row.passport_number,
      nationality: row.nationality,
      emergencyContact: row.emergency_contact,
    }));
  },

  async createTravelerProfile(profile: Omit<TravelerProfile, "id">): Promise<TravelerProfile> {
    const { data, error } = await supabase
      .from("traveler_profiles")
      .insert({
        user_id: profile.userId,
        full_name: profile.fullName,
        date_of_birth: profile.dateOfBirth,
        passport_number: profile.passportNumber,
        nationality: profile.nationality,
        emergency_contact: profile.emergencyContact,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      dateOfBirth: data.date_of_birth,
      passportNumber: data.passport_number,
      nationality: data.nationality,
      emergencyContact: data.emergency_contact,
    };
  },

  // --- Trips ---
  async getUserTrips(userId: string): Promise<Trip[]> {
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        budgets (
          id,
          limit_amount,
          currency,
          budget_breakdowns (
            flights,
            accommodation,
            activities,
            dining,
            transport,
            other,
            total
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const budgetObj = row.budgets?.[0];
      const breakdown = budgetObj?.budget_breakdowns?.[0] || {
        flights: 0,
        accommodation: 0,
        activities: 0,
        dining: 0,
        transport: 0,
        other: 0,
        total: 0,
      };

      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        destination: row.destination,
        startDate: row.start_date,
        endDate: row.end_date,
        durationDays: row.duration_days,
        travelersCount: row.travelers_count,
        status: row.status,
        budgetLimit: budgetObj ? parseFloat(budgetObj.limit_amount) : 0,
        budgetBreakdown: {
          flights: parseFloat(breakdown.flights),
          accommodation: parseFloat(breakdown.accommodation),
          activities: parseFloat(breakdown.activities),
          dining: parseFloat(breakdown.dining),
          transport: parseFloat(breakdown.transport),
          other: parseFloat(breakdown.other),
          total: parseFloat(breakdown.total),
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  },

  async createTrip(trip: Omit<Trip, "id" | "createdAt" | "updatedAt">): Promise<Trip> {
    const { data: newTrip, error: tripError } = await supabase
      .from("trips")
      .insert({
        user_id: trip.userId,
        title: trip.title,
        destination: trip.destination,
        start_date: trip.startDate,
        end_date: trip.endDate,
        duration_days: trip.durationDays,
        travelers_count: trip.travelersCount,
        status: trip.status,
      })
      .select()
      .single();

    if (tripError) throw tripError;

    const { data: newBudget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        trip_id: newTrip.id,
        user_id: trip.userId,
        limit_amount: trip.budgetLimit,
      })
      .select()
      .single();

    if (budgetError) throw budgetError;

    const { data: newBreakdown, error: breakdownError } = await supabase
      .from("budget_breakdowns")
      .insert({
        budget_id: newBudget.id,
        user_id: trip.userId,
        flights: trip.budgetBreakdown.flights,
        accommodation: trip.budgetBreakdown.accommodation,
        activities: trip.budgetBreakdown.activities,
        dining: trip.budgetBreakdown.dining,
        transport: trip.budgetBreakdown.transport,
        other: trip.budgetBreakdown.other,
        total: trip.budgetBreakdown.total,
      })
      .select()
      .single();

    if (breakdownError) throw breakdownError;

    return {
      id: newTrip.id,
      userId: newTrip.user_id,
      title: newTrip.title,
      destination: newTrip.destination,
      startDate: newTrip.start_date,
      endDate: newTrip.end_date,
      durationDays: newTrip.duration_days,
      travelersCount: newTrip.travelers_count,
      status: newTrip.status,
      budgetLimit: parseFloat(newBudget.limit_amount),
      budgetBreakdown: {
        flights: parseFloat(newBreakdown.flights),
        accommodation: parseFloat(newBreakdown.accommodation),
        activities: parseFloat(newBreakdown.activities),
        dining: parseFloat(newBreakdown.dining),
        transport: parseFloat(newBreakdown.transport),
        other: parseFloat(newBreakdown.other),
        total: parseFloat(newBreakdown.total),
      },
      createdAt: newTrip.created_at,
      updatedAt: newTrip.updated_at,
    };
  },

  // --- Itineraries ---
  async getTripItinerary(tripId: string): Promise<Itinerary | null> {
    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("trip_id", tripId)
      .eq("is_current", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      tripId: data.trip_id,
      days: data.days,
      version: data.version,
      isCurrent: data.is_current,
      createdAt: data.created_at,
    };
  },

  async saveItinerary(itinerary: Omit<Itinerary, "id" | "createdAt">): Promise<Itinerary> {
    const { data, error } = await supabase
      .from("itineraries")
      .insert({
        trip_id: itinerary.tripId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        days: itinerary.days,
        version: itinerary.version,
        is_current: itinerary.isCurrent,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      tripId: data.trip_id,
      days: data.days,
      version: data.version,
      isCurrent: data.is_current,
      createdAt: data.created_at,
    };
  },

  // --- Saved Trips Extended Mod ---
  async archiveTrip(tripId: string): Promise<void> {
    const { error } = await supabase
      .from("trips")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", tripId);

    if (error) throw error;
  },

  async deleteTrip(tripId: string): Promise<void> {
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", tripId);

    if (error) throw error;
  },

  async duplicateTrip(trip: Trip): Promise<Trip> {
    const duplicated = await this.createTrip({
      userId: trip.userId,
      title: `Copy of ${trip.title}`,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      durationDays: trip.durationDays,
      travelersCount: trip.travelersCount,
      status: "planning",
      budgetLimit: trip.budgetLimit,
      budgetBreakdown: trip.budgetBreakdown,
    });

    const activeItinerary = await this.getTripItinerary(trip.id);
    if (activeItinerary) {
      await this.saveItinerary({
        tripId: duplicated.id,
        days: activeItinerary.days,
        version: 1,
        isCurrent: true,
      });
    }

    return duplicated;
  },

  async getUserTripsPaginated(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ trips: Trip[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from("trips")
      .select(`
        *,
        budgets (
          id,
          limit_amount,
          currency,
          budget_breakdowns (
            flights,
            accommodation,
            activities,
            dining,
            transport,
            other,
            total
          )
        )
      `, { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const trips: Trip[] = (data || []).map((row: any) => {
      const budgetObj = row.budgets?.[0];
      const breakdown = budgetObj?.budget_breakdowns?.[0] || {
        flights: 0,
        accommodation: 0,
        activities: 0,
        dining: 0,
        transport: 0,
        other: 0,
        total: 0,
      };

      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        destination: row.destination,
        startDate: row.start_date,
        endDate: row.end_date,
        durationDays: row.duration_days,
        travelersCount: row.travelers_count,
        status: row.status,
        budgetLimit: budgetObj ? parseFloat(budgetObj.limit_amount) : 0,
        budgetBreakdown: {
          flights: parseFloat(breakdown.flights),
          accommodation: parseFloat(breakdown.accommodation),
          activities: parseFloat(breakdown.activities),
          dining: parseFloat(breakdown.dining),
          transport: parseFloat(breakdown.transport),
          other: parseFloat(breakdown.other),
          total: parseFloat(breakdown.total),
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return {
      trips,
      total: count || 0,
    };
  },
};

