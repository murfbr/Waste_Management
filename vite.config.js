import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ADICIONE ESTA SEÇÃO 'server'
  server: {
    proxy: {
      // Qualquer requisição que comece com /api será redirecionada
      '/api': {
        // Redireciona para o servidor que o 'vercel dev' cria
        target: 'http://localhost:3000', 
        changeOrigin: true,
      },
    },
  },
})