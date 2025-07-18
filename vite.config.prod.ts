import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Configuração específica para ambiente PRODUÇÃO
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist-prod',
    sourcemap: false, // Produção sem sourcemaps
    minify: 'terser', // Minificação otimizada
  },
  define: {
    'process.env.VITE_ENVIRONMENT': JSON.stringify('production'),
  },
})