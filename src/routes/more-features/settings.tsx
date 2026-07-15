import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { SettingsSection } from "../../components/dashboard/SettingsSection";

export const Route = createFileRoute("/more-features/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Aria" },
      { name: "description", content: "Manage your profile, travel preferences, and security settings." }
    ]
  }),
  component: SettingsPage,
});

function SettingsPage() {
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
              <div className="text-[10px] tracking-wider text-gold uppercase font-semibold">User Profile</div>
              <h1 className="font-display text-3xl">Settings</h1>
            </div>
          </div>
        </div>

        {/* Embedded Section */}
        <SettingsSection />

      </div>
    </DashboardLayout>
  );
}
