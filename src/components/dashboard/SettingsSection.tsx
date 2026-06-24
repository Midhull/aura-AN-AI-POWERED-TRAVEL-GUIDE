import { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppStore } from "../../stores/useAppStore";
import { TravelStyle, FoodPreference, AccommodationType, UserProfile, TravelerProfile } from "../../types/travel";
import { toast } from "sonner";
import { User, Shield, CreditCard, Sparkles, Settings2, Globe } from "lucide-react";

export function SettingsSection() {
  const { user, isGuest } = useAuthStore();
  const { updateTravelerProfileOptimistically } = useAppStore();

  const [activeTab, setActiveTab] = useState<"profile" | "dna">("profile");

  // Profile forms states
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [passport, setPassport] = useState("");
  const [nationality, setNationality] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Travel DNA states
  const [favoriteStyle, setFavoriteStyle] = useState<TravelStyle>(TravelStyle.BOUTIQUE);
  const [foodPreference, setFoodPreference] = useState<FoodPreference>(FoodPreference.NO_RESTRICTIONS);
  const [accommodation, setAccommodation] = useState<AccommodationType>(AccommodationType.HOTEL);
  const [dailyBudget, setDailyBudget] = useState(500);

  // Load state on mount or user change
  useEffect(() => {
    if (user) {
      setFullName(user.displayName || "");
      
      // Load traveler profile from localStorage fallback if guest or missing db row
      const localProfile = localStorage.getItem("aria_local_traveler_profile");
      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile) as TravelerProfile;
          setDob(parsed.dateOfBirth || "");
          setPassport(parsed.passportNumber || "");
          setNationality(parsed.nationality || "");
          setEmergencyName(parsed.emergencyContact?.name || "");
          setEmergencyPhone(parsed.emergencyContact?.phone || "");
        } catch (e) {
          // ignore
        }
      }

      // Load preferences
      const prefs = user.preferences || {};
      setFavoriteStyle(prefs.styles?.[0] || TravelStyle.BOUTIQUE);
      setFoodPreference(prefs.food?.[0] || FoodPreference.NO_RESTRICTIONS);
      setAccommodation(prefs.accommodation?.[0] || AccommodationType.HOTEL);
      setDailyBudget(prefs.maxDailyBudget || 500);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name cannot be empty.");
      return;
    }

    try {
      // Mock / Local save
      const profile: TravelerProfile = {
        id: "profile-id",
        userId: user?.uid || "guest",
        fullName,
        dateOfBirth: dob,
        passportNumber: passport,
        nationality,
        emergencyContact: {
          name: emergencyName,
          relationship: "Contact",
          phone: emergencyPhone
        }
      };

      // Optimistically update
      await updateTravelerProfileOptimistically(profile);
      
      // Also update display name in Auth Store
      if (user) {
        useAuthStore.setState({
          user: {
            ...user,
            displayName: fullName
          }
        });
        // If guest, save guest session updates
        if (isGuest) {
          localStorage.setItem("aria_guest_session", JSON.stringify({
            ...user,
            displayName: fullName
          }));
        }
      }

      toast.success("Traveler profile updated successfully!");
    } catch (err) {
      toast.error("Failed to save profile settings.");
    }
  };

  const handleSaveDNA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedPrefs = {
      ...user.preferences,
      styles: [favoriteStyle],
      food: [foodPreference],
      accommodation: [accommodation],
      maxDailyBudget: dailyBudget
    };

    useAuthStore.setState({
      user: {
        ...user,
        preferences: updatedPrefs
      }
    });

    if (isGuest) {
      localStorage.setItem("aria_guest_session", JSON.stringify({
        ...user,
        preferences: updatedPrefs
      }));
    }

    toast.success("Travel DNA configuration saved!");
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs tracking-[0.25em] text-white/55 uppercase">Control Panel</span>
        <h2 className="font-display text-4xl mt-1">OS Settings</h2>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 max-w-xs">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === "profile" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
          }`}
        >
          Traveler Profile
        </button>
        <button
          onClick={() => setActiveTab("dna")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === "dna" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
          }`}
        >
          Travel DNA Matrix
        </button>
      </div>

      <div className="rounded-3xl glass p-6 border border-white/5">
        {activeTab === "profile" ? (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <h3 className="text-xs font-semibold tracking-wider text-white/60 uppercase flex items-center gap-2">
              <User className="h-4 w-4 text-gold" /> Personal Credentials
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 uppercase font-mono" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 uppercase font-mono" htmlFor="dob">Date of Birth</label>
                <input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 uppercase font-mono" htmlFor="passport">Passport Number</label>
                <input
                  id="passport"
                  type="text"
                  placeholder="Z1234567"
                  value={passport}
                  onChange={(e) => setPassport(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 uppercase font-mono" htmlFor="nationality">Nationality</label>
                <input
                  id="nationality"
                  type="text"
                  placeholder="Indian, Japanese..."
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-4">
              <h3 className="text-xs font-semibold tracking-wider text-white/60 uppercase flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald" /> Emergency Contacts
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/40 uppercase font-mono" htmlFor="emergencyName">Contact Name</label>
                  <input
                    id="emergencyName"
                    type="text"
                    placeholder="Emergency Contact Name"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/40 uppercase font-mono" htmlFor="emergencyPhone">Phone Number</label>
                  <input
                    id="emergencyPhone"
                    type="tel"
                    placeholder="+91 9999999999"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-90 flex items-center justify-center gap-1.5"
              style={{ background: "var(--gradient-sunrise)" }}
            >
              Save Traveler Profile
            </button>
          </form>
        ) : (
          <form onSubmit={handleSaveDNA} className="space-y-6">
            <h3 className="text-xs font-semibold tracking-wider text-white/60 uppercase flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold animate-pulse" /> Travel DNA Preferences
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 uppercase font-mono">Favorite Travel Style</label>
                <select
                  value={favoriteStyle}
                  onChange={(e) => setFavoriteStyle(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[oklch(0.12_0.02_250)] py-2.5 px-3 text-xs text-white/80 focus:outline-none"
                >
                  {Object.values(TravelStyle).map((s) => (
                    <option key={s} value={s}>{s.toLowerCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 uppercase font-mono">Dietary Preferences</label>
                <select
                  value={foodPreference}
                  onChange={(e) => setFoodPreference(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[oklch(0.12_0.02_250)] py-2.5 px-3 text-xs text-white/80 focus:outline-none"
                >
                  {Object.values(FoodPreference).map((f) => (
                    <option key={f} value={f}>{f.toLowerCase().replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 uppercase font-mono">Lodging Class</label>
                <select
                  value={accommodation}
                  onChange={(e) => setAccommodation(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[oklch(0.12_0.02_250)] py-2.5 px-3 text-xs text-white/80 focus:outline-none"
                >
                  {Object.values(AccommodationType).map((a) => (
                    <option key={a} value={a}>{a.toLowerCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-white/40 uppercase font-mono">Default Daily Budget Limit (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">$</span>
                  <input
                    type="number"
                    min={20}
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(Math.max(20, Number(e.target.value)))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-7 pr-3 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-90 flex items-center justify-center gap-1.5"
              style={{ background: "var(--gradient-sunrise)" }}
            >
              Update Preferences Matrix
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
