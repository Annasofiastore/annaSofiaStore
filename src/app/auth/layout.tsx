import Link from "next/link";
import { location } from "@/lib/config/brand";
import { getStoreName } from "@/lib/config/store-name";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const storeName = await getStoreName();
  return (
    <div className="min-h-screen bg-[#FAF6F7] flex flex-col">
      {/* Header minimal */}
      <header className="py-6 px-8 border-b border-[#E9DDE3]">
        <Link href="/" className="inline-block">
          <span
            className="text-4xl text-[#1E1B2E]"
            style={{ fontFamily: "var(--font-script)" }}
          >
            {storeName}
          </span>
        </Link>
      </header>

      {/* Contenido */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-[10px] tracking-[0.15em] uppercase text-[#D9C3CE]">
        © {new Date().getFullYear()} {storeName} · {location}
      </footer>
    </div>
  );
}
