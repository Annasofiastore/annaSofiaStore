"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { monogramOf } from "@/lib/utils/format";
import { useStoreName } from "@/components/StoreNameProvider";

interface Props {
  images: string[];
  name: string;
}

/**
 * Escritorio: fotos grandes apiladas (la columna de información queda fija al lado).
 * Celular: carrusel deslizable con puntos.
 */
export function ProductGallery({ images, name }: Props) {
  const storeName = useStoreName();
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-[#F5DDE5]/20 flex items-center justify-center">
        <span className="text-5xl text-[#766A63]" style={{ fontFamily: "var(--font-display)" }}>
          {monogramOf(storeName)}
        </span>
      </div>
    );
  }

  function onScroll() {
    const el = trackRef.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(i: number) {
    const el = trackRef.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <>
      {/* Celular y tablet: carrusel */}
      <div className="lg:hidden -mx-4 sm:-mx-6">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <div key={i} className="relative shrink-0 w-full aspect-[3/4] snap-center bg-[#F5DDE5]/10">
              <Image
                src={src}
                alt={`${name} — foto ${i + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={cn(
                  "h-[3px] rounded-full transition-all duration-300",
                  active === i ? "w-8 bg-[#221A33]" : "w-3 bg-[#DCCFC4]"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Escritorio: fotos apiladas */}
      <div className="hidden lg:flex flex-col gap-3">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-[3/4] overflow-hidden bg-[#F5DDE5]/10">
            <Image
              src={src}
              alt={`${name} — foto ${i + 1}`}
              fill
              className="object-cover"
              sizes="55vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </>
  );
}
