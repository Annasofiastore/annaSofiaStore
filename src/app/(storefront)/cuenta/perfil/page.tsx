"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INPUT = "w-full border border-[#E9DDE3] bg-white px-3 py-2.5 text-sm text-[#1E1B2E] focus:outline-none focus:border-[#6E6680] transition-colors placeholder:text-[#D9C3CE]";
const INPUT_DISABLED = "w-full border border-[#E9DDE3] bg-[#FAF6F7] px-3 py-2.5 text-sm text-[#6E6680] cursor-not-allowed";
const LABEL = "block text-[10px] uppercase tracking-[0.15em] text-[#6E6680] font-[600] mb-1";
const BTN = "px-6 py-2.5 bg-[#1E1B2E] text-[#FAF6F7] text-[11px] uppercase tracking-[0.15em] font-[500] hover:bg-[#A0647E] transition-colors disabled:opacity-50";

export default function PerfilPage() {
  const [email, setEmail] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    marketing_email: false,
    marketing_whatsapp: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pw, setPw] = useState({ password: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: c } = await supabase
        .from("customers")
        .select("id, full_name, phone, marketing_email, marketing_whatsapp")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (c) {
        setCustomerId(c.id);
        setForm({
          full_name: c.full_name ?? "",
          phone: c.phone ?? "",
          marketing_email: c.marketing_email ?? false,
          marketing_whatsapp: c.marketing_whatsapp ?? false,
        });
      }
    })();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    if (customerId) {
      const { error: err } = await supabase
        .from("customers")
        .update(form)
        .eq("id", customerId);
      if (err) {
        setError("No se pudo guardar. Intenta de nuevo.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } else {
      // El registro no existe aún — crearlo (puede pasar si el callback no lo generó)
      const { data: newCustomer, error: err } = await supabase
        .from("customers")
        .insert({
          auth_user_id: user.id,
          email: user.email?.toLowerCase() ?? "",
          full_name: form.full_name,
          phone: form.phone,
          marketing_email: form.marketing_email,
          marketing_whatsapp: form.marketing_whatsapp,
          is_guest: false,
        })
        .select("id")
        .single();
      if (err) {
        setError("No se pudo guardar. Intenta de nuevo.");
      } else {
        setCustomerId(newCustomer.id);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    }

    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (pw.password.length < 8) {
      setPwError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (pw.password !== pw.confirm) {
      setPwError("Las contraseñas no coinciden.");
      return;
    }
    setPwSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: pw.password });
    if (err) {
      setPwError("No se pudo actualizar. Intenta de nuevo.");
    } else {
      setPwSaved(true);
      setPw({ password: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 3000);
    }
    setPwSaving(false);
  }

  return (
    <div className="space-y-6">
      <h2
        className="text-xl text-[#1E1B2E]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Mis datos
      </h2>

      {/* Información personal */}
      <div className="bg-white border border-[#E9DDE3] p-5">
        <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1E1B2E] mb-4">
          Información personal
        </p>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className={LABEL}>Correo electrónico</label>
            <input value={email} disabled className={INPUT_DISABLED} />
            <p className="text-[10px] text-[#D9C3CE] mt-1">El correo no puede cambiarse.</p>
          </div>
          <div>
            <label className={LABEL}>Nombre completo</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Tu nombre"
              className={INPUT}
              required
            />
          </div>
          <div>
            <label className={LABEL}>Teléfono</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="3XX XXX XXXX"
              className={INPUT}
            />
          </div>

          {/* Marketing */}
          <div className="pt-3 border-t border-[#FAF6F7]">
            <p className={LABEL}>Comunicaciones de marketing</p>
            <div className="space-y-2 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.marketing_email}
                  onChange={(e) => setForm({ ...form, marketing_email: e.target.checked })}
                  className="accent-[#1E1B2E] w-3.5 h-3.5"
                />
                <span className="text-xs text-[#6E6680]">
                  Recibir novedades y promociones por email
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.marketing_whatsapp}
                  onChange={(e) => setForm({ ...form, marketing_whatsapp: e.target.checked })}
                  className="accent-[#1E1B2E] w-3.5 h-3.5"
                />
                <span className="text-xs text-[#6E6680]">
                  Recibir novedades por WhatsApp
                </span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-xs text-[#A0647E] bg-[#F2D4DC]/20 border border-[#F2D4DC] px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={saving} className={BTN}>
            {saving ? "Guardando…" : saved ? "¡Guardado!" : "Guardar cambios"}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white border border-[#E9DDE3] p-5">
        <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#1E1B2E] mb-4">
          Cambiar contraseña
        </p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={LABEL}>Nueva contraseña</label>
            <input
              type="password"
              value={pw.password}
              onChange={(e) => setPw({ ...pw, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className={INPUT}
              required
            />
          </div>
          <div>
            <label className={LABEL}>Confirmar contraseña</label>
            <input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              placeholder="Repite la contraseña"
              className={INPUT}
              required
            />
          </div>

          {pwError && (
            <p className="text-xs text-[#A0647E] bg-[#F2D4DC]/20 border border-[#F2D4DC] px-3 py-2">
              {pwError}
            </p>
          )}

          <button type="submit" disabled={pwSaving} className={BTN}>
            {pwSaving
              ? "Actualizando…"
              : pwSaved
              ? "¡Contraseña actualizada!"
              : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
