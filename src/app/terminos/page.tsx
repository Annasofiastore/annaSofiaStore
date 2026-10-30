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
    title: "Términos y Condiciones", // el layout agrega el nombre de la tienda
    description: `Términos y condiciones de uso — ${storeName}, ${location}.`,
  };
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
:root{--brown:#221A33;--cream:#F7F2EC;--gold:#A0526C;--text:#221A33;--muted:#766A63;--white:#FFFFFF;--border:#E8DED4;--light-gold:#F5DDE5}
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
.page-wrap{max-width:1040px;margin:0 auto;padding:64px 40px 96px}
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
  <p class="eyebrow">Información legal</p>
  <h1>Términos y Condiciones de Uso</h1>
  <p class="updated">Vigente desde: 25 de junio de 2026</p>
  <div class="gold-line"></div>
</div>
<div class="page-wrap">
  <div class="toc">
    <p class="toc-title">Contenido</p>
    <ol><li><a href="#s1">Identificación del responsable</a></li><li><a href="#s2">Aceptación de los términos</a></li><li><a href="#s3">Objeto del sitio</a></li><li><a href="#s4">Capacidad para contratar</a></li><li><a href="#s5">Productos y precios</a></li><li><a href="#s6">Proceso de compra</a></li><li><a href="#s7">Medios de pago</a></li><li><a href="#s8">Envíos y entregas</a></li><li><a href="#s9">Propiedad intelectual</a></li><li><a href="#s10">Limitación de responsabilidad</a></li><li><a href="#s11">Modificaciones</a></li><li><a href="#s12">Ley aplicable y jurisdicción</a></li><li><a href="#s13">Contacto</a></li></ol>
  </div>
  <div class="section" id="s1"><h2><span class="sec-num">01</span>Identificación del responsable</h2><p>El presente sitio web <strong>www.${brand.domain}</strong> (en adelante, «el Sitio») es operado por <strong>${brand.legal.businessName}</strong>, identificada con NIT <strong>${brand.legal.nit}</strong>, empresa legalmente constituida bajo las leyes colombianas, propietaria de la marca comercial ${storeName.toUpperCase()}, con domicilio principal en la ciudad de ${location}.</p><p>Para comunicarse con nosotras puede hacerlo a través del Sitio o mediante nuestros canales oficiales en Instagram, WhatsApp o correo electrónico, indicados en la sección de contacto.</p></div>
  <div class="section" id="s2"><h2><span class="sec-num">02</span>Aceptación de los términos</h2><p>Al acceder, navegar o realizar compras en este Sitio, usted declara haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones, así como nuestra Política de Privacidad y Política de Devoluciones, las cuales se integran por referencia a este documento.</p><p>Si no está de acuerdo con alguna de estas condiciones, le solicitamos abstenerse de utilizar el Sitio.</p></div>
  <div class="section" id="s3"><h2><span class="sec-num">03</span>Objeto del sitio</h2><p>El Sitio tiene como finalidad ofrecer al público en general información sobre los productos de moda femenina de ${storeName.toUpperCase()}, facilitar la realización de compras en línea y proporcionar canales de contacto y atención al cliente.</p></div>
  <div class="section" id="s4"><h2><span class="sec-num">04</span>Capacidad para contratar</h2><p>Para realizar compras en el Sitio, la usuaria debe:</p><ul><li>Ser mayor de 18 años o contar con autorización de su representante legal.</li><li>Proporcionar información veraz, completa y actualizada al momento de realizar su pedido.</li><li>Disponer de un medio de pago válido y habilitado.</li></ul></div>
  <div class="section" id="s5"><h2><span class="sec-num">05</span>Productos y precios</h2><p>Todos los precios publicados en el Sitio están expresados en Pesos Colombianos (COP) e incluyen el Impuesto al Valor Agregado (IVA) cuando aplique, conforme a la legislación tributaria colombiana vigente.</p><p>${storeName.toUpperCase()} se reserva el derecho de modificar los precios en cualquier momento sin previo aviso. El precio aplicable será el vigente en el momento en que la usuaria confirme su pedido.</p><p>Las imágenes de los productos son de carácter ilustrativo. Si bien hacemos nuestro mejor esfuerzo para representar fielmente los colores y texturas, pueden presentarse ligeras variaciones por condiciones de iluminación o configuración del dispositivo.</p></div>
  <div class="section" id="s6"><h2><span class="sec-num">06</span>Proceso de compra</h2><ol><li>Selección del producto y talla deseados.</li><li>Adición al carrito de compras.</li><li>Ingreso de datos de envío y contacto.</li><li>Selección del método de pago.</li><li>Revisión y confirmación del pedido.</li><li>Recepción de confirmación por correo electrónico o WhatsApp.</li></ol><p>El contrato de compraventa se perfecciona en el momento en que la usuaria recibe la confirmación del pedido por parte de ${storeName.toUpperCase()}.</p></div>
  <div class="section" id="s7"><h2><span class="sec-num">07</span>Medios de pago</h2><ul><li>Tarjeta de crédito y débito (procesado a través de <strong>Wompi</strong>).</li><li>PSE – Pago Seguro en Línea.</li><li>Transferencia bancaria.</li></ul><div class="callout"><strong>Seguridad</strong>Todos los pagos son procesados mediante plataformas con cifrado SSL. ${storeName.toUpperCase()} no almacena información de tarjetas de crédito ni cuentas bancarias.</div></div>
  <div class="section" id="s8"><h2><span class="sec-num">08</span>Envíos y entregas</h2><ul><li><strong>Cartagena de Indias:</strong> servicio de domicilio local, entrega estimada en 1 a 2 días hábiles.</li><li><strong>Otras ciudades de Colombia:</strong> operador logístico externo, entrega estimada en 3 a 5 días hábiles a partir de la confirmación del pago.</li></ul><p>Los tiempos de entrega son estimados y pueden variar por factores externos como congestión logística, condiciones climáticas u otras circunstancias fuera del control de ${storeName.toUpperCase()}.</p></div>
  <div class="section" id="s9"><h2><span class="sec-num">09</span>Propiedad intelectual</h2><p>Todos los contenidos del Sitio —incluyendo textos, fotografías, ilustraciones, logotipos, diseños, nombres comerciales y marcas— son propiedad exclusiva de ${brand.legal.businessName} o de sus proveedores, y están protegidos por la legislación colombiana e internacional sobre propiedad intelectual.</p><p>Queda expresamente prohibida la reproducción, distribución, comunicación pública o transformación de cualquier elemento del Sitio sin autorización expresa y por escrito de ${storeName.toUpperCase()}.</p></div>
  <div class="section" id="s10"><h2><span class="sec-num">10</span>Limitación de responsabilidad</h2><ul><li>Interrupciones o errores técnicos del Sitio ajenos a su control.</li><li>Daños derivados del uso inadecuado del Sitio por parte de la usuaria.</li><li>Retrasos en la entrega imputables a transportadoras o situaciones de fuerza mayor.</li><li>Incompatibilidad del Sitio con el dispositivo o navegador de la usuaria.</li></ul></div>
  <div class="section" id="s11"><h2><span class="sec-num">11</span>Modificaciones</h2><p>${storeName.toUpperCase()} se reserva el derecho de modificar los presentes Términos y Condiciones en cualquier momento. Los cambios serán publicados en este Sitio con indicación de la fecha de actualización. El uso continuado del Sitio implica la aceptación de los nuevos términos.</p></div>
  <div class="section" id="s12"><h2><span class="sec-num">12</span>Ley aplicable y jurisdicción</h2><p>Los presentes Términos y Condiciones se rigen por las leyes de la República de Colombia, en particular por la <strong>Ley 1480 de 2011</strong> (Estatuto del Consumidor), la <strong>Ley 527 de 1999</strong> (Comercio Electrónico) y demás normas aplicables.</p><p>Para cualquier controversia, las partes se someten a la jurisdicción de los jueces competentes de la ciudad de ${location}.</p></div>
  <div class="section" id="s13"><h2><span class="sec-num">13</span>Contacto</h2><div class="contact-card"><h3>¿Tienes preguntas?</h3><ul><li><a href="mailto:${brand.email}"><span class="cc-label">Correo</span>${brand.email}</a></li><li><a href="/"><span class="cc-label">Web</span>${brand.domain}</a></li>${instagramHandle ? `<li><a href="${brand.social.instagram}" target="_blank" rel="noopener noreferrer"><span class="cc-label">Instagram</span>${instagramHandle}</a></li>` : ""}<li><a href="${whatsappUrl}" target="_blank"><span class="cc-label">WhatsApp</span>${whatsappDisplay}</a></li></ul></div></div>
</div>
<footer>
  <div class="footer-inner">
    <div class="footer-brand"><div class="footer-logo">${storeName}</div><p>${brand.description}</p></div>
    <div class="footer-col"><h4>Tienda</h4><ul><li><a href="/catalogo">Catálogo</a></li><li><a href="/colecciones">Colecciones</a></li><li><a href="/cuenta/wishlist">Favoritos</a></li><li><a href="/seguimiento">Seguir mi pedido</a></li></ul></div>
    <div class="footer-col"><h4>Información</h4><ul><li class="footer-active"><a href="/terminos">Términos y condiciones</a></li><li><a href="/privacidad">Política de privacidad</a></li><li><a href="/devoluciones">Política de devoluciones</a></li><li><a href="/nosotras">Conócenos</a></li></ul></div>
  </div>
  <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${storeName}. Todos los derechos reservados. ${location}</span><span>${brand.legal.businessName} · NIT ${brand.legal.nit}</span></div>
</footer>
`;

export default async function TerminosPage() {
  const html = renderHtml(escapeHtml(await getStoreName()));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
