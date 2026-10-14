"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArchiveProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function archive() {
    setLoading(true);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    router.push("/admin/productos");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#6E6680]">¿Archivar este producto?</span>
        <button
          onClick={archive}
          disabled={loading}
          className="text-xs text-[#A0647E] hover:text-[#1E1B2E] font-[500]"
        >
          {loading ? "Archivando…" : "Sí, archivar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-[#D9C3CE] hover:text-[#6E6680]"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-[#D9C3CE] hover:text-[#A0647E] transition-colors"
    >
      Archivar producto
    </button>
  );
}
