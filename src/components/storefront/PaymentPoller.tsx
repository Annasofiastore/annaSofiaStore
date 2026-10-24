"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RetryPaymentBanner } from "./RetryPaymentBanner";

interface Props {
  orderId: string;
  createdAt: string;
}

// Cuando el usuario llega a la confirmación justo después de pagar,
// el webhook de Wompi puede tardar unos segundos. Polleamos el estado
// cada 3 segundos durante máximo 90 segundos; en cuanto cambie a
// un estado final refrescamos la página. Si agota el tiempo, mostramos
// la opción de reintentar el pago.
export function PaymentPoller({ orderId, createdAt }: Props) {
  const router = useRouter();
  const attempts = useRef(0);
  const MAX_ATTEMPTS = 30; // 30 × 3s = 90 segundos
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      attempts.current += 1;

      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok) return;
        const { status } = await res.json();

        if (status === "payment_failed") {
          // Transacción rechazada — mostrar opción de reintento de inmediato
          // sin hacer router.refresh() que causaría un loop (orden sigue pending_payment)
          clearInterval(interval);
          setTimedOut(true);
          return;
        }

        if (
          status === "paid" ||
          status === "preparing" ||
          status === "shipped" ||
          status === "delivered" ||
          status === "cancelled"
        ) {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // silencioso — reintentará
      }

      if (attempts.current >= MAX_ATTEMPTS) {
        clearInterval(interval);
        setTimedOut(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, router]);

  if (timedOut) {
    return <RetryPaymentBanner orderId={orderId} createdAt={createdAt} />;
  }

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-[#766A63] mt-4 mb-6 animate-pulse">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A0526C] animate-bounce" />
      Verificando confirmación de pago…
    </div>
  );
}
