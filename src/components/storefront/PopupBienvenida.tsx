"use client";

import { useEffect, useState } from "react";
import { X, Mail, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "mb_bienvenida_seen";

type State = "form" | "submitting" | "success";

export function PopupBienvenida() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<State>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) return;
      const timer = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(timer);
    });
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setError("Ingresa un correo válido."); return; }

    setState("submitting");
    setError(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() }),
      });
      if (!res.ok) throw new Error();
      setState("success");
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      setState("form");
      setError("Ocurrió un error. Intenta de nuevo.");
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(31,27,25,0.55)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="relative w-full max-w-md bg-white"
        style={{
          border: "1px solid #F2DCD6",
          animation: "popupIn 0.35s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        {/* Franja superior */}
        <div style={{ height: 4, background: "linear-gradient(90deg,#F2DCD6,#965C57,#F2DCD6)" }} />

        {/* Botón cerrar */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-[#DCCFC4] hover:text-[#1F1B19] transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="px-8 py-8 text-center">
          {state === "success" ? (
            // ── Estado éxito ──────────────────────────────────
            <>
              <CheckCircle size={44} className="mx-auto mb-4 text-[#965C57]" strokeWidth={1} />
              <h2
                className="text-3xl text-[#1F1B19] mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ¡Ya casi!
              </h2>
              <p className="text-sm text-[#766A63] leading-relaxed mb-6">
                Te enviamos el código de descuento a{" "}
                <strong className="text-[#1F1B19]">{email}</strong>.
                <br />
                Revisa tu correo y úsalo al hacer checkout.
              </p>
              <button
                onClick={dismiss}
                className="w-full py-3.5 bg-[#1F1B19] text-[#F7F2EC] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#965C57] transition-colors rounded-full"
              >
                Explorar colección
              </button>
            </>
          ) : (
            // ── Formulario ────────────────────────────────────
            <>
              <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-[#965C57] font-[500] mb-4">
                Oferta exclusiva
              </span>

              <h2
                className="text-4xl text-[#1F1B19] mb-1 leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                10% de descuento
              </h2>
              <p
                className="text-xl text-[#1F1B19] mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                en tu primer pedido
              </p>

              <div className="w-10 h-px bg-[#F2DCD6] mx-auto mb-4" />

              <p className="text-sm text-[#766A63] leading-relaxed mb-5 font-[300]">
                Déjanos tu correo y te enviamos el código de descuento al instante.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3 text-left">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre (opcional)"
                  className="w-full border border-[#E8DED4] bg-[#F7F2EC] px-4 py-2.5 text-sm text-[#1F1B19] placeholder:text-[#DCCFC4] outline-none focus:border-[#766A63] transition-colors"
                />
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#DCCFC4]" strokeWidth={1.5} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="Tu correo electrónico *"
                    required
                    className="w-full border border-[#E8DED4] bg-[#F7F2EC] pl-9 pr-4 py-2.5 text-sm text-[#1F1B19] placeholder:text-[#DCCFC4] outline-none focus:border-[#766A63] transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-[#965C57]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={state === "submitting"}
                  className="w-full py-3.5 bg-[#1F1B19] text-[#F7F2EC] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#965C57] disabled:bg-[#DCCFC4] disabled:cursor-not-allowed transition-colors rounded-full"
                >
                  {state === "submitting" ? "Enviando…" : "Enviarme mi código"}
                </button>
              </form>

              <button
                onClick={dismiss}
                className="mt-4 text-[11px] text-[#DCCFC4] hover:text-[#766A63] transition-colors tracking-wide"
              >
                No gracias, seguir sin descuento
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
