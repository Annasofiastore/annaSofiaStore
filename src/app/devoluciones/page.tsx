import type { Metadata } from "next";
import {
  brand,
  location,
  whatsappUrl,
  whatsappDisplay,
  instagramHandle,
} from "@/lib/config/brand";
import { getStoreName } from "@/lib/config/store-name";
import { escapeHtml } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  const storeName = await getStoreName();
  return {
    title: `Política de Devoluciones y Cambios | ${storeName}`,
    description: `Política de Devoluciones y Cambios — ${storeName}, ${location}.`,
  };
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
:root{--brown:#1E1B2E;--cream:#FAF6F7;--gold:#A0647E;--text:#1E1B2E;--muted:#6E6680;--white:#FFFFFF;--border:#E9DDE3;--light-gold:#F2D4DC}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Cormorant Garamond','Georgia',serif;background:var(--cream);color:var(--text);font-size:17px;line-height:1.75}
a{color:var(--brown);text-decoration:none}
a:hover{color:var(--gold)}
.section p a,.section li a{color:var(--brown);text-decoration:underline;text-decoration-color:var(--gold);text-underline-offset:3px}
.section p a:hover,.section li a:hover{color:var(--gold)}
.toc ol{color:var(--brown)}
.callout a{color:var(--brown);text-decoration:underline;text-decoration-color:var(--gold)}
nav{background:var(--white);border-bottom:1px solid var(--border);padding:0 40px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:100}
.nav-logo{font-family:'Cormorant Garamond',serif;font-size:20px;letter-spacing:.15em;font-weight:600;color:var(--brown);text-decoration:none;text-transform:uppercase}
.nav-links{display:flex;gap:32px;list-style:none}
.nav-links a{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--brown);text-decoration:none;opacity:.75;transition:opacity .2s}
.nav-links a:hover{opacity:1}
.page-hero{background:var(--brown);color:var(--white);text-align:center;padding:72px 40px 56px}
.page-hero .eyebrow{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:16px}
.page-hero h1{font-size:clamp(28px,5vw,46px);font-weight:400;letter-spacing:.03em;line-height:1.2;margin-bottom:16px}
.page-hero .updated{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;opacity:.5;letter-spacing:.06em}
.gold-line{width:48px;height:2px;background:var(--gold);margin:24px auto 0}
.page-wrap{max-width:780px;margin:0 auto;padding:64px 32px 96px}
.toc{background:var(--white);border:1px solid var(--border);border-left:3px solid var(--gold);padding:28px 32px;margin-bottom:56px;border-radius:2px}
.toc-title{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.toc ol{padding-left:20px}
.toc ol li{margin-bottom:6px}
.toc a{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:var(--brown);text-decoration:none;opacity:.8;transition:opacity .2s}
.toc a:hover{opacity:1;color:var(--gold)}
.section{margin-bottom:52px;scroll-margin-top:88px}
.section h2{font-size:22px;font-weight:500;letter-spacing:.02em;color:var(--brown);margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.section h2 .sec-num{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:var(--gold);letter-spacing:.1em;display:block;margin-bottom:4px}
.section p{margin-bottom:14px;color:var(--text)}
.section ul,.section ol{padding-left:22px;margin:12px 0 18px}
.section li{margin-bottom:8px;color:var(--text)}
.callout{background:var(--light-gold);border-left:3px solid var(--gold);padding:20px 24px;margin:28px 0;border-radius:2px;font-size:15px}
.callout strong{display:block;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--gold);margin-bottom:6px}
.contact-card{background:var(--brown);color:var(--white);padding:32px 36px;border-radius:2px;margin-top:40px}
.contact-card h3{font-size:18px;font-weight:400;letter-spacing:.04em;margin-bottom:18px;color:var(--gold)}
.contact-card ul{list-style:none;padding:0}
.contact-card li{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.8);margin-bottom:10px;display:flex;align-items:center;gap:10px}
.contact-card li::before{content:'—';color:var(--gold);flex-shrink:0}
.contact-card a,.contact-card li a,.contact-card ul li a{color:#FFFFFF!important;text-decoration:none;font-weight:500}
.contact-card a:hover,.contact-card li a:hover{color:var(--gold)!important;text-decoration:underline;text-decoration-color:var(--gold)}
footer{background:var(--brown);color:rgba(255,255,255,.6);padding:48px 40px}
.footer-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:40px;padding-bottom:40px;border-bottom:1px solid rgba(255,255,255,.1)}
.footer-brand p{font-size:14px;max-width:280px;line-height:1.7;margin-top:10px}
.footer-logo{font-family:'Cormorant Garamond',serif;font-size:18px;letter-spacing:.15em;font-weight:600;color:var(--white);text-transform:uppercase}
.footer-col h4{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:16px}
.footer-col ul{list-style:none}
.footer-col li{margin-bottom:10px}
.footer-col a{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.6);text-decoration:none;transition:color .2s}
.footer-col a:hover{color:var(--white)}
.footer-active a{color:var(--gold)!important}
.footer-bottom{max-width:1100px;margin:24px auto 0;display:flex;justify-content:space-between;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;flex-wrap:wrap;gap:8px}
.contact-card ul li a{display:flex;align-items:baseline;gap:6px;color:rgba(255,255,255,.95)!important;text-decoration:none!important;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6}
.contact-card ul li a:hover{color:var(--gold)!important}
.cc-label{color:rgba(255,255,255,.55);flex-shrink:0;min-width:80px}
@media(max-width:680px){nav{padding:0 20px}.nav-links{gap:16px}.page-wrap{padding:40px 20px 64px}.footer-inner{grid-template-columns:1fr 1fr}.footer-brand{grid-column:1/-1}}
@media(max-width:440px){.nav-links{display:none}.footer-inner{grid-template-columns:1fr}}
`;

const renderHtml = (storeName: string) => `
<nav>
  <a href="/" class="nav-logo">${storeName}</a>
  <ul class="nav-links">
    <li><a href="/catalogo">Catálogo</a></li>
    <li><a href="/colecciones">Colecciones</a></li>
    <li><a href="/best-sellers">Best Sellers</a></li>
    <li><a href="/nosotras">Conócenos</a></li>
  </ul>
</nav>
<div class="page-hero">
  <p class="eyebrow">Compras y Logística</p>
  <h1>Política de Devoluciones y Cambios</h1>
  <p class="updated">Vigente desde: 25 de junio de 2026</p>
  <div class="gold-line"></div>
</div>
<div class="page-wrap">
  <div class="toc">
    <p class="toc-title">Contenido</p>
    <ol><li><a href="#s1">Cambios por talla o color</a></li><li><a href="#s2">Devoluciones por defecto de fábrica</a></li><li><a href="#s3">Proceso general de cambio o devolución</a></li><li><a href="#s4">Costos de envío</a></li><li><a href="#s5">Reembolsos</a></li><li><a href="#s6">Productos excluidos</a></li><li><a href="#s7">Cancelación de pedidos</a></li><li><a href="#s8">Marco legal</a></li><li><a href="#s9">Contacto</a></li></ol>
  </div>
  <div class="callout" style="margin-bottom:40px"><strong>Nuestro compromiso</strong>Esta política se enmarca en el <strong>Estatuto del Consumidor colombiano (Ley 1480 de 2011)</strong>.</div>
  <div class="section" id="s1"><h2><span class="sec-num">01</span>Cambios por talla o color</h2><ul><li>El cambio debe solicitarse dentro de los <strong>15 días hábiles</strong> siguientes a la recepción del producto.</li><li>El producto debe estar sin uso, sin lavado, con etiquetas originales y empaque intacto.</li><li>No debe presentar manchas, olores, desgaste ni signos de uso.</li></ul><p>Contáctanos por WhatsApp o Instagram indicando: número de pedido, producto, talla/color adquirido y talla/color deseado. La disponibilidad queda sujeta al stock existente al momento del cambio.</p></div>
  <div class="section" id="s2"><h2><span class="sec-num">02</span>Devoluciones por defecto de fábrica</h2><ul><li>Cambio del producto por uno igual o equivalente, sujeto a disponibilidad.</li><li>Reembolso total del valor pagado si no existe reposición posible.</li></ul><div class="callout"><strong>¿Cómo reportarlo?</strong>Contáctanos dentro de los <strong>15 días hábiles</strong> siguientes a la recepción, adjuntando fotografías que evidencien el defecto.</div></div>
  <div class="section" id="s3"><h2><span class="sec-num">03</span>Proceso general de cambio o devolución</h2><ol><li>Contactar a ${storeName.toUpperCase()} por WhatsApp o Instagram dentro del plazo establecido.</li><li>Indicar número de pedido, descripción del producto y motivo.</li><li>En caso de defecto, adjuntar fotografías que evidencien el problema.</li><li>${storeName.toUpperCase()} responderá dentro de los <strong>2 días hábiles</strong> siguientes.</li><li>Se indicarán las instrucciones para el envío del producto.</li><li>El producto debe enviarse sin uso, con etiquetas y empaque original.</li><li>Una vez verificado, se procederá con el cambio o reembolso.</li></ol></div>
  <div class="section" id="s4"><h2><span class="sec-num">04</span>Costos de envío en cambios y devoluciones</h2><p><strong>Cambio por talla o color (sin defecto):</strong></p><ul><li>El costo del envío de devolución será asumido por la clienta.</li><li>El envío del nuevo producto será coordinado y su costo informado al momento del cambio.</li></ul><p><strong>Defecto de fábrica comprobado:</strong></p><ul><li>${storeName.toUpperCase()} asumirá los costos de logística de recolección y reenvío.</li></ul></div>
  <div class="section" id="s5"><h2><span class="sec-num">05</span>Reembolsos</h2><ul><li>Defecto de fábrica confirmado cuando no sea posible la reposición del producto.</li><li>Cancelación del pedido antes de que haya sido despachado.</li></ul><div class="callout"><strong>Tiempo de acreditación</strong>Los reembolsos se realizan por el mismo medio de pago dentro de los <strong>5 días hábiles</strong> siguientes a la aprobación. El tiempo puede variar según la entidad bancaria.</div></div>
  <div class="section" id="s6"><h2><span class="sec-num">06</span>Productos excluidos</h2><ul><li>Ropa interior y trajes de baño.</li><li>Accesorios que hayan estado en contacto directo con la piel.</li><li>Productos en promoción o liquidación marcados como «venta final».</li></ul></div>
  <div class="section" id="s7"><h2><span class="sec-num">07</span>Cancelación de pedidos</h2><p>La clienta podrá cancelar su pedido sin penalidad siempre que no haya sido despachado. Una vez entregado a la transportadora, se aplicarán las condiciones de devolución de esta política.</p></div>
  <div class="section" id="s8"><h2><span class="sec-num">08</span>Marco legal</h2><p>La presente política se enmarca en la <strong>Ley 1480 de 2011</strong> (Estatuto del Consumidor de Colombia). Ante controversias no resueltas, la consumidora podrá acudir a la Superintendencia de Industria y Comercio en <a href="https://www.sic.gov.co" target="_blank">www.sic.gov.co</a>.</p></div>
  <div class="section" id="s9"><h2><span class="sec-num">09</span>Contacto</h2><div class="contact-card"><h3>Gestiona tu cambio o devolución</h3><ul><li><a href="mailto:${brand.email}"><span class="cc-label">Correo</span>${brand.email}</a></li><li><a href="${whatsappUrl}" target="_blank"><span class="cc-label">WhatsApp</span>${whatsappDisplay}</a></li>${instagramHandle ? `<li><a href="${brand.social.instagram}" target="_blank" rel="noopener noreferrer"><span class="cc-label">Instagram</span>${instagramHandle}</a></li>` : ""}<li><a href="#"><span class="cc-label">Atención</span>Lunes a sábado, horario comercial</a></li></ul></div></div>
</div>
<footer>
  <div class="footer-inner">
    <div class="footer-brand"><div class="footer-logo">${storeName}</div><p>${brand.description}</p></div>
    <div class="footer-col"><h4>Tienda</h4><ul><li><a href="/catalogo">Catálogo</a></li><li><a href="/colecciones">Colecciones</a></li><li><a href="/cuenta/wishlist">Favoritos</a></li><li><a href="/seguimiento">Seguir mi pedido</a></li></ul></div>
    <div class="footer-col"><h4>Información</h4><ul><li><a href="/terminos">Términos y condiciones</a></li><li><a href="/privacidad">Política de privacidad</a></li><li class="footer-active"><a href="/devoluciones">Política de devoluciones</a></li><li><a href="/nosotras">Conócenos</a></li></ul></div>
  </div>
  <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${storeName}. Todos los derechos reservados. ${location}</span><span>${brand.legal.businessName} · NIT ${brand.legal.nit}</span></div>
</footer>
`;

export default async function DevolucionesPage() {
  const html = renderHtml(escapeHtml(await getStoreName()));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
