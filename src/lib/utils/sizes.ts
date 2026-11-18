// Orden de tallas de menor a mayor; las desconocidas (o numéricas) van al final en orden natural.
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/** Posición de una talla; las combinadas ("S/M", "L-XL") se ubican según sus partes. null si no es una talla conocida. */
function sizeRank(size: string): number | null {
  const ranks = size
    .toUpperCase()
    .split(/[\s/\-,]+/)
    .filter(Boolean)
    .map((t) => SIZE_ORDER.indexOf(t));
  if (ranks.length === 0 || ranks.includes(-1)) return null;
  return ranks.reduce((a, b) => a + b, 0) / ranks.length;
}

export function bySizeOrder(a: string, b: string) {
  const ra = sizeRank(a);
  const rb = sizeRank(b);
  if (ra !== null || rb !== null) {
    if (ra === null) return 1;
    if (rb === null) return -1;
    return ra - rb || a.localeCompare(b, "es");
  }
  return a.localeCompare(b, "es", { numeric: true });
}

type SizeVariant = { stock: number; reserved?: number | null; attributes?: { talla?: string } | null };

/** Tallas de un producto con su disponibilidad, de menor a mayor. */
export function sizeAvailability(variants: SizeVariant[] | undefined): { size: string; available: boolean }[] {
  const bySize = new Map<string, boolean>();
  for (const v of variants ?? []) {
    const size = v.attributes?.talla?.trim();
    if (!size) continue;
    const available = (v.stock ?? 0) - (v.reserved ?? 0) > 0;
    bySize.set(size, (bySize.get(size) ?? false) || available);
  }
  return [...bySize.entries()]
    .map(([size, available]) => ({ size, available }))
    .sort((a, b) => bySizeOrder(a.size, b.size));
}
