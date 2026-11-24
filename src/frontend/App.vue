<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { runGas, isGasEnvironment, type ItemRecord } from './utils/gasClient';

const isGas = ref<boolean>(isGasEnvironment());
const serverStatus = ref<string>('Memeriksa koneksi...');
const items = ref<ItemRecord[]>([]);
const loading = ref<boolean>(false);
const submitting = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const formName = ref<string>('');
const formCategory = ref<string>('Hardware');

async function loadInitialData() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const [pingRes, itemsRes] = await Promise.all([
      runGas('pingServer'),
      runGas('apiGetItems'),
    ]);
    serverStatus.value = `${pingRes.status} (${new Date(pingRes.timestamp).toLocaleTimeString()})`;
    items.value = itemsRes;
  } catch (err: any) {
    errorMessage.value = err?.message || 'Gagal memuat data dari server.';
  } finally {
    loading.value = false;
  }
}

async function handleAddItem() {
  if (!formName.value.trim()) return;
  submitting.value = true;
  errorMessage.value = null;
  try {
    const created = await runGas('apiAddItem', {
      name: formName.value.trim(),
      category: formCategory.value,
    });
    items.value.unshift(created);
    formName.value = '';
  } catch (err: any) {
    errorMessage.value = err?.message || 'Gagal menyimpan data.';
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadInitialData();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Header Card -->
      <header class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900">GAS Modern Starter</h1>
            <span
              :class="isGas ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
              class="text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              {{ isGas ? 'Production (GAS)' : 'Local Mock Mode' }}
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-1">
            Vue 3 Composition API &bull; Tailwind CSS v4 &bull; LockService &amp; CacheService
          </p>
        </div>
        <button
          @click="loadInitialData"
          :disabled="loading"
          class="self-start sm:self-auto px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition cursor-pointer"
        >
          {{ loading ? 'Memuat...' : 'Refresh Data' }}
        </button>
      </header>

      <!-- Status Bar -->
      <div class="bg-slate-900 text-slate-100 rounded-xl px-4 py-3 text-xs font-mono flex items-center justify-between">
        <span>Status Backend: {{ serverStatus }}</span>
        <span class="text-slate-400">Total: {{ items.length }} item</span>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm"
      >
        {{ errorMessage }}
      </div>

      <!-- Form Tambah Item (LockService) -->
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-base font-semibold text-slate-800 mb-4">
          Tambah Data Master (via <code class="text-indigo-600">LockService</code>)
        </h2>
        <form @submit.prevent="handleAddItem" class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="formName"
            type="text"
            required
            placeholder="Nama item atau aset..."
            class="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            v-model="formCategory"
            class="rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Operational">Operational</option>
          </select>
          <button
            type="submit"
            :disabled="submitting"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition cursor-pointer"
          >
            {{ submitting ? 'Menyimpan...' : 'Tambah Item' }}
          </button>
        </form>
      </section>

      <!-- Tabel Data Master (CacheService + Batch getValues) -->
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-800">
            Daftar Data Master (via <code class="text-indigo-600">CacheService</code> &amp; <code class="text-indigo-600">getValues()</code>)
          </h2>
        </div>

        <div v-if="loading" class="p-8 text-center text-sm text-slate-500">
          Mengambil data...
        </div>

        <div v-else-if="items.length === 0" class="p-8 text-center text-sm text-slate-500">
          Belum ada data master. Silakan tambahkan item baru di atas.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th class="py-3 px-6 font-medium">ID</th>
                <th class="py-3 px-6 font-medium">Nama Item</th>
                <th class="py-3 px-6 font-medium">Kategori</th>
                <th class="py-3 px-6 font-medium">Waktu Update</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50/80">
                <td class="py-3 px-6 font-mono text-xs text-slate-500">{{ item.id }}</td>
                <td class="py-3 px-6 font-medium text-slate-900">{{ item.name }}</td>
                <td class="py-3 px-6">
                  <span class="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                    {{ item.category }}
                  </span>
                </td>
                <td class="py-3 px-6 text-xs text-slate-500">
                  {{ new Date(item.updatedAt).toLocaleString('id-ID') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>
