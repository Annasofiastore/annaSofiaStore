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
    title: `Política de Privacidad y Tratamiento de Datos | ${storeName}`,
    description: `Política de Privacidad y Tratamiento de Datos — ${storeName}, ${location}.`,
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
    <li><a href="/nosotras">Nosotras</a></li>
  </ul>
</nav>
<div class="page-hero">
  <p class="eyebrow">Información legal</p>
  <h1>Política de Privacidad y Tratamiento de Datos</h1>
  <p class="updated">Vigente desde: 25 de junio de 2026</p>
  <div class="gold-line"></div>
</div>
<div class="page-wrap">
  <div class="toc">
    <p class="toc-title">Contenido</p>
    <ol><li><a href="#s1">Identificación del responsable</a></li><li><a href="#s2">Datos personales que recopilamos</a></li><li><a href="#s3">Finalidades del tratamiento</a></li><li><a href="#s4">Autorización del titular</a></li><li><a href="#s5">Derechos del titular</a></li><li><a href="#s6">Procedimiento para ejercer sus derechos</a></li><li><a href="#s7">Transferencia y transmisión de datos</a></li><li><a href="#s8">Medidas de seguridad</a></li><li><a href="#s9">Conservación de los datos</a></li><li><a href="#s10">Cookies y tecnologías de rastreo</a></li><li><a href="#s11">Modificaciones a la política</a></li><li><a href="#s12">Contacto y reclamaciones</a></li></ol>
  </div>
  <div class="callout" style="margin-bottom:40px"><strong>Marco legal</strong>En cumplimiento de la <strong>Ley 1581 de 2012</strong> (Ley de Protección de Datos Personales), el <strong>Decreto 1074 de 2015</strong> y demás normas concordantes, ${brand.legal.businessName} adopta la presente Política de Privacidad y Tratamiento de Datos Personales.</div>
  <div class="section" id="s1"><h2><span class="sec-num">01</span>Identificación del responsable del tratamiento</h2><ul><li><strong>Razón social:</strong> ${brand.legal.businessName}</li><li><strong>NIT:</strong> ${brand.legal.nit}</li><li><strong>Marca comercial:</strong> ${storeName.toUpperCase()}</li><li><strong>Domicilio:</strong> Cartagena de Indias, Colombia</li><li><strong>Sitio web:</strong> ${brand.domain}</li><li><strong>Correo:</strong> ${brand.email}</li></ul></div>
  <div class="section" id="s2"><h2><span class="sec-num">02</span>Datos personales que recopilamos</h2><ul><li>Nombre completo.</li><li>Número de teléfono / WhatsApp.</li><li>Correo electrónico.</li><li>Dirección de envío (departamento, ciudad, barrio, dirección, indicaciones adicionales).</li><li>Información del pedido (productos, tallas, historial de compras).</li></ul><p>No recopilamos datos sensibles como información financiera directa, datos biométricos ni documentos de identidad.</p></div>
  <div class="section" id="s3"><h2><span class="sec-num">03</span>Finalidades del tratamiento</h2><ul><li>Gestión, procesamiento y despacho de pedidos.</li><li>Coordinación de envíos y seguimiento de entregas.</li><li>Comunicación sobre el estado del pedido (confirmación, pago, envío).</li><li>Atención de solicitudes, preguntas, quejas, reclamos y garantías.</li><li>Envío de comunicaciones comerciales sobre productos y colecciones (con autorización previa).</li><li>Cumplimiento de obligaciones legales, contables y tributarias.</li><li>Mejora de la experiencia de usuaria y del Sitio web.</li></ul></div>
  <div class="section" id="s4"><h2><span class="sec-num">04</span>Autorización del titular</h2><ul><li>La aceptación de la presente Política al momento de realizar una compra o registrarse en el Sitio.</li><li>La comunicación voluntaria de sus datos a través de nuestros canales de WhatsApp o Instagram.</li></ul><p>La titular puede revocar esta autorización en cualquier momento, sin que ello afecte el cumplimiento de obligaciones legales o contractuales ya adquiridas.</p></div>
  <div class="section" id="s5"><h2><span class="sec-num">05</span>Derechos del titular</h2><ul><li>Conocer, actualizar y rectificar sus datos personales.</li><li>Solicitar prueba de la autorización otorgada.</li><li>Ser informada sobre el uso que se ha dado a sus datos.</li><li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li><li>Revocar la autorización y/o solicitar la supresión de sus datos cuando sea procedente.</li><li>Acceder gratuitamente a sus datos personales tratados.</li></ul></div>
  <div class="section" id="s6"><h2><span class="sec-num">06</span>Procedimiento para ejercer sus derechos</h2><ul><li>Nombre completo e identificación de la titular.</li><li>Descripción clara de la solicitud o reclamo.</li><li>Datos de contacto para respuesta.</li></ul><div class="callout"><strong>Tiempos de respuesta</strong>Consultas: máximo <strong>10 días hábiles</strong>. Reclamos: máximo <strong>15 días hábiles</strong>, prorrogables conforme a la ley.</div></div>
  <div class="section" id="s7"><h2><span class="sec-num">07</span>Transferencia y transmisión de datos</h2><ul><li>Operadores logísticos y empresas de mensajería (exclusivamente para el despacho de pedidos).</li><li>Procesadores de pago (Wompi, PSE) para la gestión segura de transacciones.</li><li>Autoridades competentes cuando sea requerido por ley.</li></ul><p>${storeName.toUpperCase()} <strong>no vende, arrienda ni cede</strong> bases de datos de clientes a terceros para fines comerciales propios de dichos terceros.</p></div>
  <div class="section" id="s8"><h2><span class="sec-num">08</span>Medidas de seguridad</h2><p>${brand.legal.businessName} implementa medidas técnicas, humanas y administrativas razonables para proteger los datos personales. Las transacciones económicas se procesan a través de pasarelas de pago con cifrado SSL.</p></div>
  <div class="section" id="s9"><h2><span class="sec-num">09</span>Conservación de los datos</h2><p>Los datos personales serán conservados durante el tiempo necesario para cumplir con las finalidades del tratamiento y las obligaciones legales aplicables. Una vez cumplidas dichas finalidades, los datos serán eliminados de forma segura.</p></div>
  <div class="section" id="s10"><h2><span class="sec-num">10</span>Cookies y tecnologías de rastreo</h2><p>El Sitio puede utilizar cookies y tecnologías similares para mejorar la experiencia de navegación, analizar el tráfico y personalizar el contenido. Puede configurar su navegador para rechazarlas, aunque esto puede afectar algunas funcionalidades.</p></div>
  <div class="section" id="s11"><h2><span class="sec-num">11</span>Modificaciones a la política</h2><p>${storeName.toUpperCase()} se reserva el derecho de actualizar la presente Política en cualquier momento. Las modificaciones serán publicadas en el Sitio con indicación de la fecha de vigencia.</p></div>
  <div class="section" id="s12"><h2><span class="sec-num">12</span>Contacto y reclamaciones</h2><div class="contact-card"><h3>Ejerce tus derechos</h3><ul><li><a href="mailto:${brand.email}"><span class="cc-label">Correo</span>${brand.email}</a></li><li><a href="/"><span class="cc-label">Web</span>${brand.domain}</a></li><li><a href="${whatsappUrl}" target="_blank"><span class="cc-label">WhatsApp</span>${whatsappDisplay}</a></li><li><a href="https://www.sic.gov.co" target="_blank"><span class="cc-label">SIC</span>www.sic.gov.co</a></li></ul></div></div>
</div>
<footer>
  <div class="footer-inner">
    <div class="footer-brand"><div class="footer-logo">${storeName}</div><p>${brand.description}</p></div>
    <div class="footer-col"><h4>Tienda</h4><ul><li><a href="/catalogo">Catálogo</a></li><li><a href="/colecciones">Colecciones</a></li><li><a href="/cuenta/wishlist">Favoritos</a></li><li><a href="/seguimiento">Seguir mi pedido</a></li></ul></div>
    <div class="footer-col"><h4>Información</h4><ul><li><a href="/terminos">Términos y condiciones</a></li><li class="footer-active"><a href="/privacidad">Política de privacidad</a></li><li><a href="/devoluciones">Política de devoluciones</a></li><li><a href="/nosotras">Nosotras</a></li></ul></div>
  </div>
  <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${storeName}. Todos los derechos reservados. ${location}</span><span>${brand.legal.businessName} · NIT ${brand.legal.nit}</span></div>
</footer>
`;

export default async function PrivacidadPage() {
  const html = renderHtml(escapeHtml(await getStoreName()));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
