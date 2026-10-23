import Link from "next/link";
import { Plus } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, monogramOf } from "@/lib/utils/format";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { getStoreName } from "@/lib/config/store-name";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-[#F7F2EC] text-[#1F1B19]",
  draft: "bg-[#F2DCD6]/40 text-[#766A63]",
  archived: "bg-gray-100 text-gray-400",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  draft: "Borrador",
  archived: "Archivado",
};

export default async function AdminProductosPage() {
  const monogram = monogramOf(await getStoreName());
  const supabase = createServiceClient();
  const { data: products } = await supabase
    .from("products")
    .select(`*, variants:product_variants(id, stock, reserved)`)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-3xl text-[#1F1B19]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Productos
        </h1>
        <div className="flex gap-3">
          <Link
            href="/admin/productos/importar"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E8DED4] text-[#766A63] text-[11px] tracking-[0.2em] uppercase font-[500] hover:border-[#766A63] hover:text-[#1F1B19] transition-colors"
          >
            Carga masiva
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F1B19] text-[#F7F2EC] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#3A3431] transition-colors"
          >
            <Plus size={14} /> Nuevo producto
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#E8DED4] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8DED4]">
              {["", "Nombre", "Precio", "Stock total", "Estado", ""].map((h) => (
                <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase text-[#766A63] font-[600] px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((product) => {
              const totalStock = (product.variants ?? []).reduce(
                (s: number, v: any) => s + Math.max(0, v.stock - v.reserved),
                0
              );
              return (
                <tr key={product.id} className="border-b border-[#F7F2EC] hover:bg-[#F7F2EC]/50 transition-colors">
                  <td className="px-4 py-3 w-14">
                    {product.images?.[0] ? (
                      <ProductThumb src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="w-10 h-12 bg-[#F2DCD6]/20 flex items-center justify-center">
                        <span className="text-[10px] text-[#766A63]"
                          style={{ fontFamily: "var(--font-display)" }}>
                          {monogram}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-[500] text-[#1F1B19]">{product.name}</p>
                    <p className="text-xs text-[#766A63]">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[#1F1B19]">{formatCOP(product.base_price)}</td>
                  <td className="px-4 py-3">
                    <span className={totalStock === 0 ? "text-[#965C57] font-[500]" : "text-[#1F1B19]"}>
                      {totalStock === 0 ? "Agotado" : `${totalStock} uds`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-[600] tracking-wide uppercase ${STATUS_BADGE[product.status] ?? "bg-gray-100"}`}>
                      {STATUS_LABEL[product.status] ?? product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="text-xs text-[#965C57] hover:text-[#1F1B19] font-[500]"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!products?.length && (
          <div className="py-16 text-center text-[#766A63] text-sm">
            Aún no hay productos.{" "}
            <Link href="/admin/productos/nuevo" className="text-[#965C57] underline">
              Crea el primero
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
