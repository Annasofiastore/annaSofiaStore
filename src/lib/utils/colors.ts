/**
 * Color aproximado a partir del nombre ("Camel", "Blanco H", "Verde militar"), para pintar las bolitas
 * del selector cuando el color no tiene un código hex guardado. Devuelve null si no lo reconoce.
 */
const COLORS: Record<string, string> = {
  negro: "#141414", blanco: "#FFFFFF", hueso: "#EFE8DA", crema: "#F3EAD7", marfil: "#F5F0E1", perla: "#EEE9E2",
  beige: "#DCC9A8", arena: "#D8C3A0", nude: "#D9B8A0", piel: "#E3BFA3", camel: "#C19A6B", caqui: "#B5A27A",
  khaki: "#B5A27A", cafe: "#6B4430", marron: "#6B4430", chocolate: "#4B2E22", tierra: "#8B5E3C",
  terracota: "#B8573A", ladrillo: "#A4492F", mostaza: "#D4A017", amarillo: "#F0D54A", limon: "#E8E35A",
  naranja: "#E8832A", coral: "#F2735E", salmon: "#F4A08B", durazno: "#F8C4A4", rojo: "#C0262D",
  vino: "#6D1F2F", tinto: "#6D1F2F", guinda: "#7A1F36", burdeos: "#6D1F2F", fucsia: "#D6247E",
  rosado: "#E8A0B4", rosa: "#E8A0B4", palo: "#E7C1C4", lila: "#C3A6E0", lavanda: "#B9A7DB",
  morado: "#6B4A8E", violeta: "#6B4A8E", purpura: "#6B4A8E", azul: "#2C4A8A", marino: "#1B2A4A",
  navy: "#1B2A4A", rey: "#2346A8", celeste: "#8EC5E8", turquesa: "#2BA6A6", aqua: "#7CD1CF",
  verde: "#3E7C4F", oliva: "#5B6B3A", militar: "#5B6B3A", menta: "#A8DBC1", esmeralda: "#1F7A5A",
  gris: "#8E8E8E", plomo: "#6E6E6E", plateado: "#C0C0C0", dorado: "#C9A24B", oro: "#C9A24B",
};

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function colorToHex(name: string): string | null {
  const n = normalize(name);
  if (COLORS[n]) return COLORS[n];
  for (const word of n.split(/[^a-z]+/).filter(Boolean)) {
    if (COLORS[word]) return COLORS[word];
  }
  return null;
}
