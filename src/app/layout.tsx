import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { brand } from "@/lib/config/brand";
import { getStoreName } from "@/lib/config/store-name";
import { StoreNameProvider } from "@/components/StoreNameProvider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
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
    <html lang="es" className={`h-full ${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-full flex flex-col">
        <StoreNameProvider name={storeName}>{children}</StoreNameProvider>
      </body>
    </html>
  );
}
