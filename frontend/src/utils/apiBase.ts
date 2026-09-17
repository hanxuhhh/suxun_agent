/**
 * 后端 API 地址 —— 全局唯一配置点
 *
 * 由环境变量 VITE_API_BASE 控制（见 .env / .env.production）：
 * - 留空：走相对路径，开发时由 Vite 代理转发到后端
 *        （手机连同一 Wi-Fi 局域网访问也能用）
 * - 配 http://host:8080：直连后端（后端 CORS 已全开，跨域无障碍）
 *
 * 部署到服务器时只需改 .env.production 里这一处。
 */
export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')

/** 拼接完整接口地址，例如 apiUrl('/api/translate') */
export const apiUrl = (path: string): string => `${API_BASE}${path}`
