"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCOP } from "@/lib/utils/format";

type Step = "idle" | "previewing" | "importing" | "done" | "error";

interface PreviewGroup {
  nombre: string;
  precio_base: number;
  estado: string;
  categorias: string[];
  colecciones: string[];
  variants: { talla: string; color: string; sku: string; stock: number }[];
}

interface ParseError {
  row: number;
  column: string;
  message: string;
}

interface ImportResult {
  created: number;
  total: number;
  failed: { nombre: string; message: string }[];
}

export function BulkImporter() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewGroup[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function handleFile(f: File) {
    setFile(f);
    setFileName(f.name);
    setGlobalError(null);
    setParseErrors([]);
    setPreview([]);

    const fd = new FormData();
    fd.append("file", f);
    fd.append("preview", "true");

    const res = await fetch("/api/admin/import/products", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok || data.errors?.length) {
      setParseErrors(data.errors ?? [{ row: 0, column: "archivo", message: data.error ?? "Error desconocido" }]);
      setStep("error");
      return;
    }

    setPreview(data.preview ?? []);
    setStep("previewing");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function confirmImport() {
    if (!file) return;
    setStep("importing");
    setGlobalError(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/admin/import/products", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setGlobalError(data.error ?? "Error al importar.");
      setStep("error");
      return;
    }

    setResult({ created: data.created, total: data.total, failed: data.failed ?? [] });
    setStep("done");
    router.refresh();
  }

  function reset() {
    setStep("idle");
    setFile(null);
    setFileName("");
    setPreview([]);
    setParseErrors([]);
    setResult(null);
    setGlobalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const STATUS_LABEL: Record<string, string> = {
    active: "Activo", draft: "Borrador", archived: "Archivado",
  };

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === "done" && result) {
    return (
      <div className="bg-white border border-[#E9DDE3] p-8 space-y-6">
        <div className="flex items-center gap-3">
          <CheckCircle size={24} className="text-[#1E1B2E] shrink-0" />
          <div>
            <p className="font-[500] text-[#1E1B2E]">
              Importación completada: {result.created} de {result.total} productos creados.
            </p>
            {result.failed.length > 0 && (
              <p className="text-xs text-[#A0647E] mt-0.5">
                {result.failed.length} producto(s) no se pudieron crear.
              </p>
            )}
          </div>
        </div>

        {result.failed.length > 0 && (
          <div className="border border-[#F2D4DC] bg-[#F2D4DC]/10 p-4 space-y-1.5">
            {result.failed.map((f, i) => (
              <p key={i} className="text-xs text-[#A0647E]">
                <span className="font-[500]">{f.nombre}:</span> {f.message}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <a
            href="/admin/productos"
            className="text-[11px] tracking-[0.18em] uppercase font-[600] px-6 py-2.5 bg-[#1E1B2E] text-[#FAF6F7] hover:bg-[#A0647E] transition-colors"
          >
            Ver productos
          </a>
          <button
            onClick={reset}
            className="text-xs text-[#6E6680] hover:text-[#1E1B2E] transition-colors"
          >
            Importar otro archivo
          </button>
        </div>
      </div>
    );
  }

  // ── Error de parseo ───────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-[#F2D4DC] p-6 space-y-3">
          <p className="flex items-center gap-2 font-[500] text-[#A0647E]">
            <AlertCircle size={16} /> El archivo tiene errores y no puede importarse.
          </p>
          <div className="divide-y divide-[#FAF6F7]">
            {parseErrors.map((e, i) => (
              <div key={i} className="py-2 flex gap-4 text-xs">
                {e.row > 0 && (
                  <span className="text-[#D9C3CE] shrink-0 w-14">Fila {e.row}</span>
                )}
                <span className="text-[#6E6680] shrink-0 w-28">{e.column}</span>
                <span className="text-[#1E1B2E]">{e.message}</span>
              </div>
            ))}
          </div>
          {globalError && <p className="text-xs text-[#A0647E]">{globalError}</p>}
        </div>
        <button
          onClick={reset}
          className="text-xs text-[#6E6680] hover:text-[#1E1B2E] flex items-center gap-1.5"
        >
          <X size={12} /> Subir otro archivo
        </button>
      </div>
    );
  }

  // ── Preview / confirmar ───────────────────────────────────────────────────
  if (step === "previewing" || step === "importing") {
    const totalVariants = preview.reduce((s, p) => s + p.variants.length, 0);
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-[500] text-[#1E1B2E]">
              Vista previa: {preview.length} producto(s) · {totalVariants} variante(s)
            </p>
            <p className="text-xs text-[#6E6680] mt-0.5">{fileName}</p>
          </div>
          <button
            onClick={reset}
            className="text-xs text-[#6E6680] hover:text-[#1E1B2E] flex items-center gap-1"
          >
            <X size={12} /> Cancelar
          </button>
        </div>

        <div className="bg-white border border-[#E9DDE3] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E9DDE3]">
                {["Nombre", "Precio base", "Estado", "Categorías", "Variantes"].map((h) => (
                  <th key={h} className="text-left text-[9px] tracking-[0.18em] uppercase text-[#6E6680] font-[600] px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((p, i) => (
                <tr key={i} className="border-b border-[#FAF6F7] hover:bg-[#FAF6F7]/40 transition-colors">
                  <td className="px-4 py-3 font-[500] text-[#1E1B2E] max-w-[200px]">{p.nombre}</td>
                  <td className="px-4 py-3 text-[#6E6680]">{formatCOP(p.precio_base)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-[600] tracking-wide uppercase",
                      p.estado === "active" ? "bg-[#FAF6F7] text-[#1E1B2E]" : "bg-[#F2D4DC]/40 text-[#6E6680]"
                    )}>
                      {STATUS_LABEL[p.estado] ?? p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6E6680]">
                    {[...p.categorias, ...p.colecciones].join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.variants.map((v, j) => (
                        <span key={j} className="text-[9px] px-1.5 py-0.5 bg-[#FAF6F7] text-[#6E6680] rounded">
                          {v.talla}/{v.color} ({v.stock})
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={confirmImport}
            disabled={step === "importing"}
            className={cn(
              "text-[11px] tracking-[0.18em] uppercase font-[600] px-8 py-3 transition-colors",
              step === "importing"
                ? "bg-[#D9C3CE] text-white cursor-not-allowed"
                : "bg-[#1E1B2E] text-[#FAF6F7] hover:bg-[#A0647E]"
            )}
          >
            {step === "importing" ? "Importando…" : `Confirmar e importar ${preview.length} producto(s)`}
          </button>
          <button
            onClick={reset}
            disabled={step === "importing"}
            className="text-xs text-[#6E6680] hover:text-[#1E1B2E]"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── Idle: zona de upload ──────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-none px-6 py-16 text-center cursor-pointer transition-colors",
          dragOver
            ? "border-[#A0647E] bg-[#F2D4DC]/20"
            : "border-[#E9DDE3] hover:border-[#6E6680] bg-[#FAF6F7]"
        )}
      >
        <FileSpreadsheet
          size={36}
          strokeWidth={1.2}
          className={cn("mx-auto mb-4", dragOver ? "text-[#A0647E]" : "text-[#D9C3CE]")}
        />
        <p className="text-sm text-[#6E6680] mb-1">
          Arrastra tu archivo aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-[#D9C3CE]">Excel (.xlsx, .xls) o CSV · máx. 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {/* Pasos de referencia */}
      <div className="grid grid-cols-3 gap-4 text-xs text-[#6E6680]">
        {[
          { n: "1", text: "Descarga la plantilla Excel con el formato correcto." },
          { n: "2", text: "Completa filas: cada fila = una variante (talla + color)." },
          { n: "3", text: "Sube el archivo y revisa la vista previa antes de confirmar." },
        ].map((s) => (
          <div key={s.n} className="border border-[#E9DDE3] p-3 bg-white">
            <span className="text-[10px] tracking-[0.15em] uppercase font-[600] text-[#D9C3CE] block mb-1">
              Paso {s.n}
            </span>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
