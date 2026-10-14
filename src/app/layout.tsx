import type { Metadata } from "next";
import { Lora, Montserrat, Parisienne } from "next/font/google";
import { brand } from "@/lib/config/brand";
import { getStoreName } from "@/lib/config/store-name";
import { StoreNameProvider } from "@/components/StoreNameProvider";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

// Manuscrita para el nombre de la tienda, en línea con el logo
const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-parisienne",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const storeName = await getStoreName();
  return {
    title: {
      default: `${storeName} — ${brand.tagline}`,
      template: `%s | ${storeName}`,
    },
    description: brand.description,
    keywords: [...brand.keywords],
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
    },
    openGraph: {
      type: "website",
      locale: brand.locale,
      siteName: storeName,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeName = await getStoreName();

  return (
    <html lang="es" className={`h-full ${lora.variable} ${montserrat.variable} ${parisienne.variable}`}>
      <body className="min-h-full flex flex-col">
        <StoreNameProvider name={storeName}>{children}</StoreNameProvider>
      </body>
    </html>
  );
}
