import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUp, Search, Plane, Hotel, Camera, Star } from "lucide-react";
import { useTravelStore } from "../../stores/useTravelStore";

import bali from "../../assets/scene-bali.jpg";
import kyoto from "../../assets/scene-kyoto.jpg";
import alps from "../../assets/scene-alps.jpg";
import iceland from "../../assets/scene-iceland.jpg";
import santorini from "../../assets/scene-santorini.jpg";
import earth from "../../assets/scene-earth.jpg";

const SHOWCASE = [
  { img: santorini, name: "Santorini", region: "Greece", temp: "24°", tag: "Sunset" },
  { img: bali, name: "Bali", region: "Indonesia", temp: "29°", tag: "Coastline" },
  { img: alps, name: "Swiss Alps", region: "Switzerland", temp: "8°", tag: "Peaks" },
  { img: iceland, name: "Iceland", region: "Nordic", temp: "4°", tag: "Aurora" },
  { img: kyoto, name: "Kyoto", region: "Japan", temp: "18°", tag: "Temples" },
];

const PROMPTS = [
  "Plan a 10-day Japan trip.",
  "Luxury Bali honeymoon.",
  "Backpacking Europe under $2000.",
  "Best hidden gems in Kerala.",
];

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
  setPlannerState: (data: { destination: string; prompt: string }) => void;
}

export function DashboardOverview({ onNavigate, setPlannerState }: DashboardOverviewProps) {
  const { trips } = useTravelStore();
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const id = setInterval(
      () => setShowcaseIndex((i) => (i + 1) % SHOWCASE.length),
      6000,
    );
    return () => clearInterval(id);
  }, []);

  const current = SHOWCASE[showcaseIndex];

  const handleQuickPlan = (text: string) => {
    // Attempt to extract destination name from common prompt patterns
    let dest = "Japan";
    if (text.toLowerCase().includes("bali")) dest = "Bali";
    else if (text.toLowerCase().includes("europe")) dest = "Switzerland";
    else if (text.toLowerCase().includes("kerala")) dest = "Bali";
    else if (text.toLowerCase().includes("japan")) dest = "Kyoto";

    setPlannerState({ destination: dest, prompt: text });
    onNavigate("AI Planner");
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const searchVal = (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value;
    if (searchVal.trim()) {
      setPlannerState({ destination: searchVal, prompt: `Plan an amazing journey to ${searchVal}` });
      onNavigate("AI Planner");
    }
  };

  return (
    <div className="space-y-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            name="search"
            placeholder="Search destinations, trips, hotels…"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/45 focus:border-gold/50 focus:outline-none transition-all"
          />
        </form>
        <div className="flex items-center gap-3 text-xs text-white/60">
          <span className="hidden sm:inline">Now drifting through</span>
          <span className="font-medium text-white">
            {current.name}
            <span className="text-white/45">, {current.region}</span>
          </span>
          <div
            className="h-9 w-9 rounded-full ring-2 ring-gold/40 transition-all duration-1000"
            style={{ 
              backgroundImage: `url(${current.img})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "cover"
            }}
          />
        </div>
      </div>

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mx-auto max-w-3xl text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs tracking-[0.25em] text-white/85 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-orb-pulse" />
          AI Online
        </span>
        <h1 className="mt-5 font-display text-balance text-[clamp(2.2rem,5vw,4rem)] leading-[1.02]">
          Where shall we go{" "}
          <em className="not-italic gradient-text-gold">next?</em>
        </h1>
      </motion.div>

      {/* Prompt Box */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="mx-auto w-full max-w-3xl"
      >
        <div className="group relative">
          <div
            className="absolute -inset-px rounded-3xl opacity-40 blur-xl transition-opacity group-focus-within:opacity-80"
            style={{ background: "var(--gradient-aurora)" }}
          />
          <div className="relative rounded-3xl glass p-5">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Plan a 10-day Japan trip in cherry blossom season for two…"
              rows={3}
              className="w-full resize-none bg-transparent text-base text-white placeholder:text-white/45 focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/55">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                Powered by Aria Intelligence
              </div>
              <button
                onClick={() => handleQuickPlan(prompt)}
                disabled={!prompt.trim()}
                className="group inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-[oklch(0.13_0.025_250)] transition disabled:opacity-50"
                style={{
                  background: "var(--gradient-sunrise)",
                  boxShadow: "var(--shadow-glow-gold)",
                }}
              >
                <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
                Plan Journey
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleQuickPlan(p)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/75 transition hover:border-white/30 hover:bg-white/10"
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Feature Showcase & Interactive Globe */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Showcase Banner */}
        <div className="md:col-span-8 relative overflow-hidden rounded-3xl glass aspect-[16/10] md:aspect-auto md:h-[380px]">
          <AnimatePresence mode="wait">
            <motion.img
              key={current.img}
              src={current.img}
              alt={current.name}
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              exit={{ scale: 1.03, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 40%, oklch(0.08 0.02 250 / 0.95) 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6">
            <div>
              <div className="text-xs tracking-[0.25em] text-gold uppercase">
                Now Featured · {current.tag}
              </div>
              <h3 className="mt-2 font-display text-3xl">
                {current.name}
                <span className="ml-3 text-base text-white/60">{current.region}</span>
              </h3>
            </div>
            <div className="flex gap-1.5 mb-2">
              {SHOWCASE.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setShowcaseIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === showcaseIndex ? "w-8 bg-gold" : "w-1.5 bg-white/30"
                  }`}
                  aria-label={`Show destination ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Globe Widget */}
        <div className="md:col-span-4 relative overflow-hidden rounded-3xl glass p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs tracking-[0.25em] text-white/65 uppercase">
              Interactive Globe
            </div>
            <p className="text-[10px] text-white/40 mt-1">Real-time drifting catalog</p>
          </div>
          <div className="relative my-4 aspect-square max-w-[200px] mx-auto">
            <motion.img
              src={earth}
              alt="Spinning Earth"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="h-full w-full rounded-full object-cover shadow-[0_0_50px_oklch(0.55_0.13_220/0.4)]"
            />
            <div
              className="pointer-events-none absolute -inset-2 rounded-full opacity-60"
              style={{
                background:
                  "radial-gradient(circle, transparent 62%, oklch(0.7 0.15 220 / 0.3) 70%, transparent 80%)",
              }}
            />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-white/75">
              <span>Active Explorers</span>
              <span className="text-gold font-medium">24,318</span>
            </div>
            <div className="flex items-center justify-between text-white/75">
              <span>Trending Region</span>
              <span className="text-white font-medium">Japan & Bali</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatCard icon={Plane} label="Flights Tracked" value="1,284" hint="Across 42 active lanes" />
        <StatCard icon={Hotel} label="Hotels Logged" value="36" hint="9 boutique networks" />
        <StatCard icon={Camera} label="Experiences" value="128" hint="Curated by Aria intelligence" />
        <StatCard icon={Star} label="Trips Designed" value={trips.length.toString()} hint={`${trips.filter(t => t.status === "planning").length} in planning`} />
      </div>

      {/* Recommendations */}
      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs tracking-[0.25em] text-white/55 uppercase">
              Smart Recommendations
            </div>
            <h3 className="mt-2 font-display text-3xl">
              Hand-picked for your next escape
            </h3>
          </div>
          <button 
            onClick={() => onNavigate("Discover")}
            className="text-xs font-semibold text-gold/80 hover:text-gold transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {SHOWCASE.slice(0, 3).map((d) => (
            <article
              key={d.name}
              className="group relative overflow-hidden rounded-2xl glass transition-all duration-300 hover:border-white/20"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={d.img}
                  alt={d.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 50%, oklch(0.08 0.02 250 / 0.85) 100%)",
                  }}
                />
                <div className="absolute top-4 left-4 rounded-full glass px-3 py-1 text-[9px] tracking-[0.2em] text-white/90 uppercase">
                  {d.tag}
                </div>
              </div>
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-2xl">{d.name}</h4>
                  <span className="text-xs text-white/55">{d.temp}</span>
                </div>
                <p className="text-xs text-white/50">{d.region} · Optimal season drifting now</p>
                <button 
                  onClick={() => handleQuickPlan(`Plan a trip to ${d.name}`)}
                  className="pt-2 text-xs font-semibold text-gold hover:underline flex items-center gap-1.5"
                >
                  Plan with AI →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Plane;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl glass p-5 space-y-2">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/50 uppercase">
        <Icon className="h-3.5 w-3.5 text-gold" />
        {label}
      </div>
      <div className="font-display text-3xl text-white">{value}</div>
      <div className="text-[10px] text-white/40">{hint}</div>
    </div>
  );
}
