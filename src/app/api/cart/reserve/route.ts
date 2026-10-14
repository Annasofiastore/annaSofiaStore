import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { variantId, quantity, sessionId } = await req.json();

    if (!variantId || !quantity || !sessionId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Llamar función de reserva atómica — RB-CHK-03
    const { data, error } = await supabase.rpc("reserve_stock", {
      p_variant_id: variantId,
      p_session_id: sessionId,
      p_quantity: quantity,
      p_minutes: 10,
    });

    if (error || !data) {
      return NextResponse.json(
        { error: "Sin stock disponible" },
        { status: 409 }
      );
    }

    const reservedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    return NextResponse.json({ success: true, reservedUntil });
  } catch (err) {
    console.error("[reserve_stock]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
