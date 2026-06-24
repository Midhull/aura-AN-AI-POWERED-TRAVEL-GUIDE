import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  MapPin as MapIcon,
  Heart,
  Wallet,
  MessageSquare,
  Settings,
  CreditCard,
  Check,
  X,
  Loader2,
  Cpu,
  Bed
} from "lucide-react";

// Sub-components
import { AuthPortal } from "../components/dashboard/AuthPortal";
import { DashboardOverview } from "../components/dashboard/DashboardOverview";
import { DiscoverSection } from "../components/dashboard/DiscoverSection";
import { PlannerSection } from "../components/dashboard/PlannerSection";
import { TripsSection } from "../components/dashboard/TripsSection";
import { BudgetTrackerSection } from "../components/dashboard/BudgetTrackerSection";
import { AssistantSection } from "../components/dashboard/AssistantSection";
import { SettingsSection } from "../components/dashboard/SettingsSection";
import { AIAnalyticsSection } from "../components/dashboard/AIAnalyticsSection";
import { HotelsSection } from "../components/dashboard/HotelsSection";

// Stores
import { useAuthStore } from "../stores/useAuthStore";
import { useTravelStore } from "../stores/useTravelStore";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center · Aria" },
      {
        name: "description",
        content:
          "Your AI travel command center. Plan trips, discover destinations, and design itineraries.",
      },
      { property: "og:title", content: "Command Center · Aria" },
      {
        property: "og:description",
        content: "Your AI travel command center, powered by Aria.",
      },
    ],
  }),
  component: Dashboard,
});

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Compass, label: "Discover" },
  { icon: Sparkles, label: "AI Planner" },
  { icon: MapIcon, label: "My Trips" },
  { icon: Heart, label: "Saved Places" },
  { icon: Wallet, label: "Budget Tracker" },
  { icon: MessageSquare, label: "Travel Assistant" },
  { icon: Cpu, label: "AI Analytics" },
  { icon: Bed, label: "Hotels & Stays" },
  { icon: Settings, label: "Settings" },
];

function Dashboard() {
  const { user, initialized, isGuest, initialize: initAuth, signOut } = useAuthStore();
  const { setLocalMode } = useTravelStore();

  const [active, setActive] = useState("Dashboard");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [plannerInitialState, setPlannerInitialState] = useState<{ destination: string; prompt: string } | null>(null);

  // Card form mock states for Pro upgrade
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  // Sync store modes on user shift
  useEffect(() => {
    if (isGuest) {
      setLocalMode(true);
    }
  }, [isGuest]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[oklch(0.08_0.02_250)] text-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 text-gold animate-spin mx-auto" />
          <p className="text-xs text-white/50 tracking-widest uppercase">Connecting to Travel OS...</p>
        </div>
      </div>
    );
  }

  // Auth Protection portal
  if (!user) {
    return <AuthPortal />;
  }

  const handleUpgradePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc) {
      toast.error("Please fill in all checkout fields.");
      return;
    }

    setUpgrading(true);
    setTimeout(() => {
      setUpgrading(false);
      
      const updatedUser = {
        ...user,
        isPro: true
      };
      
      // Update store states
      useAuthStore.setState({ user: updatedUser });
      if (isGuest) {
        localStorage.setItem("aria_guest_session", JSON.stringify(updatedUser));
      }
      
      toast.success("Aria Pro unlocked! Infinite itinerary generation active.");
      setUpgradeOpen(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
    }, 1500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(0.08_0.02_250)] text-white flex">
      {/* Sidebar navigation */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[oklch(0.08_0.02_250/0.6)] px-4 py-6 backdrop-blur-xl md:flex z-20">
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-3">
          <div
            className="h-6 w-6 rounded-full"
            style={{ background: "var(--gradient-sunrise)" }}
          />
          <span className="font-display text-xl">Aria</span>
        </Link>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none pr-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === active;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.label === "Saved Places") {
                    toast.info("Saved Places workspace details is currently nested inside Discover.");
                    return;
                  }
                  setActive(item.label);
                }}
                className={`relative group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute left-0 h-6 w-0.5 rounded-r bg-gold"
                  />
                )}
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Aria Pro card */}
        <div className="mt-6 rounded-2xl glass p-4 text-xs text-white/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-white">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Aria Pro
            </span>
            {user.isPro && (
              <span className="text-[8px] bg-gold/20 border border-gold/40 text-gold px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Active</span>
            )}
          </div>
          <p className="leading-relaxed text-[10px]">
            Unlock unlimited itineraries and live concierge support.
          </p>
          {!user.isPro && (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="w-full rounded-lg bg-gold py-2 text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-90"
            >
              Upgrade
            </button>
          )}
        </div>

        {/* Profile Card & Logout */}
        <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs bg-gold/20 text-gold border border-gold/30">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : "E"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate max-w-[100px]">{user.displayName || "Explorer"}</div>
              <div className="text-[9px] text-white/40">{isGuest ? "Guest Mode" : "Auth Session"}</div>
            </div>
          </div>
          <button 
            onClick={() => {
              signOut();
              toast.success("Signed out successfully.");
            }} 
            className="text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 px-6 py-8 md:px-10 lg:px-14 overflow-y-auto h-screen scrollbar-none z-10">
        <AnimatePresence mode="wait">
          {active === "Dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardOverview onNavigate={setActive} setPlannerState={setPlannerInitialState} />
            </motion.div>
          )}

          {active === "Discover" && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <DiscoverSection onNavigate={setActive} setPlannerState={setPlannerInitialState} />
            </motion.div>
          )}

          {active === "AI Planner" && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <PlannerSection 
                initialState={plannerInitialState} 
                clearInitialState={() => setPlannerInitialState(null)} 
              />
            </motion.div>
          )}

          {active === "My Trips" && (
            <motion.div
              key="trips"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <TripsSection onNavigate={setActive} />
            </motion.div>
          )}

          {active === "Budget Tracker" && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <BudgetTrackerSection />
            </motion.div>
          )}

          {active === "Travel Assistant" && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AssistantSection />
            </motion.div>
          )}

          {active === "AI Analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AIAnalyticsSection />
            </motion.div>
          )}

          {active === "Hotels & Stays" && (
            <motion.div
              key="hotels"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <HotelsSection />
            </motion.div>
          )}

          {active === "Settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <SettingsSection />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Premium Upgrade Modal Dialog */}
      <AnimatePresence>
        {upgradeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl glass p-6 shadow-luxe space-y-6 text-white"
            >
              <button
                onClick={() => setUpgradeOpen(false)}
                className="absolute right-4 top-4 rounded-xl bg-white/5 p-2 text-white/55 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20 shadow-glow-gold mx-auto">
                  <Sparkles className="h-6 w-6 text-gold animate-float-slow" />
                </div>
                <h3 className="font-display text-3xl">Unlock Aria Pro</h3>
                <p className="text-xs text-white/50">Elevate your discovery process to elite limits</p>
                <div className="text-lg font-bold font-mono text-gold pt-2">$15 / Month</div>
              </div>

              {/* Benefits list */}
              <div className="space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald" />
                  <span>Unlimited Day-by-Day AI Itineraries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald" />
                  <span>Live Concierge Chat Consulting Agent</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald" />
                  <span>Advanced GBDT/XGBoost Feasibility forecasts</span>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleUpgradePayment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="cardNumber">Card Number</label>
                  <div className="relative font-mono">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      id="cardNumber"
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-gold/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="space-y-1">
                    <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="cardExpiry">Expiration</label>
                    <input
                      id="cardExpiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-gold/50"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="cardCvc">CVC</label>
                    <input
                      id="cardCvc"
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-gold/50"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={upgrading}
                  className="w-full mt-4 py-3 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: "var(--gradient-sunrise)", boxShadow: "var(--shadow-glow-gold)" }}
                >
                  {upgrading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Unlock Premium Concierge"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
