"use client";

import { useState, useTransition } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { updateNosotrasContent } from "@/app/admin/configuracion/actions";

type Content = { title: string; body: string; summary: string };

const FIELD = "mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400";

export function NosotrasContentForm({
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

  const dirty = (Object.keys(form) as (keyof Content)[]).some((k) => form[k].trim() !== saved[k].trim());
  const set = (k: keyof Content) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateNosotrasContent(form);
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
        <label className="block">
          <span className="text-sm text-gray-700">Título de la historia</span>
          <input type="text" value={form.title} onChange={set("title")} maxLength={limits.title} required className={FIELD} />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Texto de la historia</span>
          <textarea
            value={form.body}
            onChange={set("body")}
            maxLength={limits.body}
            required
            rows={12}
            className={`${FIELD} leading-relaxed`}
          />
          <span className="block text-xs text-gray-400 mt-1">
            Deja una línea en blanco para separar párrafos.
          </span>
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Resumen en el inicio</span>
          <textarea
            value={form.summary}
            onChange={set("summary")}
            maxLength={limits.summary}
            required
            rows={2}
            className={FIELD}
          />
          <span className="block text-xs text-gray-400 mt-1">
            Frase corta del banner &ldquo;Nosotras&rdquo; en la página de inicio.
          </span>
        </label>

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
            <CheckCircle size={14} /> Textos actualizados
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
