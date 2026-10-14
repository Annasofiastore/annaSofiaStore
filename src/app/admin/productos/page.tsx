import Link from "next/link";
import { Plus } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, monogramOf } from "@/lib/utils/format";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { getStoreName } from "@/lib/config/store-name";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-[#FAF6F7] text-[#1E1B2E]",
  draft: "bg-[#F2D4DC]/40 text-[#6E6680]",
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
          className="text-3xl text-[#1E1B2E]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Productos
        </h1>
        <div className="flex gap-3">
          <Link
            href="/admin/productos/importar"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E9DDE3] text-[#6E6680] text-[11px] tracking-[0.2em] uppercase font-[500] hover:border-[#6E6680] hover:text-[#1E1B2E] transition-colors"
          >
            Carga masiva
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E1B2E] text-[#FAF6F7] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#34304A] transition-colors"
          >
            <Plus size={14} /> Nuevo producto
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#E9DDE3] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E9DDE3]">
              {["", "Nombre", "Precio", "Stock total", "Estado", ""].map((h) => (
                <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase text-[#6E6680] font-[600] px-4 py-3">
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
                <tr key={product.id} className="border-b border-[#FAF6F7] hover:bg-[#FAF6F7]/50 transition-colors">
                  <td className="px-4 py-3 w-14">
                    {product.images?.[0] ? (
                      <ProductThumb src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="w-10 h-12 bg-[#F2D4DC]/20 flex items-center justify-center">
                        <span className="text-[10px] text-[#6E6680]"
                          style={{ fontFamily: "var(--font-display)" }}>
                          {monogram}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-[500] text-[#1E1B2E]">{product.name}</p>
                    <p className="text-xs text-[#6E6680]">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[#1E1B2E]">{formatCOP(product.base_price)}</td>
                  <td className="px-4 py-3">
                    <span className={totalStock === 0 ? "text-[#A0647E] font-[500]" : "text-[#1E1B2E]"}>
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
                      className="text-xs text-[#A0647E] hover:text-[#1E1B2E] font-[500]"
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
          <div className="py-16 text-center text-[#6E6680] text-sm">
            Aún no hay productos.{" "}
            <Link href="/admin/productos/nuevo" className="text-[#A0647E] underline">
              Crea el primero
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
