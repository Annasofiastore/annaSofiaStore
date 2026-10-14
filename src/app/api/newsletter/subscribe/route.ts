import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createServiceClient();

    // Upsert: si ya existe como guest, actualizar marketing_email; si no, crear
    const { data: existing } = await supabase
      .from("customers")
      .select("id, marketing_email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!existing) {
      await supabase.from("customers").insert({
        email: normalizedEmail,
        full_name: name || "Clienta",
        marketing_email: true,
        marketing_whatsapp: false,
        is_guest: true,
      });
    } else if (!existing.marketing_email) {
      await supabase
        .from("customers")
        .update({ marketing_email: true })
        .eq("id", existing.id);
    }

    // Enviar email con el código BIENVENIDA10
    await sendWelcomeEmail(normalizedEmail, name || "");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter/subscribe]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
