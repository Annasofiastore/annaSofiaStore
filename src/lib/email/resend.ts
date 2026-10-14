import { Resend } from "resend";
import { brand } from "@/lib/config/brand";

// Lazy init — evita crash en build cuando RESEND_API_KEY no está disponible
let _resend: Resend | null = null;
export function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  return _resend;
}

/**
 * Remitente con el nombre actual de la tienda. La dirección sale de EMAIL_FROM
 * ("Nombre <correo>" o solo el correo); si no está, de brand.email.
 */
export function fromAddress(storeName: string): string {
  const env = process.env.EMAIL_FROM?.trim();
  const address = env ? (env.match(/<([^>]+)>/)?.[1] ?? env) : brand.email;
  return `${storeName.replace(/["<>]/g, "")} <${address}>`;
}
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").filter(Boolean);

// Wrapper que loguea errores de Resend — usar en vez de Promise.allSettled silencioso
export async function sendEmailsSafe(
  label: string,
  ...promises: Promise<unknown>[]
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error(`[email/${label}] RESEND_API_KEY no configurado — emails no enviados`);
    return;
  }
  const results = await Promise.allSettled(promises);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[email/${label}] Error enviando email #${i + 1}:`, r.reason);
    } else if (r.status === "fulfilled") {
      const val = r.value as any;
      if (val?.error) {
        console.error(`[email/${label}] Resend rechazó email #${i + 1}:`, val.error);
      }
    }
  });
}
