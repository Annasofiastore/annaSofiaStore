"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, GripVertical, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 8 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragTargetIdx, setDragTargetIdx] = useState<number | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).slice(0, maxImages - images.length);
    if (!arr.length) return;

    setUploading(true);
    setError(null);
    const urls: string[] = [];

    for (const file of arr) {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al subir imagen");
        break;
      }
      urls.push(data.url);
    }

    onChange([...images, ...urls]);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  // Reordenar por drag dentro de la lista de thumbnails
  function handleThumbDragStart(idx: number) {
    setDraggingIdx(idx);
  }
  function handleThumbDragEnter(idx: number) {
    setDragTargetIdx(idx);
  }
  function handleThumbDrop(targetIdx: number) {
    if (draggingIdx === null || draggingIdx === targetIdx) {
      setDraggingIdx(null);
      setDragTargetIdx(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    setDraggingIdx(null);
    setDragTargetIdx(null);
  }

  const canUpload = images.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Zona de drop */}
      {canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-none px-6 py-10 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-[#A0647E] bg-[#F2D4DC]/20"
              : "border-[#E9DDE3] hover:border-[#6E6680] bg-[#FAF6F7]"
          )}
        >
          <Upload
            size={28}
            strokeWidth={1.5}
            className={cn("mx-auto mb-3", dragOver ? "text-[#A0647E]" : "text-[#D9C3CE]")}
          />
          <p className="text-sm text-[#6E6680]">
            {uploading ? "Subiendo…" : "Arrastra imágenes aquí o haz clic para seleccionar"}
          </p>
          <p className="text-xs text-[#D9C3CE] mt-1">
            JPG, PNG, WEBP, HEIC · máx. 20 MB por imagen · {images.length}/{maxImages}
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
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-[#A0647E]">
          <AlertCircle size={13} /> {error}
        </p>
      )}

      {/* Grid de thumbnails con reorden */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, idx) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleThumbDragStart(idx)}
              onDragEnter={() => handleThumbDragEnter(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleThumbDrop(idx)}
              onDragEnd={() => { setDraggingIdx(null); setDragTargetIdx(null); }}
              className={cn(
                "relative group aspect-[3/4] overflow-hidden border transition-all",
                idx === 0 ? "border-[#1E1B2E]" : "border-[#E9DDE3]",
                draggingIdx === idx && "opacity-40",
                dragTargetIdx === idx && draggingIdx !== idx && "border-[#A0647E] scale-105"
              )}
            >
              <Image
                src={url}
                alt={`Imagen ${idx + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="120px"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
              />

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-between p-1.5">
                <GripVertical size={14} className="text-white cursor-grab mt-0.5" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-white hover:text-[#F2D4DC]"
                  aria-label="Eliminar imagen"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Badge principal */}
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-[#1E1B2E]/80 text-[#FAF6F7] text-[8px] tracking-wide uppercase text-center py-0.5 font-[500]">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-[10px] text-[#6E6680]">
          Arrastra los thumbnails para reordenar. La primera imagen es la principal.
        </p>
      )}
    </div>
  );
}
