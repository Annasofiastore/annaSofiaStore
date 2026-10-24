import Link from "next/link";
import { location } from "@/lib/config/brand";
import { getStoreName } from "@/lib/config/store-name";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const storeName = await getStoreName();
  return (
    <div className="min-h-screen bg-[#F7F2EC] flex flex-col">
      {/* Header minimal */}
      <header className="py-6 px-8 border-b border-[#E8DED4]">
        <Link href="/" className="inline-block">
          <span
            className="text-4xl text-[#1C1B2E]"
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

      <footer className="py-4 text-center text-[10px] tracking-[0.15em] uppercase text-[#DCCFC4]">
        © {new Date().getFullYear()} {storeName} · {location}
      </footer>
    </div>
  );
}
