import { useState } from "react";
import { Search, Compass, Shield, CloudSun, MapPin, Sparkles, X, Star, Utensils } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import bali from "../../assets/scene-bali.jpg";
import kyoto from "../../assets/scene-kyoto.jpg";
import alps from "../../assets/scene-alps.jpg";
import iceland from "../../assets/scene-iceland.jpg";
import santorini from "../../assets/scene-santorini.jpg";

interface DiscoverSectionProps {
  onNavigate: (tab: string) => void;
  setPlannerState: (data: { destination: string; prompt: string }) => void;
}

const DESTINATIONS = [
  { id: "kyoto", name: "Kyoto", region: "Japan", temp: "18°", tag: "Temples", img: kyoto, budget: 150, difficulty: "Easy", interests: ["Culture", "History", "Food"], style: "Cultural" },
  { id: "bali", name: "Bali", region: "Indonesia", temp: "29°", tag: "Coastline", img: bali, budget: 80, difficulty: "Easy", interests: ["Nature", "Beaches", "Relaxing"], style: "Relaxing" },
  { id: "alps", name: "Swiss Alps", region: "Switzerland", temp: "8°", tag: "Peaks", img: alps, budget: 250, difficulty: "Moderate", interests: ["Adventure", "Nature", "Skiing"], style: "Adventure" },
  { id: "iceland", name: "Iceland", region: "Nordic", temp: "4°", tag: "Aurora", img: iceland, budget: 220, difficulty: "Hard", interests: ["Adventure", "Nature", "Aurora"], style: "Adventure" },
  { id: "santorini", name: "Santorini", region: "Greece", temp: "24°", tag: "Sunset", img: santorini, budget: 180, difficulty: "Easy", interests: ["Beaches", "Romance", "Relaxing"], style: "Luxury" }
];

const LOCAL_CATALOG: Record<string, any> = {
  Kyoto: {
    description: "The historical heart of Japan. Drifting cherry blossoms, pristine temples, traditional ryokans, and sublime Kaiseki culinary masterclasses.",
    bestSeason: "Spring (April - May) & Autumn (October - November)",
    averageBudget: 150,
    travelDifficulty: 2,
    safetyScore: 10,
    foodScore: 9,
    nightlifeScore: 4,
    attractions: [
      { name: "Fushimi Inari Shrine", description: "Walk through thousands of vermilion torii gates winding up Mount Inari." },
      { name: "Kinkaku-ji (Golden Pavilion)", description: "A Zen temple covered in brilliant gold leaf overlooking a reflective pond." },
      { name: "Arashiyama Bamboo Grove", description: "Walk through towering bamboo pathways whispering in the wind." }
    ],
    restaurants: [
      { name: "Gion Sasaki", foodScore: 10, priceRange: "$$$$" },
      { name: "Chao Chao Gyoza", foodScore: 8, priceRange: "$" },
      { name: "Ryokan Tawaraya Inn Dining", foodScore: 9, priceRange: "$$$$" }
    ],
    weather: [
      { month: "Jan", temp: 5 }, { month: "Apr", temp: 15 }, { month: "Jul", temp: 28 }, { month: "Oct", temp: 18 }
    ]
  },
  Bali: {
    description: "An Indonesian paradise defined by forested volcanic mountains, iconic rice paddies, beaches, coral reefs, and deep spiritual retreats.",
    bestSeason: "Dry Season (April - October)",
    averageBudget: 80,
    travelDifficulty: 1,
    safetyScore: 8,
    foodScore: 8,
    nightlifeScore: 7,
    attractions: [
      { name: "Uluwatu Temple", description: "A sea temple perched on a cliff edge, famous for sunset Kecak fire dances." },
      { name: "Tegallalang Rice Terraces", description: "Scenic sloped valleys filled with traditional Balinese irrigation systems." },
      { name: "Sacred Monkey Forest Sanctuary", description: "Spiritual ecological forest housing over 700 Balinese long-tailed macaques." }
    ],
    restaurants: [
      { name: "Locavore Ubud", foodScore: 9.5, priceRange: "$$$" },
      { name: "Naughty Nuri's", foodScore: 8.5, priceRange: "$$" },
      { name: "Warung Ibu Oka", foodScore: 8, priceRange: "$" }
    ],
    weather: [
      { month: "Jan", temp: 28 }, { month: "Apr", temp: 29 }, { month: "Jul", temp: 27 }, { month: "Oct", temp: 29 }
    ]
  },
  "Swiss Alps": {
    description: "Unparalleled winter ski resorts, summer hiking trails, and majestic peaks like the Matterhorn casting shadows over pristine valleys.",
    bestSeason: "Winter (Dec - March) for Skiing, Summer (July - Aug) for Hiking",
    averageBudget: 260,
    travelDifficulty: 3,
    safetyScore: 10,
    foodScore: 8,
    nightlifeScore: 6,
    attractions: [
      { name: "Jungfraujoch (Top of Europe)", description: "The highest railway station in Europe offering sweeping views of the Aletsch Glacier." },
      { name: "Zermatt & The Matterhorn", description: "Car-free village resting underneath one of the world's most famous pyramid peaks." },
      { name: "Lake Geneva shores", description: "A crystal clear lake backed by snowcapped mountain ranges." }
    ],
    restaurants: [
      { name: "Chez Vrony Zermatt", foodScore: 9.5, priceRange: "$$$$" },
      { name: "Restaurant Schönegger", foodScore: 8, priceRange: "$$$" },
      { name: "La Grotte", foodScore: 8.5, priceRange: "$$$" }
    ],
    weather: [
      { month: "Jan", temp: -3 }, { month: "Apr", temp: 6 }, { month: "Jul", temp: 18 }, { month: "Oct", temp: 8 }
    ]
  },
  Iceland: {
    description: "The land of fire and ice. Dramatic volcanic landscapes, active hot springs, giant geysers, gushing waterfalls, and frozen glaciers.",
    bestSeason: "Winter (Nov - Feb) for Northern Lights, Summer (June - August) for Midnight Sun",
    averageBudget: 220,
    travelDifficulty: 4,
    safetyScore: 10,
    foodScore: 7.5,
    nightlifeScore: 6,
    attractions: [
      { name: "The Blue Lagoon", description: "Geothermal spa in a lava field famous for mineral-rich milky blue waters." },
      { name: "Gullfoss Waterfall", description: "A magnificent double-cascade waterfall carving through canyon walls." },
      { name: "Reynisfjara Black Sand Beach", description: "Famous black sand beach featuring towering basalt columns and roaring Atlantic waves." }
    ],
    restaurants: [
      { name: "Dill Reykjavik", foodScore: 9, priceRange: "$$$$" },
      { name: "Messinn", foodScore: 8.5, priceRange: "$$$" },
      { name: "Bæjarins Beztu Pylsur", foodScore: 8, priceRange: "$" }
    ],
    weather: [
      { month: "Jan", temp: -1 }, { month: "Apr", temp: 3 }, { month: "Jul", temp: 12 }, { month: "Oct", temp: 4 }
    ]
  },
  Santorini: {
    description: "Whitewashed cubiform cliffside houses overlooking the vast Aegean Sea, volcanic beaches, and legendary caldera sunsets.",
    bestSeason: "Late Spring (May) or Early Autumn (September - October)",
    averageBudget: 190,
    travelDifficulty: 1,
    safetyScore: 9,
    foodScore: 8.5,
    nightlifeScore: 7,
    attractions: [
      { name: "Oia Sunset Walkways", description: "Iconic blue-domed churches built over steep cliffs offering famous sunset views." },
      { name: "Red Beach", description: "Unique reddish volcanic sand beach enclosed by steep red volcanic cliffs." },
      { name: "Akrotiri Archaeological Site", description: "Minoan Bronze Age settlement preserved under volcanic ash." }
    ],
    restaurants: [
      { name: "Selene Restaurant", foodScore: 9.5, priceRange: "$$$$" },
      { name: "Metaxi Mas", foodScore: 9, priceRange: "$$" },
      { name: "Lucky's Souvlakis", foodScore: 8, priceRange: "$" }
    ],
    weather: [
      { month: "Jan", temp: 12 }, { month: "Apr", temp: 17 }, { month: "Jul", temp: 27 }, { month: "Oct", temp: 22 }
    ]
  }
};

export function DiscoverSection({ onNavigate, setPlannerState }: DiscoverSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [interestFilter, setInterestFilter] = useState("All");
  const [budgetFilter, setBudgetFilter] = useState(300); // Max budget limit
  const [selectedDest, setSelectedDest] = useState<any | null>(null);

  const filteredDests = DESTINATIONS.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInterest = interestFilter === "All" || d.interests.includes(interestFilter);
    const matchesBudget = d.budget <= budgetFilter;
    return matchesSearch && matchesInterest && matchesBudget;
  });

  const handlePlanWithAI = (destName: string) => {
    setPlannerState({
      destination: destName,
      prompt: `Plan a highly personalized, curated trip to ${destName}.`
    });
    onNavigate("AI Planner");
  };

  const currentDetail = selectedDest ? LOCAL_CATALOG[selectedDest.name] : null;

  return (
    <div className="space-y-8 relative">
      <div>
        <span className="text-xs tracking-[0.25em] text-white/55 uppercase">Discover Catalog</span>
        <h2 className="font-display text-4xl mt-1">Explore Earth's Finest Escapes</h2>
      </div>

      {/* Filter and Search controls */}
      <div className="grid gap-4 md:grid-cols-12 rounded-2xl glass p-5">
        {/* Search */}
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            placeholder="Search by city, region or country…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Interests dropdown */}
        <div className="md:col-span-3">
          <select
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[oklch(0.12_0.02_250)] py-2 px-3 text-xs text-white/80 focus:border-gold/50 focus:outline-none transition-colors"
          >
            <option value="All">All Interests</option>
            <option value="Nature">Nature & Outdoors</option>
            <option value="Adventure">Adventure & Hiking</option>
            <option value="Beaches">Beaches & Coastline</option>
            <option value="Food">Food & Gastronomy</option>
            <option value="Culture">Culture & History</option>
          </select>
        </div>

        {/* Budget slide */}
        <div className="md:col-span-4 flex items-center gap-3">
          <span className="text-[10px] tracking-wider text-white/40 uppercase whitespace-nowrap">Max budget:</span>
          <input
            type="range"
            min={50}
            max={300}
            step={10}
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(Number(e.target.value))}
            className="flex-1 accent-gold"
          />
          <span className="text-xs font-semibold text-gold font-mono">${budgetFilter}/day</span>
        </div>
      </div>

      {/* Destination Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDests.map((d) => (
          <motion.div
            key={d.id}
            layoutId={`card-container-${d.id}`}
            onClick={() => setSelectedDest(d)}
            className="group relative overflow-hidden rounded-2xl glass cursor-pointer border border-white/5 hover:border-white/15 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative h-56 overflow-hidden">
              <img
                src={d.img}
                alt={d.name}
                className="h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <span className="absolute top-4 left-4 rounded-full glass px-3 py-1 text-[9px] tracking-[0.2em] text-white/95 uppercase">
                {d.tag}
              </span>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <h3 className="font-display text-2xl text-white">{d.name}</h3>
                  <p className="text-[10px] text-white/60">{d.region}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gold font-mono">${d.budget}/day</p>
                  <p className="text-[9px] text-white/40">{d.difficulty} Difficulty</p>
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="flex flex-wrap gap-1">
                {d.interests.map((interest) => (
                  <span key={interest} className="text-[9px] bg-white/5 text-white/60 px-2 py-0.5 rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanWithAI(d.name);
                }}
                className="w-full text-center py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-white hover:bg-gold hover:text-[oklch(0.13_0.025_250)] hover:border-gold transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3 w-3" />
                Plan with AI
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredDests.length === 0 && (
        <div className="text-center py-16 rounded-2xl glass space-y-3">
          <Compass className="h-10 w-10 text-white/20 mx-auto animate-float-slow" />
          <h4 className="text-white/60 font-medium">No Destinations Found</h4>
          <p className="text-xs text-white/40 max-w-xs mx-auto">Try resetting your filters or widen your budget sliders to see other recommendations.</p>
        </div>
      )}

      {/* Expanded Destination details popup */}
      <AnimatePresence>
        {selectedDest && currentDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-3xl glass p-6 overflow-y-auto max-h-[85vh] shadow-luxe space-y-6 text-white"
            >
              <button
                onClick={() => setSelectedDest(null)}
                className="absolute right-4 top-4 rounded-xl bg-white/5 p-2 text-white/55 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <img
                  src={selectedDest.img}
                  alt={selectedDest.name}
                  className="w-full sm:w-56 h-48 rounded-2xl object-cover border border-white/10"
                />
                <div className="space-y-3 flex-1">
                  <div>
                    <span className="text-[10px] tracking-[0.2em] text-gold uppercase">{selectedDest.region}</span>
                    <h3 className="font-display text-4xl text-white mt-1">{selectedDest.name}</h3>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{currentDetail.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-white/80">
                    <CloudSun className="h-4 w-4 text-gold" />
                    <span>Best time: <strong className="text-white">{currentDetail.bestSeason}</strong></span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="text-center">
                  <p className="text-[9px] text-white/40 tracking-wider uppercase">Budget tier</p>
                  <p className="text-base font-semibold text-gold mt-1 font-mono">${selectedDest.budget}/day</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-white/40 tracking-wider uppercase">Safety rating</p>
                  <p className="text-base font-semibold text-white mt-1 flex items-center justify-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-emerald" />
                    {currentDetail.safetyScore}/10
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-white/40 tracking-wider uppercase">Food score</p>
                  <p className="text-base font-semibold text-white mt-1 flex items-center justify-center gap-1">
                    <Star className="h-3.5 w-3.5 text-gold" />
                    {currentDetail.foodScore}/10
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-white/40 tracking-wider uppercase">Travel difficulty</p>
                  <p className="text-base font-semibold text-white mt-1">{selectedDest.difficulty}</p>
                </div>
              </div>

              {/* Attractions & Restaurants */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold tracking-wider text-white/50 uppercase flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gold" /> Curated Highlights
                  </h4>
                  <div className="space-y-3">
                    {currentDetail.attractions.map((a: any, i: number) => (
                      <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                        <div className="text-xs font-semibold text-white">{a.name}</div>
                        <div className="text-[10px] text-white/60 leading-relaxed">{a.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold tracking-wider text-white/50 uppercase flex items-center gap-2">
                    <Utensils className="h-3.5 w-3.5 text-gold" /> Gastronomy Spots
                  </h4>
                  <div className="space-y-3">
                    {currentDetail.restaurants.map((r: any, i: number) => (
                      <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                          <div className="text-xs font-semibold text-white">{r.name}</div>
                          <div className="text-[9px] text-white/40 font-mono mt-0.5">Price range: {r.priceRange}</div>
                        </div>
                        <span className="text-[10px] font-semibold bg-gold/10 text-gold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 fill-gold/25" /> {r.foodScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setSelectedDest(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
                >
                  Close Detail
                </button>
                <button
                  onClick={() => handlePlanWithAI(selectedDest.name)}
                  className="flex-1 py-3 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-95 flex items-center justify-center gap-1.5"
                  style={{ background: "var(--gradient-sunrise)", boxShadow: "var(--shadow-glow-gold)" }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Plan Itinerary with Aria
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
