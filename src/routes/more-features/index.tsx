import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Wallet,
  Settings,
  ShieldAlert,
  Briefcase,
  Compass,
  CloudSun,
  FolderLock,
  Languages,
  BookOpen,
  Coins,
  Train,
  Activity,
  Utensils,
  Building,
  Search,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock
} from "lucide-react";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { useTravelStore } from "../../stores/useTravelStore";

export const Route = createFileRoute("/more-features/")({
  head: () => ({
    meta: [
      { title: "More Features · Aria" },
      {
        name: "description",
        content: "Explore Aria's premium AI-powered travel utilities, budget consoles, emergency trackers, and translation tools.",
      },
    ],
  }),
  component: MoreFeaturesHub,
});

interface FeatureItem {
  id: string;
  name: string;
  description: string;
  category: "AI Tools" | "Discovery" | "Finance" | "Safety & Health" | "Travel Tools";
  icon: any;
  route: string;
  color: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: "saved-places",
    name: "Saved Places",
    description: "Manage your saved stays, local food spots, and photography points.",
    category: "Travel Tools",
    icon: Heart,
    route: "/more-features/saved-places",
    color: "from-pink-500/20 to-rose-500/20"
  },
  {
    id: "budget-tracker",
    name: "Budget Tracker",
    description: "Simulate costs, log expenditures, and manage your real-time travel budget.",
    category: "Finance",
    icon: Wallet,
    route: "/more-features/budget",
    color: "from-emerald-500/20 to-teal-500/20"
  },
  {
    id: "settings",
    name: "Settings",
    description: "Adjust your AI Travel DNA preferences and profile security configurations.",
    category: "Travel Tools",
    icon: Settings,
    route: "/more-features/settings",
    color: "from-blue-500/20 to-indigo-500/20"
  },
  {
    id: "emergency",
    name: "Emergency & Safety",
    description: "SOS triggers, local consulate contacts, and medical/police directory maps.",
    category: "Safety & Health",
    icon: ShieldAlert,
    route: "/more-features/emergency",
    color: "from-red-500/20 to-orange-500/20"
  },
  {
    id: "packing",
    name: "AI Packing",
    description: "Generate weather-based luggage checklists and check weight distributions.",
    category: "AI Tools",
    icon: Briefcase,
    route: "/more-features/packing",
    color: "from-amber-500/20 to-yellow-500/20"
  },
  {
    id: "hidden-gems",
    name: "Hidden Gems",
    description: "Discover local secret waterfalls, viewpoints, and non-tourist spots.",
    category: "Discovery",
    icon: Compass,
    route: "/more-features/hidden-gems",
    color: "from-purple-500/20 to-fuchsia-500/20"
  },
  {
    id: "weather",
    name: "Weather Intelligence",
    description: "Advanced forecasting systems indicating UV limits and packing recommendations.",
    category: "Travel Tools",
    icon: CloudSun,
    route: "/more-features/weather",
    color: "from-sky-500/20 to-cyan-500/20"
  },
  {
    id: "documents",
    name: "Document Vault",
    description: "Encrypt and store passports, digital visas, tickets, and bookings securely.",
    category: "Travel Tools",
    icon: FolderLock,
    route: "/more-features/documents",
    color: "from-indigo-500/20 to-violet-500/20"
  },
  {
    id: "translator",
    name: "AI Translator",
    description: "Real-time speech translator, camera sign scanner, and dictionary log.",
    category: "AI Tools",
    icon: Languages,
    route: "/more-features/translator",
    color: "from-teal-500/20 to-cyan-500/20"
  },
  {
    id: "journal",
    name: "AI Trip Journal",
    description: "Reflect on memory prompts, upload local snaps, and index travel timelines.",
    category: "AI Tools",
    icon: BookOpen,
    route: "/more-features/journal",
    color: "from-orange-500/20 to-pink-500/20"
  },
  {
    id: "currency",
    name: "Currency & Finance",
    description: "Exchange calculator, live billing rates, and nearby global ATM locator.",
    category: "Finance",
    icon: Coins,
    route: "/more-features/currency",
    color: "from-green-500/20 to-emerald-500/20"
  },
  {
    id: "transport",
    name: "Transportation Guide",
    description: "Metro & bus maps, ride-share rate calculators, and airport transfers.",
    category: "Travel Tools",
    icon: Train,
    route: "/more-features/transport",
    color: "from-rose-500/20 to-purple-500/20"
  },
  {
    id: "medical",
    name: "Medical Assistant",
    description: "Pharmacy finder, first-aid step guides, and prescription reminders.",
    category: "Safety & Health",
    icon: Activity,
    route: "/more-features/medical",
    color: "from-red-500/20 to-pink-500/20"
  },
  {
    id: "food",
    name: "Local Food Guide",
    description: "Local culinary dishes list, street food maps, and diet recommendations.",
    category: "Discovery",
    icon: Utensils,
    route: "/more-features/food",
    color: "from-amber-500/20 to-orange-500/20"
  },
  {
    id: "hotel",
    name: "Hotel Manager",
    description: "Check-in countdown timers, booking receipts, and surrounding hotspots.",
    category: "Travel Tools",
    icon: Building,
    route: "/more-features/hotel",
    color: "from-blue-500/20 to-sky-500/20"
  }
];

function MoreFeaturesHub() {
  const navigate = useNavigate();
  const { activeTrip } = useTravelStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  // Load favorites & recently used from localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem("aria_feature_favorites");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {}
    }

    const savedRecent = localStorage.getItem("aria_feature_recent");
    if (savedRecent) {
      try {
        setRecentlyUsed(JSON.parse(savedRecent));
      } catch (e) {}
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter((f) => f !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("aria_feature_favorites", JSON.stringify(updated));
  };

  const handleFeatureClick = (feature: FeatureItem) => {
    // Add to recently used, limit to 4 items, unique
    const filtered = recentlyUsed.filter((r) => r !== feature.id);
    const updated = [feature.id, ...filtered].slice(0, 4);
    setRecentlyUsed(updated);
    localStorage.setItem("aria_feature_recent", JSON.stringify(updated));
    navigate({ to: feature.route });
  };

  // Filter features
  const filteredFeatures = FEATURES.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "All" || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // AI recommendations (based on active trip destination or status)
  const aiRecommendations = activeTrip
    ? ["packing", "weather", "food"] // Recommended for trip
    : ["translator", "budget-tracker", "hidden-gems"]; // Generic default recommendations

  const categories = ["All", "AI Tools", "Discovery", "Finance", "Safety & Health", "Travel Tools"];

  return (
    <DashboardLayout activeLabel="More Features">
      <div className="space-y-10 pb-16">
        
        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="font-display text-4xl leading-tight">
              ✨ More <span className="gradient-text-gold">Features</span>
            </h1>
            <p className="text-xs text-white/50 mt-1 max-w-lg">
              Unlock secondary travel intelligence systems, offline utility guides, translation boards, and real-time security consoles.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-xs text-white placeholder:text-white/45 focus:border-gold/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Recently Used & AI Recommendations & Favorites */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Favorites */}
          <div className="rounded-2xl glass p-5 border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-gold">
              <Star className="h-4 w-4 fill-gold text-gold" />
              Favorite Utilities
            </h3>
            {favorites.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-white/40 leading-relaxed border border-dashed border-white/5 rounded-xl">
                Star your favorite utilities for fast access.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {FEATURES.filter((f) => favorites.includes(f.id)).map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      onClick={() => handleFeatureClick(feature)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${feature.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium truncate">{feature.name}</span>
                      </div>
                      <button
                        onClick={(e) => toggleFavorite(feature.id, e)}
                        className="text-gold hover:scale-110 transition-transform p-1 cursor-pointer"
                      >
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recently Used */}
          <div className="rounded-2xl glass p-5 border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-white/80">
              <Clock className="h-4 w-4 text-white/55" />
              Recently Used
            </h3>
            {recentlyUsed.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-white/40 leading-relaxed border border-dashed border-white/5 rounded-xl">
                Your recently opened travel tools will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {FEATURES.filter((f) => recentlyUsed.includes(f.id)).map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      onClick={() => handleFeatureClick(feature)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${feature.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium truncate">{feature.name}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-white transition-colors" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Recommended */}
          <div className="rounded-2xl glass p-5 border border-white/5 space-y-4 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gold/5 rounded-full blur-xl group-hover:bg-gold/10 transition-all duration-700" />
            <h3 className="text-sm font-semibold flex items-center gap-2 text-gold">
              <Sparkles className="h-4 w-4 text-gold animate-pulse" />
              AI Recommended
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {FEATURES.filter((f) => aiRecommendations.includes(f.id)).map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gold/5 hover:bg-gold/10 border border-gold/10 hover:border-gold/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${feature.color}`}>
                        <Icon className="h-3.5 w-3.5 text-gold" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-medium truncate">{feature.name}</div>
                        <div className="text-[8px] text-white/40 truncate">Personalized for you</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-gold/60" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                activeCategory === cat
                  ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 4-5 Column Responsive Grid of Premium Cards */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((feature) => {
              const Icon = feature.icon;
              const isFav = favorites.includes(feature.id);
              return (
                <motion.div
                  layout
                  key={feature.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleFeatureClick(feature)}
                  className="group relative rounded-2xl glass p-5 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-48 select-none"
                >
                  {/* Glowing background gradient on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom right, var(--gradient-sunrise))` }} />

                  <div>
                    {/* Header: Icon & Favorite Star */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${feature.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <button
                        onClick={(e) => toggleFavorite(feature.id, e)}
                        className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
                          isFav ? "text-gold" : "text-white/30 hover:text-white/60"
                        }`}
                      >
                        <Star className={`h-4 w-4 ${isFav ? "fill-gold" : ""}`} />
                      </button>
                    </div>

                    {/* Content */}
                    <h4 className="text-sm font-semibold tracking-wide text-white group-hover:text-gold transition-colors duration-300">
                      {feature.name}
                    </h4>
                    <p className="text-[10px] text-white/50 leading-relaxed mt-1.5 line-clamp-3">
                      {feature.description}
                    </p>
                  </div>

                  {/* Footer Arrow link */}
                  <div className="flex items-center justify-end pt-2 text-[10px] text-gold font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Open <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty Search State */}
        {filteredFeatures.length === 0 && (
          <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/5 max-w-md mx-auto space-y-4">
            <Search className="h-10 w-10 text-white/20 mx-auto" />
            <h4 className="text-white/70 font-semibold">No Utilities Found</h4>
            <p className="text-xs text-white/40 max-w-xs mx-auto">
              We couldn't find any utilities matching "{searchQuery}". Try refining your search keywords or switching filters.
            </p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
