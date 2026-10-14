import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal, email } = await req.json();

    if (!code || typeof subtotal !== "number") {
      return NextResponse.json({ valid: false, message: "Datos inválidos" }, { status: 400 });
    }

    const db = createServiceClient();
    const now = new Date().toISOString();

    const { data: promo } = await db
      .from("promotions")
      .select("*")
      .eq("code", String(code).toUpperCase().trim())
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .single();

    if (!promo) {
      return NextResponse.json({ valid: false, message: "Código inválido o expirado" });
    }

    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return NextResponse.json({ valid: false, message: "Este cupón ya no tiene usos disponibles" });
    }

    if (email && promo.max_uses_per_customer) {
      const { data: customer } = await db
        .from("customers")
        .select("id")
        .eq("email", String(email).toLowerCase().trim())
        .maybeSingle();

      if (customer) {
        const { count } = await db
          .from("promotion_uses")
          .select("id", { count: "exact", head: true })
          .eq("promotion_id", promo.id)
          .eq("customer_id", customer.id);

        if ((count ?? 0) >= promo.max_uses_per_customer) {
          return NextResponse.json({ valid: false, message: "Ya usaste este cupón anteriormente" });
        }
      }
    }

    const discountAmount =
      promo.discount_type === "percentage"
        ? (subtotal * promo.discount_value) / 100
        : Math.min(promo.discount_value, subtotal);

    return NextResponse.json({
      valid: true,
      promotionId: promo.id,
      name: promo.name,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      discountAmount,
      promotion: promo,
    });
  } catch (err) {
    console.error("[coupon]", err);
    return NextResponse.json({ valid: false, message: "Error interno" }, { status: 500 });
  }
}
