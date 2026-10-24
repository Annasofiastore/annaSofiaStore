"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  orderId: string;
  orderNumber: string;
}

export function VerifyPaymentButton({ orderId, orderNumber }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleVerify() {
    if (!confirm(`¿Verificar el pago de ${orderNumber} con Wompi? Si está aprobado, el pedido cambiará a "Pagado" y se enviará el email de confirmación a la clienta.`)) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify-payment`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ ok: data.ok, message: data.message });
        if (data.ok && data.status === "paid") {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        setResult({ ok: false, message: data.error ?? "Error al verificar" });
      }
    } catch {
      setResult({ ok: false, message: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-[#E8DED4]">
      <p className="text-[10px] tracking-[0.2em] uppercase text-[#766A63] font-[600] mb-3">
        Verificación manual de pago Wompi
      </p>
      <p className="text-xs text-[#766A63] mb-3">
        Si la clienta pagó pero el pedido no se confirmó, usa este botón para consultar Wompi directamente y actualizar el estado.
      </p>

      <button
        onClick={handleVerify}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1B2E] text-white text-xs rounded hover:bg-[#2D2C44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <ShieldCheck size={13} strokeWidth={1.5} />
        )}
        {loading ? "Consultando Wompi…" : "Verificar pago con Wompi"}
      </button>

      {result && (
        <div className={`flex items-start gap-2 mt-3 text-xs px-3 py-2.5 rounded border ${
          result.ok
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {result.ok ? <CheckCircle size={13} className="shrink-0 mt-0.5" /> : <AlertCircle size={13} className="shrink-0 mt-0.5" />}
          {result.message}
        </div>
      )}
    </div>
  );
}
