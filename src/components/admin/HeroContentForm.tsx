"use client";

import { useState, useTransition } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { updateHeroContent } from "@/app/admin/configuracion/actions";

type Content = { eyebrow: string; title: string; subtitle: string; cta: string };

const FIELD = "mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400";

const FIELDS: { key: keyof Content; label: string; hint: string; optional?: boolean }[] = [
  { key: "eyebrow", label: "Etiqueta", hint: "Texto pequeño sobre el título. Ej.: Nueva colección. Opcional: si lo dejas vacío no se muestra.", optional: true },
  { key: "title", label: "Título", hint: "El mensaje principal. Ej.: Vestidos para brillar esta noche" },
  { key: "subtitle", label: "Frase", hint: "Una línea de apoyo debajo del título. Opcional: si la dejas vacía no se muestra.", optional: true },
  { key: "cta", label: "Texto del botón", hint: "El botón lleva al catálogo. Ej.: Comprar ahora" },
];

export function HeroContentForm({
  initial,
  limits,
}: {
  initial: Content;
  limits: Record<keyof Content, number>;
}) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = FIELDS.some(({ key }) => form[key].trim() !== saved[key].trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateHeroContent(form);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded overflow-hidden">
      <div className="px-5 py-4 space-y-4">
        {FIELDS.map(({ key, label, hint, optional }) => (
          <label key={key} className="block">
            <span className="text-sm text-gray-700">
              {label}
              {optional && <span className="text-xs text-gray-400"> (opcional)</span>}
            </span>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              maxLength={limits[key]}
              required={!optional}
              className={FIELD}
            />
            <span className="block text-xs text-gray-400 mt-1">{hint}</span>
          </label>
        ))}

        <p className="text-xs text-gray-400">
          Puedes escribir <code className="text-gray-600">{"{tienda}"}</code> y se reemplaza por el nombre de la tienda.
        </p>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={14} /> {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle size={14} /> Banner actualizado
          </p>
        )}
      </div>
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
        <button
          type="submit"
          disabled={!dirty || pending}
          className="px-4 py-2 text-sm rounded bg-gray-800 text-white disabled:opacity-40 hover:bg-gray-700 transition-colors"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
