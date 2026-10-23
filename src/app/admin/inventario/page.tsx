import { createServiceClient } from "@/lib/supabase/server";
import { InventoryList, type InventoryRow } from "@/components/admin/InventoryList";

// Tope defensivo: el filtrado y la búsqueda son instantáneos en el cliente, así
// que se carga el catálogo entero de una vez. El orden por menor stock garantiza
// que, si algún día se supera el tope, lo que se recorta es lo que sobra.
const LIMIT = 1000;

interface VariantRow {
  id: string;
  sku: string;
  price: number | null;
  stock: number;
  reserved: number;
  attributes: Record<string, string> | null;
  product: { id: string; name: string; images: string[] | null; base_price: number } | null;
}

export default async function AdminInventarioPage() {
  const supabase = createServiceClient();

  const [{ data: variants }, { data: costs }] = await Promise.all([
    supabase
      .from("product_variants")
      .select(`
        id, sku, price, stock, reserved, attributes,
        product:products(id, name, images, base_price)
      `)
      .order("stock", { ascending: true })
      .limit(LIMIT),
    supabase.from("product_costs").select("product_id, cost"),
  ]);

  const costByProduct = new Map((costs ?? []).map((c) => [c.product_id, Number(c.cost)]));

  const rows: InventoryRow[] = ((variants ?? []) as unknown as VariantRow[]).map((v) => ({
    id: v.id,
    sku: v.sku,
    stock: v.stock,
    reserved: v.reserved,
    attributes: v.attributes,
    productId: v.product?.id ?? null,
    // El precio de la variante, si existe, reemplaza al precio base del producto
    price: Number(v.price ?? v.product?.base_price ?? 0),
    cost: v.product ? costByProduct.get(v.product.id) ?? null : null,
    productName: v.product?.name ?? "—",
    image: v.product?.images?.[0],
  }));

  return (
    <div>
      <h1
        className="text-2xl md:text-3xl text-[#1F1B19] mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Inventario
      </h1>

      <InventoryList rows={rows} truncated={rows.length === LIMIT} />
    </div>
  );
}
