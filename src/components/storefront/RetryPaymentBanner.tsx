"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  orderId: string;
  createdAt: string;
}

const RETRY_WINDOW_MS = 25 * 60 * 1000; // debe coincidir con el endpoint

export function RetryPaymentBanner({ orderId, createdAt }: Props) {
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpired = Date.now() - new Date(createdAt).getTime() > RETRY_WINDOW_MS;

  if (isExpired) {
    return (
      <div className="border border-[#E8DED4] bg-[#F7F2EC]/40 px-5 py-5 mb-6 text-center">
        <p className="text-sm text-[#766A63] mb-3">
          El tiempo para completar el pago expiró. Este pedido será cancelado automáticamente.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-[#1F1B19] text-[#F7F2EC] text-[11px] tracking-[0.15em] uppercase font-[500] hover:bg-[#3A3431] transition-colors rounded-full"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  async function handleRetry() {
    setRetrying(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/retry-payment`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo retomar el pago. Intenta de nuevo.");
        setRetrying(false);
        return;
      }

      const { wompi } = data;

      // Enviar al checkout de Wompi con los nuevos parámetros
      const form = document.createElement("form");
      form.method = "GET";
      form.action = "https://checkout.wompi.co/p/";

      const fields: Record<string, string> = {
        "public-key": wompi.publicKey,
        currency: wompi.currency,
        "amount-in-cents": String(wompi.amountInCents),
        reference: wompi.reference,
        "redirect-url": wompi.redirectUrl,
        "signature:integrity": wompi.integritySignature,
      };

      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setRetrying(false);
    }
  }

  return (
    <div className="border border-amber-200 bg-amber-50 px-5 py-5 mb-6 text-center">
      <p className="text-sm text-[#1F1B19] font-[500] mb-1">Pago pendiente</p>
      <p className="text-xs text-[#766A63] mb-4">
        Tu pedido está reservado. Tienes unos minutos para completar el pago.
      </p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="px-6 py-2.5 bg-[#1F1B19] text-[#F7F2EC] text-[11px] tracking-[0.15em] uppercase font-[500] hover:bg-[#3A3431] transition-colors disabled:opacity-50 rounded-full"
      >
        {retrying ? "Preparando pago…" : "Completar pago"}
      </button>
    </div>
  );
}
