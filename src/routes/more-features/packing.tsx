import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  CloudSun,
  Loader2,
  Check,
  Luggage
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";

export const Route = createFileRoute("/more-features/packing")({
  head: () => ({
    meta: [
      { title: "AI Packing · Aria" },
      { name: "description", content: "AI packing assistants, smart checklists, and luggage weight estimations." }
    ]
  }),
  component: PackingPage,
});

interface PackingItem {
  id: string;
  category: "Clothing" | "Toiletries" | "Electronics" | "Documents" | "Other";
  name: string;
  packed: boolean;
}

function PackingPage() {
  const [climate, setClimate] = useState<"Tropical" | "Cold" | "Rainy" | "Moderate">("Tropical");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  
  // Load packing items from localStorage
  const [items, setItems] = useState<PackingItem[]>(() => {
    try {
      const raw = localStorage.getItem("aria_packing_items");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist packing items
  useEffect(() => {
    localStorage.setItem("aria_packing_items", JSON.stringify(items));
  }, [items]);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<PackingItem["category"]>("Clothing");

  // Weights for estimator
  const [bagWeight, setBagWeight] = useState(3.2); // kg
  const [clothesWeight, setClothesWeight] = useState(8.5); // kg
  const [shoesWeight, setShoesWeight] = useState(2.4); // kg
  const [toiletriesWeight, setToiletriesWeight] = useState(1.8); // kg
  const [electronicsWeight, setElectronicsWeight] = useState(3.1); // kg

  const totalWeight = parseFloat((bagWeight + clothesWeight + shoesWeight + toiletriesWeight + electronicsWeight).toFixed(1));
  const isOverweight = totalWeight > 23;

  const handleGenerateList = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      let list: PackingItem[] = [];
      const base = [
        { id: "g1", category: "Electronics" as const, name: "Universal adapter", packed: false },
        { id: "g2", category: "Documents" as const, name: "Passport copies", packed: false },
        { id: "g3", category: "Toiletries" as const, name: "First aid travelkit", packed: false },
      ];

      if (climate === "Tropical") {
        list = [
          { id: "t1", category: "Clothing", name: `${days}x Lightweight cotton shirts`, packed: false },
          { id: "t2", category: "Clothing", name: "Sunhat & UV sunglasses", packed: false },
          { id: "t3", category: "Clothing", name: "Quick-dry shorts (x3)", packed: false },
          { id: "t4", category: "Toiletries", name: "Reef-safe sunscreen & bug spray", packed: false },
          ...base
        ];
        setClothesWeight(days * 0.4);
        setToiletriesWeight(1.5);
      } else if (climate === "Cold") {
        list = [
          { id: "c1", category: "Clothing", name: `${days}x Thermal base layers`, packed: false },
          { id: "c2", category: "Clothing", name: "Heavy down winter jacket", packed: false },
          { id: "c3", category: "Clothing", name: "Wool gloves & fleece beanie", packed: false },
          { id: "c4", category: "Clothing", name: "Thick hiking socks (x5)", packed: false },
          { id: "c5", category: "Toiletries", name: "Lip balm & moisturizer", packed: false },
          ...base
        ];
        setClothesWeight(days * 0.9 + 2.5); // heavy clothes
        setToiletriesWeight(1.8);
      } else if (climate === "Rainy") {
        list = [
          { id: "r1", category: "Clothing", name: "Gore-Tex waterproof jacket", packed: false },
          { id: "r2", category: "Clothing", name: "Waterproof hiking boots", packed: false },
          { id: "r3", category: "Clothing", name: "Travel umbrella", packed: false },
          { id: "r4", category: "Electronics", name: "Waterproof drybag pouch", packed: false },
          ...base
        ];
        setClothesWeight(days * 0.5 + 1.2);
        setToiletriesWeight(1.2);
      } else {
        list = [
          { id: "m1", category: "Clothing", name: `${days}x Layering t-shirts`, packed: false },
          { id: "m2", category: "Clothing", name: "Light cardigan / sweater", packed: false },
          { id: "m3", category: "Clothing", name: "Denim pants (x2)", packed: false },
          ...base
        ];
        setClothesWeight(days * 0.6);
        setToiletriesWeight(1.4);
      }

      setItems(list);
      toast.success(`Generated ${climate}-themed packing list for ${days} days!`);
    }, 1500);
  };

  const handleToggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, packed: !item.packed } : item));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: PackingItem = {
      id: crypto.randomUUID(),
      category: newItemCategory,
      name: newItemName.trim(),
      packed: false
    };

    setItems(prev => [...prev, newItem]);
    setNewItemName("");
    toast.success(`Added "${newItem.name}" to checklist`);
  };

  const handleDeleteItem = (id: string, name: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.info(`Deleted "${name}"`);
  };

  const packedCount = items.filter(i => i.packed).length;
  const packedProgress = items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0;

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
              <div className="text-[10px] tracking-wider text-amber-400 uppercase font-semibold">AI Assistant Suite</div>
              <h1 className="font-display text-3xl">AI Packing Planner</h1>
            </div>
          </div>
        </div>

        {/* Configurations & Weight Estimator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List Generator Inputs */}
          <div className="rounded-2xl glass p-6 border border-white/5 space-y-6">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold animate-pulse" />
              Checklist Generator
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="climate">Target Climate</label>
                <select
                  id="climate"
                  value={climate}
                  onChange={(e) => setClimate(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-gold/50 cursor-pointer"
                >
                  <option value="Tropical" className="bg-[oklch(0.08_0.02_250)]">Tropical / Beach (Warm)</option>
                  <option value="Cold" className="bg-[oklch(0.08_0.02_250)]">Alpine / Winter (Cold)</option>
                  <option value="Rainy" className="bg-[oklch(0.08_0.02_250)]">Monsoon / Rainforest (Wet)</option>
                  <option value="Moderate" className="bg-[oklch(0.08_0.02_250)]">Temperate / City (Mild)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-white/60">
                  <span className="font-mono uppercase tracking-wider">Trip Duration</span>
                  <span className="font-bold text-white font-mono">{days} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="21"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                />
              </div>

              <button
                onClick={handleGenerateList}
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ background: "var(--gradient-sunrise)", boxShadow: "var(--shadow-glow-gold)" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[oklch(0.13_0.025_250)]" />
                    AI Analyzing Climate...
                  </>
                ) : (
                  <>
                    <Briefcase className="h-4 w-4" />
                    Generate Packing List
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Luggage Weight Estimator */}
          <div className="lg:col-span-2 rounded-2xl glass p-6 border border-white/5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Scale className="h-4 w-4 text-gold" />
                  Luggage Weight Estimator
                </h3>
                <span className="text-[10px] font-bold bg-white/5 border border-white/10 text-white px-2 py-0.5 rounded-lg">Checked Bag limit: 23 kg</span>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-white/55">
                    <span>Empty Suitcase</span>
                    <span className="font-mono text-white">{bagWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.1"
                    value={bagWeight}
                    onChange={(e) => setBagWeight(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-white/55">
                    <span>Clothing & Garments</span>
                    <span className="font-mono text-white">{clothesWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.1"
                    value={clothesWeight}
                    onChange={(e) => setClothesWeight(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-white/55">
                    <span>Shoes & Boots</span>
                    <span className="font-mono text-white">{shoesWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.1"
                    value={shoesWeight}
                    onChange={(e) => setShoesWeight(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-white/55">
                    <span>Toiletries & Skincare</span>
                    <span className="font-mono text-white">{toiletriesWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="0.1"
                    value={toiletriesWeight}
                    onChange={(e) => setToiletriesWeight(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex justify-between text-[10px] text-white/55">
                    <span>Electronics & Adapters</span>
                    <span className="font-mono text-white">{electronicsWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={electronicsWeight}
                    onChange={(e) => setElectronicsWeight(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                </div>
              </div>
            </div>

            {/* Total weight display */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-3">
                <Luggage className={`h-8 w-8 ${isOverweight ? "text-red-500 animate-bounce" : "text-emerald-400 animate-float-slow"}`} />
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Estimated Bag Weight</div>
                  <div className="text-xl font-bold font-mono">
                    {totalWeight} kg <span className="text-xs font-normal text-white/45">/ 23 kg</span>
                  </div>
                </div>
              </div>

              {isOverweight ? (
                <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] leading-relaxed">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span><strong>Overweight Warning!</strong> Exceeds 23kg airline checked bag limits. Remove heavy layers.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Baggage is within normal safety thresholds.</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Packing Checklist Dashboard */}
        <div className="rounded-2xl glass p-6 border border-white/5 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-semibold">Active Checklist</h3>
              <div className="flex items-center gap-2 text-[10px] text-white/55 mt-1">
                <span>{packedCount} of {items.length} items packed</span>
                <span>•</span>
                <span className="font-bold text-gold">{packedProgress}% Complete</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full sm:max-w-xs h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gold transition-all duration-500"
                style={{ width: `${packedProgress}%` }}
              />
            </div>
          </div>

          {/* Checklist grids */}
          {items.length === 0 ? (
            <div className="text-center py-10 rounded-xl bg-white/5 border border-white/5 space-y-3">
              <Briefcase className="h-8 w-8 text-white/10 mx-auto" />
              <p className="text-xs text-white/40 max-w-xs mx-auto">
                No packing items listed. Select a climate and duration to generate your checklist.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(["Clothing", "Toiletries", "Electronics", "Documents"] as const).map(category => {
                const catItems = items.filter(i => i.category === category);
                return (
                  <div key={category} className="space-y-3">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono border-b border-white/5 pb-1">{category}</h4>
                    
                    {catItems.length === 0 ? (
                      <div className="text-[10px] text-white/30 italic py-2">No items listed.</div>
                    ) : (
                      <div className="space-y-2">
                        {catItems.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 group transition"
                          >
                            <label className="flex items-center gap-2 cursor-pointer select-none overflow-hidden pr-2">
                              <input
                                type="checkbox"
                                checked={item.packed}
                                onChange={() => handleToggleItem(item.id)}
                                className="rounded border-white/10 bg-white/5 text-gold focus:ring-0 cursor-pointer h-3.5 w-3.5"
                              />
                              <span className={`text-[11px] truncate leading-tight ${item.packed ? "line-through text-white/30" : "text-white/80"}`}>
                                {item.name}
                              </span>
                            </label>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add custom item form */}
          <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <div className="flex-1">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Add custom packing item... (e.g. swim goggles)"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white placeholder:text-white/40 focus:border-gold/50 focus:outline-none"
              />
            </div>
            
            <div className="w-full sm:max-w-[150px]">
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="Clothing" className="bg-[oklch(0.08_0.02_250)]">Clothing</option>
                <option value="Toiletries" className="bg-[oklch(0.08_0.02_250)]">Toiletries</option>
                <option value="Electronics" className="bg-[oklch(0.08_0.02_250)]">Electronics</option>
                <option value="Documents" className="bg-[oklch(0.08_0.02_250)]">Documents</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white flex items-center gap-1 transition cursor-pointer justify-center"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </form>

        </div>

      </div>
    </DashboardLayout>
  );
}
