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
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: userText
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // Analyze text patterns for budget consultation
    const budgetMatch = userText.match(/\$?(\d+[\d,]*)/);
    const daysMatch = userText.match(/(\d+)\s*-?\s*day/i);
    const hasTravelKeyword = /trip|travel|visit|stay|vacation|holiday|tour|go\s+to|fly|spend|hotel|flight/i.test(userText) ||
                             /japan|bali|swiss|greece|santorini|alps|switzerland/i.test(userText);

    if (budgetMatch && daysMatch && hasTravelKeyword) {
      setIsStreaming(true);
      // Simulate thinking delay
      setTimeout(() => {
        // Parse numbers
        const budgetUSD = parseInt(budgetMatch[1].replace(/,/g, ""));
        const durationDays = parseInt(daysMatch[1]);
        
        // Convert USD budget to INR for travelConsultantAgent
        const budgetINR = budgetUSD * 83;

        let dest = "Japan";
        if (userText.toLowerCase().includes("bali")) dest = "Bali";
        else if (userText.toLowerCase().includes("swiss") || userText.toLowerCase().includes("alps")) dest = "Switzerland";
        else if (userText.toLowerCase().includes("greece") || userText.toLowerCase().includes("santorini")) dest = "Greece";

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
        setIsStreaming(false);
      }, 800);
    } else {
      // Fallback to conversational chat responder via streaming proxy
      setIsStreaming(true);

      const assistantMessageId = crypto.randomUUID();
      const ariaResponse: Message = {
        id: assistantMessageId,
        sender: "aria",
        text: "",
      };
      
      setMessages((prev) => [...prev, ariaResponse]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body returned from server");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.substring(6).trim();
              if (dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
                const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (textChunk) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, text: msg.text + textChunk }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error("Failed to parse stream chunk:", dataStr, e);
              }
            }
          }
        }

        // Process final leftover buffer line if any
        if (buffer.trim().startsWith("data: ")) {
          const dataStr = buffer.trim().substring(6).trim();
          try {
            const parsed = JSON.parse(dataStr);
            const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (textChunk) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, text: msg.text + textChunk }
                    : msg
                )
              );
            }
          } catch (e) {
            // Ignored
          }
        }
      } catch (error: any) {
        console.error("Streaming error:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  text: `Sorry, I encountered an error: ${error.message || "Please check your network connection and try again."}`
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
      }
    }
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
            <span className={`flex h-1.5 w-1.5 rounded-full ${isStreaming ? "bg-gold animate-bounce" : "bg-emerald animate-pulse"}`} />
          </h3>
          <p className="text-[10px] text-white/40">{isStreaming ? "Streaming response..." : "Inference Consultation Agent active"}</p>
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
                      ? "bg-white/5 border border-white/5 text-white/80 whitespace-pre-wrap"
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
          placeholder={isStreaming ? "Aria is responding..." : "Ask Aria about travel planning or budget audits..."}
          value={input}
          disabled={isStreaming}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-xs text-white placeholder:text-white/35 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="p-2.5 rounded-xl text-[oklch(0.13_0.025_250)] bg-gold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
