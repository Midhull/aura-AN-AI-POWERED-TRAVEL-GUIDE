import { useState } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import { authService } from "../../services/supabase/auth";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, User, Compass } from "lucide-react";
import { motion } from "framer-motion";

export function AuthPortal() {
  const { setGuestUser } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(email, password, fullName);
        toast.success("Verification email sent! Check your inbox or continue as guest.");
      } else {
        await authService.signInWithPassword(email, password);
        toast.success("Logged in successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Authentication failed. You can continue in guest mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (err: any) {
      toast.error(err.message || "OAuth redirection failed.");
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[oklch(0.08_0.02_250)] px-4 py-12 text-white">
      {/* Aurora visual glow backdrops */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full opacity-30 blur-3xl pointer-events-none"
           style={{ background: "var(--gradient-aurora)", filter: "blur(80px)" }} />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl pointer-events-none"
           style={{ background: "var(--gradient-sunrise)", filter: "blur(100px)" }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl glass p-8 shadow-luxe"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-glow-gold">
            <Compass className="h-6 w-6 text-gold animate-float-slow" />
          </div>
          <h2 className="mt-6 font-display text-4xl tracking-tight">
            Welcome to <em className="not-italic gradient-text-gold">Aria</em>
          </h2>
          <p className="mt-2 text-sm text-white/50">Your cinematic AI travel companion.</p>
        </div>

        {/* Tab switcher */}
        <div className="mt-8 flex rounded-xl bg-white/5 p-1 border border-white/5">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              !isSignUp ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              isSignUp ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] tracking-[0.2em] text-white/40 uppercase" htmlFor="fullName">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Amelia Earhart"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] tracking-[0.2em] text-white/40 uppercase" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                id="email"
                type="email"
                placeholder="explorer@aria.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] tracking-[0.2em] text-white/40 uppercase" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl py-3 text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-sunrise)", boxShadow: "var(--shadow-glow-gold)" }}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[oklch(0.13_0.025_250)] border-t-transparent" />
            ) : (
              isSignUp ? "Register Journey" : "Begin Exploration"
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-white/10" />
          <span className="relative bg-[oklch(0.08_0.02_250)] px-4 text-[10px] tracking-[0.25em] text-white/30 uppercase">Or Continue With</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs text-white/80 transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>
          <button
            onClick={() => {
              setGuestUser();
              toast.success("Exploration started in Demo/Guest mode!");
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 py-2.5 text-xs text-gold transition hover:bg-gold/15"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Guest Mode
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] text-white/30 leading-relaxed">
          By continuing, you agree to board our travel OS and acknowledge that your preferences align with personalized discovery models.
        </p>
      </motion.div>
    </div>
  );
}
