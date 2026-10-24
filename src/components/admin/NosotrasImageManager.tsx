"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

const SETTING_KEY = "nosotras_historia_image";
const FALLBACK = "/nosotras-historia.jpg";

export function NosotrasImageManager() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch(`/api/admin/site-settings?key=${SETTING_KEY}`);
    if (res.ok) {
      const data = await res.json();
      setCurrentUrl(data.value || FALLBACK);
    } else {
      setCurrentUrl(FALLBACK);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/") && !file.name.match(/\.heic$/i)) {
      setError("Solo se aceptan imágenes");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("prefix", "content");

    const upRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const upData = await upRes.json();
    if (!upRes.ok) {
      setError(upData.error ?? "Error al subir la imagen");
      setUploading(false);
      return;
    }

    const saveRes = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: SETTING_KEY, value: upData.url }),
    });

    if (!saveRes.ok) {
      const d = await saveRes.json();
      setError(d.error ?? "Error al guardar");
      setUploading(false);
      return;
    }

    setCurrentUrl(upData.url);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setUploading(false);
  }

  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <p className="text-sm font-[600] text-gray-700">Imagen de la sección Historia (Nosotras)</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Aparece junto a la historia de la marca en la página <strong>/nosotras</strong>.
          Recomendado: formato vertical (ratio 3:4), mínimo 800×1000px.
        </p>
      </div>

      <div className="p-5 flex gap-6 flex-wrap items-start">
        {/* Vista previa */}
        <div className="relative w-40 flex-shrink-0">
          {loading ? (
            <div className="w-40 h-52 bg-gray-100 animate-pulse rounded" />
          ) : currentUrl ? (
            <div className="relative w-40 h-52 rounded overflow-hidden bg-[#F5DDE5]/20 border border-gray-100">
              <Image
                src={currentUrl}
                alt="Imagen actual de Nosotras"
                fill
                className="object-cover object-top"
                sizes="160px"
                unoptimized={currentUrl.startsWith("/")}
              />
            </div>
          ) : null}
          <p className="text-[10px] text-gray-400 text-center mt-1.5">Imagen actual</p>
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-3 justify-center">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">
              <CheckCircle size={13} />
              Imagen actualizada correctamente
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1B2E] text-white text-xs rounded hover:bg-[#2D2C44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={13} strokeWidth={1.5} />
            {uploading ? "Subiendo…" : "Cambiar imagen"}
          </button>

          <p className="text-[10px] text-gray-400 max-w-[200px]">
            Formatos: JPG, PNG, WEBP, HEIC. Máximo 20 MB.
          </p>
        </div>
      </div>
    </div>
  );
}
