/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_BASE_URL: string;
  readonly VITE_ENABLE_AUTH: string;
  readonly VITE_ENABLE_PWA: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_AUTO_REFRESH_INTERVAL: string;
  readonly VITE_REQUEST_TIMEOUT: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
