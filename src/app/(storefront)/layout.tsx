import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { FooterGate } from "@/components/storefront/FooterGate";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <FooterGate>
        <Footer />
      </FooterGate>
      <WhatsAppButton />
    </>
  );
}
