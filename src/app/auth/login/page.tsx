"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(
        authError.message.includes("Invalid login")
          ? "Email o contraseña incorrectos."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (authError) {
      setError("Error al conectar con Google.");
      setGoogleLoading(false);
    }
  }

  const inputCls = "w-full border border-[#E8DED4] bg-white px-4 py-3 text-sm text-[#1C1B2E] focus:outline-none focus:border-[#766A63] transition-colors placeholder:text-[#DCCFC4]";

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1
          className="text-3xl text-[#1C1B2E] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Bienvenida
        </h1>
        <p className="text-sm text-[#766A63]">Inicia sesión en tu cuenta</p>
      </div>

      <div className="bg-white border border-[#E8DED4] p-8 space-y-5">
        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 border border-[#E8DED4] py-3 text-sm text-[#1C1B2E] hover:border-[#766A63] transition-colors disabled:opacity-50"
        >
          {/* Google icon SVG */}
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

        {/* Email / Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] tracking-[0.18em] uppercase text-[#766A63] font-[600]">
                Contraseña
              </label>
              <Link
                href="/auth/recuperar"
                className="text-[10px] text-[#A0526C] hover:text-[#1C1B2E] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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

          {error && (
            <p className="text-xs text-[#A0526C] bg-[#F5DDE5]/20 border border-[#F5DDE5] px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-[#1C1B2E] text-[#F7F2EC] py-3 text-[11px] tracking-[0.2em] uppercase font-[600] hover:bg-[#A0526C] transition-colors disabled:opacity-50 rounded-full"
          >
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-[#766A63] mt-5">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/registro" className="text-[#A0526C] hover:text-[#1C1B2E] transition-colors font-[500]">
          Regístrate
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
