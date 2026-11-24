# GAS Modern Starter Rules
- **Stack:** Vue 3 (Composition API `<script setup lang="ts">`), Tailwind CSS v4, TypeScript, Vite (`vite-plugin-singlefile`), esbuild, `@google/clasp`.
- **Architecture:** Monorepo terpisah antara `src/frontend` dan `src/backend`, dikompilasi ke `dist/`.
- **GAS Backend Constraint:** 
  - Semua fungsi yang dipanggil dari frontend via `google.script.run` WAJIB diekspos ke `(globalThis as any).namaFungsi = namaFungsi` di `src/backend/main.ts`.
  - Operasi tulis Google Sheets wajib menggunakan `LockService.getScriptLock()`.
  - Operasi baca data master wajib menggunakan `CacheService.getScriptCache()` dan batch array (`getValues()`).
- **OS Environment:** Windows (gunakan script Node.js lintas platform untuk menyalin `appsscript.json`, jangan gunakan perintah bash `cp`).