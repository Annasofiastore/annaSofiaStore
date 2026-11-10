"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, X } from "lucide-react";
import {
  focusStyle,
  imageFocus,
  imageSrc,
  withImageFocus,
  MAX_ZOOM,
  MIN_ZOOM,
  type ImageFocus,
} from "@/lib/utils/image-focus";

export type FocusPreview = {
  label: string;
  /** Proporción ancho/alto del marco, p. ej. "3/4" */ aspect: string;
};

interface Props {
  /** URL de la foto (puede traer ya un encuadre guardado). */
  src: string;
  /** Marcos en los que se verá la foto en la tienda, para ver el resultado antes de guardar. */
  previews: FocusPreview[];
  /** Devuelve la URL con el encuadre aplicado. */
  onSave: (url: string) => void;
  onClose: () => void;
}

/**
 * Ventana para encuadrar una foto: se toca (o arrastra) sobre la foto completa el punto que siempre
 * debe verse, y a la derecha se ve cómo queda recortada en cada marco de la tienda.
 */
export function FocusPicker({ src, previews, onSave, onClose }: Props) {
  const [focus, setFocus] = useState<ImageFocus>(
    () => imageFocus(src) ?? { x: 50, y: 50, z: 1 },
  );
  const areaRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const url = imageSrc(src);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setFromPointer(e: React.PointerEvent) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    setFocus((f) => ({
      ...f,
      x: Math.min(
        100,
        Math.max(0, ((e.clientX - rect.left) / rect.width) * 100),
      ),
      y: Math.min(
        100,
        Math.max(0, ((e.clientY - rect.top) / rect.height) * 100),
      ),
    }));
  }

  const previewStyle = focusStyle({
    x: Math.round(focus.x),
    y: Math.round(focus.y),
    z: focus.z,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Encuadrar foto"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cuerpo con scroll; el zoom y los botones quedan fijos abajo para no tener que desplazarse */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-[600] text-gray-800">Encuadrar foto</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 -mr-2 text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Toca o arrastra sobre la foto la parte que siempre debe verse (la
            cara, la prenda…) y usa el zoom para acercarla. Arriba (o a la
            derecha en computador) ves cómo queda en la tienda.
          </p>

          <div className="grid sm:grid-cols-[1fr_auto] gap-4 sm:gap-5">
            {/* Foto completa */}
            <div className="flex justify-center bg-gray-50 border border-gray-200 p-2">
              <div
                ref={areaRef}
                className="relative inline-block touch-none cursor-crosshair select-none"
                onPointerDown={(e) => {
                  dragging.current = true;
                  (e.currentTarget as HTMLElement).setPointerCapture(
                    e.pointerId,
                  );
                  setFromPointer(e);
                }}
                onPointerMove={(e) => dragging.current && setFromPointer(e)}
                onPointerUp={() => (dragging.current = false)}
                onPointerCancel={() => (dragging.current = false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Foto completa"
                  draggable={false}
                  className="block max-h-[45dvh] sm:max-h-[55vh] w-auto max-w-full"
                />
                <span
                  className="absolute w-10 h-10 sm:w-7 sm:h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#A0526C]/50 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] flex items-center justify-center pointer-events-none"
                  style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
                >
                  <Crosshair size={14} className="text-white" />
                </span>
              </div>
            </div>

            {/* Vistas previas */}
            <div className="order-first sm:order-last flex sm:flex-col gap-3 sm:gap-4 sm:w-44">
              {previews.map((p) => (
                <div
                  key={p.label}
                  className="flex-1 sm:flex-none max-w-[9rem] sm:max-w-none"
                >
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                    {p.label}
                  </p>
                  <div
                    className="relative w-full overflow-hidden border border-gray-200 bg-gray-100"
                    style={{ aspectRatio: p.aspect }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={previewStyle}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 sm:px-5 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white">
          {/* Zoom: acerca la foto hacia el punto elegido */}
          <div>
            <label
              htmlFor="focus-zoom"
              className="flex items-center justify-between text-xs text-gray-600 mb-1"
            >
              <span>Zoom</span>
              <span className="tabular-nums text-gray-400">
                {focus.z.toFixed(1)}×
              </span>
            </label>
            <input
              id="focus-zoom"
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={focus.z}
              onChange={(e) =>
                setFocus((f) => ({ ...f, z: Number(e.target.value) }))
              }
              className="w-full h-8 accent-[#221A33]"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Acerca la foto hacia el punto elegido. Con mucho zoom una foto de
              baja calidad se ve borrosa.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 mt-4">
            <button
              type="button"
              onClick={() => setFocus({ x: 50, y: 50, z: 1 })}
              className="py-2 text-xs text-gray-500 underline underline-offset-2 hover:text-gray-800"
            >
              Centrar
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 sm:py-2 text-xs text-gray-500 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onSave(withImageFocus(src, focus))}
                className="px-4 py-3 sm:py-2 bg-[#221A33] text-white text-xs hover:bg-[#352A4B] transition-colors"
              >
                Guardar encuadre
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
