import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Compass,
  MapPin,
  Lock,
  Unlock,
  Star,
  Camera,
  Heart,
  Eye,
  Sparkles,
  Search,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { supabase } from "../../services/supabase/client";

export const Route = createFileRoute("/more-features/hidden-gems")({
  head: () => ({
    meta: [
      { title: "Hidden Gems · Aria" },
      { name: "description", content: "Locate secret waterfalls, non-tourist photography spots, and coordinates." }
    ]
  }),
  component: HiddenGemsPage,
});

interface Gem {
  id: string;
  name: string;
  category: "Secret Beach" | "Hidden Waterfall" | "Photography Spot" | "Sunset Point" | "Local Café";
  region: string;
  description: string;
  rating: number;
  unlocked: boolean;
  coordinates?: string;
  bestTime?: string;
  image: string;
  photographerTip?: string;
}

function HiddenGemsPage() {
  const [gems, setGems] = useState<Gem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("aria_unlocked_gems");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("aria_saved_places");
      const parsed = raw ? JSON.parse(raw) : [];
      return parsed.map((x: any) => x.id);
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const fetchGems = async () => {
      setLoading(true);
      try {
        const { data: dests } = await supabase.from("destinations").select("id, name");
        const { data: attrs, error } = await supabase
          .from("attractions")
          .select("*");
        if (error) throw error;

        const mapped: Gem[] = (attrs || []).map((a: any) => {
          const destName = dests?.find(d => d.id === a.destination_id)?.name || "Local Region";
          return {
            id: a.id,
            name: a.name,
            category: a.name.toLowerCase().includes("waterfall") ? "Hidden Waterfall" 
                    : a.name.toLowerCase().includes("beach") || a.name.toLowerCase().includes("lagoon") ? "Secret Beach" 
                    : a.name.toLowerCase().includes("cafe") || a.name.toLowerCase().includes("tea") ? "Local Café"
                    : a.name.toLowerCase().includes("sunset") || a.name.toLowerCase().includes("ridge") ? "Sunset Point"
                    : "Photography Spot",
            region: `${a.name}, ${destName}`,
            description: a.description || "Discover this secret local coordinate cataloged by Aria intelligence.",
            rating: parseFloat((4.5 + (a.name.length % 5) / 10).toFixed(1)),
            unlocked: false,
            coordinates: a.coordinates ? (typeof a.coordinates === 'string' ? a.coordinates : `${a.coordinates.lat || a.coordinates.x}° N, ${a.coordinates.lng || a.coordinates.y}° E`) : "35.0000° N, 135.0000° E",
            bestTime: "Early Morning (06:00 - 08:30)",
            image: a.name.toLowerCase().includes("waterfall") 
              ? "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop"
              : a.name.toLowerCase().includes("beach") || a.name.toLowerCase().includes("lagoon")
              ? "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1542931287-023b922fa89b?q=80&w=600&auto=format&fit=crop",
            photographerTip: "Shoot with low angles during golden hour to maximize canopy shadows."
          };
        });
        setGems(mapped);
      } catch (err) {
        console.error("Error loading attractions for hidden gems:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGems();
  }, []);

  const handleUnlock = (id: string, name: string) => {
    setUnlockingId(id);
    setTimeout(() => {
      const nextUnlocked = [...unlockedIds, id];
      setUnlockedIds(nextUnlocked);
      localStorage.setItem("aria_unlocked_gems", JSON.stringify(nextUnlocked));
      setUnlockingId(null);
      toast.success(`Coordinates for "${name}" unlocked successfully!`);
    }, 1200);
  };

  const handleSaveGem = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    let rawSaved = localStorage.getItem("aria_saved_places");
    let currentSaved: any[] = [];
    try {
      currentSaved = rawSaved ? JSON.parse(rawSaved) : [];
    } catch (err) {}

    const isCurrentlySaved = currentSaved.some((x: any) => x.id === id);
    let nextSaved;

    if (isCurrentlySaved) {
      nextSaved = currentSaved.filter((x: any) => x.id !== id);
      toast.info(`Removed "${name}" from Saved Places`);
    } else {
      const targetGem = gems.find(g => g.id === id);
      if (targetGem) {
        const newSaved: any = {
          id: targetGem.id,
          name: targetGem.name,
          category: targetGem.category === "Local Café" ? "Dining" : "Attraction",
          rating: targetGem.rating,
          reviews: Math.floor(targetGem.rating * 20),
          location: targetGem.region,
          image: targetGem.image,
          description: targetGem.description
        };
        nextSaved = [...currentSaved, newSaved];
        toast.success(`Saved "${name}" to Saved Places!`);
      } else {
        nextSaved = currentSaved;
      }
    }
    
    localStorage.setItem("aria_saved_places", JSON.stringify(nextSaved));
    setSavedIds(nextSaved.map((x: any) => x.id));
  };

  const categories = ["All", "Secret Beach", "Hidden Waterfall", "Photography Spot", "Sunset Point", "Local Café"];

  const filtered = gems.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || g.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
              <div className="text-[10px] tracking-wider text-purple-400 uppercase font-semibold">Local Discovery</div>
              <h1 className="font-display text-3xl">Hidden Gems Board</h1>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeCategory === cat
                    ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search secret spots..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/45 focus:border-gold/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Gems Grid */}
        {loading ? (
          <div className="text-center py-20 rounded-2xl glass">
            <Loader2 className="h-8 w-8 text-gold animate-spin mx-auto" />
            <p className="text-xs text-white/40 mt-3 font-mono">Scanning satellite archives for hidden coordinates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/5 max-w-sm mx-auto space-y-4">
            <Compass className="h-10 w-10 text-white/10 mx-auto animate-pulse" />
            <h4 className="text-white/60 font-semibold">No hidden gems available</h4>
            <p className="text-xs text-white/40 max-w-xs mx-auto">
              No hidden gems detected in our active destinations registry.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map(gem => {
                const isUnlocked = unlockedIds.includes(gem.id);
                return (
                  <motion.div
                    layout
                    key={gem.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="group rounded-2xl glass overflow-hidden border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row h-auto md:h-64"
                  >
                    {/* Visual Image half */}
                    <div className="relative w-full md:w-2/5 h-48 md:h-full overflow-hidden shrink-0">
                      <img
                        src={gem.image}
                        alt={gem.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                      
                      {/* Category tag */}
                      <div className="absolute left-4 top-4 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-bold uppercase tracking-wider text-gold flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        {gem.category}
                      </div>
                    </div>

                    {/* Information half */}
                    <div className="p-5 flex flex-col justify-between flex-1 overflow-hidden">
                      
                      {/* Upper details */}
                      <div className="space-y-2 overflow-y-auto scrollbar-none pr-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-white/55">
                            <MapPin className="h-3 w-3 text-gold/80" />
                            <span>{gem.region}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-white">
                              <Star className="h-3 w-3 text-gold fill-gold" />
                              {gem.rating}
                            </span>
                            
                            <button
                              onClick={(e) => handleSaveGem(gem.id, gem.name, e)}
                              className={`p-1 rounded-lg transition-colors cursor-pointer hover:bg-white/5 ${
                                savedIds.includes(gem.id) ? "text-rose-500" : "text-white/30 hover:text-white"
                              }`}
                            >
                              <Heart className={`h-3.5 w-3.5 ${savedIds.includes(gem.id) ? "fill-rose-500" : ""}`} />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-semibold text-sm leading-tight text-white group-hover:text-gold transition-colors">
                          {gem.name}
                        </h3>
                        <p className="text-[11px] text-white/55 leading-relaxed">
                          {gem.description}
                        </p>

                        {/* Unlocked content */}
                        <AnimatePresence>
                          {isUnlocked && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="pt-2.5 border-t border-white/5 space-y-2 text-[10px] leading-relaxed"
                            >
                              <div className="grid grid-cols-2 gap-2 bg-gold/5 p-2 rounded-lg border border-gold/10 font-mono">
                                <div>
                                  <span className="text-white/40 block text-[8px] uppercase">GPS Coordinate</span>
                                  <span className="text-gold font-bold">{gem.coordinates}</span>
                                </div>
                                <div>
                                  <span className="text-white/40 block text-[8px] uppercase">Best Hour</span>
                                  <span className="text-white/80">{gem.bestTime}</span>
                                </div>
                              </div>
                              
                              {gem.photographerTip && (
                                <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex gap-1.5 items-start">
                                  <Camera className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-sky-300">Photographer Tip:</strong> {gem.photographerTip}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Unlock Coordinate Button */}
                      {!isUnlocked && (
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-2">
                          <span className="text-[9px] text-white/30 flex items-center gap-1 font-mono">
                            <Lock className="h-3 w-3" /> Coordinates Locked
                          </span>
                          
                          <button
                            onClick={() => handleUnlock(gem.id, gem.name)}
                            disabled={unlockingId === gem.id}
                            className="px-3.5 py-1.5 rounded-xl bg-gold/10 hover:bg-gold/25 border border-gold/25 hover:border-gold/45 text-gold text-[10px] font-semibold transition cursor-pointer flex items-center gap-1.5"
                          >
                            {unlockingId === gem.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" /> Unscrambling GPS...
                              </>
                            ) : (
                              <>
                                <Unlock className="h-3 w-3" /> Unlock coordinates
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {isUnlocked && (
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-emerald-400 font-mono mt-2">
                          <span className="flex items-center gap-1">
                            <Unlock className="h-3 w-3" /> Fully Unlocked
                          </span>
                          <span className="text-white/35 flex items-center gap-1 uppercase tracking-wider">
                            Explore <Compass className="h-3 w-3" />
                          </span>
                        </div>
                      )}

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
