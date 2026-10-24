"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Heart, User, Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart";
import { useStoreName } from "@/components/StoreNameProvider";

const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/colecciones", label: "Colecciones" },
  { href: "/best-sellers", label: "Best Sellers", hot: true },
  { href: "/nosotras", label: "Conócenos" },
];

export function Navbar() {
  const storeName = useStoreName();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroDark, setHeroDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0)
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Si la página tiene un hero con foto detrás de la barra, los textos van en blanco
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setHeroDark(!!document.querySelector("[data-hero-dark]"))
    );
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/catalogo?q=${encodeURIComponent(q)}`);
  }

  // Transparente arriba; sólida al bajar
  const solid = scrolled;
  const light = heroDark && !solid;
  const ink = light ? "text-white" : "text-[#1F1B19]";
  const muted = light ? "text-white/85 hover:text-white" : "text-[#766A63] hover:text-[#1F1B19]";

  return (
    <>
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        solid
          ? "bg-[#F7F2EC]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(31,27,25,0.12)]"
          : light
          ? "bg-gradient-to-b from-black/40 to-transparent" // degradado suave para que se lea sobre la foto
          : "bg-transparent"
      )}
    >
      <div className="px-4 sm:px-6 lg:px-10">
        {/* Grid 3 columnas: [nav] [logo] [iconos] */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">

          {/* COLUMNA IZQUIERDA */}
          <div className="flex items-center min-w-0">
            {/* Menú de navegación: siempre en el drawer */}
            <button
              className={cn("shrink-0 transition-colors", ink)}
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>

          {/* COLUMNA CENTRAL: Logo — siempre centrado */}
          <Link href="/" className="flex items-center justify-center px-3">
            <span
              className={cn("text-[34px] sm:text-[42px] leading-none select-none whitespace-nowrap transition-colors duration-300", ink)}
              style={{ fontFamily: "var(--font-script)" }}
            >
              {storeName}
            </span>
          </Link>

          {/* COLUMNA DERECHA */}
          <div className="flex items-center justify-end gap-3 sm:gap-4">
            {/* Móvil y tablet (< 1280px): búsqueda + carrito */}
            <div className="xl:hidden flex items-center gap-3">
              <button
                aria-label="Buscar"
                onClick={() => setSearchOpen(true)}
                className={cn(muted, "transition-colors")}
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
              <Link
                href="/carrito"
                aria-label={`Carrito (${itemCount} productos)`}
                className={cn("relative transition-colors", muted)}
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#965C57] text-white text-[9px] font-[600] flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Desktop (≥ 1280px): todos los iconos */}
            <div className="hidden xl:flex items-center gap-4 2xl:gap-5">
              <button
                aria-label="Buscar"
                onClick={() => setSearchOpen(true)}
                className={cn(muted, "transition-colors")}
              >
                <Search size={18} strokeWidth={1.5} />
              </button>

              <Link
                href="/cuenta/wishlist"
                aria-label="Wishlist"
                className={cn(muted, "transition-colors")}
              >
                <Heart size={18} strokeWidth={1.5} />
              </Link>

              <Link
                href="/cuenta"
                aria-label="Mi cuenta"
                className={cn(muted, "transition-colors")}
              >
                <User size={18} strokeWidth={1.5} />
              </Link>

              <Link
                href="/carrito"
                aria-label={`Carrito (${itemCount} productos)`}
                className={cn("relative transition-colors", muted)}
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#965C57] text-white text-[9px] font-[600] flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY DE BÚSQUEDA */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-[#1F1B19]/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative bg-[#F7F2EC] border-b border-[#E8DED4] px-4 sm:px-8 py-5">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex items-center gap-4">
              <Search size={18} className="text-[#766A63] shrink-0" strokeWidth={1.5} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar prendas..."
                className="flex-1 bg-transparent text-lg text-[#1F1B19] placeholder:text-[#DCCFC4] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className={cn(muted, "transition-colors")}
                aria-label="Cerrar búsqueda"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>
      )}

    </header>

    {/* DRAWER DE NAVEGACIÓN — fuera del header para que el desenfoque no limite su posición */}
    <div
      className={cn("fixed inset-0 z-[60]", menuOpen ? "" : "pointer-events-none")}
      aria-hidden={!menuOpen}
    >
      <div
        onClick={() => setMenuOpen(false)}
        className={cn(
          "absolute inset-0 bg-[#1F1B19]/50 backdrop-blur-sm transition-opacity duration-300",
          menuOpen ? "opacity-100" : "opacity-0"
        )}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 w-[85%] max-w-sm bg-[#F7F2EC] shadow-[0_8px_40px_rgba(31,27,25,0.14)] flex flex-col transition-transform duration-300 ease-out",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#E8DED4]">
          <span
            className="text-[26px] text-[#1F1B19] leading-none"
            style={{ fontFamily: "var(--font-script)" }}
          >
            {storeName}
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            tabIndex={menuOpen ? 0 : -1}
            className="text-[#1F1B19]"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              className={cn(
                "text-3xl py-3 border-b border-[#E8DED4] transition-colors",
                pathname === link.href
                  ? "text-[#965C57]"
                  : link.hot
                  ? "text-[#965C57] hover:text-[#1F1B19]"
                  : "text-[#1F1B19] hover:text-[#965C57]"
              )}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-6 py-6 border-t border-[#E8DED4] flex gap-6">
          <Link
            href="/cuenta/wishlist"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
            aria-label="Favoritos"
            className="text-[#766A63] hover:text-[#1F1B19]"
          >
            <Heart size={20} strokeWidth={1.5} />
          </Link>
          <Link
            href="/cuenta"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
            aria-label="Mi cuenta"
            className="text-[#766A63] hover:text-[#1F1B19]"
          >
            <User size={20} strokeWidth={1.5} />
          </Link>
        </div>
      </aside>
    </div>
    </>
  );
}