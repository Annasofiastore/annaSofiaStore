"use client";

import Image from "next/image";
import { useState } from "react";
import { monogramOf } from "@/lib/utils/format";
import { useStoreName } from "@/components/StoreNameProvider";

interface Props {
  /** Puede venir vacío: `images[0]` de un producto sin fotos es undefined. */
  src: string | undefined;
  alt: string;
  /** "md" para las tarjetas de inventario en celular, donde 40px se queda corto. */
  size?: "sm" | "md";
}

const BOX = { sm: "w-10 h-12", md: "w-16 h-20" };
const SIZES = { sm: "40px", md: "64px" };

export function ProductThumb({ src, alt, size = "sm" }: Props) {
  const monogram = monogramOf(useStoreName());
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`${BOX[size]} shrink-0 bg-[#F2DCD6]/20 flex items-center justify-center`}>
        <span
          className="text-[10px] text-[#766A63]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {monogram}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${BOX[size]} shrink-0 overflow-hidden bg-[#F2DCD6]/20`}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className="object-cover"
        sizes={SIZES[size]}
        onError={() => setError(true)}
      />
    </div>
  );
}
