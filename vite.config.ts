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
        '/api/occupations': {
          target: target + '/occupations',
          changeOrigin: true,
          rewrite: () => '',
          secure: true,
          headers: {
            Authorization: authHeader,
          },
        },
        '/api/occupation-mappings/': {
          target,
          changeOrigin: true,
          rewrite: (path: string) => '/occupations/' + path.replace('/api/occupation-mappings/', '') + '/mappings',
          secure: true,
          headers: {
            Authorization: authHeader,
          },
        },
        '/api/legacy-suppliers': {
          target: target + '/legacy/suppliers',
          changeOrigin: true,
          rewrite: () => '',
          secure: true,
          headers: {
            Authorization: authHeader,
          },
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.method = 'POST';
            });
          },
        },
        '/api/legacy-portfolios': {
          target: target + '/legacy/portfolios',
          changeOrigin: true,
          rewrite: () => '',
          secure: true,
          headers: {
            Authorization: authHeader,
          },
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.method = 'POST';
            });
          },
        },
        '/api/legacy-products': {
          target,
          changeOrigin: true,
          rewrite: (p: string) => p.replace('/api/legacy-products', '/legacy/products'),
          secure: true,
          headers: {
            Authorization: authHeader,
          },
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.method = 'POST';
            });
          },
        },
        '/api/suppliers': {
          target: target + '/suppliers',
          changeOrigin: true,
          rewrite: () => '',
          secure: true,
          headers: {
            Authorization: authHeader,
          },
        },
      },
    },
  }
})
