// "Portero" delante de la web estática.
//
// - MANTENIMIENTO = "false" → sirve la web normalmente.
// - MANTENIMIENTO = "true"  → muestra la página "web en reparación" (HTTP 503),
//   salvo para quien tenga la cookie de acceso.
//
// Para obtener la cookie: abrir cualquier página con ?acceso=CLAVE
// (CLAVE = secreto CLAVE_ACCESO en Cloudflare). Dura 30 días.
// Para salir: ?acceso=salir. Si CLAVE_ACCESO no está cargada, no entra nadie.

import sitio from '../src/data/sitio.json';

const COOKIE = 'acceso_web';
const DURACION = 60 * 60 * 24 * 30; // 30 días
const LIBRES = [/^\/admin(\/|$)/, /^\/favicon\.svg$/, /^\/og-imagen\.png$/];

export default {
  async fetch(request, env) {
    if (String(env.MANTENIMIENTO).toLowerCase() !== 'true') {
      return env.ASSETS.fetch(request);
    }

    const url = new URL(request.url);
    if (LIBRES.some((re) => re.test(url.pathname))) {
      return env.ASSETS.fetch(request);
    }

    const clave = env.CLAVE_ACCESO;
    const token = clave ? await hash(`centro-yoga:${clave}`) : null;
    const pedido = url.searchParams.get('acceso');

    if (pedido !== null) {
      url.searchParams.delete('acceso');
      if (pedido === 'salir') {
        return redirigir(url, `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
      }
      if (token && (await iguales(await hash(`centro-yoga:${pedido}`), token))) {
        return redirigir(url, `${COOKIE}=${token}; Path=/; Max-Age=${DURACION}; HttpOnly; Secure; SameSite=Lax`);
      }
      return paginaMantenimiento(true);
    }

    if (token && (await iguales(leerCookie(request, COOKIE), token))) {
      const res = await env.ASSETS.fetch(request);
      const copia = new Response(res.body, res);
      copia.headers.set('X-Robots-Tag', 'noindex, nofollow');
      copia.headers.set('Cache-Control', 'private, no-store');
      return copia;
    }

    return paginaMantenimiento(false);
  },
};

async function hash(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Comparación en tiempo constante (ambos son hashes hex de igual largo).
async function iguales(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

function leerCookie(request, nombre) {
  const header = request.headers.get('Cookie') || '';
  for (const parte of header.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return v.join('=');
  }
  return null;
}

function redirigir(url, cookie) {
  return new Response(null, {
    status: 302,
    headers: { Location: url.pathname + url.search, 'Set-Cookie': cookie, 'Cache-Control': 'no-store' },
  });
}

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function paginaMantenimiento(claveIncorrecta) {
  const nombre = escapar(sitio.nombre);
  const wa = (sitio.whatsapp || '').replace(/\D/g, '');
  const contactos = [
    wa && `<a class="btn btn--wa" href="https://wa.me/${wa}?text=${encodeURIComponent(sitio.whatsapp_mensaje || '¡Hola!')}">WhatsApp</a>`,
    sitio.instagram && `<a class="btn" href="${escapar(sitio.instagram)}">Instagram</a>`,
    sitio.email && `<a class="btn" href="mailto:${escapar(sitio.email)}">${escapar(sitio.email)}</a>`,
  ].filter(Boolean).join('');

  const html = `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${nombre} · Web en preparación</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Nunito+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root { --crema:#faf6ef; --crema-2:#f3ebdd; --terracota:#b5653a; --terracota-osc:#8f4a26; --tinta:#2d2a26; --suave:#5c554c; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 32px 16px;
    font-family: 'Nunito Sans', system-ui, sans-serif; color: var(--tinta); text-align: center;
    background:
      radial-gradient(circle at 80% 15%, rgba(217,150,43,.28), transparent 45%),
      radial-gradient(circle at 15% 85%, rgba(95,122,100,.22), transparent 45%),
      var(--crema-2);
  }
  main { max-width: 560px; }
  .logo { display: block; width: 76px; height: 76px; margin: 0 auto 24px; }
  .eyebrow { display: block; line-height: 1.5; font-size: .8rem; letter-spacing: .16em; text-transform: uppercase; color: var(--terracota-osc); font-weight: 700; }
  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: clamp(2.2rem, 7vw, 3.2rem); line-height: 1.1; margin: .4em 0 .3em; }
  p { font-size: 1.1rem; line-height: 1.6; color: var(--suave); margin: 0 0 1.6em; }
  .acciones { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
  .btn { display: inline-block; padding: .75rem 1.4rem; border-radius: 999px; border: 2px solid var(--terracota); color: var(--terracota-osc); font-weight: 700; text-decoration: none; }
  .btn:hover { background: var(--terracota-osc); border-color: var(--terracota-osc); color: #fff; }
  .btn:focus-visible { outline: 3px solid var(--terracota-osc); outline-offset: 3px; }
  .btn--wa { background: #128c4a; border-color: #128c4a; color: #fff; }
  .btn--wa:hover { background: #0e7a3f; border-color: #0e7a3f; }
  .aviso { margin-top: 28px; font-size: .9rem; color: var(--terracota-osc); }
</style>
</head>
<body>
<main>
  <svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#b5653a"/><g fill="none" stroke="#faf6ef" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M32 18c-6 7-6 17 0 24 6-7 6-17 0-24z"/><path d="M32 42c-5-6-12-9-18-8 1 6 8 10 18 8z"/><path d="M32 42c5-6 12-9 18-8-1 6-8 10-18 8z"/></g></svg>
  <span class="eyebrow">${nombre}</span>
  <h1>Estamos preparando nuestra nueva web</h1>
  <p>Muy pronto vas a encontrar acá los horarios, precios, la formación de profesoras y todas las novedades del centro. Mientras tanto, escribinos:</p>
  ${contactos ? `<div class="acciones">${contactos}</div>` : ''}
  ${claveIncorrecta ? '<p class="aviso">El enlace de acceso no es válido.</p>' : ''}
</main>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '86400',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
