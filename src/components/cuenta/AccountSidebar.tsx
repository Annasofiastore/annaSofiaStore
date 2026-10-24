"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Package, Heart, MapPin, User, LogOut } from "lucide-react";

const NAV = [
  { href: "/cuenta", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/cuenta/pedidos", label: "Pedidos", icon: Package },
  { href: "/cuenta/wishlist", label: "Wishlist", icon: Heart },
  { href: "/cuenta/direcciones", label: "Direcciones", icon: MapPin },
  { href: "/cuenta/perfil", label: "Mis datos", icon: User },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function isActive(item: (typeof NAV)[number]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-44 shrink-0">
        <nav className="bg-white border border-[#E8DED4] overflow-hidden">
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-[13px] border-b border-[#F7F2EC] last:border-0 transition-colors ${
                  active
                    ? "bg-[#F7F2EC] text-[#221A33] font-[600]"
                    : "text-[#766A63] hover:bg-[#F7F2EC]/60 hover:text-[#221A33]"
                }`}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#766A63] hover:bg-[#F5DDE5]/20 hover:text-[#A0526C] transition-colors"
          >
            <LogOut size={14} />
            Salir
          </button>
        </nav>
      </aside>

      {/* Mobile top nav */}
      <nav className="md:hidden flex overflow-x-auto gap-1 mb-4 pb-1">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.1em] font-[500] whitespace-nowrap border rounded-full transition-colors ${
                active
                  ? "bg-[#221A33] text-[#F7F2EC] border-[#221A33]"
                  : "bg-white text-[#766A63] border-[#E8DED4] hover:border-[#766A63]"
              }`}
            >
              <item.icon size={12} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.1em] font-[500] whitespace-nowrap border bg-white text-[#766A63] border-[#E8DED4] hover:text-[#A0526C] hover:border-[#A0526C] transition-colors rounded-full"
        >
          <LogOut size={12} />
          Salir
        </button>
      </nav>
    </>
  );
}
