import type { createServiceClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceClient>;

// El navegador solo dice QUÉ variante y CUÁNTAS unidades. Precio, nombre y SKU salen de la base.
export interface RequestedItem {
  variantId: string;
  quantity: number;
}

export interface PricedItem {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  attributes: Record<string, string>;
  quantity: number;
  unitPrice: number;
}

export type PriceResult =
  | { ok: true; items: PricedItem[]; subtotal: number }
  | { ok: false; status: number; error: string };

const MAX_LINES = 50;
const MAX_QUANTITY_PER_LINE = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESERVATION_MINUTES = 10;

const fail = (status: number, error: string): PriceResult => ({ ok: false, status, error });

type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  price: number | null;
  attributes: Record<string, string> | null;
  product: { id: string; name: string; base_price: number; status: string } | { id: string; name: string; base_price: number; status: string }[] | null;
};

/**
 * Valida las líneas del carrito, las precia con los valores reales de la base y se asegura de que
 * haya stock reservado para esta sesión (re-reservando lo que falte si la reserva venció).
 */
export async function priceCart(db: Db, requested: unknown, sessionId: string): Promise<PriceResult> {
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
    return fail(400, "Sesión de compra inválida.");
  }
  if (!Array.isArray(requested) || requested.length === 0 || requested.length > MAX_LINES) {
    return fail(400, "Carrito vacío o inválido.");
  }

  // Unir líneas repetidas de la misma variante y validar cantidades
  const quantities = new Map<string, number>();
  for (const line of requested) {
    const variantId = line?.variantId;
    const quantity = line?.quantity;
    if (typeof variantId !== "string" || !UUID_PATTERN.test(variantId)) {
      return fail(400, "Hay un producto inválido en tu carrito.");
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return fail(400, "La cantidad de un producto no es válida.");
    }
    quantities.set(variantId, (quantities.get(variantId) ?? 0) + quantity);
  }
  for (const quantity of quantities.values()) {
    if (quantity > MAX_QUANTITY_PER_LINE) {
      return fail(400, `Máximo ${MAX_QUANTITY_PER_LINE} unidades por producto.`);
    }
  }

  const variantIds = [...quantities.keys()];
  const { data, error } = await db
    .from("product_variants")
    .select("id, product_id, sku, price, attributes, product:products(id, name, base_price, status)")
    .in("id", variantIds);

  if (error) return fail(500, "No se pudo verificar tu carrito. Intenta de nuevo.");
  const variants = (data ?? []) as unknown as VariantRow[];
  if (variants.length !== variantIds.length) {
    return fail(409, "Un producto de tu carrito ya no existe. Revisa tu carrito.");
  }

  // Reservas vigentes de esta sesión por variante
  const { data: reservations } = await db
    .from("stock_reservations")
    .select("variant_id, quantity")
    .eq("session_id", sessionId)
    .eq("converted", false)
    .gt("expires_at", new Date().toISOString())
    .in("variant_id", variantIds);

  const reserved = new Map<string, number>();
  for (const r of reservations ?? []) {
    reserved.set(r.variant_id, (reserved.get(r.variant_id) ?? 0) + r.quantity);
  }

  const items: PricedItem[] = [];
  for (const variant of variants) {
    const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
    if (!product || product.status !== "active") {
      return fail(409, `${product?.name ?? "Un producto"} ya no está disponible. Revisa tu carrito.`);
    }

    const quantity = quantities.get(variant.id)!;

    // Si la reserva venció o no alcanza, se intenta reservar lo que falta; si no hay stock, se rechaza
    const missing = quantity - (reserved.get(variant.id) ?? 0);
    if (missing > 0) {
      const { data: ok } = await db.rpc("reserve_stock", {
        p_variant_id: variant.id,
        p_session_id: sessionId,
        p_quantity: missing,
        p_minutes: RESERVATION_MINUTES,
      });
      if (!ok) return fail(409, `No hay stock suficiente de ${product.name}. Revisa tu carrito.`);
    }

    const unitPrice = Number(variant.price ?? product.base_price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return fail(500, "No se pudo calcular el precio de tu pedido. Contáctanos.");
    }

    items.push({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      sku: variant.sku,
      attributes: variant.attributes ?? {},
      quantity,
      unitPrice,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return { ok: true, items, subtotal };
}
