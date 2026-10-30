import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validatePromotion } from "@/lib/checkout/promotions";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal, email } = await req.json();

    if (!code || typeof subtotal !== "number") {
      return NextResponse.json({ valid: false, message: "Datos inválidos" }, { status: 400 });
    }

    const check = await validatePromotion(createServiceClient(), code, subtotal, email);
    if (!check.valid) {
      return NextResponse.json({ valid: false, message: check.message });
    }

    const { promotion: promo, discountAmount } = check;
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
