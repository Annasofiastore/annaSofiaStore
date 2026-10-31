import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/admin";
import { brand } from "@/lib/config/brand";
import { getStoreName } from "@/lib/config/store-name";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const storeName = await getStoreName();
  const headers = [
    "nombre",
    "descripcion",
    "cuidados",
    "precio_base",
    "precio_comparacion",
    "estado",
    "categorias",
    "colecciones",
    "ocasiones",
    "talla",
    "color",
    "sku",
    "stock",
    "precio_variante",
  ];

  const examples = [
    [
      "Vestido Lino Ibiza",
      "Vestido ligero de lino ideal para la playa.",
      "Lavar a mano en agua fría. No centrifugar.",
      120000,
      150000,
      "active",
      "Vestidos",
      "Verano 2025",
      "Playa",
      "S",
      "Blanco",
      "VLIB-S-BLAN",
      5,
      "",
    ],
    [
      "Vestido Lino Ibiza",
      "",
      "",
      120000,
      "",
      "",
      "",
      "",
      "",
      "M",
      "Blanco",
      "VLIB-M-BLAN",
      3,
      "",
    ],
    [
      "Vestido Lino Ibiza",
      "",
      "",
      120000,
      "",
      "",
      "",
      "",
      "",
      "S",
      "Azul Marino",
      "VLIB-S-AZUL",
      4,
      125000,
    ],
    [
      "Blusa Crop Tropical",
      "Blusa corta con estampado tropical.",
      "Lavado a máquina 30°C.",
      85000,
      "",
      "draft",
      "Blusas",
      "",
      "Casual",
      "XS",
      "Coral",
      "BCRO-XS-CORA",
      6,
      "",
    ],
    [
      "Blusa Crop Tropical",
      "",
      "",
      85000,
      "",
      "",
      "",
      "",
      "",
      "S",
      "Coral",
      "BCRO-S-CORA",
      8,
      "",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);

  // Column widths
  ws["!cols"] = headers.map((h) => ({
    wch: Math.max(h.length + 2, 16),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");

  // Add instructions sheet
  const instructions = [
    [`INSTRUCCIONES DE CARGA MASIVA — ${storeName.toUpperCase()}`],
    [""],
    ["ESTRUCTURA DEL ARCHIVO"],
    ["• Cada fila representa UNA VARIANTE (talla + color)."],
    ["• Si un producto tiene 3 variantes, ocupa 3 filas consecutivas."],
    ["• En las filas 2, 3... del mismo producto puedes dejar en blanco: descripcion, cuidados, precio_base, estado, categorias, colecciones, ocasiones — se heredan de la primera fila del producto."],
    ["• El campo 'nombre' debe ser idéntico en todas las filas del mismo producto."],
    [""],
    ["COLUMNAS"],
    ["nombre         → Nombre del producto. Obligatorio en la primera fila de cada producto."],
    ["descripcion    → Descripción larga. Opcional."],
    ["cuidados       → Instrucciones de lavado/cuidado. Opcional."],
    ["precio_base    → Precio en COP (sin puntos ni símbolos). Ej: 120000. Obligatorio."],
    ["precio_comparacion → Precio tachado/original. Opcional. Debe ser mayor al precio_base."],
    ["estado         → draft (borrador) | active (activo) | archived (archivado). Por defecto: draft."],
    ["categorias     → Nombre(s) de categoría separados por coma. Deben existir en el panel."],
    ["colecciones    → Nombre(s) de colección separados por coma. Deben existir en el panel."],
    ["ocasiones      → Nombre(s) de ocasión separados por coma. Deben existir en el panel."],
    ["talla          → Talla de esta variante. Ej: XS, S, M, L, XL, XXL, Única. Obligatorio."],
    ["color          → Color de esta variante. Ej: Blanco, Azul Marino, Coral. Obligatorio."],
    ["sku            → Código único de la variante. Si está vacío, se genera automáticamente."],
    ["stock          → Unidades disponibles. Número entero ≥ 0. Por defecto: 0."],
    ["precio_variante → Precio especial para esta variante. Deja vacío para usar precio_base."],
    [""],
    ["NOTAS"],
    ["• El archivo puede ser .xlsx, .xls o .csv (UTF-8)."],
    ["• Si el nombre del producto ya existe, se crea como producto nuevo con slug diferente."],
    ["• Categorías, colecciones y ocasiones que no existan en el panel son ignoradas (no se crean)."],
    ["• Imágenes no se pueden cargar por este archivo. Sube las imágenes después desde el formulario de edición."],
  ];
  const wsI = XLSX.utils.aoa_to_sheet(instructions);
  wsI["!cols"] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsI, "Instrucciones");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        `attachment; filename="plantilla_importacion_${brand.slug}.xlsx"`,
    },
  });
}
