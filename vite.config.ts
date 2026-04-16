import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    proxy: {
      '/api/omnilife': {
        target: 'https://uat.omnilife.com.au/API/4',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/omnilife/, ''),
        secure: true,
      },
    },
  },
})
