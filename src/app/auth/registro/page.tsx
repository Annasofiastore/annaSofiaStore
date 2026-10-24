"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useStoreName } from "@/components/StoreNameProvider";

export default function RegistroPage() {
  const storeName = useStoreName();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [marketingWhatsapp, setMarketingWhatsapp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const supabase = createClient();

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          phone: form.phone,
          marketing_email: marketingEmail,
          marketing_whatsapp: marketingWhatsapp,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "Ya existe una cuenta con ese email. ¿Quieres iniciar sesión?"
          : authError.message
      );
      setLoading(false);
      return;
    }

    setDone(true);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const inputCls = "w-full border border-[#E8DED4] bg-white px-4 py-3 text-sm text-[#221A33] focus:outline-none focus:border-[#766A63] transition-colors placeholder:text-[#DCCFC4]";

  async function handleResend() {
    setResendLoading(true);
    setResendSent(false);
    await supabase.auth.resend({
      type: "signup",
      email: form.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResendLoading(false);
    setResendSent(true);
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-white border border-[#E8DED4] p-10 space-y-4">
          <div className="text-3xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
            ¡Casi listo!
          </div>
          <p className="text-sm text-[#766A63]">
            Enviamos un correo de confirmación a <strong className="text-[#221A33]">{form.email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <p className="text-xs text-[#DCCFC4]">Revisa también tu carpeta de spam.</p>

          <div className="pt-2 border-t border-[#E8DED4]">
            <p className="text-xs text-[#766A63] mb-3">¿No lo recibiste?</p>
            {resendSent ? (
              <p className="text-xs text-[#766A63] font-[500]">
                ✓ Correo reenviado. Revisa tu bandeja y spam.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-[11px] tracking-[0.18em] uppercase font-[600] text-[#A0526C] hover:text-[#221A33] transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Enviando…" : "Reenviar correo de confirmación"}
              </button>
            )}
          </div>

          <Link
            href="/auth/login"
            className="inline-block text-[11px] tracking-[0.18em] uppercase font-[600] text-[#DCCFC4] hover:text-[#221A33] transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1
          className="text-3xl text-[#221A33] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Crear cuenta
        </h1>
        <p className="text-sm text-[#766A63]">Únete a la comunidad {storeName}</p>
      </div>

      <div className="bg-white border border-[#E8DED4] p-8 space-y-5">
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 border border-[#E8DED4] py-3 text-sm text-[#221A33] hover:border-[#766A63] transition-colors disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          {googleLoading ? "Redirigiendo…" : "Continuar con Google"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E8DED4]" />
          <span className="text-[10px] tracking-[0.15em] uppercase text-[#DCCFC4]">o</span>
          <div className="flex-1 h-px bg-[#E8DED4]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600] mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="María García"
              required
              autoComplete="name"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600] mb-1.5">
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="3XX XXX XXXX"
              required
              autoComplete="tel"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                className={cn(inputCls, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#DCCFC4] hover:text-[#766A63]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600] mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                placeholder="Repite tu contraseña"
                required
                autoComplete="new-password"
                className={cn(inputCls, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#DCCFC4] hover:text-[#766A63]"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Marketing opt-in */}
          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingEmail}
                onChange={(e) => setMarketingEmail(e.target.checked)}
                className="mt-0.5 accent-[#221A33]"
              />
              <span className="text-xs text-[#766A63]">
                Quiero recibir novedades, colecciones y ofertas exclusivas por email.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingWhatsapp}
                onChange={(e) => setMarketingWhatsapp(e.target.checked)}
                className="mt-0.5 accent-[#221A33]"
              />
              <span className="text-xs text-[#766A63]">
                Quiero recibir novedades y ofertas por WhatsApp.
              </span>
            </label>
          </div>

          {error && (
            <p className="text-xs text-[#A0526C] bg-[#F5DDE5]/20 border border-[#F5DDE5] px-3 py-2">
              {error}{" "}
              {error.includes("iniciar sesión") && (
                <Link href="/auth/login" className="underline font-[500]">Ir al login</Link>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-[#221A33] text-[#F7F2EC] py-3 text-[11px] tracking-[0.2em] uppercase font-[600] hover:bg-[#A0526C] transition-colors disabled:opacity-50 rounded-full"
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-[#766A63] mt-5">
        ¿Ya tienes cuenta?{" "}
        <Link href="/auth/login" className="text-[#A0526C] hover:text-[#221A33] transition-colors font-[500]">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
