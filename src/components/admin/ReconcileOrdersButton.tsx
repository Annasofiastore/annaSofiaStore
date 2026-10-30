"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";

const LAST_RUN_KEY = "reconcile-orders-last-run";
const AUTO_INTERVAL_MS = 5 * 60 * 1000;

type Summary = {
  checked: number;
  recovered: string[];
  pending: string[];
  unpaid: number;
  unknown: number;
};

function describe(s: Summary): { text: string; tone: "ok" | "warn" | "neutral" } {
  const parts: string[] = [];
  if (s.recovered.length) {
    parts.push(
      `${s.recovered.length} ${s.recovered.length === 1 ? "pedido actualizado" : "pedidos actualizados"} a Pagado (${s.recovered.join(", ")})`
    );
  }
  if (s.pending.length) {
    parts.push(`${s.pending.length} en proceso en Wompi (${s.pending.join(", ")})`);
  }
  if (s.unknown) {
    parts.push(`${s.unknown} no se pudo consultar en Wompi`);
  }
  if (!parts.length) {
    return { text: s.checked ? "Pagos al día" : "Sin pedidos pendientes por revisar", tone: "neutral" };
  }
  return { text: parts.join(" · "), tone: s.unknown || s.pending.length ? "warn" : "ok" };
}

export function ReconcileOrdersButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "warn" | "neutral" } | null>(null);

  async function run(auto: boolean) {
    setLoading(true);
    if (!auto) setMessage(null);
    try {
      localStorage.setItem(LAST_RUN_KEY, String(Date.now()));
    } catch {
      // sin localStorage: se revisará en cada entrada, no pasa nada
    }

    try {
      const res = await fetch("/api/admin/orders/reconcile", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (!auto) setMessage({ text: data.error ?? "No se pudo verificar los pagos", tone: "warn" });
        return;
      }
      const summary = describe(data as Summary);
      // En la revisión automática solo se avisa si hay algo que contar
      if (!auto || summary.tone !== "neutral") setMessage(summary);
      if ((data as Summary).recovered.length) router.refresh();
    } catch {
      if (!auto) setMessage({ text: "Error de conexión", tone: "warn" });
    } finally {
      setLoading(false);
    }
  }

  // Al entrar: revisar en segundo plano si pasaron más de 5 minutos desde la última vez
  useEffect(() => {
    let last = 0;
    try {
      last = Number(localStorage.getItem(LAST_RUN_KEY) ?? 0);
    } catch {
      // ignorar
    }
    if (Date.now() - last < AUTO_INTERVAL_MS) return;

    const id = setTimeout(() => run(true), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => run(false)}
        disabled={loading}
        title="Consulta a Wompi los pedidos pendientes o cancelados de las últimas 48 horas"
        className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#221A33] text-[#221A33] text-[11px] tracking-[0.15em] uppercase font-[500] hover:bg-[#221A33] hover:text-[#F7F2EC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} strokeWidth={1.5} />}
        {loading ? "Verificando pagos…" : "Verificar pagos"}
      </button>
      {message && (
        <span
          className={`text-xs ${
            message.tone === "ok" ? "text-green-700" : message.tone === "warn" ? "text-[#A0526C]" : "text-[#766A63]"
          }`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
