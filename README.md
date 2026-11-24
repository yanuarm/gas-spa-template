# GAS Modern Starter Template

Starter template modern untuk membangun aplikasi Web App **Google Apps Script (GAS)** menggunakan **Vue 3 (Composition API `<script setup lang="ts">`)**, **Tailwind CSS v4**, **TypeScript**, **Vite (`vite-plugin-singlefile`)**, dan **esbuild**.

---

## 1. Arsitektur Folder

```text
├── src/
│   ├── frontend/                # Source code UI (Vue 3 + Tailwind CSS v4)
│   │   ├── utils/
│   │   │   └── gasClient.ts     # Wrapper Promise google.script.run (`callGas` / `runGas`) + Mock fallback
│   │   ├── App.vue              # Komponen utama Vue
│   │   ├── main.ts              # Entry point Vue
│   │   ├── style.css            # Entry point Tailwind CSS v4 (@import "tailwindcss";)
│   │   └── index.html           # Template HTML
│   └── backend/                 # Source code Google Apps Script (TypeScript)
│       ├── services/
│       │   └── sheetService.ts  # Operasi Google Sheets (CacheService + LockService)
│       └── main.ts              # Entry point GAS & ekspos fungsi ke `globalThis`
├── dist/                        # Hasil kompilasi siap push ke GAS (dibuat otomatis)
│   ├── index.html               # Single-file HTML (JS & CSS ter-inline)
│   ├── Code.js                  # Bundle backend berformat IIFE (target ES2020)
│   └── appsscript.json          # Manifest Google Apps Script
├── appsscript.json              # Master manifest GAS
├── tsconfig.json                # Konfigurasi TypeScript untuk Frontend
├── tsconfig.gas.json            # Konfigurasi TypeScript untuk Backend GAS
└── vite.config.ts               # Konfigurasi bundler Vite + Singlefile
```

---

## 2. Langkah Setup Proyek Baru dari Awal

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Login ke Google Clasp**
   ```bash
   npx clasp login
   ```

3. **Buat Proyek Google Sheets & GAS Baru**
   Pastikan folder `dist/` sudah terbentuk terlebih dahulu (`npm run build`), lalu inisialisasi proyek Clasp dengan `--rootDir ./dist`:
   ```bash
   npm run build
   npx clasp create --type sheets --title "Nama Aplikasi GAS" --rootDir ./dist
   ```
   > **Catatan:** Perintah di atas akan membuat file `.clasp.json` yang mengarah ke folder `./dist`.

4. **Push & Deploy ke Google Apps Script**
   ```bash
   npm run push
   ```

---

## 3. Daftar Perintah NPM

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server development Vite secara lokal lengkap dengan *auto-fallback* mock data (tanpa perlu koneksi ke server GAS). |
| `npm run build` | Mengompilasi UI ke `dist/index.html` (single-file), mem-bundle backend ke `dist/Code.js` (format IIFE), dan menyalin `appsscript.json` ke `dist/` via Node.js. |
| `npm run push` | Menjalankan `npm run build` lalu mengunggah isi folder `dist/` ke server Google Apps Script menggunakan `clasp push`. |
| `npm run deploy` | Menjalankan `npm run build`, mengunggah kode (`clasp push`), dan membuat versi deployment baru (`clasp deploy`). |

---

## 4. Aturan Wajib Menambah Fungsi API Baru

Karena backend dikompilasi menggunakan `esbuild` dengan format **IIFE** (`--format=iife`), seluruh fungsi di dalam module akan tertutup di dalam *local scope* kecuali diekspos secara eksplisit ke `globalThis`.

### A. Sisi Backend (`src/backend/`)
1. **Wajib Ekspos ke `globalThis`**: Semua fungsi di `src/backend/main.ts` yang dipanggil oleh `google.script.run` wajib didaftarkan ke `(globalThis as any).namaFungsi = namaFungsi`.
2. **Operasi Baca Data Master**: Wajib menggunakan `CacheService.getScriptCache()` dan operasi *batch array* (`getValues()`).
3. **Operasi Tulis Google Sheets**: Wajib menggunakan `LockService.getScriptLock()` dan menghapus cache terkait setelah penulisan selesai.

Contoh di `src/backend/main.ts`:
```ts
function apiGetUsers() {
  // Implementasi baca...
}

// WAJIB diekspos ke globalThis
(globalThis as any).apiGetUsers = apiGetUsers;
```

### B. Sisi Frontend (`src/frontend/`)
1. Daftarkan tipe fungsi & mock handler-nya di `src/frontend/utils/gasClient.ts` pada interface `ServerFunctions` dan objek `mockHandlers` agar mode `npm run dev` tetap berjalan lancar.
2. Panggil fungsi backend dari komponen Vue menggunakan helper `callGas` (atau alias `runGas`):

```ts
import { callGas } from '@/utils/gasClient';

const items = await callGas('apiGetItems');
const created = await callGas('apiAddItem', {
  name: 'Monitor Dell 27"',
  category: 'Hardware',
});
```
