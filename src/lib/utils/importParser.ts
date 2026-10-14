/**
 * Parses a CSV/XLSX buffer into structured product import rows.
 *
 * Expected columns (case-insensitive, order doesn't matter):
 *   nombre, descripcion, cuidados, precio_base, precio_comparacion,
 *   estado, categorias, colecciones, ocasiones,
 *   talla, color, sku, stock, precio_variante
 *
 * Each spreadsheet row = one variant.
 * Multiple rows with the same `nombre` → same product, multiple variants.
 */

import * as XLSX from "xlsx";
import { buildSku } from "@/lib/utils/sku";

export interface ImportRow {
  rowIndex: number; // 1-based, matching sheet row
  nombre: string;
  descripcion: string;
  cuidados: string;
  precio_base: number;
  precio_comparacion: number | null;
  estado: "draft" | "active" | "archived";
  categorias: string[];
  colecciones: string[];
  ocasiones: string[];
  talla: string;
  color: string;
  sku: string;
  stock: number;
  precio_variante: number | null;
}

export interface ParseError {
  row: number;
  column: string;
  message: string;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: ParseError[];
}

const VALID_STATUS = new Set(["draft", "active", "archived", "borrador", "activo", "archivado"]);
const STATUS_MAP: Record<string, "draft" | "active" | "archived"> = {
  borrador: "draft",
  activo: "active",
  archivado: "archived",
  draft: "draft",
  active: "active",
  archived: "archived",
};

function normalize(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, "_");
}

function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function num(val: unknown): number | null {
  const n = parseFloat(String(val).replace(/[^\d.-]/g, ""));
  return isNaN(n) ? null : n;
}

function splitList(val: unknown): string[] {
  const s = str(val);
  if (!s) return [];
  return s.split(/[,;|]/).map((x) => x.trim()).filter(Boolean);
}

export function parseImportFile(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  const rows: ImportRow[] = [];
  const errors: ParseError[] = [];

  if (raw.length === 0) {
    errors.push({ row: 0, column: "archivo", message: "El archivo está vacío." });
    return { rows, errors };
  }

  // Normalize headers
  const normalizedRaw = raw.map((r) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      normalized[normalize(k)] = v;
    }
    return normalized;
  });

  // Track last seen product-level fields (inherits down rows with same nombre)
  const lastProduct: Partial<ImportRow> = {};

  normalizedRaw.forEach((r, idx) => {
    const rowIndex = idx + 2; // +2 because row 1 is header
    const addError = (column: string, message: string) =>
      errors.push({ row: rowIndex, column, message });

    // Product-level fields — inherit from previous row if blank
    const nombre = str(r["nombre"]) || str(lastProduct.nombre);
    if (!nombre) {
      addError("nombre", "Falta el nombre del producto.");
      return;
    }

    const talla = str(r["talla"]);
    if (!talla) { addError("talla", "Falta la talla."); return; }

    const color = str(r["color"]);
    if (!color) { addError("color", "Falta el color."); return; }

    const rawPrecio = r["precio_base"] || lastProduct.precio_base;
    const precio_base = num(rawPrecio);
    if (precio_base === null || precio_base <= 0) {
      addError("precio_base", "precio_base debe ser un número positivo.");
      return;
    }

    const rawStatus = str((r["estado"] || lastProduct.estado) ?? "draft").toLowerCase();
    if (rawStatus && !VALID_STATUS.has(rawStatus)) {
      addError("estado", `Estado inválido: "${rawStatus}". Usa: draft, active, archived.`);
    }
    const estado = STATUS_MAP[rawStatus] ?? "draft";

    const stockRaw = num(r["stock"]);
    const stock = stockRaw !== null ? Math.max(0, Math.round(stockRaw)) : 0;

    const skuRaw = str(r["sku"]);
    const sku = skuRaw || buildSku(nombre, talla, color);

    const row: ImportRow = {
      rowIndex,
      nombre,
      descripcion: str(r["descripcion"] || lastProduct.descripcion),
      cuidados: str(r["cuidados"] || lastProduct.cuidados),
      precio_base,
      precio_comparacion: num(r["precio_comparacion"] ?? lastProduct.precio_comparacion ?? ""),
      estado,
      categorias: splitList(r["categorias"] || lastProduct.categorias?.join(",") || ""),
      colecciones: splitList(r["colecciones"] || lastProduct.colecciones?.join(",") || ""),
      ocasiones: splitList(r["ocasiones"] || lastProduct.ocasiones?.join(",") || ""),
      talla,
      color,
      sku,
      stock,
      precio_variante: num(r["precio_variante"] ?? ""),
    };

    // Update inherited product-level context
    Object.assign(lastProduct, {
      nombre: row.nombre,
      descripcion: row.descripcion,
      cuidados: row.cuidados,
      precio_base: row.precio_base,
      precio_comparacion: row.precio_comparacion,
      estado: row.estado,
      categorias: row.categorias,
      colecciones: row.colecciones,
      ocasiones: row.ocasiones,
    });

    rows.push(row);
  });

  return { rows, errors };
}

/** Groups import rows by product name */
export interface ProductGroup {
  nombre: string;
  descripcion: string;
  cuidados: string;
  precio_base: number;
  precio_comparacion: number | null;
  estado: "draft" | "active" | "archived";
  categorias: string[];
  colecciones: string[];
  ocasiones: string[];
  variants: { talla: string; color: string; sku: string; stock: number; precio_variante: number | null }[];
}

export function groupByProduct(rows: ImportRow[]): ProductGroup[] {
  const map = new Map<string, ProductGroup>();
  for (const row of rows) {
    const key = row.nombre.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        nombre: row.nombre,
        descripcion: row.descripcion,
        cuidados: row.cuidados,
        precio_base: row.precio_base,
        precio_comparacion: row.precio_comparacion,
        estado: row.estado,
        categorias: row.categorias,
        colecciones: row.colecciones,
        ocasiones: row.ocasiones,
        variants: [],
      });
    }
    map.get(key)!.variants.push({
      talla: row.talla,
      color: row.color,
      sku: row.sku,
      stock: row.stock,
      precio_variante: row.precio_variante,
    });
  }
  return Array.from(map.values());
}
