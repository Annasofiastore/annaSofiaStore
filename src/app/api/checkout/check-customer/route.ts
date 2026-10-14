import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/checkout/check-customer?email=xxx  o  ?id_number=xxx
// Devuelve { registered: true } si existe un usuario registrado con esos datos.
// Solo detecta cuentas con auth_user_id (no guests).
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const email = searchParams.get("email")?.toLowerCase().trim();
  const idNumber = searchParams.get("id_number")?.trim();

  if (!email && !idNumber) {
    return NextResponse.json({ registered: false });
  }

  const db = createServiceClient();

  if (email) {
    const { data } = await db
      .from("customers")
      .select("id")
      .eq("email", email)
      .not("auth_user_id", "is", null)
      .maybeSingle();

    return NextResponse.json({ registered: Boolean(data) });
  }

  if (idNumber) {
    const { data } = await db
      .from("customers")
      .select("id")
      .eq("id_number", idNumber)
      .not("auth_user_id", "is", null)
      .maybeSingle();

    return NextResponse.json({ registered: Boolean(data) });
  }

  return NextResponse.json({ registered: false });
}
