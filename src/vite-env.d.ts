/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute API origin (e.g. https://api.example.com). Leave unset in dev to use Vite `/api` proxy. */
  readonly VITE_QUIZ_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
