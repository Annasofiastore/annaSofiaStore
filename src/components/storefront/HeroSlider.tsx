"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useStoreName } from "@/components/StoreNameProvider";

type Slide = { id: string; image_url: string; alt_text: string | null };

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const storeName = useStoreName();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) dx > 0 ? prev() : next();
        touchStartX.current = null;
      }}
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            key={i === current ? `on-${current}` : `off-${i}`}
            src={slide.image_url}
            alt={slide.alt_text ?? storeName}
            fill
            className={`object-cover object-center ${i === current ? "animate-ken-burns" : ""}`}
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Overlay: oscurece abajo a la izquierda, donde va el texto del banner */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to top, rgba(30,27,46,0.65) 0%, rgba(30,27,46,0.25) 45%, rgba(30,27,46,0) 75%)"
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to right, rgba(30,27,46,0.35) 0%, rgba(30,27,46,0) 60%)"
      }} />

      {/* Dots de navegación */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-10 flex items-center gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                i === current ? "bg-white w-8" : "bg-white/50 w-2.5 hover:bg-white/80"
              }`}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
