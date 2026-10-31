import { createHash, timingSafeEqual } from "crypto";
import type { WompiWebhookEvent } from "@/types";

/**
 * Verifica la firma de un evento de Wompi.
 *
 * Wompi envía `signature.properties` con rutas RELATIVAS a `data`
 * (["transaction.id", "transaction.status", "transaction.amount_in_cents"]); los valores de esas
 * rutas, seguidos de `timestamp` y del secreto de eventos, se concatenan y se pasan por SHA-256.
 * Antes se buscaban desde la raíz del evento, no se encontraba nada y la firma nunca coincidía.
 * También se acepta una ruta que empiece por "data." (relativa a la raíz), por si Wompi la cambia.
 */
export function verifyWompiSignature(event: WompiWebhookEvent, secret: string): boolean {
  if (!secret) {
    console.error("[wompi_webhook] WOMPI_EVENTS_SECRET no está configurado");
    return false;
  }
  if (!event?.signature || !Array.isArray(event.signature.properties) || !event.signature.checksum) {
    console.error("[wompi_webhook] Evento sin bloque de firma");
    return false;
  }

  const { properties, checksum } = event.signature;

  const values = properties.map((prop) => {
    const parts = prop.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = parts[0] === "data" ? event : event.data;
    for (const part of parts) {
      value = value?.[part];
    }
    return value ?? "";
  });

  const expected = createHash("sha256")
    .update([...values, event.timestamp, secret].join(""))
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(checksum).toLowerCase());
  const valid = a.length === b.length && timingSafeEqual(a, b);

  if (!valid) {
    console.error("[wompi_webhook] Firma inválida", {
      properties,
      values,
      timestamp: event.timestamp,
      received: checksum,
    });
  }

  return valid;
}
