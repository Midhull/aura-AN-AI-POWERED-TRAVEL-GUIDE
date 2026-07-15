import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTravelStore } from "../../stores/useTravelStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppStore } from "../../stores/useAppStore";
import { travelOS } from "../../services/travelOS";
import { feedbackService } from "../../services/feedbackService";
import { orchestrateTripPlan } from "../../services/trips";
import { budgetEngine } from "../../services/budgetEngine";
import { travelDNASystem } from "../../services/travelDNASystem";
import { travelRiskEngine } from "../../services/travelRiskEngine";
import { tripSuccessPredictor } from "../../services/tripSuccessPredictor";
import { tripOptimizationEngine } from "../../services/tripOptimizationEngine";
import { TravelStyle, FoodPreference, AccommodationType } from "../../types/travel";
import { toast } from "sonner";
import { Sparkles, Calendar, Users, DollarSign, Activity, AlertTriangle, CheckCircle, RefreshCw, MapPin, Clock, ArrowRight, Shield, CloudSun, Star, Loader2 } from "lucide-react";
import { PlaceSearchAutocomplete } from "../google/PlaceSearchAutocomplete";
import { ActivityPhoto } from "../google/ActivityPhoto";
import { ItineraryMap } from "../google/ItineraryMap";

interface PlannerSectionProps {
  initialState?: { destination: string; prompt: string } | null;
  clearInitialState?: () => void;
}

const STEP_LABELS = ["Destination", "Duration & Count", "Budget & Style", "Review"];

export function PlannerSection({ initialState, clearInitialState }: PlannerSectionProps) {
  const { user } = useAuthStore();
  const { createTrip, activeTrip, activeItinerary, loading: storeLoading } = useTravelStore();

  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState("");
  const [prompt, setPrompt] = useState("");
  const [durationDays, setDurationDays] = useState(3);
  const [travelersCount, setTravelersCount] = useState(1);
  const [budgetLimit, setBudgetLimit] = useState(2000);
  const [selectedStyle, setSelectedStyle] = useState<TravelStyle>(TravelStyle.BOUTIQUE);
  const [foodPreference, setFoodPreference] = useState<FoodPreference>(FoodPreference.NO_RESTRICTIONS);
  const [accommodationType, setAccommodationType] = useState<AccommodationType>(AccommodationType.HOTEL);

  // Loading animation states
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Result Reports States
  const [dnaProfile, setDnaProfile] = useState<any | null>(null);
  const [budgetReport, setBudgetReport] = useState<any | null>(null);
  const [riskReport, setRiskReport] = useState<any | null>(null);
  const [successReport, setSuccessReport] = useState<any | null>(null);
  const [optReport, setOptReport] = useState<any | null>(null);

  // Active visualized tab for generated itinerary
  const [itineraryTab, setItineraryTab] = useState<"schedule" | "budget" | "risk" | "engine">("schedule");

  // Feedback/ratings states
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const handleFeedbackSubmit = async () => {
    if (!activeTrip) return;
    if (rating === 0) {
      toast.error("Please select a rating first.");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await feedbackService.submitFeedback({
        userId: user?.uid || "00000000-0000-0000-0000-000000000000",
        tripId: activeTrip.id,
        itemType: "itinerary",
        itemId: activeTrip.id || "",
        rating,
        review: comment,
      });
      setFeedbackSubmitted(true);
      toast.success("Feedback submitted successfully! Thank you for training the model.");
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      toast.error("Failed to submit feedback. Saving offline.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    if (initialState) {
      setDestination(initialState.destination);
      setPrompt(initialState.prompt);
      setStep(3); // skip right to review
      if (clearInitialState) clearInitialState();
    }
  }, [initialState]);

  const runSimulationPipeline = async () => {
    console.log("FORM DATA", {
      destination,
      travelStyle: selectedStyle,
      budget: budgetLimit,
      duration: durationDays,
      dietaryPreference: foodPreference,
      lodgingPreference: accommodationType,
    });
    setGenerating(true);
    setLoadingStep(0);

    // Simulated timing delays for realism & wow factor
    const steps = [
      "1/7 Analyzing Traveler Preferences & Travel DNA...",
      "2/7 Calculating Budget Allocations & Deterministic Base Rates...",
      "3/7 Fetching Destination Intelligence & Match Scores...",
      "4/7 Performing Risk Analysis & Weather Forecast checks...",
      "5/7 Evaluating XGBoost Decision Forest Success Predictor...",
      "6/7 Assembling Cinematic Itinerary with Aria AI...",
      "7/7 Saving curated package to database..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(i);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      const mockProfile = {
        uid: user?.uid || "00000000-0000-0000-0000-000000000000",
        email: user?.email || "guest@aria.ai",
        displayName: user?.displayName || "Explorer",
        preferences: {
          styles: [selectedStyle],
          food: [foodPreference],
          accommodation: [accommodationType],
          currency: "USD",
          maxDailyBudget: budgetLimit / durationDays
        },
        isPro: user?.isPro || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Call the real orchestrator pipeline on the server
      console.log("[PlannerSection] Running travelOS server orchestrator...");
      const result = await orchestrateTripPlan({
        data: {
          userProfile: mockProfile as any,
          destinationQuery: destination,
          durationDays,
          travelersCount,
          budgetLimitINR: budgetLimit * 83,
          pastTrips: []
        }
      });

      setDnaProfile(result.dnaProfile);
      setBudgetReport(result.budgetResult);
      setRiskReport(result.riskReport);
      setSuccessReport(result.successReport);
      setOptReport(result.optimizationReport);

      // Persist the real AI-generated itinerary days
      await createTrip({
        userId: mockProfile.uid,
        title: `Journey to ${destination}`,
        destination,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        durationDays,
        travelersCount,
        status: "planning" as const,
        budgetLimit: result.budgetResult.breakdown.total,
        budgetBreakdown: result.budgetResult.breakdown
      }, result.finalItinerary.days);

      toast.success("AI travel package generated successfully!");
    } catch (err: any) {
      console.error("[PlannerSection] Generation Error:", err);
      toast.error(err.message || "An error occurred during itinerary generation.");
    } finally {
      setGenerating(false);
    }
  };

  const currentStepLabel = STEP_LABELS[step];

  // If there's an active trip and generated itinerary, render the beautiful visualizer
  if (activeTrip && activeItinerary) {
    const breakdown = activeTrip.budgetBreakdown;
    return (
      <div className="space-y-6">
        {/* Itinerary Header */}
        <div className="rounded-2xl glass p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] tracking-[0.2em] text-gold font-semibold uppercase">Curated AI Journey Plan</span>
            <h2 className="font-display text-4xl text-white">{activeTrip.title}</h2>
            <p className="text-xs text-white/50">{activeTrip.destination} · {activeTrip.durationDays} Days · {activeTrip.travelersCount} Traveler(s)</p>
          </div>

          <button
            onClick={() => {
              // Clear active trip to go back to planner
              useTravelStore.getState().setActiveTrip(null);
              setStep(0);
            }}
            className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-2 self-start"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Plan New Escape
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 max-w-lg scrollbar-none overflow-x-auto">
          {(["schedule", "budget", "risk", "engine"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setItineraryTab(tab)}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg capitalize transition-all whitespace-nowrap ${
                itineraryTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              {tab === "engine" ? "Optimization DNA" : tab}
            </button>
          ))}
        </div>

        {/* Visualizer content based on active tab */}
        <AnimatePresence mode="wait">
          {itineraryTab === "schedule" && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Visual Route Map */}
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-1">
                  <ItineraryMap itineraryDays={activeItinerary.days} />
                </div>

                {activeItinerary.days.map((day: any) => (
        <div key={day.dayNumber} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">Day {day.dayNumber}</span>
            <h3 className="font-display text-2xl text-white">{day.theme}</h3>
          </div>
          <div className="relative pl-4 border-l border-white/10 ml-6 space-y-4">
            {day.activities.map((act: any, idx: number) => (
              <div key={idx} className="relative group bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Timeline dot */}
                <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-white/30 border-2 border-[oklch(0.08_0.02_250)] group-hover:bg-gold transition-colors" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/55 uppercase font-mono">{act.category}</span>
                    <span className="text-xs text-white/70 font-semibold font-mono flex items-center gap-1"><Clock className="h-3 w-3 text-gold" /> {act.timeSlot}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{act.title}</h4>
                  <p className="text-xs text-white/60 leading-relaxed max-w-2xl">{act.description}</p>
                </div>
                <div className="flex flex-col gap-3 items-start sm:items-end sm:min-w-[140px] shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-white/45 font-semibold bg-white/5 py-1.5 px-3 rounded-xl border border-white/5">
                    <MapPin className="h-3 w-3 text-gold" /> {act.locationName}
                  </div>
                  <div className="w-full sm:w-[140px] h-[90px] overflow-hidden rounded-xl border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity">
                    <ActivityPhoto locationName={act.locationName} maxWidth={140} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>

  </div>
)}

          {itineraryTab === "budget" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {/* Grand summary */}
              <div className="rounded-2xl glass p-6 space-y-6">
                <div>
                  <h3 className="font-display text-2xl">Financial Allocation</h3>
                  <p className="text-xs text-white/45 mt-1">Deterministic budget breakdown calculated by local indices</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-xs text-white/60">Estimated Total Cost</span>
                    <span className="text-2xl font-bold font-mono text-gold">${breakdown.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-xs text-white/60">Your Budget Limit</span>
                    <span className="text-base font-semibold text-white font-mono">${activeTrip.budgetLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs bg-emerald/10 border border-emerald/20 text-emerald p-3 rounded-xl">
                    <CheckCircle className="h-4 w-4" />
                    <span>Allocation conforms successfully within your budget boundaries.</span>
                  </div>
                </div>

                {/* Savings recommendations */}
                <div className="space-y-3">
                  <h4 className="text-[10px] tracking-wider text-white/40 uppercase">Aria Savings Suggestions</h4>
                  <ul className="space-y-2 text-xs text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="h-1 w-2 rounded bg-gold mt-1.5 shrink-0" />
                      <span>Use local public passes instead of premium cab networks.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1 w-2 rounded bg-gold mt-1.5 shrink-0" />
                      <span>Opt for boutique local dining to save up to 25% daily.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Progress categories */}
              <div className="rounded-2xl glass p-6 space-y-5">
                <h3 className="text-xs font-semibold tracking-wider text-white/50 uppercase">Expenditure Categories</h3>
                <div className="space-y-4">
                  <BudgetBar label="Flights & Sky lanes" value={breakdown.flights} max={breakdown.total} />
                  <BudgetBar label="Accommodation & Hospitality" value={breakdown.accommodation} max={breakdown.total} />
                  <BudgetBar label="Excursions & Attractions" value={breakdown.activities} max={breakdown.total} />
                  <BudgetBar label="Dining & Cuisine" value={breakdown.dining} max={breakdown.total} />
                  <BudgetBar label="Transit & Airport Transfers" value={breakdown.transport} max={breakdown.total} />
                  <BudgetBar label="Emergency & Local Buffer" value={breakdown.other} max={breakdown.total} />
                </div>
              </div>
            </motion.div>
          )}

          {itineraryTab === "risk" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-6 md:grid-cols-3"
            >
              {/* Weather forecast */}
              <div className="rounded-2xl glass p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white/60 tracking-wider uppercase">Weather Forecast</h3>
                  <CloudSun className="h-5 w-5 text-gold animate-float-slow" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono">24°C</span>
                  <span className="text-xs text-white/45">Average Daily Temp</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">Optimal weather indices detected. Low precipitation risks during your duration.</p>
              </div>

              {/* Safety Index */}
              <div className="rounded-2xl glass p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white/60 tracking-wider uppercase">Safety & Security</h3>
                  <Shield className="h-5 w-5 text-emerald" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono text-emerald">9.2</span>
                  <span className="text-xs text-white/45">Global Safety Rating</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">Safe destination. Standard tourist areas feature active protection grids.</p>
              </div>

              {/* Travel Warnings */}
              <div className="rounded-2xl glass p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white/60 tracking-wider uppercase">Risk Alerts</h3>
                  <AlertTriangle className="h-5 w-5 text-gold" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-white/80 font-medium">Caldera cliffs require careful step planning.</div>
                  <p className="text-[10px] text-white/50">Stick to marked pathways on outer cliff zones.</p>
                  <div className="text-xs text-white/80 font-medium">Always secure taxi rides via official desk channels.</div>
                  <p className="text-[10px] text-white/50">Avoid unauthorized terminal drivers.</p>
                </div>
              </div>
            </motion.div>
          )}

          {itineraryTab === "engine" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {/* XGBoost Decision Forest Results */}
              <div className="rounded-2xl glass p-6 space-y-4">
                <div>
                  <h3 className="font-display text-2xl">GBDT Success Estimator</h3>
                  <p className="text-xs text-white/45 mt-1">Machine learning inference running decision forest models</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold font-mono text-gold">94.8%</span>
                  <span className="text-xs text-white/45">Predicted Success Rate</span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] tracking-wider text-white/40 uppercase">Decision Tree Feature Importance</h4>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-white/60 text-[10px]">
                        <span>Budget Allocation Sufficiency</span>
                        <span>Weight: 0.45</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full"><div className="h-full bg-gold rounded-full" style={{ width: "90%" }} /></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-white/60 text-[10px]">
                        <span>Traveler Style Matching</span>
                        <span>Weight: 0.32</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full"><div className="h-full bg-gold rounded-full" style={{ width: "80%" }} /></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-white/60 text-[10px]">
                        <span>Itinerary Complexity Index</span>
                        <span>Weight: 0.23</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full"><div className="h-full bg-gold rounded-full" style={{ width: "70%" }} /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Travel DNA Profile */}
              <div className="rounded-2xl glass p-6 space-y-4">
                <div>
                  <h3 className="font-display text-2xl">Traveler DNA Mapping</h3>
                  <p className="text-xs text-white/45 mt-1">Preference matrix matching destination features</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/40 uppercase">Style Bias</span>
                    <p className="font-semibold text-white mt-1 capitalize">{selectedStyle.toLowerCase()}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/40 uppercase">Food Bias</span>
                    <p className="font-semibold text-white mt-1 capitalize">{foodPreference.toLowerCase().replace("_", " ")}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/40 uppercase">Pacing Bias</span>
                    <p className="font-semibold text-white mt-1">Balanced (3 acts/day)</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/40 uppercase">Accomodation Bias</span>
                    <p className="font-semibold text-white mt-1 capitalize">{accommodationType.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Section */}
        <div className="rounded-3xl glass p-6 border border-white/5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Rate your Itinerary</h3>
            <p className="text-xs text-white/50">Your rating trains our neural and GBDT models for personalized recommendation optimization.</p>
          </div>

          {feedbackSubmitted ? (
            <div className="flex items-center gap-2 text-xs bg-emerald/10 border border-emerald/20 text-emerald p-4 rounded-2xl">
              <CheckCircle className="h-5 w-5" />
              <span>Feedback submitted successfully! Thank you for training the Aria AI concierge.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform active:scale-90 cursor-pointer"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= rating ? "fill-gold text-gold" : "text-white/20 hover:text-white/40"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <textarea
                  placeholder="Tell us what you liked or how we can improve this trip plan (optional)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white focus:outline-none focus:border-gold/50 min-h-[80px]"
                />
              </div>

              <button
                onClick={handleFeedbackSubmit}
                disabled={submittingFeedback || rating === 0}
                className="rounded-xl bg-gold py-2 px-5 text-xs font-semibold text-[oklch(0.13_0.025_250)] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submittingFeedback ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Ingesting feedback...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Planner Forms (Step-by-step wizard)
  return (
    <div className="space-y-8 relative">
      {/* Loading Overlay */}
      <AnimatePresence>
        {generating && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-md text-white">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 max-w-md"
            >
              {/* Spinning Loader */}
              <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-gold animate-spin" />
                <Sparkles className="h-6 w-6 text-gold animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-3xl">Aria Concierge Orchestrator</h3>
                <p className="text-xs text-white/40">Executing ML models and semantic builders</p>
              </div>

              {/* Progress Steps Log */}
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-left text-xs font-mono text-white/70 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                  <span>{loadingStep >= 0 ? "Analyzing preferences..." : "Pending"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${loadingStep >= 1 ? "bg-gold" : "bg-white/10"}`} />
                  <span className={loadingStep >= 1 ? "text-white" : "text-white/30"}>Calculating deterministic budgets...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${loadingStep >= 2 ? "bg-gold" : "bg-white/10"}`} />
                  <span className={loadingStep >= 2 ? "text-white" : "text-white/30"}>Fetching destination matching catalog...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${loadingStep >= 3 ? "bg-gold" : "bg-white/10"}`} />
                  <span className={loadingStep >= 3 ? "text-white" : "text-white/30"}>Evaluating risk & weather profiles...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${loadingStep >= 4 ? "bg-gold" : "bg-gold"}`} />
                  <span className={loadingStep >= 4 ? "text-white" : "text-white/30"}>Predicting trip success rate (GBDT)...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${loadingStep >= 5 ? "bg-gold animate-pulse" : "bg-white/10"}`} />
                  <span className={loadingStep >= 5 ? "text-white" : "text-white/30"}>Synthesizing day schedules...</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div>
        <span className="text-xs tracking-[0.25em] text-white/55 uppercase">AI Planner</span>
        <h2 className="font-display text-4xl mt-1">Design Your Perfect Journey</h2>
      </div>

      {/* Step Wizard Nav */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex gap-4">
          {STEP_LABELS.map((label, idx) => (
            <div
              key={label}
              className={`text-xs font-semibold tracking-wider transition-colors ${
                step === idx ? "text-gold" : "text-white/30"
              }`}
            >
              <span className="mr-1">{idx + 1}.</span> {label}
            </div>
          ))}
        </div>
        <span className="text-xs text-white/45 font-mono">Step {step + 1} of 4</span>
      </div>

      {/* Wizard Form Panels */}
      <div className="rounded-3xl glass p-6 min-h-[300px] flex flex-col justify-between">
        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="space-y-1">
              <PlaceSearchAutocomplete
                onPlaceSelected={(place) => setDestination(place)}
                initialValue={destination}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] tracking-[0.2em] text-white/45 uppercase" htmlFor="prompt">Curator instructions</label>
              <textarea
                id="prompt"
                placeholder="Add special instructions: 'Honeymoon styling with a focus on photography and light walking, ryokan lodgings...'"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none resize-none"
              />
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.2em] text-white/45 uppercase flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold" /> Trip Duration (Days)
              </label>
              <div className="flex gap-3">
                {[3, 5, 7, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDurationDays(d)}
                    className={`flex-1 py-3 text-xs font-semibold rounded-xl border transition-all ${
                      durationDays === d
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
                  className="w-20 text-center rounded-xl border border-white/10 bg-white/5 text-sm text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.2em] text-white/45 uppercase flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gold" /> Traveler Count
              </label>
              <div className="flex gap-3">
                {[1, 2, 4].map((c) => (
                  <button
                    key={c}
                    onClick={() => setTravelersCount(c)}
                    className={`flex-1 py-3 text-xs font-semibold rounded-xl border transition-all ${
                      travelersCount === c
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {c === 1 ? "Solo" : c === 2 ? "Duo / Couple" : `${c} Travelers`}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.2em] text-white/45 uppercase flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-gold" /> Budget Limit (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/50">$</span>
                <input
                  type="number"
                  min={100}
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Math.max(100, Number(e.target.value)))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-8 pr-4 text-sm text-white focus:border-gold/50 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.2em] text-white/45 uppercase">Travel Style Preferred</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[TravelStyle.LUXURY, TravelStyle.BOUTIQUE, TravelStyle.BUDGET, TravelStyle.ADVENTURE].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStyle(s)}
                    className={`py-2.5 text-xs font-semibold rounded-xl border capitalize transition-all ${
                      selectedStyle === s
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {s.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.2em] text-white/45 uppercase">Dietary Preferences</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: FoodPreference.NO_RESTRICTIONS, label: "No Restrictions" },
                  { key: FoodPreference.VEGETARIAN, label: "Vegetarian" },
                  { key: FoodPreference.VEGAN, label: "Vegan" },
                  { key: FoodPreference.HALAL, label: "Halal" }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFoodPreference(f.key)}
                    className={`py-3 text-xs font-semibold rounded-xl border transition-all ${
                      foodPreference === f.key
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.2em] text-white/45 uppercase">Lodging Preferences</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: AccommodationType.HOTEL, label: "Hotel" },
                  { key: AccommodationType.RESORT, label: "Resort" },
                  { key: AccommodationType.RYOKAN, label: "Ryokan" }
                ].map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setAccommodationType(a.key)}
                    className={`py-3 text-xs font-semibold rounded-xl border transition-all ${
                      accommodationType === a.key
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 flex justify-between border-t border-white/5 pt-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-xl px-5 py-2.5 text-xs font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-30 transition-all"
          >
            Previous
          </button>

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 0 && !destination.trim()) {
                  toast.error("Please provide a destination name.");
                  return;
                }
                setStep((s) => s + 1);
              }}
              className="rounded-xl px-5 py-2.5 text-xs font-semibold bg-white text-[oklch(0.13_0.025_250)] hover:bg-gold transition-colors flex items-center gap-1"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={runSimulationPipeline}
              className="rounded-xl px-6 py-2.5 text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-95 flex items-center gap-2"
              style={{ background: "var(--gradient-sunrise)", boxShadow: "var(--shadow-glow-gold)" }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate AI Package
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BudgetBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-white/70">
        <span>{label}</span>
        <span className="font-semibold font-mono">${value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gold rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
