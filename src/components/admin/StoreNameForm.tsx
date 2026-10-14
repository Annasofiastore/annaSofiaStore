"use client";

import { useState, useTransition } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { updateStoreName } from "@/app/admin/configuracion/actions";

export function StoreNameForm({ initialName, maxLength }: { initialName: string; maxLength: number }) {
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = name.trim() !== saved;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateStoreName(name);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(name.trim());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded overflow-hidden">
      <div className="px-5 py-4 space-y-3">
        <label className="block">
          <span className="text-sm text-gray-700">Nombre de la tienda</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={maxLength}
            required
            className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400"
          />
        </label>
        <p className="text-xs text-gray-400">
          Se muestra en el menú, el pie de página, el título del navegador, los correos y las páginas legales.
        </p>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={14} /> {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle size={14} /> Nombre actualizado
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
