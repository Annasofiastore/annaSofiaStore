import { getResend, fromAddress, ADMIN_EMAILS } from "./resend";
import { formatCOP, escapeHtml } from "@/lib/utils/format";
import { getStoreName } from "@/lib/config/store-name";
import { brand, siteUrl, location, whatsappUrl } from "@/lib/config/brand";

const SITE_URL = siteUrl;

// ── Wrapper principal — tabla compatible con todos los clientes ────
function emailBase(storeName: string, preheader: string, content: string): string {
  const name = escapeHtml(storeName);
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${name}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#F7F2EC;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- preheader hidden -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F2EC;">
    <tr>
      <td align="center" style="padding:40px 16px 32px;">

        <!-- LOGO -->
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:30px;color:#1C1B2E;letter-spacing:0.02em;">${name}</span>
              </a>
              <div style="width:40px;height:1px;background:#F5DDE5;margin:10px auto 0;"></div>
            </td>
          </tr>
        </table>

        <!-- CARD -->
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #F5DDE5;">
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- FOOTER -->
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;margin-top:24px;">
          <tr>
            <td align="center" style="padding:0 20px;">
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#766A63;line-height:1.7;margin:0;">
                ${name} · ${location}<br>
                <a href="${SITE_URL}" style="color:#766A63;text-decoration:underline;">${brand.domain}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${brand.email}" style="color:#766A63;text-decoration:underline;">${brand.email}</a>
              </p>
              <p style="font-family:Arial,sans-serif;font-size:10px;color:#DCCFC4;margin:8px 0 0;">
                Estás recibiendo este correo porque realizaste una compra o tienes una cuenta en ${name}.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Componentes reutilizables ──────────────────────────────────────
function heading(text: string): string {
  return `<h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-style:italic;font-size:26px;color:#1C1B2E;margin:0 0 8px;line-height:1.3;">${text}</h1>`;
}

function subheading(text: string): string {
  return `<p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#A0526C;font-weight:600;margin:0 0 20px;">${text}</p>`;
}

function bodyText(text: string, extra = ""): string {
  return `<p style="font-family:Arial,sans-serif;font-size:14px;color:#766A63;line-height:1.75;margin:0 0 14px;${extra}">${text}</p>`;
}

function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td style="border-top:1px solid #F5DDE5;font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}

function label(text: string): string {
  return `<p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#DCCFC4;font-weight:600;margin:0 0 6px;">${text}</p>`;
}

function value(text: string): string {
  return `<p style="font-family:Arial,sans-serif;font-size:14px;color:#1C1B2E;font-weight:600;margin:0 0 16px;">${text}</p>`;
}

function cta(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
    <tr>
      <td style="background:#1C1B2E;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;color:#F7F2EC;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function orderHeader(orderNumber: string, status: string, statusColor: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F2EC;margin-bottom:24px;">
    <tr>
      <td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              ${label("Número de pedido")}
              <p style="font-family:Georgia,serif;font-size:18px;color:#1C1B2E;font-weight:600;margin:0;">${orderNumber}</p>
            </td>
            <td align="right" valign="middle">
              <span style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${statusColor};font-weight:700;background:${statusColor}18;border:1px solid ${statusColor}40;padding:4px 10px;">${status}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function itemsTable(items: any[]): string {
  if (!items.length) return "";
  const rows = items.map((item) => {
    const attrs = item.variant_attrs ? Object.values(item.variant_attrs).filter(Boolean).join(" · ") : "";
    return `<tr>
      <td style="font-family:Arial,sans-serif;font-size:13px;color:#1C1B2E;padding:10px 0;border-bottom:1px solid #F7F2EC;">
        <span style="font-weight:500;">${item.product_name}</span>${attrs ? `<br><span style="font-size:11px;color:#766A63;">${attrs}</span>` : ""}
        <span style="color:#A0526C;font-size:12px;"> &nbsp;×${item.quantity}</span>
      </td>
      <td align="right" style="font-family:Arial,sans-serif;font-size:13px;color:#1C1B2E;font-weight:600;padding:10px 0;border-bottom:1px solid #F7F2EC;white-space:nowrap;">
        ${formatCOP(item.total_price)}
      </td>
    </tr>`;
  }).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`;
}

function totalsTable(order: any): string {
  const hasDiscount = order.discount_amount > 0;
  const hasShipping = order.shipping_cost > 0;
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
    <tr>
      <td style="font-family:Arial,sans-serif;font-size:13px;color:#766A63;padding:8px 0 4px;">Subtotal</td>
      <td align="right" style="font-family:Arial,sans-serif;font-size:13px;color:#766A63;padding:8px 0 4px;">${formatCOP(order.subtotal)}</td>
    </tr>
    ${hasDiscount ? `<tr>
      <td style="font-family:Arial,sans-serif;font-size:13px;color:#A0526C;padding:4px 0;">Descuento</td>
      <td align="right" style="font-family:Arial,sans-serif;font-size:13px;color:#A0526C;padding:4px 0;">−${formatCOP(order.discount_amount)}</td>
    </tr>` : ""}
    ${hasShipping ? `<tr>
      <td style="font-family:Arial,sans-serif;font-size:13px;color:#766A63;padding:4px 0;">Envío</td>
      <td align="right" style="font-family:Arial,sans-serif;font-size:13px;color:#766A63;padding:4px 0;">${formatCOP(order.shipping_cost)}</td>
    </tr>` : ""}
    <tr>
      <td style="border-top:1px solid #F5DDE5;"></td>
      <td style="border-top:1px solid #F5DDE5;"></td>
    </tr>
    <tr>
      <td style="font-family:Georgia,serif;font-size:16px;color:#1C1B2E;font-weight:600;padding:12px 0 0;">Total</td>
      <td align="right" style="font-family:Georgia,serif;font-size:16px;color:#1C1B2E;font-weight:600;padding:12px 0 0;">${formatCOP(order.total)}</td>
    </tr>
  </table>`;
}

function shippingBlock(order: any): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F2EC;margin-top:16px;">
    <tr>
      <td style="padding:16px 20px;">
        ${label("Dirección de entrega")}
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#1C1B2E;margin:0;line-height:1.6;">
          <strong>${order.shipping_name}</strong><br>
          ${order.shipping_address}<br>
          ${order.shipping_city}, ${order.shipping_department}<br>
          <span style="color:#766A63;">${order.shipping_phone}</span>
        </p>
      </td>
    </tr>
  </table>`;
}

// ══════════════════════════════════════════════════════════════════
// PLANTILLAS
// ══════════════════════════════════════════════════════════════════

// 1. Confirmación de pedido a la clienta — RB-PED-03
export async function sendOrderConfirmationEmail(order: any) {
  const storeName = await getStoreName();
  const items = order.items ?? [];
  const trackUrl = `${SITE_URL}/seguimiento?orden=${order.order_number}&email=${encodeURIComponent(order.shipping_email)}`;

  const content = `
    ${subheading("Confirmación de pedido")}
    ${heading("¡Gracias por tu compra!")}
    ${bodyText(`Hola <strong style="color:#1C1B2E;">${order.shipping_name}</strong>, tu pedido está confirmado y ya estamos preparándolo con cariño para ti.`)}
    ${divider()}
    ${orderHeader(order.order_number, "Confirmado", "#3D7A3D")}
    ${label("Tus prendas")}
    ${itemsTable(items)}
    ${totalsTable(order)}
    ${divider()}
    ${shippingBlock(order)}
    ${cta("Seguir mi pedido", trackUrl)}
    ${divider()}
    ${bodyText(`¿Tienes alguna pregunta? Escríbenos por <a href='${whatsappUrl}' style='color:#A0526C;'>WhatsApp</a> o a <a href='mailto:${brand.email}' style='color:#A0526C;'>${brand.email}</a>.`, "font-size:12px;")}
  `;

  return getResend().emails.send({
    from: fromAddress(storeName),
    to: order.shipping_email,
    subject: `Tu pedido ${order.order_number} está confirmado — ${storeName}`,
    html: emailBase(storeName, `Tu pedido ${order.order_number} fue confirmado. Ya estamos preparándolo.`, content),
  });
}

// 2. Notificación a los 3 admins — RB-PED-05
export async function sendNewOrderAdminEmail(order: any) {
  const storeName = await getStoreName();
  if (!ADMIN_EMAILS.length) return;
  const items = order.items ?? [];
  const adminUrl = `${SITE_URL}/admin/pedidos/${order.id}`;

  const content = `
    ${subheading("Panel administrativo")}
    ${heading("Nuevo pedido recibido")}
    ${orderHeader(order.order_number, "Pendiente preparación", "#A0526C")}
    ${label("Clienta")}
    ${value(order.shipping_name)}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr>
        <td style="font-family:Arial,sans-serif;font-size:13px;color:#766A63;">
          <a href="mailto:${order.shipping_email}" style="color:#A0526C;">${order.shipping_email}</a>&nbsp;&nbsp;·&nbsp;&nbsp;
          <a href="tel:${order.shipping_phone}" style="color:#766A63;text-decoration:none;">${order.shipping_phone}</a>
        </td>
      </tr>
    </table>
    ${divider()}
    ${label("Prendas")}
    ${itemsTable(items)}
    ${totalsTable(order)}
    ${divider()}
    ${shippingBlock(order)}
    ${cta("Ver pedido en el admin", adminUrl)}
  `;

  return getResend().emails.send({
    from: fromAddress(storeName),
    to: ADMIN_EMAILS,
    subject: `[Nuevo pedido] ${order.order_number} — ${formatCOP(order.total)}`,
    html: emailBase(storeName, `Nuevo pedido de ${order.shipping_name} por ${formatCOP(order.total)}.`, content),
  });
}

// 3. Pago rechazado — RB-CHK-05
export async function sendPaymentFailedEmail(order: any) {
  const storeName = await getStoreName();
  const content = `
    ${subheading("Estado del pago")}
    ${heading("No pudimos procesar tu pago")}
    ${bodyText(`Hola <strong style="color:#1C1B2E;">${order.shipping_name}</strong>, lamentablemente el pago de tu pedido <strong style="color:#1C1B2E;">${order.order_number}</strong> no pudo completarse.`)}
    ${bodyText("Esto puede ocurrir por fondos insuficientes, datos incorrectos o un rechazo temporal del banco. Tus productos siguen disponibles.")}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F2EC;">
      <tr>
        <td style="padding:16px 20px;">
          ${label("¿Qué puedes hacer?")}
          <ul style="font-family:Arial,sans-serif;font-size:13px;color:#766A63;line-height:1.8;margin:8px 0 0;padding-left:18px;">
            <li>Verificar los datos de tu tarjeta</li>
            <li>Intentar con otro método de pago (PSE, Nequi, Daviplata)</li>
            <li>Contactar a tu banco</li>
          </ul>
        </td>
      </tr>
    </table>
    ${cta("Volver al carrito", `${SITE_URL}/carrito`)}
    ${divider()}
    ${bodyText(`¿Necesitas ayuda? Escríbenos por <a href='${whatsappUrl}' style='color:#A0526C;'>WhatsApp</a>.`, "font-size:12px;")}
  `;

  return getResend().emails.send({
    from: fromAddress(storeName),
    to: order.shipping_email,
    subject: `Problema con tu pago — ${storeName}`,
    html: emailBase(storeName, "Tu pago no pudo procesarse. Tus productos siguen disponibles.", content),
  });
}

// 4. Cambios de estado del pedido — RB-PED-03
export async function sendOrderStatusEmail(order: any, newStatus: string) {
  const storeName = await getStoreName();
  const trackUrl = `${SITE_URL}/seguimiento?orden=${order.order_number}&email=${encodeURIComponent(order.shipping_email)}`;

  const configs: Record<string, { preheader: string; badge: string; badgeColor: string; title: string; body: string; extra?: string }> = {
    preparing: {
      preheader: `Tu pedido ${order.order_number} está siendo preparado.`,
      badge: "En preparación",
      badgeColor: "#7B5EA7",
      title: "Estamos preparando tu pedido",
      body: `¡Buenas noticias! Estamos empacando tu pedido <strong style="color:#1C1B2E;">${order.order_number}</strong> con mucho cariño. Te notificaremos cuando sea despachado.`,
    },
    shipped: {
      preheader: `Tu pedido ${order.order_number} va en camino.`,
      badge: "En camino",
      badgeColor: "#1A7FA8",
      title: "Tu pedido va en camino",
      body: `Tu pedido <strong style="color:#1C1B2E;">${order.order_number}</strong> fue entregado al courier y está en camino hacia ti.${order.tracking_number ? ` Número de guía: <strong style="color:#1C1B2E;">${order.tracking_number}</strong>${order.courier ? ` (${order.courier})` : ""}.` : ""} Tiempo estimado: 3–5 días hábiles.`,
    },
    delivered: {
      preheader: `Tu pedido ${order.order_number} fue entregado. ¡Disfrútalo!`,
      badge: "Entregado",
      badgeColor: "#3D7A3D",
      title: "¡Tu pedido llegó!",
      body: `Tu pedido <strong style="color:#1C1B2E;">${order.order_number}</strong> fue entregado exitosamente. Esperamos que ames tus nuevas prendas.`,
      extra: `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F2EC;margin-top:20px;"><tr><td style="padding:16px 20px;text-align:center;"><p style="font-family:Georgia,serif;font-style:italic;font-size:15px;color:#1C1B2E;margin:0;">"Vístete con intención, vive con propósito."</p></td></tr></table>`,
    },
  };

  const cfg = configs[newStatus];
  if (!cfg) return;

  const content = `
    ${subheading("Actualización de pedido")}
    ${heading(cfg.title)}
    ${orderHeader(order.order_number, cfg.badge, cfg.badgeColor)}
    ${bodyText(cfg.body)}
    ${cfg.extra ?? ""}
    ${divider()}
    ${shippingBlock(order)}
    ${cta("Ver estado del pedido", trackUrl)}
    ${divider()}
    ${bodyText(`¿Preguntas? Escríbenos por <a href='${whatsappUrl}' style='color:#A0526C;'>WhatsApp</a>.`, "font-size:12px;")}
  `;

  return getResend().emails.send({
    from: fromAddress(storeName),
    to: order.shipping_email,
    subject: cfg.preheader.replace(".", " —") + ` ${storeName}`,
    html: emailBase(storeName, cfg.preheader, content),
  });
}

// 5. Bienvenida — nueva cuenta registrada
export async function sendWelcomeEmail(email: string, name: string) {
  const storeName = await getStoreName();
  const content = `
    ${subheading(`Bienvenida a ${escapeHtml(storeName)}`)}
    ${heading(`Hola, ${name || "bienvenida"} ✨`)}
    ${bodyText(`Nos alegra que formes parte de nuestra comunidad. En ${escapeHtml(storeName)} encontrarás moda femenina con alma costera, pensada para mujeres que viven con estilo e intención.`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F2EC;">
      <tr>
        <td style="padding:20px;">
          ${label("Con tu cuenta puedes")}
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
            ${[
              ["Seguir tus pedidos en tiempo real", "📦"],
              ["Guardar tus prendas favoritas en tu wishlist", "💛"],
              ["Guardar tus direcciones de envío", "📍"],
            ].map(([txt, icon]) => `<tr><td style="font-family:Arial,sans-serif;font-size:13px;color:#766A63;padding:5px 0;">${icon}&nbsp; ${txt}</td></tr>`).join("")}
          </table>
        </td>
      </tr>
    </table>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF6F1;border:1px dashed #F5DDE5;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#A0526C;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 10px;">Tu regalo de bienvenida</p>
          <p style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:26px;color:#1C1B2E;margin:0 0 6px;">10% de descuento</p>
          <p style="font-family:Arial,sans-serif;font-size:13px;color:#766A63;margin:0 0 14px;">en tu primer pedido</p>
          <div style="display:inline-block;background:#1C1B2E;padding:10px 24px;">
            <span style="font-family:monospace;font-size:18px;color:#F7F2EC;font-weight:700;letter-spacing:0.15em;">BIENVENIDA10</span>
          </div>
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#DCCFC4;margin:12px 0 0;">Aplica el código al hacer checkout · 1 uso por cuenta</p>
        </td>
      </tr>
    </table>
    ${cta("Explorar el catálogo", `${SITE_URL}/catalogo`)}
    ${divider()}
    ${bodyText(`¿Tienes dudas? Escríbenos por <a href='${whatsappUrl}' style='color:#A0526C;'>WhatsApp</a> o a <a href='mailto:${brand.email}' style='color:#A0526C;'>${brand.email}</a>.`, "font-size:12px;")}
  `;

  return getResend().emails.send({
    from: fromAddress(storeName),
    to: email,
    subject: `Bienvenida a ${storeName} — tu 10% de descuento está aquí`,
    html: emailBase(storeName, "Tu cuenta está lista + 10% off en tu primer pedido con BIENVENIDA10", content),
  });
}
