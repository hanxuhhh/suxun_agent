/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 地址，空 = 相对路径（走代理）；填 http://host:8080 = 直连 */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
