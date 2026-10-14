"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Variant = "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight" | "scale";

const HIDDEN: Record<Variant, CSSProperties> = {
  fadeUp:    { opacity: 0, transform: "translateY(48px)" },
  fadeIn:    { opacity: 0 },
  fadeLeft:  { opacity: 0, transform: "translateX(-36px)" },
  fadeRight: { opacity: 0, transform: "translateX(36px)" },
  scale:     { opacity: 0, transform: "scale(0.94)" },
};

const VISIBLE: CSSProperties = { opacity: 1, transform: "none" };

interface Props {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export function ScrollReveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 700,
  className = "",
  threshold = 0.12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced, threshold]);

  const style: CSSProperties = reduced
    ? {}
    : {
        ...(visible ? VISIBLE : HIDDEN[variant]),
        transition: `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
