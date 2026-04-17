import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const username = env.OMNILIFE_USERNAME ?? 'FinuraDigital'
  const password = env.OMNILIFE_PASSWORD ?? '16HahIceQ42WpmurCIdP'
  const target = env.OMNILIFE_BASE_URL ?? 'https://uat.omnilife.com.au/api/4'
  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

  return {
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
          target,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/omnilife/, ''),
          secure: true,
          headers: {
            Authorization: authHeader,
          },
        },
      },
    },
  }
})
