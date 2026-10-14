"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface Props {
  children: ReactNode[];
  className?: string;
  itemDelay?: number;
  duration?: number;
  threshold?: number;
}

export function StaggeredGrid({ children, className = "", itemDelay = 90, duration = 650, threshold = 0.08 }: Props) {
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

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => {
            const style: CSSProperties = reduced
              ? {}
              : {
                  opacity: visible ? 1 : 0,
                  transform: visible ? "none" : "translateY(40px)",
                  transition: `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${i * itemDelay}ms, transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${i * itemDelay}ms`,
                };
            return (
              <div key={i} style={style}>
                {child}
              </div>
            );
          })
        : children}
    </div>
  );
}
