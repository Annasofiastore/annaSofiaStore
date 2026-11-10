/**
 * Encuadre de una foto: qué parte se ve y cuánto se acerca.
 *
 * La foto se muestra recortada para llenar su marco (object-cover). El encuadre tiene:
 *  - un punto (x, y) que siempre debe verse: (50, 50) es el centro, (50, 0) la parte de arriba, etc.
 *  - un zoom (z) de 1 (sin acercar) a 2 (el doble de cerca), que agranda la foto alrededor de ese punto.
 * Se guarda dentro de la misma URL de la imagen como un fragmento ("...jpg#foco=40,15,1.5"), así no hace
 * falta una columna nueva en la base de datos. Los navegadores y Supabase ignoran el fragmento.
 */

import type { CSSProperties } from "react";

export type ImageFocus = { x: number; y: number; z: number };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 2;

const FOCUS_RE = /#foco=(\d{1,3}),(\d{1,3})(?:,(\d(?:\.\d{1,2})?))?$/;

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

/** URL sin el fragmento de encuadre: la que se le pasa a <Image> o se descarga. */
export function imageSrc(url: string): string;
export function imageSrc(url: string | null | undefined): string | undefined;
export function imageSrc(url: string | null | undefined): string | undefined {
  return url ? url.replace(FOCUS_RE, "") : undefined;
}

/** Encuadre guardado en la URL, o null si no se ha ajustado. */
export function imageFocus(url: string | null | undefined): ImageFocus | null {
  const m = url?.match(FOCUS_RE);
  return m ? { x: clamp(Number(m[1])), y: clamp(Number(m[2])), z: clampZoom(m[3] ? Number(m[3]) : 1) } : null;
}

/** Estilo (object-position y zoom) de un encuadre. Sin ajuste usa `fallback` y no acerca. */
export function focusStyle(focus: ImageFocus | null, fallback = "50% 50%"): CSSProperties {
  if (!focus) return { objectPosition: fallback };
  const position = `${focus.x}% ${focus.y}%`;
  return focus.z > 1
    ? { objectPosition: position, transform: `scale(${focus.z})`, transformOrigin: position }
    : { objectPosition: position };
}

/**
 * Estilo para el <Image> / <img> de una foto. Sin ajuste devuelve `fallback`
 * (por defecto el centro, que es lo que hace object-cover). El contenedor debe tener overflow-hidden.
 */
export function imageStyle(url: string | null | undefined, fallback = "50% 50%"): CSSProperties {
  return focusStyle(imageFocus(url), fallback);
}

/** URL con el encuadre aplicado. El centro sin zoom se guarda como "sin ajuste". */
export function withImageFocus(url: string, focus: ImageFocus): string {
  const base = imageSrc(url);
  const x = clamp(focus.x);
  const y = clamp(focus.y);
  const z = clampZoom(focus.z);
  if (x === 50 && y === 50 && z === 1) return base;
  return `${base}#foco=${x},${y}${z > 1 ? `,${z}` : ""}`;
}
