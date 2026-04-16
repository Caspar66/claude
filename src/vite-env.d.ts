/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OMNILIFE_BASE_URL?: string;
  readonly VITE_OMNILIFE_USERNAME?: string;
  readonly VITE_OMNILIFE_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
