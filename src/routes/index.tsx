import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { z } from "zod";

// Sub-components
import { DashboardOverview } from "../components/dashboard/DashboardOverview";
import { DiscoverSection } from "../components/dashboard/DiscoverSection";
import { PlannerSection } from "../components/dashboard/PlannerSection";
import { TripsSection } from "../components/dashboard/TripsSection";
import { AssistantSection } from "../components/dashboard/AssistantSection";
import { AIAnalyticsSection } from "../components/dashboard/AIAnalyticsSection";
import { HotelsSection } from "../components/dashboard/HotelsSection";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";

const dashboardSearchSchema = z.object({
  tab: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: dashboardSearchSchema,
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

function Dashboard() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const tabFromUrl = search.tab || "Dashboard";

  const [active, setActive] = useState(tabFromUrl);
  const [plannerInitialState, setPlannerInitialState] = useState<{ destination: string; prompt: string } | null>(null);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (search.tab && search.tab !== active) {
      setActive(search.tab);
    }
  }, [search.tab]);

  const handleTabChange = (newTab: string) => {
    setActive(newTab);
    navigate({
      to: "/",
      search: { tab: newTab },
    });
  };

  return (
    <DashboardLayout activeLabel={active} onTabChange={handleTabChange}>
      <AnimatePresence mode="wait">
        {active === "Dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardOverview onNavigate={handleTabChange} setPlannerState={setPlannerInitialState} />
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
            <DiscoverSection onNavigate={handleTabChange} setPlannerState={setPlannerInitialState} />
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
            <TripsSection onNavigate={handleTabChange} />
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
      </AnimatePresence>
    </DashboardLayout>
  );
}
