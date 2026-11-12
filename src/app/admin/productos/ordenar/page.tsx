import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductOrderManager } from "@/components/admin/ProductOrderManager";

export const dynamic = "force-dynamic";

export default async function OrdenarProductosPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, images")
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(500);

  const items = (data ?? []).map((p) => ({ id: p.id, name: p.name, image: p.images?.[0] ?? null }));

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-xs text-[#766A63] hover:text-[#221A33] mb-4"
      >
        <ArrowLeft size={13} /> Productos
      </Link>
      <h1 className="text-3xl text-[#221A33] mb-1" style={{ fontFamily: "var(--font-display)" }}>
        Ordenar catálogo
      </h1>
      <p className="text-sm text-[#766A63] mb-4">
        Arrastra los productos (o usa las flechas) para decidir en qué orden se muestran. Solo aparecen los productos
        activos. Las clientas que elijan ordenar por precio seguirán viendo ese orden.
      </p>
      {items.length ? (
        <ProductOrderManager initial={items} />
      ) : (
        <p className="py-16 text-center text-sm text-[#766A63]">No hay productos activos para ordenar.</p>
      )}
    </div>
  );
}
