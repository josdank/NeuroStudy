import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',

  // IMPORTANTE: asegura rutas correctas en producción
  base: './',

  // IMPORTANTE: todo lo que esté en /public se copia a dist
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  server: {
    port: 3000,
    open: true,
  },

  preview: {
    port: 4173,
  },
})