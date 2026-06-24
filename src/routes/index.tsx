import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AIOrb } from "@/components/AIOrb";
import { CinematicScene } from "@/components/CinematicScene";
import { ArrowRight, Compass, Search, Sparkles } from "lucide-react";

import clouds from "@/assets/scene-clouds.jpg";
import earth from "@/assets/scene-earth.jpg";
import bali from "@/assets/scene-bali.jpg";
import kyoto from "@/assets/scene-kyoto.jpg";
import alps from "@/assets/scene-alps.jpg";
import iceland from "@/assets/scene-iceland.jpg";
import santorini from "@/assets/scene-santorini.jpg";
import finale from "@/assets/scene-finale.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aria — The AI Travel Guide" },
      {
        name: "description",
        content:
          "A cinematic, AI-powered travel companion. Discover destinations, design itineraries, and travel like never before.",
      },
      { property: "og:title", content: "Aria — The AI Travel Guide" },
      {
        property: "og:description",
        content:
          "Cinematic AI travel intelligence. Plan luxury trips, discover hidden gems, design perfect itineraries.",
      },
      { property: "og:image", content: finale },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: finale },
    ],
  }),
  component: WelcomeExperience,
});

const DESTINATIONS = [
  { name: "Bali", region: "Indonesia" },
  { name: "Kyoto", region: "Japan" },
  { name: "Iceland", region: "Nordic" },
  { name: "Switzerland", region: "Alps" },
  { name: "Santorini", region: "Greece" },
];

function WelcomeExperience() {
  useLenis();
  return (
    <main className="relative bg-[oklch(0.08_0.02_250)] text-white">
      <TopNav />
      <SceneClouds />
      <SceneWorld />
      <SceneDestination
        image={bali}
        alt="Luxury Bali beach villa at sunset"
        place="Bali"
        line1="Curated by AI."
        line2="Designed around you."
        accent="oklch(0.7 0.14 60)"
      />
      <SceneDestination
        image={kyoto}
        alt="Kyoto cherry blossom temple in morning fog"
        place="Kyoto"
        line1="Discover what"
        line2="guidebooks miss."
        accent="oklch(0.78 0.1 350)"
        petals
      />
      <SceneDestination
        image={alps}
        alt="Swiss Alps at golden hour"
        place="Swiss Alps"
        line1="Explore beyond"
        line2="the ordinary."
        accent="oklch(0.75 0.08 220)"
      />
      <SceneAIPlanner />
      <SceneFinale />
      <SiteFooter />
    </main>
  );
}

/* ────────────────────────────────────────────────────────── */

function TopNav() {
  const { scrollY } = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 200],
    ["rgba(15,18,30,0)", "rgba(15,18,30,0.55)"],
  );
  const border = useTransform(
    scrollY,
    [0, 200],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"],
  );
  return (
    <motion.header
      style={{ background: bg, borderColor: border }}
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative h-6 w-6">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: "var(--gradient-aurora)" }}
            />
            <div className="absolute inset-[3px] rounded-full bg-[oklch(0.1_0.02_250)]" />
            <div
              className="absolute inset-[5px] rounded-full"
              style={{ background: "var(--gradient-sunrise)" }}
            />
          </div>
          <span className="font-display text-xl tracking-tight">Aria</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#world" className="hover:text-white transition-colors">Discover</a>
          <a href="#planner" className="hover:text-white transition-colors">AI Planner</a>
          <a href="#finale" className="hover:text-white transition-colors">Journeys</a>
        </nav>
        <Link
          to="/dashboard"
          className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[oklch(0.13_0.025_250)] transition hover:bg-gold"
        >
          Enter
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.header>
  );
}

/* ── SCENE 01 ─────────────────────────────────────────────── */

function SceneClouds() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.2, 0.8]);
  const headOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const headY = useTransform(scrollYProgress, [0, 1], ["0px", "-80px"]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden">
      <motion.div style={{ scale: imgScale, y: imgY }} className="absolute inset-0">
        <img
          src={clouds}
          alt="Cinematic sunrise above the clouds"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      </motion.div>
      <motion.div
        style={{
          opacity: overlayOpacity,
          background:
            "linear-gradient(180deg, transparent 0%, oklch(0.08 0.02 250 / 0.85) 100%)",
        }}
        className="absolute inset-0"
      />
      {/* light rays */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse at 50% 25%, oklch(0.95 0.1 80 / 0.5), transparent 60%)",
        }}
      />

      <motion.div
        style={{ opacity: headOpacity, y: headY }}
        className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center gap-10 px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <AIOrb size={140} />
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-balance text-[clamp(2.75rem,8vw,7.5rem)] leading-[0.98] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.45)]"
          >
            Every destination
            <br />
            has a <em className="italic gradient-text-gold not-italic font-display">story.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.4, ease: "easeOut" }}
            className="text-lg text-white/85 md:text-xl"
          >
            Let AI discover yours.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] text-white/60 uppercase"
        >
          Scroll to begin
          <div className="mx-auto mt-3 h-10 w-px bg-gradient-to-b from-white/60 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── SCENE 02 ─────────────────────────────────────────────── */

function SceneWorld() {
  const ref = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const earthRotate = useTransform(scrollYProgress, [0, 1], [-25, 25]);
  const earthScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 1.15]);

  return (
    <section
      id="world"
      ref={ref}
      className="relative h-screen w-full overflow-hidden bg-[oklch(0.08_0.02_250)]"
    >
      {/* starfield */}
      <Starfield />

      {/* aurora glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 60%, oklch(0.58 0.18 295 / 0.55), transparent 70%)",
        }}
      />

      <motion.div
        style={{ scale: earthScale, rotate: earthRotate }}
        className="absolute left-1/2 top-1/2 aspect-square w-[min(95vmin,1000px)] -translate-x-1/2 -translate-y-1/2"
      >
        <img
          src={earth}
          alt="Earth from space"
          loading="lazy"
          className="h-full w-full rounded-full object-cover shadow-[0_0_120px_oklch(0.55_0.13_220/0.6)]"
        />
        {/* atmosphere ring */}
        <div
          className="pointer-events-none absolute -inset-4 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, transparent 60%, oklch(0.7 0.15 220 / 0.4) 72%, transparent 80%)",
          }}
        />
      </motion.div>

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-between gap-8 px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.2 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs tracking-[0.25em] text-white/85 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
            Scene 02 — The world awaits
          </span>
          <h2 className="mt-6 font-display text-balance text-[clamp(2.25rem,6vw,5.5rem)] leading-[1.02]">
            Where would you{" "}
            <em className="not-italic gradient-text-aurora font-display">like to go?</em>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1, delay: 0.4 }}
          className="w-full max-w-xl"
        >
          <div className="group relative">
            <div
              className="absolute -inset-px rounded-2xl opacity-60 blur-md transition-opacity group-focus-within:opacity-100"
              style={{ background: "var(--gradient-aurora)" }}
            />
            <div className="relative flex items-center gap-3 rounded-2xl glass px-5 py-4">
              <Search className="h-5 w-5 text-white/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any destination on Earth…"
                className="flex-1 bg-transparent text-base text-white placeholder:text-white/50 focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-white/20 px-2 py-0.5 text-[10px] text-white/60 md:inline">
                ⏎
              </kbd>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {DESTINATIONS.map((d) => (
              <button
                key={d.name}
                onClick={() => setSelected(d.name)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  selected === d.name
                    ? "border-gold/70 bg-gold/15 text-gold"
                    : "border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {d.name}
                <span className="ml-1.5 text-xs text-white/40">{d.region}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="text-xs text-white/40">
          {selected ? `Plotting course to ${selected}…` : "Drift through the world below."}
        </div>
      </div>
    </section>
  );
}

function Starfield() {
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; opacity: number }>>([]);
  useEffect(() => {
    setStars(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 4,
        opacity: 0.4 + Math.random() * 0.5,
      })),
    );
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `orb-pulse 3s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── SCENE 03 / 04 / 05 ───────────────────────────────────── */

function SceneDestination({
  image,
  alt,
  place,
  line1,
  line2,
  accent,
  petals,
}: {
  image: string;
  alt: string;
  place: string;
  line1: string;
  line2: string;
  accent: string;
  petals?: boolean;
}) {
  return (
    <CinematicScene
      image={image}
      imageAlt={alt}
      eyebrow={place}
      headline={
        <>
          {line1}
          <br />
          <em
            className="not-italic"
            style={{
              backgroundImage: `linear-gradient(135deg, ${accent}, oklch(0.95 0.05 80))`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {line2}
          </em>
        </>
      }
    >
      {petals && <Petals />}
    </CinematicScene>
  );
}

function Petals() {
  const petals = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((i) => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: `${(i * 7) % 100}%`,
            top: "-10vh",
            background:
              "radial-gradient(circle, oklch(0.92 0.08 350), oklch(0.78 0.1 350))",
            animation: `petal-fall ${8 + (i % 5)}s linear ${i * 0.6}s infinite`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

/* ── SCENE 06 — AI Planner ────────────────────────────────── */

function SceneAIPlanner() {
  return (
    <section
      id="planner"
      className="relative min-h-screen w-full overflow-hidden bg-[oklch(0.1_0.025_250)] py-32"
    >
      {/* atmospheric backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 30% 30%, oklch(0.42 0.13 240 / 0.6), transparent 60%), radial-gradient(ellipse 50% 50% at 80% 70%, oklch(0.58 0.18 295 / 0.5), transparent 60%)",
        }}
      />
      <Starfield />

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.2 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs tracking-[0.25em] text-white/85 uppercase">
            <Sparkles className="h-3 w-3 text-gold" />
            Scene 06 — Travel Intelligence
          </span>
          <h2 className="mt-6 font-display text-balance text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.02]">
            Millions of possibilities.
            <br />
            <em className="not-italic gradient-text-gold">One perfect itinerary.</em>
          </h2>
          <p className="mt-6 text-white/70 md:text-lg">
            Aria assembles flights, stays, attractions, local secrets, and budget — in seconds.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-4 md:grid-cols-12">
          {PLANNER_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative overflow-hidden rounded-2xl glass p-6 ${card.span}`}
            >
              <div
                className="absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-70"
                style={{ background: card.glow }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs tracking-[0.25em] text-white/60 uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {card.label}
                </div>
                <h3 className="mt-3 font-display text-2xl text-white md:text-3xl">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-white/70">{card.desc}</p>
                <div className="mt-5 space-y-2">
                  {card.lines.map((l) => (
                    <div key={l} className="flex items-center gap-2 text-sm text-white/80">
                      <span className="h-1 w-3 rounded-full bg-gradient-to-r from-gold to-transparent" />
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLANNER_CARDS = [
  {
    label: "Flights",
    title: "Smart routing",
    desc: "Curated by price, layover, and arrival time.",
    span: "md:col-span-5",
    glow: "oklch(0.58 0.18 295 / 0.8)",
    lines: ["SFO → NRT · 11h 20m", "Premium economy · $1,840"],
  },
  {
    label: "Stay",
    title: "Hand-picked hotels",
    desc: "Boutique, luxury, and hidden retreats.",
    span: "md:col-span-7",
    glow: "oklch(0.82 0.14 78 / 0.8)",
    lines: ["Aman Tokyo · 5★", "Hoshinoya Kyoto · 5★", "The Tawaraya Inn · Ryokan"],
  },
  {
    label: "Day 01",
    title: "Arrival in Kyoto",
    desc: "Morning tea, Fushimi Inari at golden hour.",
    span: "md:col-span-7",
    glow: "oklch(0.78 0.1 350 / 0.7)",
    lines: ["08:00 — Ryokan check-in", "16:30 — Fushimi Inari", "19:30 — Kaiseki dinner"],
  },
  {
    label: "Budget",
    title: "Real-time totals",
    desc: "Track every yen across the journey.",
    span: "md:col-span-5",
    glow: "oklch(0.62 0.13 165 / 0.8)",
    lines: ["Estimated $4,820 · 10 days", "Tracked across 6 categories"],
  },
  {
    label: "Local Secrets",
    title: "What guidebooks miss",
    desc: "Quiet alleys, neighborhood bakeries, hidden onsen.",
    span: "md:col-span-12",
    glow: "oklch(0.62 0.13 240 / 0.8)",
    lines: [
      "A 4-seat sushi counter loved by chefs",
      "Sunrise viewpoint above Arashiyama",
      "An off-grid onsen 90 minutes from town",
    ],
  },
];

/* ── SCENE 07 — Finale ───────────────────────────────────── */

function SceneFinale() {
  return (
    <section id="finale" className="relative h-[110vh] w-full overflow-hidden">
      <img
        src={finale}
        alt="Panoramic golden hour landscape"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.08 0.02 250 / 0.2) 0%, oklch(0.08 0.02 250 / 0.65) 80%, oklch(0.08 0.02 250 / 0.95) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center gap-8 px-6 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-30%" }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <AIOrb size={120} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="font-display text-balance text-[clamp(2.5rem,7vw,6.5rem)] leading-[1.02] text-white"
        >
          The future of travel
          <br />
          <em className="not-italic gradient-text-gold">begins here.</em>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            to="/dashboard"
            className="group relative inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-medium text-[oklch(0.13_0.025_250)] transition"
            style={{ background: "var(--gradient-sunrise)", boxShadow: "var(--shadow-glow-gold)" }}
          >
            Start Your Journey
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#world"
            className="inline-flex items-center gap-2 rounded-full glass px-7 py-4 text-base font-medium text-white transition hover:bg-white/15"
          >
            <Compass className="h-4 w-4" />
            Explore Destinations
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[oklch(0.07_0.02_250)] px-6 py-12 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-white/50 md:flex-row">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full"
            style={{ background: "var(--gradient-sunrise)" }}
          />
          <span className="font-display text-base text-white/80">Aria</span>
          <span>· The AI Travel Guide</span>
        </div>
        <div>© {new Date().getFullYear()} Aria. Designed for explorers.</div>
      </div>
    </footer>
  );
}

/* Smooth scroll via Lenis */
function useLenis() {
  useEffect(() => {
    let raf = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const Lenis = (await import("lenis")).default;
      if (cancelled) return;
      lenis = new Lenis({ duration: 1.2, smoothWheel: true });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);
}

