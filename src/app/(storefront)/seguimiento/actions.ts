"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// La consulta viaja por POST y se recuerda unos minutos en una cookie httpOnly,
// así el correo de la clienta no queda en la URL, el historial ni los logs.
const TRACKING_COOKIE = "seguimiento"; // la página lee la misma cookie
const MAX_AGE_SECONDS = 15 * 60;

async function remember(orden: string, email: string) {
  const store = await cookies();
  store.set(TRACKING_COOKIE, Buffer.from(JSON.stringify({ orden, email })).toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/seguimiento",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Formulario de "Consultar pedido". */
export async function lookupOrder(formData: FormData) {
  const orden = String(formData.get("orden") ?? "").trim().slice(0, 40);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  if (orden && email) await remember(orden, email);
  redirect("/seguimiento");
}

/** Botón "Seguir pedido" de la página de confirmación (el pedido y correo ya se conocen). */
export async function openTracking(orden: string, email: string) {
  await remember(orden, email);
  redirect("/seguimiento");
}
