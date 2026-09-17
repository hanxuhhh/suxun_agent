import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 读取 .env / .env.[mode] 里的变量
  const env = loadEnv(mode, '.', '')

  // 代理目标：优先取 VITE_API_BASE，默认本机后端。
  // 说明：VITE_API_BASE 留空时前端走相对路径 + 此代理，手机局域网访问也能用；
  //      VITE_API_BASE 配了完整地址时，请求直连后端（CORS 已开），代理不生效。
  const backend = (env.VITE_API_BASE || 'http://localhost:8080').replace(/\/+$/, '')

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // 允许手机通过局域网 IP 访问，方便真机体验 H5
      port: 5173,
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
        },
      },
    },
  }
})
