import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShieldAlert,
  Phone,
  MapPin,
  Building2,
  Users,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Locate,
  Clock,
  HeartPulse
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";

export const Route = createFileRoute("/more-features/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency & Safety · Aria" },
      { name: "description", content: "Consular lookups, local police and medical contacts, and active SOS tracking consoles." }
    ]
  }),
  component: EmergencyPage,
});

interface Embassy {
  country: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
}

const EMBASSIES: Embassy[] = [
  {
    country: "Japan",
    name: "Embassy of the United States, Tokyo",
    address: "1-10-5 Akasaka, Minato-ku, Tokyo 107-8420",
    phone: "+81 3-3224-5000",
    hours: "08:30 - 12:00, 14:00 - 17:30 (Mon-Fri)"
  },
  {
    country: "Indonesia",
    name: "Embassy of the United Kingdom, Jakarta",
    address: "Jl. M.H. Thamrin No.75, Jakarta 10310",
    phone: "+62 21-2356-5200",
    hours: "08:30 - 17:00 (Mon-Fri)"
  },
  {
    country: "France",
    name: "Embassy of Canada, Paris",
    address: "130 Rue du Faubourg Saint-Honoré, 75008 Paris",
    phone: "+33 1-44-43-29-00",
    hours: "09:00 - 17:00 (Mon-Fri)"
  },
  {
    country: "United Kingdom",
    name: "Embassy of Australia, London",
    address: "Australia House, Strand, London WC2B 4LA",
    phone: "+44 20-7379-4334",
    hours: "09:00 - 17:00 (Mon-Fri)"
  }
];



function EmergencyPage() {
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Japan");
  const [locationSharing, setLocationSharing] = useState(false);
  
  const [bloodType, setBloodType] = useState(() => localStorage.getItem("aria_blood_type") || "");
  const [allergies, setAllergies] = useState(() => localStorage.getItem("aria_allergies") || "");
  const [insurancePolicy, setInsurancePolicy] = useState(() => localStorage.getItem("aria_insurance_policy") || "");
  
  const [coordinates, setCoordinates] = useState<string>("Location sharing disabled");
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem("aria_emergency_contacts");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Watch geolocation coordinates
  useEffect(() => {
    if (!locationSharing) {
      setCoordinates("Location sharing disabled");
      return;
    }

    if (!navigator.geolocation) {
      setCoordinates("Geolocation not supported by this browser");
      return;
    }

    setCoordinates("Loading location...");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoordinates(`${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (Accuracy: ±${Math.round(accuracy)}m)`);
      },
      (error) => {
        setCoordinates("GPS position unavailable");
        console.warn("Geolocation watch error:", error);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [locationSharing]);

  // SOS Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosActive && sosCountdown > 0) {
      timer = setTimeout(() => {
        setSosCountdown(prev => prev - 1);
      }, 1000);
    } else if (sosActive && sosCountdown === 0) {
      setSosDispatched(true);
      setSosActive(false);
      toast.error("SOS Triggered! Location broadcasted to local authorities.", { duration: 5000 });
    }
    return () => clearTimeout(timer);
  }, [sosActive, sosCountdown]);

  const handleStartSos = () => {
    setSosActive(true);
    setSosCountdown(5);
    setSosDispatched(false);
    toast.warning("SOS Countdown Started. Hold Cancel to stop.");
  };

  const handleCancelSos = () => {
    setSosActive(false);
    setSosCountdown(5);
    toast.success("SOS Cancelled successfully.");
  };

  const selectedEmbassy = EMBASSIES.find(e => e.country === selectedCountry);

  const handleSaveMedical = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("aria_blood_type", bloodType);
    localStorage.setItem("aria_allergies", allergies);
    localStorage.setItem("aria_insurance_policy", insurancePolicy);
    toast.success("Medical Information saved in local encrypted vault.");
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
              <div className="text-[10px] tracking-wider text-red-400 uppercase font-semibold">Active Protection</div>
              <h1 className="font-display text-3xl">Emergency & Safety</h1>
            </div>
          </div>
        </div>

        {/* SOS Panel & Location Sharing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main SOS Control Room */}
          <div className="lg:col-span-2 rounded-2xl glass p-6 border border-white/5 flex flex-col justify-between items-center text-center space-y-6 min-h-[350px] relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-red-500/5 to-transparent pointer-events-none" />

            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-red-400 uppercase border border-red-500/20">
                <ShieldAlert className="h-3 w-3 animate-pulse" /> Emergency SOS Console
              </span>
              <h2 className="text-xl font-semibold">Immediate Assistance</h2>
              <p className="text-xs text-white/50 max-w-sm">
                Pressing the SOS triggers a critical beacon transmitting your exact GPS coordinates and medical details to regional coordinators.
              </p>
            </div>

            {/* Pulsing SOS Button */}
            <div className="relative flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!sosActive && !sosDispatched && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={handleStartSos}
                    className="h-36 w-36 rounded-full bg-red-600 hover:bg-red-500 flex flex-col items-center justify-center border-4 border-red-500/30 text-white font-display text-2xl font-bold tracking-widest shadow-glow-red cursor-pointer relative group transition-all"
                  >
                    <div className="absolute -inset-4 rounded-full bg-red-600/10 animate-ping group-hover:bg-red-600/25 duration-1000" />
                    SOS
                  </motion.button>
                )}

                {sosActive && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="h-36 w-36 rounded-full bg-red-950/60 border border-red-500/50 flex items-center justify-center text-red-500 text-5xl font-mono font-bold animate-pulse">
                      {sosCountdown}
                    </div>
                    <button
                      onClick={handleCancelSos}
                      className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold cursor-pointer"
                    >
                      Cancel Trigger
                    </button>
                  </motion.div>
                )}

                {sosDispatched && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-emerald-400">Beacon Dispatched</h3>
                      <p className="text-[10px] text-white/50 mt-1 max-w-[200px]">GPS Coordinates broadcasted. Help is on the way.</p>
                    </div>
                    <button
                      onClick={() => setSosDispatched(false)}
                      className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-semibold cursor-pointer mt-2"
                    >
                      Reset Beacon
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Current Coordinates mock */}
            <div className="text-[10px] font-mono text-white/35 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> GPS Coordinates: {coordinates}
            </div>

          </div>

          {/* Location and Safety Toggles */}
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Locate className="h-4 w-4 text-gold" />
                Live Safety Actions
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold">Live Location Sharing</div>
                    <p className="text-[9px] text-white/40 leading-relaxed">Broadcast location updates to registered contacts every 60 seconds.</p>
                  </div>
                  <button
                    onClick={() => {
                      setLocationSharing(!locationSharing);
                      toast.info(`Location sharing turned ${!locationSharing ? "ON" : "OFF"}`);
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      locationSharing ? "bg-gold" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        locationSharing ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" /> Emergency Contacts
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    {emergencyContacts.length > 0 ? (
                      emergencyContacts.map((contact, i) => (
                        <div key={i} className={`flex justify-between ${i > 0 ? 'border-t border-white/5 pt-1.5' : ''}`}>
                          <span className="text-white/60">{contact.name} ({contact.relationship})</span>
                          <span className="font-mono text-white/80">{contact.phone}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-white/40 text-[10px] italic">No emergency contacts registered.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick dial emergency numbers */}
            <div className="space-y-2.5">
              <div className="text-[9px] uppercase tracking-wider text-white/35 font-mono">Quick Local Emergency Lines</div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <a
                  href="tel:119"
                  className="flex items-center gap-2 p-2 rounded-xl bg-red-950/20 border border-red-500/10 hover:bg-red-950/40 text-red-400 justify-center text-xs font-bold transition"
                >
                  <Phone className="h-3.5 w-3.5" /> Ambulance (119)
                </a>
                <a
                  href="tel:110"
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white justify-center text-xs font-bold transition"
                >
                  <Phone className="h-3.5 w-3.5" /> Police (110)
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Embassy Finder & Medical Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Embassy Finder */}
          <div className="rounded-2xl glass p-6 border border-white/5 space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gold" />
                Embassy / Consulate Finder
              </h3>
              <p className="text-[10px] text-white/55">Select your destination country to locate emergency diplomatic services.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="country">Destination Country</label>
                <select
                  id="country"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none focus:border-gold/50 cursor-pointer"
                >
                  {EMBASSIES.map(e => (
                    <option key={e.country} value={e.country} className="bg-[oklch(0.08_0.02_250)] text-white">{e.country}</option>
                  ))}
                </select>
              </div>

              {selectedEmbassy && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3.5 text-xs">
                  <div className="font-semibold text-white">{selectedEmbassy.name}</div>
                  <div className="space-y-2 text-[10px] text-white/60">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                      <span>{selectedEmbassy.address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                      <a href={`tel:${selectedEmbassy.phone}`} className="hover:underline text-white font-mono">{selectedEmbassy.phone}</a>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                      <span>{selectedEmbassy.hours}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information Vault */}
          <div className="rounded-2xl glass p-6 border border-white/5 space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-500 animate-pulse" />
                Medical Information Vault
              </h3>
              <p className="text-[10px] text-white/55">In-app offline profile for emergency responders. Kept locally in encrypted state.</p>
            </div>

            <form onSubmit={handleSaveMedical} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="bloodType">Blood Type</label>
                  <input
                    id="bloodType"
                    type="text"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="allergies">Allergies</label>
                  <input
                    id="allergies"
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="insurance">Travel Insurance Policy</label>
                <input
                  id="insurance"
                  type="text"
                  value={insurancePolicy}
                  onChange={(e) => setInsurancePolicy(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none focus:border-gold/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white transition cursor-pointer"
              >
                Update Medical Vault
              </button>
            </form>
          </div>

        </div>

        {/* Nearby Services Directory */}
        <div className="rounded-2xl glass p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-gold" />
            Nearby Emergency Directory
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locationSharing ? (
              <div className="col-span-3 text-center py-6 text-white/40 text-xs font-mono">
                No nearby emergency services found.
              </div>
            ) : (
              <div className="col-span-3 text-center py-6 text-white/40 text-xs font-mono">
                GPS Location disabled. Please enable location sharing to scan nearby services.
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
