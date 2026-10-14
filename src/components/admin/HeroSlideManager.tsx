"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, GripVertical, AlertCircle } from "lucide-react";

type Slide = { id: string; image_url: string; alt_text: string | null; sort_order: number };

export function HeroSlideManager() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragTargetIdx, setDragTargetIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/hero-slides");
    if (res.ok) setSlides(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    setError(null);

    for (const file of arr) {
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) { setError(upData.error ?? "Error al subir imagen"); break; }

      const addRes = await fetch("/api/admin/hero-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: upData.url }),
      });
      if (!addRes.ok) { const d = await addRes.json(); setError(d.error ?? "Error al guardar"); break; }
    }

    await load();
    setUploading(false);
  }

  async function removeSlide(id: string) {
    setError(null);
    const res = await fetch("/api/admin/hero-slides", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setSlides((prev) => prev.filter((s) => s.id !== id));
    else { const d = await res.json(); setError(d.error ?? "Error al eliminar"); }
  }

  async function applyReorder(next: Slide[]) {
    setSlides(next);
    await Promise.all(
      next.map((s, i) =>
        fetch("/api/admin/hero-slides", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, sort_order: i }),
        })
      )
    );
  }

  function onThumbDrop(targetIdx: number) {
    if (draggingIdx === null || draggingIdx === targetIdx) {
      setDraggingIdx(null);
      setDragTargetIdx(null);
      return;
    }
    const next = [...slides];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(targetIdx, 0, moved);
    setDraggingIdx(null);
    setDragTargetIdx(null);
    applyReorder(next);
  }

  if (loading) return <div className="h-40 bg-gray-100 animate-pulse rounded" />;

  return (
    <div className="space-y-4">
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          <AlertCircle size={13} /> {error}
        </p>
      )}

      {/* Grid de slides actuales */}
      {slides.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => setDraggingIdx(idx)}
              onDragEnter={() => setDragTargetIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onThumbDrop(idx)}
              onDragEnd={() => { setDraggingIdx(null); setDragTargetIdx(null); }}
              className={`relative group aspect-video overflow-hidden border transition-all cursor-grab ${
                draggingIdx === idx
                  ? "opacity-40 border-gray-300"
                  : dragTargetIdx === idx && draggingIdx !== idx
                  ? "border-[#A0647E] scale-105"
                  : idx === 0
                  ? "border-[#1E1B2E]"
                  : "border-gray-200"
              }`}
            >
              <Image
                src={slide.image_url}
                alt={slide.alt_text ?? `Slide ${idx + 1}`}
                fill
                unoptimized
                className="object-cover object-center"
                sizes="200px"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-between p-1.5">
                <GripVertical size={14} className="text-white mt-0.5" />
                <button
                  type="button"
                  onClick={() => removeSlide(slide.id)}
                  className="text-white hover:text-[#F2D4DC]"
                  aria-label="Eliminar slide"
                >
                  <X size={14} />
                </button>
              </div>
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-[#1E1B2E]/80 text-[#FAF6F7] text-[8px] tracking-wide uppercase text-center py-0.5 font-[500]">
                  Primera
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {slides.length > 1 && (
        <p className="text-[10px] text-[#6E6680]">
          Arrastra para reordenar. Las imágenes rotan cada 3 segundos.
        </p>
      )}

      {/* Zona de subida */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-[#A0647E] bg-[#F2D4DC]/20" : "border-[#E9DDE3] hover:border-[#6E6680] bg-[#FAF6F7]"
        }`}
      >
        <Upload size={24} strokeWidth={1.5} className={`mx-auto mb-2 ${dragOver ? "text-[#A0647E]" : "text-[#D9C3CE]"}`} />
        <p className="text-sm text-[#6E6680]">
          {uploading ? "Subiendo…" : "Arrastra fotos aquí o haz clic para seleccionar"}
        </p>
        <p className="text-xs text-[#D9C3CE] mt-1">
          JPG, PNG, WEBP, HEIC · máx. 20 MB por imagen · {slides.length} foto{slides.length !== 1 ? "s" : ""} cargada{slides.length !== 1 ? "s" : ""}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,image/heic,image/heif,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
