import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Motivos permitidos. Debe coincidir con el CASE de adjust_variant_stock.
const REASONS = ["venta_whatsapp", "devolucion", "entrada", "conteo", "dano"] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  // Este endpoint escribe stock con service role, así que valida rol de admin
  // y no solo que exista sesión.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { variantId?: unknown; newStock?: unknown; reason?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const variantId = typeof body.variantId === "string" ? body.variantId : "";
  if (!UUID_RE.test(variantId)) {
    return NextResponse.json({ error: "Variante no válida" }, { status: 400 });
  }

  const newStock = Number(body.newStock);
  if (!Number.isInteger(newStock) || newStock < 0) {
    return NextResponse.json(
      { error: "La cantidad debe ser un número entero mayor o igual a 0" },
      { status: 400 }
    );
  }

  const reason = body.reason as (typeof REASONS)[number];
  if (!REASONS.includes(reason)) {
    return NextResponse.json({ error: "Motivo no válido" }, { status: 400 });
  }

  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 500) : null;

  const service = createServiceClient();
  const { data, error } = await service.rpc("adjust_variant_stock", {
    p_variant_id: variantId,
    p_new_stock: newStock,
    p_reason: reason,
    p_note: note,
    p_changed_by: user.id,
  });

  if (error) {
    // Las excepciones de la función traen mensajes pensados para la pantalla
    // (p. ej. "Hay 2 unidades reservadas en carritos...").
    console.error("adjust_variant_stock:", error);
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  return NextResponse.json(data);
}
