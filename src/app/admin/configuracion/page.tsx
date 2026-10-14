import { AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { ShippingZoneManager } from "@/components/admin/ShippingZoneManager";
import { HeroSlideManager } from "@/components/admin/HeroSlideManager";
import { NosotrasImageManager } from "@/components/admin/NosotrasImageManager";
import { StoreNameForm } from "@/components/admin/StoreNameForm";
import { NosotrasContentForm } from "@/components/admin/NosotrasContentForm";
import { brand } from "@/lib/config/brand";
import { getStoreName, STORE_NAME_MAX_LENGTH } from "@/lib/config/store-name";
import { getNosotrasRaw, NOSOTRAS_LIMITS } from "@/lib/config/nosotras";

function EnvRow({ label, envKey, secret }: { label: string; envKey: string; secret?: boolean }) {
  const val = process.env[envKey];
  const ok = !!val && val !== "placeholder";
  const display = ok ? (secret ? "••••••••••••" : val) : "No configurado";
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{display}</p>
      </div>
      {ok ? (
        <CheckCircle size={16} className="text-green-500 shrink-0 ml-4" />
      ) : (
        <AlertTriangle size={16} className="text-amber-500 shrink-0 ml-4" />
      )}
    </div>
  );
}

export default async function AdminConfiguracionPage() {
  const [storeName, nosotras] = await Promise.all([getStoreName(), getNosotrasRaw()]);

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <h1 className="text-xl font-semibold text-gray-800">Configuración</h1>

      {/* Nombre de la tienda */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-[600] text-gray-800">Nombre de la tienda</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Los cambios se reflejan en todo el sitio en unos segundos.
          </p>
        </div>
        <StoreNameForm initialName={storeName} maxLength={STORE_NAME_MAX_LENGTH} />
      </div>

      {/* Fotos del banner (hero) */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-[600] text-gray-800">Banner del inicio</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Las fotos rotan automáticamente cada 3 segundos en el banner principal de la tienda.
            Arrastra para reordenar. La primera foto aparece al cargar la página.
          </p>
        </div>
        <HeroSlideManager />
      </div>

      {/* Textos de Nosotras */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-[600] text-gray-800">Textos de Nosotras</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            La historia de la marca en la página <strong>/nosotras</strong> y el resumen del banner del inicio.
          </p>
        </div>
        <NosotrasContentForm initial={nosotras} limits={NOSOTRAS_LIMITS} />
      </div>

      {/* Imagen de Nosotras */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-[600] text-gray-800">Imagen de la página Nosotras</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Foto que aparece junto a la historia de la marca.
          </p>
        </div>
        <NosotrasImageManager />
      </div>

      {/* Tarifas de envío */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-[600] text-gray-800">Tarifas de envío</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Define el costo por zona. El sistema aplica automáticamente el precio según la ciudad del cliente.
            La Zona 3 aplica a todos los municipios no listados en las zonas anteriores.
          </p>
        </div>
        <ShippingZoneManager />
      </div>

      {/* Integraciones */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-[600] text-gray-700">Variables de entorno</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Configuradas en Vercel → Project Settings → Environment Variables
          </p>
        </div>
        <div className="px-5">
          <EnvRow label="URL del sitio" envKey="NEXT_PUBLIC_SITE_URL" />
          <EnvRow label="Supabase URL" envKey="NEXT_PUBLIC_SUPABASE_URL" />
          <EnvRow label="Supabase Anon Key" envKey="NEXT_PUBLIC_SUPABASE_ANON_KEY" secret />
          <EnvRow label="Supabase Service Role Key" envKey="SUPABASE_SERVICE_ROLE_KEY" secret />
          <EnvRow label="Email remitente" envKey="EMAIL_FROM" />
          <EnvRow label="Resend API Key" envKey="RESEND_API_KEY" secret />
          <EnvRow label="Emails admin" envKey="ADMIN_EMAILS" />
          <EnvRow label="Wompi Public Key" envKey="NEXT_PUBLIC_WOMPI_PUBLIC_KEY" />
          <EnvRow label="Wompi Integrity Secret" envKey="WOMPI_INTEGRITY_SECRET" secret />
          <EnvRow label="Wompi Events Secret" envKey="WOMPI_EVENTS_SECRET" secret />
        </div>
      </div>

      {/* Links útiles */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-[600] text-gray-700">Paneles externos</p>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { label: "Supabase Dashboard", href: "https://app.supabase.com" },
            { label: "Vercel Dashboard", href: "https://vercel.com" },
            { label: "Resend Dashboard", href: "https://resend.com" },
            { label: "Wompi Dashboard", href: "https://dashboard.wompi.co" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">{label}</span>
              <ExternalLink size={14} className="text-gray-400" />
            </a>
          ))}
        </div>
      </div>

      {/* Decisiones pendientes */}
      <div className="bg-amber-50 border border-amber-200 rounded p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-[600] text-amber-800 mb-2">
              Decisiones pendientes antes del lanzamiento
            </p>
            <ul className="space-y-1.5 text-xs text-amber-700">
              <li><strong>DP-03</strong> — Responsabilidades tributarias (IVA, facturación electrónica)</li>
              <li><strong>DP-05</strong> — Verificar dominio {brand.domain} en Resend para envío de emails</li>
              <li><strong>DP-09</strong> — Documentos legales: Términos, Privacidad, Datos (Ley 1581/2012)</li>
              <li><strong>DP-10</strong> — Esquema de tarifa de envío en Fase 1</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
