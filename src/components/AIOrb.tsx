import { motion } from "framer-motion";

interface AIOrbProps {
  size?: number;
  className?: string;
}

export function AIOrb({ size = 120, className = "" }: AIOrbProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* outer rings */}
      {[0, 0.8, 1.6].map((delay) => (
        <span
          key={delay}
          className="absolute inset-0 rounded-full border border-gold/40"
          style={{
            animation: `orb-ring 3.2s ease-out ${delay}s infinite`,
          }}
        />
      ))}
      {/* glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-70"
        style={{ background: "var(--gradient-aurora)" }}
      />
      {/* core */}
      <motion.div
        className="absolute inset-[18%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, oklch(0.98 0.03 80) 0%, oklch(0.82 0.14 78) 40%, oklch(0.58 0.18 295) 100%)",
          boxShadow:
            "inset 0 0 30px oklch(1 0 0 / 0.6), 0 0 60px oklch(0.82 0.14 78 / 0.7)",
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* highlight */}
      <div
        className="absolute inset-[24%] rounded-full opacity-80 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 35% 28%, oklch(1 0 0 / 0.9), transparent 45%)",
        }}
      />
    </div>
  );
}
