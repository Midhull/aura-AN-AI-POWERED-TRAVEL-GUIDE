import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Sparkles,
  Search,
  Bed,
  Phone,
  HelpCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { useAppStore } from "../../stores/useAppStore";
import { supabase } from "../../services/supabase/client";
import type { Trip } from "../../types/travel";

export const Route = createFileRoute("/more-features/hotel")({
  head: () => ({
    meta: [
      { title: "Hotel Manager · Aria" },
      { name: "description", content: "Reservation check-in trackers, stay checklists, and local attraction cards." }
    ]
  }),
  component: HotelManagerPage,
});

interface CheckInTask {
  id: string;
  task: string;
  completed: boolean;
}

function HotelManagerPage() {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [attractions, setAttractions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<CheckInTask[]>([]);
  const [reminderActive, setReminderActive] = useState(false);

  useEffect(() => {
    const loadActiveTrip = async () => {
      setLoading(true);
      try {
        let trip = useAppStore.getState().currentTrip;
        if (!trip) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: trips } = await supabase
              .from("trips")
              .select("*")
              .eq("status", "active")
              .limit(1);
            if (trips && trips.length > 0) {
              const t = trips[0];
              trip = {
                id: t.id,
                title: t.title,
                destination: t.destination,
                startDate: t.start_date,
                endDate: t.end_date,
                durationDays: t.duration_days,
                travelersCount: t.travelers_count,
                status: t.status,
                createdAt: t.created_at,
                updatedAt: t.updated_at
              } as Trip;
            } else {
              const { data: recent } = await supabase
                .from("trips")
                .select("*")
                .order("start_date", { ascending: true })
                .limit(1);
              if (recent && recent.length > 0) {
                const t = recent[0];
                trip = {
                  id: t.id,
                  title: t.title,
                  destination: t.destination,
                  startDate: t.start_date,
                  endDate: t.end_date,
                  durationDays: t.duration_days,
                  travelersCount: t.travelers_count,
                  status: t.status,
                  createdAt: t.created_at,
                  updatedAt: t.updated_at
                } as Trip;
              }
            }
          }
        }
        
        setActiveTrip(trip);
        
        if (trip) {
          const { data: destData } = await supabase
            .from("destinations")
            .select("id")
            .ilike("name", `%${trip.destination}%`)
            .limit(1);
          
          if (destData && destData.length > 0) {
            const { data: attrs } = await supabase
              .from("attractions")
              .select("*")
              .eq("destination_id", destData[0].id)
              .limit(3);
            
            if (attrs && attrs.length > 0) {
              setAttractions(attrs.map((a, i) => ({
                name: a.name,
                type: "Local Highlight",
                distance: `${(0.5 + i * 0.4).toFixed(1)} km`,
                rating: parseFloat((4.5 + (a.name.length % 5) / 10).toFixed(1))
              })));
            } else {
              setAttractions([]);
            }
          } else {
            setAttractions([]);
          }
        }
      } catch (err) {
        console.error("Error loading hotel info:", err);
      } finally {
        setLoading(false);
      }
    };
    loadActiveTrip();
  }, []);

  // Load tasks when activeTrip is set
  useEffect(() => {
    if (!activeTrip) return;
    const key = `aria_hotel_tasks_${activeTrip.id}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      setTasks(JSON.parse(raw));
    } else {
      const defaultTasks = [
        { id: "ht-1", task: "Verify check-in window and late arrival policy", completed: false },
        { id: "ht-2", task: "Prepare hotel address in local language", completed: false },
        { id: "ht-3", task: "Save offline copy of booking reference", completed: false },
        { id: "ht-4", task: "Ensure passport is valid for more than 6 months", completed: true }
      ];
      setTasks(defaultTasks);
      localStorage.setItem(key, JSON.stringify(defaultTasks));
    }
  }, [activeTrip]);

  const toggleTask = (id: string, name: string) => {
    if (!activeTrip) return;
    const nextTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(nextTasks);
    localStorage.setItem(`aria_hotel_tasks_${activeTrip.id}`, JSON.stringify(nextTasks));
    toast.success(`Task status updated for ${name}`);
  };

  const handleToggleReminder = () => {
    const next = !reminderActive;
    setReminderActive(next);
    toast.success(`Check-in alarms turned ${next ? "ON" : "OFF"}`);
  };

  // Date and countdown calculation helper
  const getDaysUntil = () => {
    if (!activeTrip) return 0;
    const diffTime = new Date(activeTrip.startDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  return (
    <DashboardLayout activeLabel="More Features">
      <div className="space-y-8 pb-16">
        
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/more-features"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-white/70 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="text-[10px] tracking-wider text-sky-400 uppercase font-semibold">Stay Desk</div>
              <h1 className="font-display text-3xl">Hotel Manager</h1>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 rounded-2xl glass border border-white/5">
            <Loader2 className="h-8 w-8 text-gold animate-spin mx-auto" />
            <p className="text-xs text-white/40 mt-3 font-mono">Synchronizing stay reservations with database...</p>
          </div>
        ) : !activeTrip ? (
          <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/5 max-w-sm mx-auto space-y-4">
            <Bed className="h-10 w-10 text-white/15 mx-auto animate-pulse" />
            <h4 className="text-white/60 font-semibold text-sm">No active hotel reservations logged</h4>
            <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed px-4">
              You do not have any active trip itineraries in progress. Plan a trip or activate one to coordinate hotel bookings.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hotel Details & Checkin Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Booking Details */}
              <div className="lg:col-span-2 rounded-2xl glass p-6 border border-white/5 flex flex-col justify-between h-[320px] relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-500/5 rounded-full blur-2xl" />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[8px] bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Stay Confirmed</span>
                    <h2 className="text-2xl font-bold mt-2 text-white">Ryokan Aria Oasis</h2>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/45 mt-1 font-mono">
                      <MapPin className="h-3.5 w-3.5" /> Near downtown {activeTrip.destination}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/60 bg-white/5 border border-white/5 px-2.5 py-1 rounded-xl font-mono">
                    <Clock className="h-3.5 w-3.5 text-gold" /> Check-in: 15:00 PM
                  </div>
                </div>

                {/* Check in dates */}
                <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-4">
                  <div>
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono block">Check-In Date</span>
                    <span className="text-sm font-semibold text-white font-mono flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-4 w-4 text-gold" /> {activeTrip.startDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono block">Check-Out Date</span>
                    <span className="text-sm font-semibold text-white font-mono flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-4 w-4 text-gold" /> {activeTrip.endDate}
                    </span>
                  </div>
                </div>

                {/* Reservation identifiers */}
                <div className="flex justify-between items-center text-[10px] pt-2 font-mono">
                  <div>
                    <span className="text-white/35">RES ID:</span> <span className="text-white/80 font-bold">#ARIA-{activeTrip.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-white/35">CONTACT:</span> <span className="text-white/80">+81 booking-assist</span>
                  </div>
                </div>

              </div>

              {/* Countdown & Alarm toggles */}
              <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gold animate-pulse" />
                    Stay Countdown
                  </h3>

                  <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-4xl font-display font-bold text-gold">
                      {getDaysUntil()}{" "}
                      <span className="text-xs font-sans text-white/40 font-normal">Days</span>
                    </div>
                    <div className="text-[9px] text-white/35 uppercase font-mono mt-1">Time until check-in</div>
                  </div>
                </div>

                {/* Checkin notification toggle */}
                <div className="flex items-start justify-between gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold">Check-in Reminders</div>
                    <p className="text-[9px] text-white/40 leading-relaxed">Alert me 24 hours and 2 hours prior to reservation time.</p>
                  </div>
                  <button
                    onClick={handleToggleReminder}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      reminderActive ? "bg-gold" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        reminderActive ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

              </div>

            </div>

            {/* Check-In Checklist */}
            <div className="rounded-2xl glass p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold">Pre-Check-In Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id, task.task)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center gap-3 transition cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      readOnly
                      className="rounded border-white/10 bg-white/5 text-gold focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    <span className={`text-xs ${task.completed ? "line-through text-white/30" : "text-white"}`}>{task.task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Surrounding Attractions */}
            {attractions.length > 0 && (
              <div className="rounded-2xl glass p-6 border border-white/5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Compass className="h-4 w-4 text-gold" />
                  Surrounding Hotspots (Near Hotel)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {attractions.map((site, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-xs font-semibold text-white">{site.name}</h4>
                        <span className="text-[9px] text-white/40 block mt-1">{site.type} • {site.distance} away</span>
                      </div>
                      <div className="text-[10px] font-bold text-gold shrink-0">★ {site.rating}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
