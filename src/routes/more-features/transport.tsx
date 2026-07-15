import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Train,
  Bus,
  Car,
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle,
  HelpCircle,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";

export const Route = createFileRoute("/more-features/transport")({
  head: () => ({
    meta: [
      { title: "Transportation Guide · Aria" },
      { name: "description", content: "Metro and bus schedules, ride sharing comparisons, and airport transfers." }
    ]
  }),
  component: TransportPage,
});

interface RideService {
  name: string;
  type: string;
  pricePerKm: number;
  basePrice: number;
  eta: string;
  best: boolean;
}

const SERVICES: RideService[] = [
  { name: "Uber", type: "Ride-Share", pricePerKm: 1.8, basePrice: 3.5, eta: "4 min", best: false },
  { name: "Grab", type: "Local App", pricePerKm: 1.4, basePrice: 2.2, eta: "3 min", best: true },
  { name: "Lyft / Gojek", type: "Ride-Share", pricePerKm: 1.6, basePrice: 2.8, eta: "6 min", best: false },
  { name: "Local Metered Taxi", type: "Public Service", pricePerKm: 2.0, basePrice: 4.0, eta: "1 min", best: false }
];

const SCHEDULES = [
  { route: "Chuo Line (Rapid)", origin: "Tokyo Station", destination: "Shinjuku Station", time: "Leaves in 3 mins", delay: "On Time", platform: "Plat 7" },
  { route: "Yamanote Line (Outer Loop)", origin: "Tokyo Station", destination: "Shibuya Station", time: "Leaves in 6 mins", delay: "On Time", platform: "Plat 5" },
  { route: "Narita Express (N'EX)", origin: "Tokyo Station", destination: "Narita Airport", time: "Leaves in 14 mins", delay: "2 min delay", platform: "Plat 1" }
];

function TransportPage() {
  const [distance, setDistance] = useState(8); // km
  const [activeTab, setActiveTab] = useState<"rides" | "transit" | "airport">("rides");

  // Airport transfer form states
  const [airport, setAirport] = useState("Haneda Airport (HND)");
  const [vehicle, setVehicle] = useState("Shared Airport Shuttle");
  const [booked, setBooked] = useState(false);

  const calculateFare = (base: number, perKm: number) => {
    return (base + perKm * distance).toFixed(2);
  };

  const handleBookShuttle = (e: React.FormEvent) => {
    e.preventDefault();
    setBooked(true);
    toast.success(`Booking Confirmed: Airport transfer for ${airport} reserved.`);
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
              <div className="text-[10px] tracking-wider text-pink-400 uppercase font-semibold">Transit Bureau</div>
              <h1 className="font-display text-3xl">Transportation Assistant</h1>
            </div>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <button
            onClick={() => setActiveTab("rides")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              activeTab === "rides"
                ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Ride-Share Compare
          </button>
          <button
            onClick={() => setActiveTab("transit")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              activeTab === "transit"
                ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Transit Schedules
          </button>
          <button
            onClick={() => setActiveTab("airport")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              activeTab === "airport"
                ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Airport Transfers
          </button>
        </div>

        {/* Configurations grid based on tabs */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            
            {/* RIDES SHARE COMPARE */}
            {activeTab === "rides" && (
              <motion.div
                key="rides-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Distance Adjuster slider */}
                <div className="rounded-2xl glass p-6 border border-white/5 space-y-6 h-fit">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Car className="h-4 w-4 text-gold" />
                    Trip Distance Calculator
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-white/55">
                        <span className="font-mono uppercase">Distance</span>
                        <span className="font-bold text-white font-mono">{distance} km</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="40"
                        value={distance}
                        onChange={(e) => setDistance(parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                      />
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[9px] text-white/45 leading-relaxed">
                      Pricing is dynamically estimated based on standard city coefficients. Local traffic factors may increase real rates.
                    </div>
                  </div>
                </div>

                {/* Service Fare Compare cards */}
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="text-sm font-semibold">Live Service Rates</h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {SERVICES.map((srv, idx) => (
                      <div
                        key={idx}
                        className={`p-4 bg-white/5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                          srv.best ? "border-gold/30 bg-gold/5" : "border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${srv.best ? "bg-gold/20 text-gold" : "bg-white/5 text-white/60"}`}>
                            <Car className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">{srv.name}</span>
                              {srv.best && <span className="text-[7px] bg-gold/20 border border-gold/40 text-gold px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Best Value</span>}
                            </div>
                            <span className="text-[9px] text-white/45 block mt-0.5">{srv.type} • Driver nearby</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="text-[9px] text-white/40 block font-mono">ETA</span>
                            <span className="font-mono text-white/70 font-semibold">{srv.eta}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-white/40 block font-mono">Est Price</span>
                            <span className="font-mono text-gold font-bold">${calculateFare(srv.basePrice, srv.pricePerKm)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* METRO & TRANSIT SCHEDULES */}
            {activeTab === "transit" && (
              <motion.div
                key="transit-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Active departures (Tokyo Hub)</h3>
                  <button
                    onClick={() => toast.success("Schedules updated.")}
                    className="text-[9px] hover:underline text-white/45 font-mono cursor-pointer"
                  >
                    Sync times
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SCHEDULES.map((sched, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between h-40"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Train className="h-4 w-4 text-gold shrink-0" />
                          <span className="text-xs font-semibold text-white">{sched.route}</span>
                        </div>
                        <div className="text-[10px] text-white/40">
                          <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {sched.origin}</div>
                          <div className="flex items-center gap-1 mt-1"><ArrowRight className="h-3 w-3" /> {sched.destination}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-3 mt-3">
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <Clock className="h-3.5 w-3.5" /> {sched.time}
                        </span>
                        <span className="font-mono text-white/50">{sched.platform}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AIRPORT TRANSFERS */}
            {activeTab === "airport" && (
              <motion.div
                key="airport-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Shuttle Reservation Form */}
                <div className="rounded-2xl glass p-6 border border-white/5 space-y-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Car className="h-4 w-4 text-gold" />
                    Book Transfer Shuttle
                  </h3>

                  <form onSubmit={handleBookShuttle} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="airport">Target Airport</label>
                      <select
                        id="airport"
                        value={airport}
                        onChange={(e) => setAirport(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Haneda Airport (HND)" className="bg-[oklch(0.08_0.02_250)] text-white">Haneda Airport, Tokyo</option>
                        <option value="Narita Airport (NRT)" className="bg-[oklch(0.08_0.02_250)] text-white">Narita Airport, Tokyo</option>
                        <option value="Denpasar Bali (DPS)" className="bg-[oklch(0.08_0.02_250)] text-white">Ngurah Rai, Bali</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="vehicle">Vehicle Class</label>
                      <select
                        id="vehicle"
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Shared Airport Shuttle" className="bg-[oklch(0.08_0.02_250)] text-white">Shared Shuttle ($15)</option>
                        <option value="Private Sedan Transfer" className="bg-[oklch(0.08_0.02_250)] text-white">Private Sedan ($45)</option>
                        <option value="Luxury SUV Transfer" className="bg-[oklch(0.08_0.02_250)] text-white">Premium SUV ($75)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] bg-gold transition cursor-pointer"
                    >
                      Reserve Shuttle Transfer
                    </button>
                  </form>
                </div>

                {/* Booking status info card */}
                <div className="lg:col-span-2 rounded-2xl glass p-6 border border-white/5 flex flex-col justify-between min-h-[250px]">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 font-mono">Transfer Manifest</h3>
                    
                    <div className="mt-6 space-y-4">
                      {booked ? (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                            <CheckCircle className="h-4 w-4" /> Transfer Booked & Dispatched
                          </div>
                          <div className="text-[10px] text-white/60 space-y-1 font-mono">
                            <div>Airport: {airport}</div>
                            <div>Vehicle: {vehicle}</div>
                            <div>Status: Confirmed • Driver details will arrive 3h prior to pickup</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-white/35 italic">
                          No active transfer shuttle reserved. Select airport and submit booking.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[9px] text-white/30 border-t border-white/5 pt-3 leading-relaxed">
                    Airport bookings include complete meet-and-greet support inside the arrival terminal. Free cancellation up to 24 hours.
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </DashboardLayout>
  );
}
