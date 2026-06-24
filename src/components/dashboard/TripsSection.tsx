import { useEffect, useState } from "react";
import { useTravelStore } from "../../stores/useTravelStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { Plane, Calendar, Archive, Trash2, Copy, Play, Loader2, Sparkles, Compass } from "lucide-react";
import { toast } from "sonner";

interface TripsSectionProps {
  onNavigate: (tab: string) => void;
}

export function TripsSection({ onNavigate }: TripsSectionProps) {
  const { user } = useAuthStore();
  const { trips, activeTrip, fetchTrips, setActiveTrip, deleteTrip, archiveTrip, duplicateTrip, loading } = useTravelStore();
  const [filter, setFilter] = useState<"all" | "planning" | "completed">("all");

  useEffect(() => {
    if (user) {
      fetchTrips(user.uid);
    }
  }, [user]);

  const handleSetActive = async (trip: any) => {
    await setActiveTrip(trip);
    toast.success(`Loaded plan for ${trip.destination}!`);
    onNavigate("AI Planner");
  };

  const handleDuplicate = async (trip: any) => {
    try {
      await duplicateTrip(trip);
      toast.success("Trip duplicated successfully!");
    } catch (e) {
      toast.error("Failed to duplicate trip.");
    }
  };

  const handleArchive = async (tripId: string) => {
    try {
      await archiveTrip(tripId);
      toast.success("Trip archived and marked completed!");
    } catch (e) {
      toast.error("Failed to archive trip.");
    }
  };

  const handleDelete = async (tripId: string) => {
    if (confirm("Are you sure you want to delete this trip permanently?")) {
      try {
        await deleteTrip(tripId);
        toast.success("Trip removed.");
      } catch (e) {
        toast.error("Failed to delete trip.");
      }
    }
  };

  const filteredTrips = trips.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs tracking-[0.25em] text-white/55 uppercase">My Workspace</span>
          <h2 className="font-display text-4xl mt-1">Saved AI Journeys</h2>
        </div>

        {/* Tab filters */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 self-start">
          {(["all", "planning", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`py-1.5 px-3 text-xs font-medium rounded-lg capitalize transition-all ${
                filter === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading && trips.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-16 rounded-2xl glass space-y-4">
          <Compass className="h-10 w-10 text-white/20 mx-auto animate-float-slow" />
          <h4 className="text-white/60 font-medium">No saved trips found</h4>
          <p className="text-xs text-white/40 max-w-xs mx-auto">
            You don't have any trips matching this category. Start planning one using the AI Planner.
          </p>
          <button
            onClick={() => onNavigate("AI Planner")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-xs text-gold hover:bg-gold/15 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Launch Planner
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip) => {
            const isActive = activeTrip?.id === trip.id;
            return (
              <div
                key={trip.id}
                className={`relative rounded-2xl glass p-5 flex flex-col justify-between border transition-all ${
                  isActive ? "border-gold/50 shadow-glow-gold" : "border-white/5 hover:border-white/15"
                }`}
              >
                {isActive && (
                  <span className="absolute top-4 right-4 text-[9px] font-bold bg-gold/20 text-gold px-2.5 py-0.5 rounded-full border border-gold/30">
                    Active Trip
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-wider uppercase">
                    <Plane className="h-3.5 w-3.5 text-gold" />
                    {trip.status}
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-white leading-tight truncate">{trip.title}</h3>
                    <p className="text-xs text-white/50">{trip.destination}</p>
                  </div>
                  <div className="text-xs text-white/70 space-y-1.5 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-white/30" />
                      <span>{trip.startDate} to {trip.endDate} ({trip.durationDays} days)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Total Budget:</span>
                      <span className="text-white font-semibold">${trip.budgetLimit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => handleSetActive(trip)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-gold text-[oklch(0.13_0.025_250)] hover:opacity-90 transition-all flex items-center justify-center gap-1"
                  >
                    <Play className="h-3 w-3 fill-[oklch(0.13_0.025_250)]" />
                    Explore Itinerary
                  </button>
                  <button
                    onClick={() => handleDuplicate(trip)}
                    title="Duplicate Trip"
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {trip.status !== "completed" && (
                    <button
                      onClick={() => handleArchive(trip.id)}
                      title="Archive / Complete Trip"
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(trip.id)}
                    title="Delete Trip"
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 text-white/70 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
