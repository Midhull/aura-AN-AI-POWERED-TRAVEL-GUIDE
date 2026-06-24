import { useState, useEffect } from "react";
import { useTravelStore } from "../../stores/useTravelStore";
import { budgetSimulator, SimulationFlightClass, SimulationTransportType, SimulationActivityIntensity } from "../../services/budgetSimulator";
import { DollarSign, PlusCircle, TrendingUp, AlertTriangle, HelpCircle, ArrowRight, CheckCircle, ListPlus, Sliders } from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string;
  category: "flights" | "accommodation" | "activities" | "dining" | "transport" | "other";
  amount: number;
  description: string;
  date: string;
}

const CATEGORIES = [
  { key: "flights", label: "Flights" },
  { key: "accommodation", label: "Accommodation" },
  { key: "activities", label: "Excursions" },
  { key: "dining", label: "Dining" },
  { key: "transport", label: "Transit" },
  { key: "other", label: "Other Buffer" }
] as const;

export function BudgetTrackerSection() {
  const { activeTrip } = useTravelStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Expense Logger form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("dining");
  const [description, setDescription] = useState("");

  // Simulator adjustments states
  const [hotelStars, setHotelStars] = useState(3);
  const [flightClass, setFlightClass] = useState<SimulationFlightClass>("Economy");
  const [transportType, setTransportType] = useState<SimulationTransportType>("Public");
  const [activityIntensity, setActivityIntensity] = useState<SimulationActivityIntensity>("Medium");

  // Simulation result state
  const [simResult, setSimResult] = useState<any | null>(null);

  // Load local expenses on mount or activeTrip change
  useEffect(() => {
    if (activeTrip) {
      const saved = localStorage.getItem(`aria_expenses_${activeTrip.id}`);
      if (saved) {
        try {
          setExpenses(JSON.parse(saved));
        } catch (e) {
          setExpenses([]);
        }
      } else {
        // Seed default initial expenses from breakdown
        const bd = activeTrip.budgetBreakdown;
        const seed: Expense[] = [
          { id: "seed-1", category: "flights", amount: Math.round(bd.flights * 0.9), description: "Outbound flight ticket booking", date: activeTrip.startDate },
          { id: "seed-2", category: "accommodation", amount: Math.round(bd.accommodation * 0.45), description: "Ryokan deposit block", date: activeTrip.startDate }
        ];
        localStorage.setItem(`aria_expenses_${activeTrip.id}`, JSON.stringify(seed));
        setExpenses(seed);
      }
    }
  }, [activeTrip]);

  if (!activeTrip) {
    return (
      <div className="text-center py-20 rounded-2xl glass space-y-4">
        <DollarSign className="h-10 w-10 text-white/20 mx-auto animate-float-slow" />
        <h4 className="text-white/60 font-medium">No Active Trip Selected</h4>
        <p className="text-xs text-white/40 max-w-xs mx-auto">
          Please select or generate a journey plan from the Dashboard or My Trips catalog to activate the budget tracking console.
        </p>
      </div>
    );
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      category,
      amount: Math.round(Number(amount)),
      description: description.trim() || `${category} expense`,
      date: new Date().toISOString().split("T")[0]
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    localStorage.setItem(`aria_expenses_${activeTrip.id}`, JSON.stringify(updated));

    setAmount("");
    setDescription("");
    toast.success("Expense logged successfully!");
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((exp) => exp.id !== id);
    setExpenses(updated);
    localStorage.setItem(`aria_expenses_${activeTrip.id}`, JSON.stringify(updated));
    toast.success("Expense removed.");
  };

  // Calculations
  const limit = activeTrip.budgetLimit;
  const spent = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const remaining = limit - spent;
  const percentSpent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

  const handleRunSimulation = () => {
    // budgetSimulator works in INR baseline. We convert active USD budget to INR index (x83)
    const baseINR = activeTrip.budgetLimit * 83;
    const res = budgetSimulator.simulate(
      baseINR,
      {
        hotelStars,
        durationDays: activeTrip.durationDays,
        flightClass,
        transportType,
        activityIntensity,
        travelersCount: activeTrip.travelersCount
      },
      activeTrip.destination
    );

    // Convert result back to USD for display consistency
    setSimResult({
      total: Math.round(res.newTotalCostINR / 83),
      diff: Math.round(res.costDifferenceINR / 83),
      impact: res.impactAnalysis,
      breakdown: {
        flights: Math.round(res.breakdown.flights / 83),
        accommodation: Math.round(res.breakdown.accommodation / 83),
        activities: Math.round(res.breakdown.activities / 83),
        transport: Math.round(res.breakdown.transport / 83),
        other: Math.round(res.breakdown.other / 83)
      }
    });
    toast.success("Budget adjustment simulation calculated.");
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs tracking-[0.25em] text-white/55 uppercase">Financial Control</span>
        <h2 className="font-display text-4xl mt-1">Real-time Budget Tracker</h2>
        <p className="text-xs text-white/55 mt-1">{activeTrip.title} ({activeTrip.destination})</p>
      </div>

      {/* Main summary numbers */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl glass p-5 space-y-2 border border-white/5 relative overflow-hidden">
          <span className="text-[10px] tracking-wider text-white/40 uppercase">Total Budget Limit</span>
          <div className="text-3xl font-display text-white font-mono">${limit.toLocaleString()}</div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gold rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="rounded-2xl glass p-5 space-y-2 border border-white/5 relative overflow-hidden">
          <span className="text-[10px] tracking-wider text-white/40 uppercase">Total Logged Spend</span>
          <div className={`text-3xl font-display font-mono ${spent > limit ? "text-red-400" : "text-white"}`}>
            ${spent.toLocaleString()}
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${spent > limit ? "bg-red-400" : "bg-gold"}`} 
              style={{ width: `${Math.min(100, percentSpent)}%` }} 
            />
          </div>
          <div className="text-[10px] text-white/40 font-mono">{percentSpent}% of total limit</div>
        </div>

        <div className="rounded-2xl glass p-5 space-y-2 border border-white/5 relative overflow-hidden">
          <span className="text-[10px] tracking-wider text-white/40 uppercase">Remaining Cash</span>
          <div className={`text-3xl font-display font-mono ${remaining < 0 ? "text-red-400" : "text-emerald"}`}>
            ${remaining.toLocaleString()}
          </div>
          <p className="text-[10px] text-white/40 leading-none">
            {remaining < 0 ? "Budget deficit warning" : "Surplus buffer available"}
          </p>
        </div>
      </div>

      {/* Content Columns: Log and History vs Simulator */}
      <div className="grid gap-6 md:grid-cols-12">
        
        {/* Logger and History Column */}
        <div className="md:col-span-7 space-y-6">
          {/* Logger form */}
          <div className="rounded-2xl glass p-5 space-y-4 border border-white/5">
            <h3 className="text-xs font-semibold tracking-wider text-white/60 uppercase flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-gold" /> Log Travel Expense
            </h3>

            <form onSubmit={handleAddExpense} className="grid gap-3 sm:grid-cols-3 items-end">
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-mono">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">$</span>
                  <input
                    type="number"
                    placeholder="75"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-7 pr-3 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-mono">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[oklch(0.12_0.02_250)] py-2 px-3 text-xs text-white/80 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[9px] text-white/40 uppercase font-mono">Description / Notes</label>
                <input
                  type="text"
                  placeholder="Local subway day pass, sushi counter..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="py-2 px-4 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-90 flex items-center justify-center gap-1.5"
                style={{ background: "var(--gradient-sunrise)" }}
              >
                <ListPlus className="h-3.5 w-3.5" /> Save
              </button>
            </form>
          </div>

          {/* Expenses List */}
          <div className="rounded-2xl glass p-5 space-y-4 border border-white/5">
            <h3 className="text-xs font-semibold tracking-wider text-white/60 uppercase">Expense Record Log</h3>
            <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto pr-1">
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/45">No expenses logged yet.</div>
              ) : (
                expenses.map((exp) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-mono bg-white/5 px-2 py-0.5 rounded text-white/50">{exp.category}</span>
                        <span className="text-[10px] text-white/35 font-mono">{exp.date}</span>
                      </div>
                      <div className="text-xs text-white mt-1.5 font-medium">{exp.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold font-mono text-white">${exp.amount}</span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Predictive Simulator Column */}
        <div className="md:col-span-5 space-y-6">
          <div className="rounded-2xl glass p-5 space-y-4 border border-white/5">
            <h3 className="text-xs font-semibold tracking-wider text-white/60 uppercase flex items-center gap-2">
              <Sliders className="h-4 w-4 text-gold" /> Budget Adjustment Simulator
            </h3>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Tweak parameters to simulate budget health forecasts. We predict price fluctuations based on local indices.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-mono">Hotel Rating Stars</label>
                <div className="flex gap-2">
                  {[1, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setHotelStars(s)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        hotelStars === s ? "border-gold bg-gold/15 text-gold" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {s === 1 ? "Budget" : `${s} ★`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-mono">Flight Cabin Class</label>
                <select
                  value={flightClass}
                  onChange={(e) => setFlightClass(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[oklch(0.12_0.02_250)] py-2 px-3 text-xs text-white/80 focus:outline-none"
                >
                  <option value="Economy">Economy Class</option>
                  <option value="PremiumEconomy">Premium Economy</option>
                  <option value="Business">Business Class</option>
                  <option value="FirstClass">First Class Luxury</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-mono">Ground Transportation</label>
                <select
                  value={transportType}
                  onChange={(e) => setTransportType(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[oklch(0.12_0.02_250)] py-2 px-3 text-xs text-white/80 focus:outline-none"
                >
                  <option value="Public">Public Transit Passes</option>
                  <option value="PrivateSedan">Private AC Sedan Cab</option>
                  <option value="PremiumSUV">Premium SUV Chauffeur</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-mono">Activity Intensity</label>
                <div className="flex gap-2">
                  {(["Low", "Medium", "High"] as const).map((intensity) => (
                    <button
                      key={intensity}
                      onClick={() => setActivityIntensity(intensity)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        activityIntensity === intensity ? "border-gold bg-gold/15 text-gold" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRunSimulation}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-90 flex items-center justify-center gap-1.5"
                style={{ background: "var(--gradient-sunrise)" }}
              >
                <TrendingUp className="h-3.5 w-3.5" /> Simulate Costs
              </button>
            </div>

            {/* Simulation Results Output */}
            {simResult && (
              <div className="border-t border-white/10 pt-4 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-white/60">Simulated Total:</span>
                  <span className="text-xl font-bold font-mono text-gold">${simResult.total}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-white/60">Variance Difference:</span>
                  <span className={`text-xs font-bold font-mono ${simResult.diff > 0 ? "text-red-400" : "text-emerald"}`}>
                    {simResult.diff > 0 ? `+$${simResult.diff}` : `-$${Math.abs(simResult.diff)}`}
                  </span>
                </div>

                {simResult.impact.length > 0 && (
                  <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/5 text-[10px] text-white/70">
                    <div className="font-semibold text-white flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-gold" /> Cost Impact Analysis
                    </div>
                    <ul className="space-y-1 list-disc pl-3">
                      {simResult.impact.map((point: string, idx: number) => (
                        <li key={idx}>{point.replace(/₹\d+(,\d+)*/g, (m) => `$${Math.round(parseInt(m.replace(/[^\d]/g, "")) / 83)}`)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
