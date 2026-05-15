# NeuroStudy — Plataforma Adaptativa de Estudio

> "Estudia menos. Aprende más. Tu cerebro manda."

## 📂 Estructura del proyecto

```
neurostudy/
├── index.html          ← HTML principal (semántico, SEO, Netlify Forms)
├── netlify.toml        ← Configuración de despliegue Netlify
├── README.md
├── styles/
│   └── style.css       ← Estilos externos (responsivo, variables CSS)
├── scripts/
│   └── main.js         ← Lógica JS (sesión, validación, animaciones)
├── assets/
│   └── favicon.svg     ← Favicon vectorial
└── images/
    └── (tus imágenes aquí)
```

---

## 🚀 Ejecución local con Live Server

1. Abre la carpeta `neurostudy/` en VS Code.
2. Instala la extensión **Live Server** (Ritwick Dey) si no la tienes.
3. Haz clic derecho sobre `index.html` → **"Open with Live Server"**.
4. Se abrirá automáticamente en `http://127.0.0.1:5500`.

> **Nota:** El formulario de contacto requiere HTTPS y Netlify para procesar los envíos. En local mostrará el mensaje de éxito de forma simulada.

---

## ☁️ Despliegue en Netlify (arrastrar carpeta)

### Opción A — Drag & Drop (más rápido)

1. Ve a [app.netlify.com](https://app.netlify.com) e inicia sesión.
2. En el dashboard, ve a la sección **"Sites"**.
3. Arrastra la carpeta **`neurostudy/`** directamente al área de drop.
4. ¡Listo! Netlify desplegará el sitio en segundos con URL automática.

### Opción B — Conectar con Git

1. Sube el proyecto a un repositorio de GitHub/GitLab.
2. En Netlify: **"Add new site" → "Import an existing project"**.
3. Conecta tu repositorio.
4. Configuración de build:
   - **Base directory:** `/` (o la subcarpeta si aplica)
   - **Build command:** (vacío, es sitio estático)
   - **Publish directory:** `.`
5. Haz clic en **"Deploy site"**.

---

## 📬 Formulario de contacto (Netlify Forms)

El formulario en `index.html` ya tiene la configuración necesaria:

```html
<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="contact" />
  ...
</form>
```

- `data-netlify="true"` → Netlify detecta y procesa el formulario automáticamente.
- `netlify-honeypot="bot-field"` → Protección anti-spam.
- Los envíos aparecerán en **Netlify Dashboard → Forms → contact**.
- Puedes configurar notificaciones por email desde el dashboard.

---

## ✅ Checklist antes de publicar

- [ ] Reemplazar `images/og-preview.png` con una imagen real para Open Graph
- [ ] Verificar que `assets/favicon.svg` se muestra correctamente en el navegador
- [ ] Probar el formulario de contacto en producción (Netlify)
- [ ] Revisar que la cámara funcione en HTTPS (requerido por los navegadores)
- [ ] Comprobar el sitio en móvil y tablet

---

## 🎨 Tecnologías usadas

| Capa       | Tecnología                         |
|------------|------------------------------------|
| HTML       | HTML5 semántico, ARIA, meta SEO    |
| CSS        | CSS3, Custom Properties, Grid/Flex |
| JS         | Vanilla JS ES6+, Canvas API        |
| Fuentes    | Google Fonts (DM Serif + DM Sans)  |
| Deploy     | Netlify (Forms + CDN + HTTPS)      |

---

## 📄 Licencia

Proyecto de ejemplo. Úsalo libremente como plantilla.
