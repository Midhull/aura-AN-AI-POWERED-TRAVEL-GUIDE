import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Languages,
  Mic,
  Volume2,
  Copy,
  Camera,
  Play,
  RotateCw,
  Sparkles,
  Loader2,
  Check,
  ScanFace,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";

export const Route = createFileRoute("/more-features/translator")({
  head: () => ({
    meta: [
      { title: "AI Translator · Aria" },
      { name: "description", content: "Voice translators, camera image scans, and text conversion modules." }
    ]
  }),
  component: TranslatorPage,
});

const LANGUAGES = ["English", "Japanese", "Spanish", "French", "German", "Korean", "Mandarin", "Bahasa Indonesia"];

const DICTIONARY: Record<string, string> = {
  "hello": "こんにちは (Konnichiwa)",
  "where is the train station?": "駅はどこですか？ (Eki wa doko desu ka?)",
  "how much does this cost?": "これはいくらですか？ (Kore wa ikura desu ka?)",
  "water, please": "お水をください (Omizu o kudasai)",
  "thank you": "ありがとうございます (Arigatou gozaimasu)"
};

function TranslatorPage() {
  const [activeTab, setActiveTab] = useState<"text" | "voice" | "camera">("text");
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Japanese");
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [translating, setTranslating] = useState(false);
  const [listening, setListening] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraScanning, setCameraScanning] = useState(false);
  const [cameraOutput, setCameraOutput] = useState<string | null>(null);

  const handleTranslate = (textToTranslate: string) => {
    const query = textToTranslate.trim().toLowerCase();
    if (!query) return;

    setTranslating(true);
    setTimeout(() => {
      setTranslating(false);
      if (sourceLang === "English" && targetLang === "Japanese") {
        const found = DICTIONARY[query] || "申し訳ありませんが、翻訳が見つかりません。 (Unable to find matching translation)";
        setTranslatedText(found);
      } else {
        setTranslatedText(`[Simulated Translation into ${targetLang}]: ${inputText}`);
      }
      toast.success("Translation completed.");
    }, 1000);
  };

  const handleVoiceListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported in this browser. Simulating voice input...");
      setListening(true);
      setTimeout(() => {
        setListening(false);
        setInputText("Where is the train station?");
        handleTranslate("Where is the train station?");
      }, 2000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = sourceLang === "Japanese" ? "ja-JP" : sourceLang === "Spanish" ? "es-ES" : "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setListening(true);

      recognition.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setInputText(speechToText);
        handleTranslate(speechToText);
        toast.success("Voice input processed.");
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event);
        toast.error("Speech recognition failed or timed out.");
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setListening(false);
      toast.error("Failed to start voice capture.");
    }
  };

  const handleCameraScan = () => {
    setCameraScanning(true);
    setTimeout(() => {
      setCameraScanning(false);
      setCameraOutput("出口 (Exit) · Way Out");
      toast.success("Camera text scanned!");
    }, 2000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleSpeak = (text: string) => {
    toast.info(`Speaking text in ${targetLang}... (Audio output simulated)`);
  };

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(translatedText);
    setTranslatedText(inputText);
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
              <div className="text-[10px] tracking-wider text-teal-400 uppercase font-semibold">AI Utilities</div>
              <h1 className="font-display text-3xl">AI Translator</h1>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <button
            onClick={() => setActiveTab("text")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              activeTab === "text"
                ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Text Translator
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              activeTab === "voice"
                ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Voice Translator
          </button>
          <button
            onClick={() => setActiveTab("camera")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              activeTab === "camera"
                ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Camera Scanner
          </button>
        </div>

        {/* Language Selection Bar (Text & Voice tabs) */}
        {activeTab !== "camera" && (
          <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 text-xs">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-semibold"
            >
              {LANGUAGES.map(l => (
                <option key={l} value={l} className="bg-[oklch(0.08_0.02_250)] text-white">{l}</option>
              ))}
            </select>

            <button
              onClick={swapLanguages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/65 hover:text-white transition cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-semibold"
            >
              {LANGUAGES.map(l => (
                <option key={l} value={l} className="bg-[oklch(0.08_0.02_250)] text-white">{l}</option>
              ))}
            </select>
          </div>
        )}

        {/* Main Content Area based on Tab */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            
            {/* TEXT TRANSLATOR */}
            {activeTab === "text" && (
              <motion.div
                key="text-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Input Text Area */}
                <div className="rounded-2xl glass p-5 border border-white/5 flex flex-col justify-between h-64">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type words or phrases to translate... (e.g. hello, thank you, water, please)"
                    className="w-full h-40 bg-transparent text-sm resize-none focus:outline-none text-white placeholder:text-white/30"
                  />
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <span className="text-[9px] text-white/35 font-mono">English dictionary matches words</span>
                    <button
                      onClick={() => handleTranslate(inputText)}
                      disabled={translating || !inputText.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] bg-gold disabled:opacity-50 transition cursor-pointer"
                    >
                      {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Translate"}
                    </button>
                  </div>
                </div>

                {/* Output Text Area */}
                <div className="rounded-2xl glass p-5 border border-white/5 bg-white/5 flex flex-col justify-between h-64 relative">
                  <div>
                    <span className="text-[10px] text-white/30 font-mono uppercase">Translation Result</span>
                    <div className="text-base text-white font-semibold mt-4">
                      {translating ? (
                        <div className="flex items-center gap-2 text-gold text-xs">
                          <Loader2 className="h-4 w-4 animate-spin" /> Deciphering dialect...
                        </div>
                      ) : (
                        translatedText || <span className="text-white/20 font-light text-sm italic">Translation output will render here...</span>
                      )}
                    </div>
                  </div>

                  {translatedText && !translating && (
                    <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                      <button
                        onClick={() => handleSpeak(translatedText)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                        title="Speak Translation"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(translatedText)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                        title="Copy Translation"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* VOICE TRANSLATOR */}
            {activeTab === "voice" && (
              <motion.div
                key="voice-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="rounded-2xl glass p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-8 min-h-[300px]"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">Simulated Speech Translation</h3>
                  <p className="text-xs text-white/55 max-w-sm">Tap the microphone to speak in English and hear the translated audio feed.</p>
                </div>

                {/* Animated waves when listening */}
                <div className="flex items-center justify-center h-20">
                  <AnimatePresence mode="wait">
                    {listening ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 h-12"
                      >
                        {[0.8, 1.4, 0.6, 1.8, 1.1, 0.9, 1.5, 0.7].map((scale, i) => (
                          <motion.div
                            key={i}
                            animate={{ scaleY: [1, scale, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1.5 bg-gold rounded-full h-8 origin-center"
                          />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.button
                        onClick={handleVoiceListen}
                        className="h-16 w-16 rounded-full bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/50 flex items-center justify-center text-gold cursor-pointer transition-all"
                      >
                        <Mic className="h-7 w-7" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {inputText && (
                  <div className="w-full max-w-md p-4 bg-white/5 rounded-xl border border-white/5 text-left text-xs space-y-2">
                    <div>
                      <span className="text-[8px] text-white/40 block font-mono uppercase">Detected English</span>
                      <span className="font-semibold text-white">{inputText}</span>
                    </div>
                    {translatedText && (
                      <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] text-gold block font-mono uppercase">{targetLang} Translation</span>
                          <span className="font-bold text-gold">{translatedText}</span>
                        </div>
                        <button
                          onClick={() => handleSpeak(translatedText)}
                          className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition cursor-pointer"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* CAMERA TRANSLATOR */}
            {activeTab === "camera" && (
              <motion.div
                key="camera-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Camera Viewfinder */}
                <div className="lg:col-span-2 rounded-2xl glass p-4 border border-white/5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 font-mono">Live Sign Scan</h3>
                  
                  <div className="relative h-64 w-full rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                    
                    {/* Viewfinder background grid */}
                    <div className="absolute inset-0 opacity-15" style={{
                      backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                      backgroundSize: "20px 20px"
                    }} />

                    {/* Viewfinder crosshairs */}
                    <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-gold" />
                    <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-gold" />
                    <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-gold" />
                    <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-gold" />

                    {/* Simulated Sign Image */}
                    {cameraActive && (
                      <div className="text-center space-y-3 z-10">
                        {cameraOutput ? (
                          <>
                            <div className="text-white/60 text-[10px] tracking-widest font-mono uppercase">Captured Signage</div>
                            <div className="text-3xl font-bold bg-white/5 border border-white/10 px-8 py-3 rounded-lg text-white font-serif">
                              出口
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-white/40 text-[10px] tracking-widest font-mono uppercase">Camera Feed Active</div>
                            <div className="h-10 w-24 border border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/20 text-xs">
                              Empty View
                            </div>
                            <div className="text-[9px] text-white/35">Align target characters within the frame</div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Scan line animation */}
                    {cameraScanning && (
                      <motion.div
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-gold/50 shadow-glow-gold pointer-events-none"
                      />
                    )}

                    {cameraActive && (
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/60 p-2.5 rounded-lg border border-white/10 text-[9px] backdrop-blur-md">
                        <span className="flex items-center gap-1"><ScanFace className="h-3.5 w-3.5 text-gold" /> Scan aligned</span>
                        <button
                          onClick={handleCameraScan}
                          disabled={cameraScanning}
                          className="px-2.5 py-1 bg-gold text-[oklch(0.13_0.025_250)] font-bold rounded cursor-pointer disabled:opacity-50"
                        >
                          {cameraScanning ? "Scanning..." : "Capture Sign"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        setCameraActive(!cameraActive);
                        setCameraOutput(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white cursor-pointer"
                    >
                      {cameraActive ? "Turn Off Lens" : "Turn On Lens"}
                    </button>
                  </div>
                </div>

                {/* Translation Panel */}
                <div className="rounded-2xl glass p-5 border border-white/5 flex flex-col justify-between min-h-[250px]">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 font-mono">Sign Translate Result</h3>
                    <div className="mt-6 space-y-4">
                      {cameraScanning && (
                        <div className="text-xs text-gold flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Decoding characters...
                        </div>
                      )}
                      
                      {!cameraScanning && cameraOutput && (
                        <div className="space-y-3">
                          <div className="p-3 bg-gold/5 border border-gold/10 rounded-xl space-y-1">
                            <span className="text-[8px] text-gold block font-mono uppercase">Deciphered Text</span>
                            <span className="text-sm font-semibold text-white">{cameraOutput}</span>
                          </div>

                          <div className="text-[10px] text-white/50 leading-relaxed">
                            This is standard signage indicating the nearest evacuation way-out or station egress route.
                          </div>
                        </div>
                      )}

                      {!cameraScanning && !cameraOutput && (
                        <div className="text-xs text-white/35 italic">
                          Activate Lens, align sign inside viewfinder, and capture to decrypt.
                        </div>
                      )}
                    </div>
                  </div>

                  {cameraOutput && (
                    <button
                      onClick={() => handleCopy(cameraOutput)}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white cursor-pointer"
                    >
                      Copy Output
                    </button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </DashboardLayout>
  );
}
