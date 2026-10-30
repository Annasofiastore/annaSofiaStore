import type { createServiceClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceClient>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Promotion = Record<string, any>;

export type PromotionCheck =
  | { valid: true; promotion: Promotion; discountAmount: number }
  | { valid: false; message: string };

/** Descuento en pesos enteros para un subtotal dado. Misma fórmula que usa el carrito. */
export function computeDiscount(
  promotion: { discount_type: string; discount_value: number },
  subtotal: number
): number {
  const raw =
    promotion.discount_type === "percentage"
      ? (subtotal * promotion.discount_value) / 100
      : Math.min(promotion.discount_value, subtotal);
  return Math.min(subtotal, Math.round(raw));
}

/**
 * Valida un cupón con las reglas de la tienda: existe, está activo y vigente, tiene usos
 * disponibles y la clienta no superó su límite. No registra el uso (eso ocurre al confirmarse el pago).
 */
export async function validatePromotion(
  db: Db,
  code: string,
  subtotal: number,
  email?: string | null
): Promise<PromotionCheck> {
  const now = new Date().toISOString();

  const { data: promo } = await db
    .from("promotions")
    .select("*")
    .eq("code", String(code).toUpperCase().trim())
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .single();

  if (!promo) return { valid: false, message: "Código inválido o expirado" };

  if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
    return { valid: false, message: "Este cupón ya no tiene usos disponibles" };
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
        return { valid: false, message: "Ya usaste este cupón anteriormente" };
      }
    }
  }

  return { valid: true, promotion: promo, discountAmount: computeDiscount(promo, subtotal) };
}
