/**
 * Limpia el texto de un buscador antes de usarlo en un filtro de Supabase.
 *
 * Los filtros `.or()` y `ilike` se arman con texto: una coma, un paréntesis o un comodín (% _ *)
 * escritos por quien busca cambiarían la consulta. Solo se dejan letras, números y los signos que
 * aparecen en nombres, correos, teléfonos y números de pedido (@ . + - #).
 */
export function cleanSearchTerm(raw: string | undefined | null): string {
  return (raw ?? "")
    .slice(0, 60)
    .replace(/[^\p{L}\p{N}@.+\-#\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
