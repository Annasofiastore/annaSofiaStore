"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, AlertCircle, UserCheck, Clock, Truck } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/utils/format";
import { MUNICIPIOS_POR_DEPARTAMENTO, DEPARTAMENTOS } from "@/lib/data/colombia-municipios";
import type { CheckoutForm } from "@/types";
import { useStoreName } from "@/components/StoreNameProvider";

const CONTRAENTREGA_CITIES = new Set(["Cartagena", "Turbaco"]);

function isEligibleCity(city: string): boolean {
  return CONTRAENTREGA_CITIES.has(city);
}

function getSameDayStatus(): { beforeCutoff: boolean } {
  const now = new Date();
  const colombiaMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() - 5 * 60 + 24 * 60) % (24 * 60);
  return { beforeCutoff: colombiaMinutes < 16 * 60 };
}


export default function CheckoutPage() {
  const storeName = useStoreName();
  const router = useRouter();
  const { items, subtotal, discountAmount, shippingCost, total, sessionId, clearCart, applyPromotion, appliedPromotion } =
    useCartStore();

  const [form, setForm] = useState<CheckoutForm>({
    full_name: "",
    email: "",
    phone: "",
    id_type: "CC",
    id_number: "",
    address: "",
    city: "",
    department: "",
    coupon_code: "",
    terms_accepted: false,
  });
  const [prefilled, setPrefilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "payment">("form");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [existingCustomer, setExistingCustomer] = useState(false);
  const checkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wompi" | "contraentrega">("wompi");
  const [shippingZone, setShippingZone] = useState<{ code: string; name: string; price: number } | null>(null);
  const [wompiData, setWompiData] = useState<{
    publicKey: string;
    currency: string;
    amountInCents: number;
    reference: string;
    redirectUrl: string;
    integritySignature: string;
  } | null>(null);

  useEffect(() => {
    if (items.length === 0) router.replace("/carrito");
  }, [items, router]);

  // Precargar datos del usuario autenticado
  useEffect(() => {
    if (prefilled) return;
    const supabase = createClient();

    async function prefillFromUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates: Partial<CheckoutForm> = {};

      if (user.email) updates.email = user.email;

      // Buscar perfil en customers
      const { data: customer } = await supabase
        .from("customers")
        .select("full_name, phone, id_type, id_number")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (customer) {
        if (customer.full_name) updates.full_name = customer.full_name;
        if (customer.phone) updates.phone = customer.phone;
        if (customer.id_type) updates.id_type = customer.id_type;
        if (customer.id_number) updates.id_number = customer.id_number;
      }

      // Buscar dirección por defecto
      const { data: address } = await supabase
        .from("customer_addresses")
        .select("address, city, department")
        .eq("customer_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (address) {
        if (address.address) updates.address = address.address;
        if (address.department) {
          updates.department = address.department;
          // Solo precargar la ciudad si existe en el listado del departamento
          const municipios = MUNICIPIOS_POR_DEPARTAMENTO[address.department] ?? [];
          if (address.city && municipios.includes(address.city)) {
            updates.city = address.city;
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        setForm((f) => ({ ...f, ...updates }));
        if (updates.city) detectShippingZone(updates.city);
      }
      setPrefilled(true);
    }

    prefillFromUser();
  }, [prefilled]);

  // Detectar zona de envío cuando cambia la ciudad
  const detectShippingZone = useCallback(async (city: string) => {
    if (!city) {
      setShippingZone(null);
      useCartStore.getState().setShippingCost(0);
      return;
    }
    try {
      const res = await fetch(`/api/shipping/zone?city=${encodeURIComponent(city)}`);
      if (res.ok) {
        const zone = await res.json();
        setShippingZone(zone);
        useCartStore.getState().setShippingCost(zone.price);
      }
    } catch { /* silencioso */ }
  }, []);

  const checkExistingCustomer = useCallback((email: string, idNumber: string) => {
    if (prefilled) return; // ya está logueado, no mostrar el banner
    if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);

    const param = email.includes("@") ? `email=${encodeURIComponent(email)}`
      : idNumber.length >= 5 ? `id_number=${encodeURIComponent(idNumber)}`
      : null;

    if (!param) { setExistingCustomer(false); return; }

    checkDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/checkout/check-customer?${param}`);
        const { registered } = await res.json();
        setExistingCustomer(registered);
      } catch { /* silencioso */ }
    }, 700);
  }, [prefilled]);

  function set(field: keyof CheckoutForm, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "email" || field === "id_number") {
        checkExistingCustomer(
          field === "email" ? String(value) : next.email,
          field === "id_number" ? String(value) : next.id_number
        );
      }
      return next;
    });
    if (field === "city" && typeof value === "string") {
      if (!isEligibleCity(String(value))) setPaymentMethod("wompi");
      detectShippingZone(String(value));
    }
    setError(null);
  }

  async function applyCoupon() {
    const code = form.coupon_code?.trim();
    if (!code) { setCouponMsg({ text: "Ingresa un código de cupón", ok: false }); return; }
    if (appliedPromotion) { setCouponMsg({ text: "Ya hay un descuento aplicado", ok: false }); return; }

    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, email: form.email }),
      });
      const data = await res.json();
      if (data.valid) {
        applyPromotion(data.promotion);
        setCouponMsg({ text: `¡Cupón aplicado! −${data.promotion.discount_value}% de descuento`, ok: true });
      } else {
        setCouponMsg({ text: data.message ?? "Código inválido", ok: false });
      }
    } catch {
      setCouponMsg({ text: "Error al validar el cupón", ok: false });
    } finally {
      setCouponLoading(false);
    }
  }

  function validate(): string | null {
    if (!form.full_name.trim()) return "Ingresa tu nombre completo.";
    if (!form.email.includes("@")) return "El correo no es válido.";
    if (form.phone.replace(/\D/g, "").length < 7) return "El teléfono no es válido.";
    if (!form.id_type) return "Selecciona el tipo de documento.";
    if (form.id_number.replace(/\D/g, "").length < 4) return "Ingresa un número de documento válido.";
    if (!form.address.trim()) return "Ingresa tu dirección.";
    if (!form.department) return "Selecciona tu departamento.";
    if (!form.city) return "Selecciona tu ciudad o municipio.";
    if (!form.terms_accepted) return "Debes aceptar los términos y condiciones.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, items, sessionId, total, subtotal, discountAmount, shippingCost, paymentMethod }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al procesar el pedido."); return; }

      if (data.contraentrega) {
        clearCart();
        router.push(`/confirmacion/${data.orderId}`);
        return;
      }

      setWompiData(data.wompi);
      setStep("payment");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const cityEligible = isEligibleCity(form.city);
  const sameDayStatus = getSameDayStatus();

  if (items.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/carrito" className="text-[#6E6680] hover:text-[#1E1B2E] transition-colors">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </Link>
        <h1
          className="text-3xl text-[#1E1B2E]"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          Checkout
        </h1>
      </div>

      {step === "payment" && wompiData ? (
        <WompiWidget data={wompiData} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* ── FORMULARIO ── */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">

            {/* Banner cliente existente */}
            {existingCustomer && (
              <div className="flex items-start gap-3 bg-white border border-[#F2D4DC] px-4 py-3.5">
                <UserCheck size={16} className="text-[#A0647E] shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs text-[#1E1B2E] font-[500]">¿Ya tienes cuenta en {storeName}?</p>
                  <p className="text-[11px] text-[#6E6680] mt-0.5">Inicia sesión para cargar tus datos automáticamente.</p>
                </div>
                <Link
                  href="/auth/login?redirect=/checkout"
                  className="shrink-0 text-[10px] tracking-[0.12em] uppercase font-[600] text-[#A0647E] hover:text-[#1E1B2E] transition-colors whitespace-nowrap"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}

            <Section title="Datos de contacto">
              <Field label="Nombre completo *" id="full_name">
                <Input
                  id="full_name" type="text" autoComplete="name"
                  value={form.full_name}
                  onChange={(v) => set("full_name", v)}
                  placeholder="María García"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Correo electrónico *" id="email">
                  <Input
                    id="email" type="email" autoComplete="email"
                    value={form.email}
                    onChange={(v) => set("email", v)}
                    placeholder="maria@ejemplo.com"
                  />
                </Field>
                <Field label="Teléfono *" id="phone">
                  <Input
                    id="phone" type="tel" autoComplete="tel"
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                    placeholder="3001234567"
                  />
                </Field>
              </div>

              {/* Documento de identidad */}
              <div className="grid grid-cols-5 gap-3">
                <Field label="Tipo *" id="id_type">
                  <select
                    id="id_type"
                    value={form.id_type}
                    onChange={(e) => set("id_type", e.target.value)}
                    className="w-full border border-[#E9DDE3] bg-[#FAF6F7] px-3 py-2.5 text-sm text-[#1E1B2E] outline-none focus:border-[#6E6680] transition-colors"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PPT">PPT</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="NIT">NIT</option>
                  </select>
                </Field>
                <div className="col-span-4">
                  <Field label="Número de documento *" id="id_number">
                    <Input
                      id="id_number" type="text" autoComplete="off"
                      value={form.id_number}
                      onChange={(v) => set("id_number", v)}
                      placeholder="1234567890"
                    />
                  </Field>
                </div>
              </div>
            </Section>

            <Section title="Dirección de envío">
              <Field label="Dirección *" id="address">
                <Input
                  id="address" type="text" autoComplete="street-address"
                  value={form.address}
                  onChange={(v) => set("address", v)}
                  placeholder="Calle 10 # 4-55, Apt 201"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Departamento *" id="department">
                  <select
                    id="department"
                    value={form.department}
                    onChange={(e) => {
                      const dep = e.target.value;
                      setForm((f) => ({ ...f, department: dep, city: "" }));
                      setPaymentMethod("wompi");
                      setError(null);
                    }}
                    className="w-full border border-[#E9DDE3] bg-[#FAF6F7] px-3 py-2.5 text-sm text-[#1E1B2E] outline-none focus:border-[#6E6680] transition-colors"
                  >
                    <option value="">Seleccionar…</option>
                    {DEPARTAMENTOS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Ciudad / Municipio *" id="city">
                  <select
                    id="city"
                    value={form.city}
                    disabled={!form.department}
                    onChange={(e) => set("city", e.target.value)}
                    className="w-full border border-[#E9DDE3] bg-[#FAF6F7] px-3 py-2.5 text-sm text-[#1E1B2E] outline-none focus:border-[#6E6680] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {form.department ? "Seleccionar…" : "Primero el departamento"}
                    </option>
                    {form.department &&
                      (MUNICIPIOS_POR_DEPARTAMENTO[form.department] ?? []).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Código de descuento">
              <div className="flex gap-2">
                <Input
                  id="coupon" type="text"
                  value={form.coupon_code ?? ""}
                  onChange={(v) => { set("coupon_code", v); setCouponMsg(null); }}
                  placeholder="Ej: BIENVENIDA10"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || !!appliedPromotion}
                  className="px-5 py-2.5 border border-[#E9DDE3] text-[11px] tracking-[0.15em] uppercase text-[#6E6680] hover:border-[#6E6680] hover:text-[#1E1B2E] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {couponLoading ? "…" : "Aplicar"}
                </button>
              </div>
              {couponMsg && (
                <p className={`text-xs mt-1.5 ${couponMsg.ok ? "text-green-700" : "text-[#A0647E]"}`}>
                  {couponMsg.text}
                </p>
              )}
            </Section>

            {/* Aviso entrega mismo día + método de pago — solo Cartagena / Turbaco */}
            {cityEligible && (
              <div className="space-y-3">
                {/* Aviso entrega */}
                <div className={`flex items-start gap-3 px-4 py-3 border ${sameDayStatus.beforeCutoff ? "bg-[#FAF6F7] border-[#D9C3CE]" : "bg-white border-[#E9DDE3]"}`}>
                  {sameDayStatus.beforeCutoff ? (
                    <Clock size={15} className="text-[#6E6680] shrink-0 mt-0.5" strokeWidth={1.5} />
                  ) : (
                    <Truck size={15} className="text-[#D9C3CE] shrink-0 mt-0.5" strokeWidth={1.5} />
                  )}
                  <div>
                    {sameDayStatus.beforeCutoff ? (
                      <>
                        <p className="text-xs font-[600] text-[#1E1B2E]">Entrega hoy en Cartagena</p>
                        <p className="text-[11px] text-[#6E6680] mt-0.5">Pedidos antes de las 4:00 PM llegan antes de las 6:00 PM.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-[600] text-[#6E6680]">Pedidos después de las 4:00 PM</p>
                        <p className="text-[11px] text-[#6E6680] mt-0.5">Tu pedido llegará mañana en Cartagena o Turbaco.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Selector método de pago */}
                <div className="space-y-2">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#6E6680] font-[600]">Método de pago</p>
                  <label className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors ${paymentMethod === "wompi" ? "border-[#1E1B2E] bg-[#FAF6F7]" : "border-[#E9DDE3] bg-white hover:border-[#6E6680]"}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="wompi"
                      checked={paymentMethod === "wompi"}
                      onChange={() => setPaymentMethod("wompi")}
                      className="accent-[#1E1B2E]"
                    />
                    <div>
                      <p className="text-sm text-[#1E1B2E] font-[500]">Tarjeta / PSE / Nequi</p>
                      <p className="text-[11px] text-[#6E6680]">Pago en línea seguro via Wompi</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors ${paymentMethod === "contraentrega" ? "border-[#1E1B2E] bg-[#FAF6F7]" : "border-[#E9DDE3] bg-white hover:border-[#6E6680]"}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="contraentrega"
                      checked={paymentMethod === "contraentrega"}
                      onChange={() => setPaymentMethod("contraentrega")}
                      className="accent-[#1E1B2E]"
                    />
                    <div>
                      <p className="text-sm text-[#1E1B2E] font-[500]">Contraentrega</p>
                      <p className="text-[11px] text-[#6E6680]">Pagas en efectivo cuando recibas tu pedido</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Términos — RB-CHK-08 */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.terms_accepted}
                  onChange={(e) => set("terms_accepted", e.target.checked)}
                  className="mt-0.5 accent-[#1E1B2E]"
                />
                <span className="text-xs text-[#6E6680] leading-relaxed">
                  He leído y acepto los{" "}
                  <Link href="/terminos" target="_blank" className="text-[#A0647E] underline underline-offset-2">
                    Términos y Condiciones
                  </Link>
                  , la{" "}
                  <Link href="/privacidad" target="_blank" className="text-[#A0647E] underline underline-offset-2">
                    Política de Privacidad
                  </Link>{" "}
                  y autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.save_address ?? false}
                  onChange={(e) => set("save_address", e.target.checked)}
                  className="mt-0.5 accent-[#1E1B2E]"
                />
                <span className="text-xs text-[#6E6680]">
                  Deseo recibir novedades y ofertas por correo electrónico.
                </span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-[#A0647E] bg-[#F2D4DC]/30 border border-[#F2D4DC] px-4 py-3">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#1E1B2E] text-[#FAF6F7] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#34304A] disabled:bg-[#D9C3CE] disabled:cursor-not-allowed transition-colors"
            >
              {paymentMethod === "contraentrega" ? (
                <Truck size={13} strokeWidth={1.5} />
              ) : (
                <Lock size={13} strokeWidth={1.5} />
              )}
              {submitting
                ? "Procesando…"
                : paymentMethod === "contraentrega"
                ? "Confirmar pedido (pago al recibir)"
                : "Continuar al pago"}
            </button>

            {paymentMethod === "contraentrega" ? (
              <p className="text-[10px] text-center text-[#6E6680] flex items-center justify-center gap-1.5">
                <Truck size={10} /> Ten el efectivo listo cuando llegue tu domicilio
              </p>
            ) : (
              <p className="text-[10px] text-center text-[#6E6680] flex items-center justify-center gap-1.5">
                <Lock size={10} /> Pago seguro procesado por Wompi (Bancolombia)
              </p>
            )}
          </form>

          {/* ── RESUMEN ── */}
          <div className="lg:col-span-2">
            <div className="bg-[#F2D4DC]/15 border border-[#E9DDE3] p-5 sticky top-24">
              <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#6E6680] font-[600] mb-4">
                Tu pedido ({items.length} {items.length === 1 ? "prenda" : "prendas"})
              </h2>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.variantId} className="flex justify-between gap-2 text-xs">
                    <span className="text-[#1E1B2E] leading-snug">
                      {item.productName}{" "}
                      <span className="text-[#6E6680]">× {item.quantity}</span>
                    </span>
                    <span className="text-[#1E1B2E] font-[500] shrink-0">
                      {formatCOP(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E9DDE3] pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-[#6E6680]">
                  <span>Subtotal</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#A0647E]">
                    <span>Descuento</span>
                    <span>−{formatCOP(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6E6680]">
                  <div>
                    <span>Envío</span>
                    {shippingZone && (
                      <p className="text-[10px] text-[#D9C3CE]">{shippingZone.name}</p>
                    )}
                  </div>
                  <span className="text-right text-xs">
                    {shippingCost > 0 ? formatCOP(shippingCost) : (
                      <span className="text-[#D9C3CE]">Selecciona ciudad</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-[600] text-[#1E1B2E] text-base pt-1 border-t border-[#E9DDE3]">
                  <span>Total</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes del formulario ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#6E6680] font-[600] border-b border-[#E9DDE3] pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-[#6E6680] mb-1.5 font-[500]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  id, type, value, onChange, placeholder, autoComplete,
}: {
  id: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoComplete?: string;
}) {
  return (
    <input
      id={id} type={type} value={value} autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-[#E9DDE3] bg-[#FAF6F7] px-3 py-2.5 text-sm text-[#1E1B2E] placeholder:text-[#D9C3CE] outline-none focus:border-[#6E6680] transition-colors"
    />
  );
}

function WompiWidget({ data }: { data: NonNullable<ReturnType<typeof useState<any>>[0]> }) {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="mb-6">
        <h2
          className="text-3xl text-[#1E1B2E] mb-2"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          Completa tu pago
        </h2>
        <p className="text-sm text-[#6E6680]">
          Total a pagar: <strong>{formatCOP(data.amountInCents / 100)}</strong>
        </p>
      </div>

      <form action="https://checkout.wompi.co/p/" method="GET">
        <input type="hidden" name="public-key" value={data.publicKey} />
        <input type="hidden" name="currency" value={data.currency} />
        <input type="hidden" name="amount-in-cents" value={data.amountInCents} />
        <input type="hidden" name="reference" value={data.reference} />
        <input type="hidden" name="redirect-url" value={data.redirectUrl} />
        <input type="hidden" name="signature:integrity" value={data.integritySignature} />

        <button
          type="submit"
          className="w-full py-4 bg-[#1E1B2E] text-[#FAF6F7] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#34304A] transition-colors flex items-center justify-center gap-2"
        >
          <Lock size={13} strokeWidth={1.5} />
          Pagar con Wompi
        </button>
      </form>

      <p className="mt-4 text-[10px] text-[#6E6680]">
        Tarjeta de crédito/débito · PSE · Nequi · Daviplata
      </p>
    </div>
  );
}
