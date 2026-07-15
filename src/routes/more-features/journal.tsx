import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  MapPin,
  Camera,
  Plus,
  Sparkles,
  Heart,
  Trash2,
  Share2,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";

export const Route = createFileRoute("/more-features/journal")({
  head: () => ({
    meta: [
      { title: "AI Trip Journal · Aria" },
      { name: "description", content: "Record trip reflections, timeline memories, and AI diary prompts." }
    ]
  }),
  component: JournalPage,
});

interface JournalEntry {
  id: string;
  date: string;
  location: string;
  title: string;
  content: string;
  promptText?: string;
  image?: string;
  starred: boolean;
}

const REFLECTION_PROMPTS = [
  "What is the most surprising taste experience you had today?",
  "Describe the sounds of the local market or streets at sunset.",
  "Which local person did you interact with today, and what was their story?",
  "What was the most challenging part of navigating today, and how did you resolve it?",
  "Describe a colour or texture that caught your attention today."
];

function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const raw = localStorage.getItem("aria_journal_entries");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("aria_journal_entries", JSON.stringify(entries));
  }, [entries]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("Kyoto, Japan");
  const [activePrompt, setActivePrompt] = useState(REFLECTION_PROMPTS[0]);
  const [customImage, setCustomImage] = useState<string | undefined>(undefined);
  const [writeOpen, setWriteOpen] = useState(false);

  const handleGeneratePrompt = () => {
    setActivePrompt(prev => {
      const currentIndex = REFLECTION_PROMPTS.indexOf(prev);
      const nextIndex = (currentIndex + 1) % REFLECTION_PROMPTS.length;
      return REFLECTION_PROMPTS[nextIndex];
    });
    toast.success("New reflection prompt loaded!");
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both a title and journal entry text.");
      return;
    }

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      location: location.trim() || "Unknown Location",
      title: title.trim(),
      content: content.trim(),
      promptText: activePrompt,
      image: customImage,
      starred: false
    };

    setEntries([newEntry, ...entries]);
    setTitle("");
    setContent("");
    setCustomImage(undefined);
    setWriteOpen(false);
    toast.success("Journal memory logged and synced!");
  };

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.info("Journal entry removed.");
  };

  const toggleStar = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  };

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
              <div className="text-[10px] tracking-wider text-rose-400 uppercase font-semibold">Memory Log</div>
              <h1 className="font-display text-3xl">AI Trip Journal</h1>
            </div>
          </div>
        </div>

        {/* AI Reflection Prompt Panel */}
        <div className="rounded-2xl glass p-5 border border-white/5 bg-gradient-to-r from-rose-500/5 to-gold/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] text-gold font-semibold uppercase tracking-wider font-mono">
              <Sparkles className="h-3.5 w-3.5" /> AI Reflection Prompt
            </span>
            <p className="text-xs font-medium text-white italic">"{activePrompt}"</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGeneratePrompt}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-semibold transition cursor-pointer text-white/80"
            >
              Suggest Another
            </button>
            <button
              onClick={() => {
                setWriteOpen(true);
                setContent(`Prompt Reflection: \n`);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gold text-[oklch(0.13_0.025_250)] text-[10px] font-bold transition cursor-pointer"
            >
              Write Reflection
            </button>
          </div>
        </div>

        {/* Configurations grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Write Memory Form */}
          <div className={`lg:col-span-1 rounded-2xl glass p-6 border border-white/5 space-y-4 h-fit transition ${writeOpen ? "ring-1 ring-gold/45" : ""}`}>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold" />
              Write New Memory
            </h3>

            <form onSubmit={handleAddEntry} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="jTitle">Title</label>
                <input
                  id="jTitle"
                  type="text"
                  required
                  placeholder="e.g. Sunrise temple stroll"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white placeholder:text-white/40 focus:border-gold/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="jLoc">Location</label>
                <input
                  id="jLoc"
                  type="text"
                  placeholder="e.g. Kyoto, Japan"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="jText">Memory Notes</label>
                <textarea
                  id="jText"
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Draft your daily thoughts here..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white placeholder:text-white/40 focus:border-gold/50 focus:outline-none resize-none"
                />
              </div>

              {/* Attach mock photo */}
              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono">Attach Photo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomImage("https://images.unsplash.com/photo-1542931287-023b922fa89b?q=80&w=600&auto=format&fit=crop");
                      toast.success("Photo attached successfully!");
                    }}
                    className={`flex-1 py-2 px-3 border border-dashed rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition ${
                      customImage ? "border-gold bg-gold/5 text-gold" : "border-white/15 hover:border-white/25 text-white/55"
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" /> {customImage ? "Photo Attached" : "Select Photo"}
                  </button>
                  {customImage && (
                    <button
                      type="button"
                      onClick={() => setCustomImage(undefined)}
                      className="px-2 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/10 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] bg-gold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Publish Memory
              </button>
            </form>
          </div>

          {/* Timeline memories */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold">Memory Timeline</h3>
            
            <div className="relative border-l border-white/10 pl-6 space-y-6 ml-3 py-2">
              <AnimatePresence mode="popLayout">
                {entries.map((entry, idx) => (
                  <motion.div
                    layout
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="relative"
                  >
                    {/* Timeline Node dot */}
                    <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-gold border-2 border-[oklch(0.08_0.02_250)]" />

                    <div className="rounded-2xl glass p-5 border border-white/5 hover:border-white/10 transition space-y-3.5">
                      
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {entry.date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {entry.location}</span>
                          </div>
                          <h4 className="text-sm font-semibold mt-1 text-white">{entry.title}</h4>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleStar(entry.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/5 ${
                              entry.starred ? "text-gold" : "text-white/30"
                            }`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${entry.starred ? "fill-gold text-gold" : ""}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {entry.image && (
                        <div className="h-40 w-full overflow-hidden rounded-xl">
                          <img
                            src={entry.image}
                            alt={entry.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      <p className="text-xs text-white/60 leading-relaxed font-light">
                        {entry.content}
                      </p>

                      {entry.promptText && (
                        <div className="text-[9px] text-gold/80 italic bg-gold/5 p-2 rounded-lg border border-gold/10">
                          AI Prompt: "{entry.promptText}"
                        </div>
                      )}

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {entries.length === 0 && (
              <div className="text-center py-16 text-[10px] text-white/40 italic">
                Your journal is empty. Log your first memory!
              </div>
            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
