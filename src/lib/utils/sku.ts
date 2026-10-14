// Generación de SKU para variantes (producto + talla + color).
// Fuente única: la usan tanto el formulario de admin como el importador masivo,
// para que un mismo producto reciba el mismo SKU por cualquiera de las dos vías.

/** Mayúsculas, sin acentos, sin caracteres raros, recortado a `len`. */
function segment(value: string, len: number): string {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, len);
}

/**
 * `VESTIDOAURO-M-NEGR`
 *
 * El prefijo sale del nombre real del producto (no de un literal fijo): el SKU
 * es `unique` a nivel de toda la tabla, así que dos productos con las mismas
 * tallas y colores chocarían si compartieran prefijo.
 */
export function buildSku(nombre: string, talla: string, color: string): string {
  return [segment(nombre, 11), segment(talla, 4), segment(color, 4)]
    .filter(Boolean)
    .join("-");
}
