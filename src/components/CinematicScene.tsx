import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface CinematicSceneProps {
  image: string;
  imageAlt: string;
  eyebrow?: string;
  headline: ReactNode;
  sub?: ReactNode;
  align?: "left" | "center" | "right";
  tint?: string;
  children?: ReactNode;
  priority?: boolean;
}

export function CinematicScene({
  image,
  imageAlt,
  eyebrow,
  headline,
  sub,
  align = "center",
  tint = "linear-gradient(180deg, oklch(0.13 0.025 250 / 0.15) 0%, oklch(0.13 0.025 250 / 0.65) 100%)",
  children,
  priority,
}: CinematicSceneProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Parallax + cinematic camera feel
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 0.5, 1], ["40px", "0px", "-40px"]);
  const textOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6, 0.9],
    [0, 1, 1, 0],
  );

  const alignClasses =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  return (
    <section
      ref={ref}
      className="relative h-screen w-full overflow-hidden"
    >
      <motion.div
        style={{ y, scale }}
        className="absolute inset-0 will-change-transform"
      >
        <img
          src={image}
          alt={imageAlt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="h-full w-full object-cover"
        />
      </motion.div>
      <div className="absolute inset-0" style={{ background: tint }} />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className={`relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center gap-6 px-6 md:px-10 ${alignClasses}`}
      >
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs tracking-[0.25em] text-white/85 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-balance text-[clamp(2.5rem,7vw,6.5rem)] leading-[1.02] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
          {headline}
        </h2>
        {sub && (
          <p className="max-w-2xl text-balance text-base text-white/85 md:text-lg">
            {sub}
          </p>
        )}
        {children}
      </motion.div>
    </section>
  );
}

export type { MotionValue };
