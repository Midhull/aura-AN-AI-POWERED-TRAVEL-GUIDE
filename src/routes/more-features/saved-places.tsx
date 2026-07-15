import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Search, ArrowLeft, Star, Coffee, Bed, Camera, Compass } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";

export const Route = createFileRoute("/more-features/saved-places")({
  head: () => ({
    meta: [
      { title: "Saved Places · Aria" },
      { name: "description", content: "Your collection of saved hotels, restaurants, and attractions." }
    ]
  }),
  component: SavedPlacesSection,
});

interface SavedPlace {
  id: string;
  name: string;
  category: "Stay" | "Dining" | "Attraction";
  rating: number;
  reviews: number;
  location: string;
  image: string;
  description: string;
}

function SavedPlacesSection() {
  const [places, setPlaces] = useState<SavedPlace[]>(() => {
    try {
      const raw = localStorage.getItem("aria_saved_places");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleUnsave = (id: string, name: string) => {
    const backup = places.find(p => p.id === id);
    const updated = places.filter(p => p.id !== id);
    setPlaces(updated);
    localStorage.setItem("aria_saved_places", JSON.stringify(updated));
    
    toast.success(`Removed "${name}" from Saved Places`, {
      action: {
        label: "Undo",
        onClick: () => {
          if (backup) {
            const restored = [...updated, backup];
            setPlaces(restored);
            localStorage.setItem("aria_saved_places", JSON.stringify(restored));
            toast.success(`Restored "${name}"`);
          }
        }
      }
    });
  };

  const filtered = places.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFilter === "All" || p.category === activeFilter;
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
              <div className="text-[10px] tracking-wider text-gold uppercase font-semibold">Travel Vault</div>
              <h1 className="font-display text-3xl">Saved Places</h1>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {["All", "Stay", "Dining", "Attraction"].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeFilter === filter
                    ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {filter === "All" ? "All Places" : filter}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved places..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/45 focus:border-gold/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Places Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map(place => (
              <motion.div
                layout
                key={place.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-2xl glass overflow-hidden border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Category Label */}
                    <div className="absolute left-4 top-4 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      {place.category === "Stay" && <Bed className="h-3 w-3 text-sky-400" />}
                      {place.category === "Dining" && <Coffee className="h-3 w-3 text-amber-400" />}
                      {place.category === "Attraction" && <Camera className="h-3 w-3 text-purple-400" />}
                      {place.category}
                    </div>

                    {/* Unsave Heart Button */}
                    <button
                      onClick={() => handleUnsave(place.id, place.name)}
                      className="absolute right-4 top-4 p-2 rounded-xl bg-black/60 hover:bg-red-500/20 backdrop-blur-md border border-white/10 text-rose-500 hover:text-rose-400 hover:border-rose-500/30 transition cursor-pointer"
                    >
                      <Heart className="h-4 w-4 fill-rose-500" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-white/55">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gold/80" />
                        {place.location}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-white">
                        <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                        {place.rating}
                      </span>
                    </div>

                    <h3 className="font-semibold text-base leading-tight group-hover:text-gold transition-colors">
                      {place.name}
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed font-light">
                      {place.description}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-white/5 mt-auto">
                  <span className="text-[10px] text-white/30 font-mono">{place.reviews} verified reviews</span>
                  <button className="text-[10px] text-gold font-semibold tracking-wider uppercase flex items-center gap-1 hover:underline cursor-pointer">
                    Navigate <Compass className="h-3 w-3" />
                  </button>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/5 max-w-sm mx-auto space-y-4">
            <Heart className="h-10 w-10 text-white/10 mx-auto animate-pulse" />
            <h4 className="text-white/60 font-semibold">No saved destinations</h4>
            <p className="text-xs text-white/40 max-w-xs mx-auto">
              You haven't saved any locations yet. Look for destinations and attractions in Discover or the Hidden Gems board!
            </p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
