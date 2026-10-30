// Reglas de negocio del checkout compartidas entre la pantalla y el servidor.

/** Ciudades donde se ofrece pago contra entrega. Único lugar donde se define. */
export const CONTRAENTREGA_CITIES = ["Montería"] as const;

export function isContraentregaCity(city: string): boolean {
  return (CONTRAENTREGA_CITIES as readonly string[]).includes(city);
}
