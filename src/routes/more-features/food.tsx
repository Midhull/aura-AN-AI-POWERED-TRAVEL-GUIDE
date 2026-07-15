import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Utensils,
  Search,
  Sparkles,
  Heart,
  Star,
  MapPin,
  Flame,
  Check,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { supabase } from "../../services/supabase/client";

export const Route = createFileRoute("/more-features/food")({
  head: () => ({
    meta: [
      { title: "Local Food Guide · Aria" },
      { name: "description", content: "Culinary dining recommendations, regional street foods, and dietary guide maps." }
    ]
  }),
  component: FoodPage,
});

interface FoodDish {
  id: string;
  name: string;
  category: "Street Food" | "Fine Dining";
  region: string;
  tags: string[]; // Vegetarian, Vegan, Halal
  rating: number;
  description: string;
  image: string;
  spiciness: number; // 0-3
}

function FoodPage() {
  const [dishes, setDishes] = useState<FoodDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTagFilter, setActiveTagFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [regionSelector, setRegionSelector] = useState("Asia");

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
    const fetchDishes = async () => {
      setLoading(true);
      try {
        const { data: dests } = await supabase.from("destinations").select("id, name");
        const { data: rests, error } = await supabase
          .from("restaurants")
          .select("*");
        if (error) throw error;

        const mapped: FoodDish[] = (rests || []).map((r: any) => {
          const destName = dests?.find(d => d.id === r.destination_id)?.name || "Local Region";
          return {
            id: r.id,
            name: r.name,
            category: r.food_score && r.food_score >= 8.5 ? "Fine Dining" : "Street Food",
            region: `${r.cuisine || "Specialty"}, ${destName}`,
            tags: r.cuisine ? [r.cuisine] : [],
            rating: r.food_score ? parseFloat((r.food_score / 2).toFixed(1)) : 4.5,
            description: r.description || "Indulge in authentic local gastronomy approved by Aria.",
            image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&auto=format&fit=crop",
            spiciness: r.name.length % 4
          };
        });
        setDishes(mapped);
      } catch (err) {
        console.error("Error loading restaurants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDishes();
  }, []);

  const handleSaveFood = (id: string, name: string) => {
    let rawSaved = localStorage.getItem("aria_saved_places");
    let currentSaved: any[] = [];
    try {
      currentSaved = rawSaved ? JSON.parse(rawSaved) : [];
    } catch (err) {}

    const isCurrentlySaved = currentSaved.some((x: any) => x.id === id);
    let nextSaved;

    if (isCurrentlySaved) {
      nextSaved = currentSaved.filter((x: any) => x.id !== id);
      toast.info(`Removed "${name}" from food bookmarks.`);
    } else {
      const targetDish = dishes.find(d => d.id === id);
      if (targetDish) {
        const newSaved: any = {
          id: targetDish.id,
          name: targetDish.name,
          category: "Dining",
          rating: targetDish.rating,
          reviews: Math.floor(targetDish.rating * 20),
          location: targetDish.region,
          image: targetDish.image,
          description: targetDish.description
        };
        nextSaved = [...currentSaved, newSaved];
        toast.success(`Bookmarked "${name}"!`);
      } else {
        nextSaved = currentSaved;
      }
    }
    
    localStorage.setItem("aria_saved_places", JSON.stringify(nextSaved));
    setSavedIds(nextSaved.map((x: any) => x.id));
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.region.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTagFilter === "All") return matchesSearch;
    if (activeTagFilter === "Street Food" || activeTagFilter === "Fine Dining") {
      return matchesSearch && dish.category === activeTagFilter;
    }
    return matchesSearch && dish.tags.includes(activeTagFilter);
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
              <div className="text-[10px] tracking-wider text-amber-400 uppercase font-semibold">Gourmet Companion</div>
              <h1 className="font-display text-3xl">Local Food Guide</h1>
            </div>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {["All", "Street Food", "Fine Dining", "Vegetarian", "Vegan", "Halal"].map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(tag)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                  activeTagFilter === tag
                    ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search local dishes..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/45 focus:border-gold/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Dispatches culinary cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold">Gourmet Specialties</h3>
            
            {loading ? (
              <div className="text-center py-20 rounded-2xl glass">
                <Loader2 className="h-8 w-8 text-gold animate-spin mx-auto" />
                <p className="text-xs text-white/40 mt-3 font-mono">Loading dining spots from active travel directories...</p>
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/5 space-y-3">
                <Utensils className="h-10 w-10 text-white/20 mx-auto animate-pulse" />
                <h4 className="text-white/60 font-semibold">No local dining spots found</h4>
                <p className="text-xs text-white/40 max-w-xs mx-auto">
                  No specialties or dining spots matched your query. Check again later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDishes.map(dish => (
                  <div
                    key={dish.id}
                    className="group rounded-2xl glass overflow-hidden border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative h-40 w-full overflow-hidden">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="h-full w-full object-cover group-hover:scale-103 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        
                        <div className="absolute left-3 bottom-3 text-[9px] text-white/55 flex items-center gap-1 font-mono">
                          <MapPin className="h-3 w-3 text-gold/80" /> {dish.region}
                        </div>

                        <button
                          onClick={() => handleSaveFood(dish.id, dish.name)}
                          className={`absolute right-3 top-3 p-1.5 rounded-lg backdrop-blur-md border cursor-pointer transition ${
                            savedIds.includes(dish.id)
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                              : "bg-black/60 border-white/10 text-white/55 hover:text-white"
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${savedIds.includes(dish.id) ? "fill-rose-500" : ""}`} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-bold uppercase tracking-wider">{dish.category}</span>
                          <span className="flex items-center gap-0.5 text-white/80 font-bold">
                            <Star className="h-3 w-3 text-gold fill-gold" /> {dish.rating}
                          </span>
                        </div>

                        <h4 className="font-semibold text-sm group-hover:text-gold transition-colors">{dish.name}</h4>
                        <p className="text-[10px] text-white/55 leading-relaxed font-light">{dish.description}</p>
                      </div>
                    </div>

                    {/* Footer tags */}
                    <div className="px-4 pb-4 pt-2 border-t border-white/5 mt-auto flex justify-between items-center text-[8px] font-semibold">
                      <div className="flex gap-1">
                        {dish.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold uppercase tracking-wider">{t}</span>
                        ))}
                        {dish.tags.length === 0 && <span className="text-white/30 italic">No dietary tags</span>}
                      </div>

                      <div className="flex items-center gap-0.5 text-red-400">
                        {Array.from({ length: dish.spiciness }).map((_, i) => (
                          <Flame key={i} className="h-3 w-3 fill-red-400" />
                        ))}
                        {dish.spiciness === 0 && <span className="text-white/35 font-mono">Mild</span>}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Culinary Suggestions */}
          <div className="rounded-2xl glass p-6 border border-white/5 flex flex-col justify-between space-y-5 h-fit">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                AI Culinary Recommendations
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono">Select Continent</label>
                  <select
                    value={regionSelector}
                    onChange={(e) => setRegionSelector(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Asia" className="bg-[oklch(0.08_0.02_250)] text-white">East / Southeast Asia</option>
                    <option value="Europe" className="bg-[oklch(0.08_0.02_250)] text-white">Western Europe</option>
                    <option value="Americas" className="bg-[oklch(0.08_0.02_250)] text-white">Latin Americas</option>
                  </select>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2 text-[10px] leading-relaxed">
                  {regionSelector === "Asia" && (
                    <>
                      <div className="font-semibold text-gold">Hygiene Tip: Street Food</div>
                      <p className="text-white/60">Choose stalls with long queues of local families. This guarantees fast ingredient turnovers and high-quality preparation practices.</p>
                    </>
                  )}
                  {regionSelector === "Europe" && (
                    <>
                      <div className="font-semibold text-gold">Dining Rule: Tipping</div>
                      <p className="text-white/60">Servicing charges are usually included in billing checks. Extra gratuities of 5-10% are appreciated but optional for exceptional service.</p>
                    </>
                  )}
                  {regionSelector === "Americas" && (
                    <>
                      <div className="font-semibold text-gold">Hydration Guide: Ice Water</div>
                      <p className="text-white/60">Stick strictly to sealed bottled beverages in rural areas. Ask for drinks without ice blocks to prevent stomach bugs.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-[9px] text-white/30 border-t border-white/5 pt-3 leading-relaxed font-mono">
              Culinary database matched to your Travel DNA profiles.
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
