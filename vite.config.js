// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // Carpeta raíz del proyecto (donde está index.html)
  root: '.',

  // Carpeta de salida al hacer "npm run build"
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  // Servidor de desarrollo
  server: {
    port: 3000,      // http://localhost:3000
    open: true,      // Abre el navegador automáticamente
  },

  // Preview del build
  preview: {
    port: 4173,
  },
})
