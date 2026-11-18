// Orden de tallas de menor a mayor; las desconocidas (o numéricas) van al final en orden natural.
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function bySizeOrder(a: string, b: string) {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
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
