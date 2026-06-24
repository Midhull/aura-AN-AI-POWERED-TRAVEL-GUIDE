import { useState, useRef, useEffect } from "react";
import { travelConsultantAgent } from "../../services/travelConsultantAgent";
import { TravelStyle } from "../../types/travel";
import { MessageSquare, Send, Sparkles, AlertCircle, HelpCircle, ArrowRight } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "aria";
  text: string;
  consultation?: {
    isRealistic: boolean;
    reasoning: string;
    decision: string;
    alternatives: Array<{ name: string; desc: string; cost: number }>;
    followUps: string[];
  };
}

export function AssistantSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "aria",
      text: "Hello! I am Aria, your personal travel concierge. I can help you research destinations, plan itineraries, or perform a feasibility audit on your budget. Try asking me something like: 'Is $3000 enough for a 7-day trip to Switzerland?'"
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: input
    };

    setMessages((prev) => [...prev, userMessage]);
    const userText = input.trim();
    setInput("");

    // Simulate thinking delay
    setTimeout(() => {
      // Analyze text patterns for budget consultation
      // E.g., "$3000 for 7 days in Switzerland", "budget of 2000 for 10 days in Japan"
      const budgetMatch = userText.match(/\$?(\d+[\d,]*)/);
      const daysMatch = userText.match(/(\d+)\s*-?\s*day/i);
      
      let dest = "Japan";
      if (userText.toLowerCase().includes("bali")) dest = "Bali";
      else if (userText.toLowerCase().includes("swiss") || userText.toLowerCase().includes("alps")) dest = "Switzerland";
      else if (userText.toLowerCase().includes("greece") || userText.toLowerCase().includes("santorini")) dest = "Greece";

      if (budgetMatch && daysMatch) {
        // Parse numbers
        const budgetUSD = parseInt(budgetMatch[1].replace(/,/g, ""));
        const durationDays = parseInt(daysMatch[1]);
        
        // Convert USD budget to INR for travelConsultantAgent
        const budgetINR = budgetUSD * 83;

        // Run feasibility engine
        const consultation = travelConsultantAgent.consult({
          destination: dest,
          durationDays,
          budgetAmount: budgetINR,
          travelStyle: userText.toLowerCase().includes("luxury") ? TravelStyle.LUXURY : TravelStyle.BOUTIQUE
        });

        // Convert alternatives prices back to USD
        const formattedAlternatives = consultation.alternatives.map((alt) => ({
          name: alt.optionName,
          desc: alt.description,
          cost: Math.round(alt.estimatedCost / 83)
        }));

        const ariaResponse: Message = {
          id: crypto.randomUUID(),
          sender: "aria",
          text: consultation.reasoning,
          consultation: {
            isRealistic: consultation.isRealistic,
            reasoning: consultation.reasoning,
            decision: consultation.decisionExplanation,
            alternatives: formattedAlternatives,
            followUps: consultation.followUpQuestions
          }
        };
        setMessages((prev) => [...prev, ariaResponse]);
      } else {
        // Fallback to conversational chat responder
        let responseText = "That sounds like a fascinating journey! To help you audit the feasibility of this trip, please specify your budget amount and the duration in days (for example: '$2500 for a 5-day stay').";
        
        if (userText.toLowerCase().includes("hello") || userText.toLowerCase().includes("hi")) {
          responseText = "Hello explorer! How can I assist you with your travel planning today?";
        } else if (userText.toLowerCase().includes("packing") || userText.toLowerCase().includes("pack")) {
          responseText = "For most destinations, I recommend a capsule wardrobe: layers for varying climates, comfortable walking shoes, universal power adapters, and copies of essential documents saved securely.";
        } else if (userText.toLowerCase().includes("weather") || userText.toLowerCase().includes("season")) {
          responseText = "Kyoto is beautiful in Spring (April) and Autumn (November). Bali's dry season runs from April to October. Swiss Alps skiing peak is January through March.";
        }

        const ariaResponse: Message = {
          id: crypto.randomUUID(),
          sender: "aria",
          text: responseText
        };
        setMessages((prev) => [...prev, ariaResponse]);
      }
    }, 1000);
  };

  return (
    <div className="rounded-3xl glass p-5 h-[80vh] flex flex-col justify-between border border-white/5 relative">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
          <MessageSquare className="h-4 w-4 text-gold" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-white font-mono flex items-center gap-1.5">
            Aria Concierge Assistant
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
          </h3>
          <p className="text-[10px] text-white/40">Inference Consultation Agent active</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-none">
        {messages.map((msg) => {
          const isAria = msg.sender === "aria";
          return (
            <div
              key={msg.id}
              className={`flex ${isAria ? "justify-start" : "justify-end"} items-start gap-3`}
            >
              {isAria && (
                <div className="h-7 w-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-[10px] font-bold text-gold shrink-0">
                  A
                </div>
              )}
              <div className="space-y-3 max-w-[85%]">
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isAria
                      ? "bg-white/5 border border-white/5 text-white/80"
                      : "bg-gold text-[oklch(0.13_0.025_250)] font-medium"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Consultation Details */}
                {msg.consultation && (
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-4 space-y-4 text-xs">
                    <div className="flex items-center gap-2">
                      {msg.consultation.isRealistic ? (
                        <span className="text-[9px] font-bold bg-emerald/20 text-emerald px-2 py-0.5 rounded border border-emerald/30">Feasible</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-red-400/20 text-red-400 px-2 py-0.5 rounded border border-red-400/30">High Variance Risk</span>
                      )}
                      <span className="text-[10px] text-white/40">Decision Explanation Report</span>
                    </div>

                    <p className="text-white/60 leading-relaxed text-[11px]">{msg.consultation.decision}</p>

                    <div className="space-y-2">
                      <div className="text-[10px] tracking-wider text-white/40 uppercase">Option Alternatives</div>
                      <div className="space-y-2">
                        {msg.consultation.alternatives.map((alt, i) => (
                          <div key={i} className="bg-white/5 border border-white/5 p-2.5 rounded-xl flex items-center justify-between gap-3 text-[11px]">
                            <div>
                              <div className="font-semibold text-white">{alt.name}</div>
                              <div className="text-[10px] text-white/50">{alt.desc}</div>
                            </div>
                            <span className="font-mono text-gold font-semibold shrink-0">${alt.cost.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {msg.consultation.followUps.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] tracking-wider text-white/40 uppercase">Aria Follow-ups</div>
                        <ul className="space-y-1 text-[11px] text-gold/80 pl-2">
                          {msg.consultation.followUps.map((q, i) => (
                            <li key={i} onClick={() => setInput(q)} className="hover:underline cursor-pointer flex items-center gap-1.5">
                              <ArrowRight className="h-3 w-3 shrink-0" /> {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input box */}
      <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
        <input
          placeholder="Ask Aria about travel planning or budget audits..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-xs text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="p-2.5 rounded-xl text-[oklch(0.13_0.025_250)] bg-gold hover:opacity-90 transition-all flex items-center justify-center shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
