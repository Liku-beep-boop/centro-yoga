# Web del centro de yoga

Sitio estático hecho con [Astro](https://astro.build) y editable desde un panel web ([Sveltia CMS](https://github.com/sveltia/sveltia-cms)) en `/admin`.
El contenido vive en este repo; cada cambio guardado desde el panel hace un commit y Cloudflare Pages vuelve a publicar la web en ~1 minuto.

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
```

### Probar el panel en local
1. `npm run dev` y abrir `http://localhost:4321/admin/` en **Chrome o Edge**.
2. Elegir **"Work with Local Repository"** y seleccionar la carpeta del proyecto.
3. Los cambios se escriben directo en los archivos; el sitio en `localhost:4321` se actualiza solo.

## Dónde está cada cosa

| Qué | Archivo | En el panel |
|---|---|---|
| Entradas del blog | `src/content/blog/*.md` | Entradas del blog |
| Talleres / eventos | `src/content/eventos/*.md` | Talleres y eventos |
| Quién soy / Formación | `src/content/paginas/*.md` | Páginas |
| Grilla semanal (una lista por día) | `src/data/horarios.json` | Horarios de clases |
| Precios | `src/data/precios.json` | Precios |
| Libro | `src/data/libro.json` | El libro |
| Nombre, WhatsApp, redes, mapa | `src/data/sitio.json` | Datos del sitio y contacto |
| Imágenes subidas | `public/uploads/` | (automático) |
| Configuración del panel | `public/admin/config.yml` | — |

Los eventos con fecha anterior a hoy (hora Argentina) no se muestran.

## Puesta en producción (una sola vez)

### 1. Repositorio en GitHub
```bash
git init && git add . && git commit -m "Primera versión"
git branch -M main
git remote add origin https://github.com/USUARIO/REPO.git
git push -u origin main
```

### 2. Cloudflare Pages
1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → elegir el repo.
2. Framework preset: **Astro**. Build command: `npm run build`. Output: `dist`.
3. En *Settings → Environment variables* agregar `NODE_VERSION = 22`.
4. *Custom domains* → agregar el dominio (y `www`). Si el dominio está en NIC Argentina, cambiar los DNS a los que indique Cloudflare (o crear un CNAME a `xxx.pages.dev`).
5. Cambiar `site` en `astro.config.mjs` y `site_url`/`display_url` en `public/admin/config.yml` por el dominio real.

### 3. Login del panel (GitHub OAuth)
1. Desplegar el worker [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) en Cloudflare (botón *Deploy to Cloudflare* del README).
2. GitHub → *Settings → Developer settings → OAuth Apps → New*:
   - Homepage URL: el dominio de la web.
   - Callback URL: `https://sveltia-cms-auth.<tu-cuenta>.workers.dev/callback`
3. En el worker, cargar las variables `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` y `ALLOWED_DOMAINS` (= el dominio de la web).
4. En `public/admin/config.yml` completar `repo:` y `base_url:` (URL del worker). Commit y push.
5. Crear una cuenta de GitHub para tu mamá e invitarla como *collaborator* del repo (con permiso de escritura).

### 4. Rebuild diario (para que los eventos pasados desaparezcan)
1. Cloudflare Pages → *Settings → Builds → Deploy hooks* → crear uno y copiar la URL.
2. GitHub repo → *Settings → Secrets and variables → Actions* → nuevo secreto `CF_DEPLOY_HOOK` con esa URL.
3. El workflow `.github/workflows/rebuild-diario.yml` corre todos los días a las 03:00.

### 5. Formulario de contacto (opcional)
Crear una clave gratis en [web3forms.com](https://web3forms.com) con el email donde llegan las consultas y pegarla en el panel → *Datos del sitio → Clave de Web3Forms*. Sin clave, la página de contacto muestra solo WhatsApp, email y dirección.

## Modo "web en preparación"

La web se sirve con un Worker (`worker/index.js`, config en `wrangler.jsonc`) que puede mostrar una página de "Estamos preparando nuestra nueva web" (HTTP 503, no indexada) a todo el público, excepto a quien tenga acceso.

- **Activar / desactivar:** en `wrangler.jsonc` cambiar `"MANTENIMIENTO": "true"` / `"false"`, hacer commit y push. Se aplica en ~1 minuto.
- **Clave de acceso:** Cloudflare → Workers & Pages → `centro-yoga` → Settings → Variables and Secrets → Add → tipo **Secret**, nombre `CLAVE_ACCESO`. Si no está cargada, no entra nadie.
- **Dar acceso a alguien:** pasarle `https://centroargentinoyogareiki.com.ar/?acceso=LA_CLAVE`. Queda habilitado en ese navegador por 30 días.
- **Revocar todos los accesos:** cambiar el valor de `CLAVE_ACCESO`.
- **Salir:** `/?acceso=salir`.
- `/admin/` siempre queda accesible (igual pide login con GitHub).

Probar en local: crear `.dev.vars` con `CLAVE_ACCESO=prueba`, `npm run build` y `npx wrangler dev`.

Guía para quien edita la web: [GUIA-PANEL.md](GUIA-PANEL.md).
