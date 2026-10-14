import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { variantId, sessionId } = await req.json();

    if (!variantId || !sessionId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createServiceClient();

    await supabase.rpc("release_reservations_by_session", {
      p_variant_id: variantId,
      p_session_id: sessionId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cart/release]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
