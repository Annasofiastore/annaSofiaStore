import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Libera N unidades de una reserva existente (cuando cliente reduce cantidad en carrito)
export async function POST(req: NextRequest) {
  try {
    const { variantId, sessionId, quantity } = await req.json();

    if (!variantId || !sessionId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createServiceClient();

    await supabase.rpc("release_partial_reservation", {
      p_variant_id: variantId,
      p_session_id: sessionId,
      p_quantity: quantity,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cart/release-partial]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
