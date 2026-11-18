/**
 * Fotos de cada color de un producto: { "negro": ["url1", "url2"], "camel": ["url3"] }.
 * La clave es el nombre del color en minúsculas. Antes cada color guardaba una sola URL (string);
 * se siguen aceptando esos valores.
 */
export type ColorImages = Record<string, string[]>;

export function normalizeColorImages(raw: unknown): ColorImages {
  const out: ColorImages = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [color, value] of Object.entries(raw as Record<string, unknown>)) {
    const urls = (Array.isArray(value) ? value : [value]).filter((u): u is string => typeof u === "string" && !!u);
    if (urls.length > 0) out[color.toLowerCase()] = urls;
  }
  return out;
}
