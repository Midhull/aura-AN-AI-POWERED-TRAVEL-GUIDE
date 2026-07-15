import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Activity,
  Plus,
  Trash2,
  Phone,
  Search,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Clock,
  HeartPulse
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";

export const Route = createFileRoute("/more-features/medical")({
  head: () => ({
    meta: [
      { title: "Medical Assistant · Aria" },
      { name: "description", content: "Pharmacy directories, medicine reminder schedules, and first aid procedures." }
    ]
  }),
  component: MedicalPage,
});

interface MedReminder {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

const FIRST_AID_STEPS: Record<string, string[]> = {
  "Food Poisoning": [
    "Hydrate constantly with small sips of water or rehydration salts (ORS).",
    "Avoid solid food for the first few hours to rest the digestive system.",
    "Do not take anti-diarrhea medications immediately; they can trap toxins in the body.",
    "Seek immediate professional medical care if fever exceeds 38.5°C or vomiting persists past 24 hours."
  ],
  "Heat Exhaustion": [
    "Move the person to a cool, shaded environment or air-conditioned room immediately.",
    "Loosen heavy clothing and apply damp cold cloths to neck, armpits, and forehead.",
    "Sip cool water or electrolyte liquids. Do not drink quickly.",
    "Monitor for confusion or high body temp, which indicates Heat Stroke (dial emergency lines)."
  ],
  "Insect / Jellyfish Bites": [
    "For jellyfish: Rinse the area thoroughly with vinegar for at least 30 seconds. Do not wash with fresh water.",
    "For bee/wasp sting: Scrap off the stinger using a flat card. Do not squeeze with tweezers.",
    "Wash area with soap and apply ice blocks wrapped in cloth to reduce swelling.",
    "Monitor closely for hives, swelling of throat, or breathing issues indicating anaphylaxis."
  ]
};

function MedicalPage() {
  const [activeAidTab, setActiveAidTab] = useState("Food Poisoning");
  const [meds, setMeds] = useState<MedReminder[]>(() => {
    try {
      const raw = localStorage.getItem("aria_med_reminders");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("aria_med_reminders", JSON.stringify(meds));
  }, [meds]);

  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("1 Pill");
  const [newMedTime, setNewMedTime] = useState("08:00 AM");

  const handleLogMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newMed: MedReminder = {
      id: crypto.randomUUID(),
      name: newMedName.trim(),
      dosage: newMedDosage,
      time: newMedTime,
      taken: false
    };

    setMeds([...meds, newMed]);
    setNewMedName("");
    toast.success(`Medicine reminder for "${newMed.name}" set.`);
  };

  const handleToggleTaken = (id: string, name: string) => {
    setMeds(prev => prev.map(m => {
      if (m.id === id) {
        const next = !m.taken;
        if (next) toast.success(`Logged: ${name} taken.`);
        return { ...m, taken: next };
      }
      return m;
    }));
  };

  const handleDeleteMed = (id: string, name: string) => {
    setMeds(prev => prev.filter(m => m.id !== id));
    toast.info(`Reminder for "${name}" cancelled.`);
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
              <div className="text-[10px] tracking-wider text-rose-400 uppercase font-semibold">Health Deck</div>
              <h1 className="font-display text-3xl">Medical Assistant</h1>
            </div>
          </div>
        </div>

        {/* Medicine scheduler & First Aid guide */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Medicine Reminder Tracker */}
          <div className="rounded-2xl glass p-6 border border-white/5 space-y-5 h-fit">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" />
              Medicine Reminder Scheduler
            </h3>

            <form onSubmit={handleLogMed} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="medName">Medicine Name</label>
                <input
                  id="medName"
                  type="text"
                  required
                  placeholder="e.g. Travel sickness pill"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white placeholder:text-white/40 focus:border-gold/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="medDose">Dosage</label>
                  <input
                    id="medDose"
                    type="text"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="medTime">Reminder Time</label>
                  <input
                    id="medTime"
                    type="text"
                    value={newMedTime}
                    onChange={(e) => setNewMedTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] bg-gold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Log Reminder
              </button>
            </form>
          </div>

          {/* Active reminders list */}
          <div className="lg:col-span-2 rounded-2xl glass p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold">Daily Intake Checklist</h3>
            
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {meds.map(med => (
                  <motion.div
                    layout
                    key={med.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={med.taken}
                        onChange={() => handleToggleTaken(med.id, med.name)}
                        className="rounded border-white/10 bg-white/5 text-gold focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <div>
                        <h4 className={`text-xs font-semibold ${med.taken ? "line-through text-white/30" : "text-white"}`}>{med.name}</h4>
                        <span className="text-[8px] text-white/45 font-mono">{med.dosage} • Time: {med.time}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMed(med.id, med.name)}
                      className="text-white/30 hover:text-red-400 p-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {meds.length === 0 && (
                <div className="text-center py-8 text-[10px] text-white/40 italic">
                  No medicine reminders scheduled.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* First Aid Step Guides */}
        <div className="rounded-2xl glass p-6 border border-white/5 space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold" />
              Interactive First Aid Protocol
            </h3>
            <p className="text-[10px] text-white/45">Quick step-by-step responder guide for typical travel health incidents.</p>
          </div>

          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            {Object.keys(FIRST_AID_STEPS).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveAidTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                  activeAidTab === tab
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/60 hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-3">
            {FIRST_AID_STEPS[activeAidTab].map((step, idx) => (
              <div key={idx} className="flex gap-3 items-start text-xs text-white/70 leading-relaxed font-light">
                <span className="h-5 w-5 rounded-full bg-gold/15 border border-gold/30 text-gold flex items-center justify-center font-bold text-[9px] shrink-0 font-mono mt-0.5">{idx + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
