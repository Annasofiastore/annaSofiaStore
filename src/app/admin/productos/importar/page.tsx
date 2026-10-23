import Link from "next/link";
import { Download } from "lucide-react";
import { BulkImporter } from "@/components/admin/BulkImporter";

export default function ImportarProductosPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-3xl text-[#1F1B19]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Carga masiva de productos
          </h1>
          <p className="text-sm text-[#766A63] mt-1">
            Importa múltiples productos desde un archivo Excel o CSV.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/admin/import/template"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase border border-[#E8DED4] text-[#766A63] px-4 py-2 hover:border-[#766A63] hover:text-[#1F1B19] transition-colors font-[500]"
          >
            <Download size={13} /> Descargar plantilla
          </a>
          <Link
            href="/admin/productos"
            className="text-xs text-[#766A63] hover:text-[#1F1B19] transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </div>

      {/* Advertencias antes de importar */}
      <div className="border border-[#E8DED4] bg-[#F7F2EC] p-4 mb-6 text-xs text-[#766A63] space-y-1.5">
        <p className="font-[500] text-[#1F1B19] text-[11px] tracking-[0.12em] uppercase mb-2">
          Antes de importar
        </p>
        <p>• <strong>Categorías, colecciones y ocasiones</strong> deben estar creadas en el panel antes de importar. Los nombres deben coincidir exactamente.</p>
        <p>• Cada fila del archivo es <strong>una variante</strong> (talla + color). Un producto con 4 variantes ocupa 4 filas.</p>
        <p>• Las <strong>imágenes</strong> no se importan por este flujo. Después de crear los productos puedes editarlos y subir las fotos.</p>
        <p>• Si el nombre de un producto ya existe en el catálogo, se creará como <strong>producto nuevo</strong> (slug diferente).</p>
        <p>• Los productos se crean en estado <strong>Borrador</strong> salvo que indiques "active" en la columna estado.</p>
      </div>

      <BulkImporter />
    </div>
  );
}
