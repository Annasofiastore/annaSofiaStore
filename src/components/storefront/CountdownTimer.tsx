"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  expiresAt: string;
}

export function CountdownTimer({ expiresAt }: Props) {
  const [secs, setSecs] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (secs <= 0) return null;

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs < 120;

  return (
    <p
      className={`flex items-center gap-1 text-[10px] mt-1 font-[500] ${
        urgent ? "text-[#A0647E]" : "text-[#6E6680]"
      }`}
    >
      <Clock size={10} />
      Reservado {m}:{String(s).padStart(2, "0")}
    </p>
  );
}
