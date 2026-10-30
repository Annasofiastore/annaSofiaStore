import { ImageResponse } from "next/og";
import { brand } from "@/lib/config/brand";
import { getStoreName } from "@/lib/config/store-name";

// Imagen por defecto al compartir el enlace (WhatsApp, Instagram, Facebook…).
// Las fichas de producto ya traen la foto del producto, que tiene prioridad.
export const alt = "Tienda de moda femenina";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const storeName = await getStoreName();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#221A33",
          color: "#F7F2EC",
          padding: "0 80px",
        }}
      >
        <div style={{ width: 96, height: 3, background: "#E8B9C7", marginBottom: 48, display: "flex" }} />
        <div style={{ fontSize: 112, letterSpacing: 2, textAlign: "center", display: "flex" }}>{storeName}</div>
        <div style={{ fontSize: 40, marginTop: 32, color: "#E8B9C7", textAlign: "center", display: "flex" }}>
          {brand.tagline}
        </div>
        <div style={{ width: 96, height: 3, background: "#E8B9C7", marginTop: 48, display: "flex" }} />
      </div>
    ),
    { ...size }
  );
}
