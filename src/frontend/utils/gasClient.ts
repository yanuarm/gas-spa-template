export interface ItemRecord {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
}

export interface ServerFunctions {
  pingServer: () => { status: string; timestamp: string };
  apiGetItems: () => ItemRecord[];
  apiAddItem: (payload: { name: string; category: string }) => ItemRecord;
}

// Penyimpanan in-memory mock untuk mode local development (npm run dev)
const mockItemsStore: ItemRecord[] = [
  {
    id: 'mock-001',
    name: 'Laptop ThinkPad X1 Carbon',
    category: 'Hardware',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-002',
    name: 'Lisensi Google Workspace Enterprise',
    category: 'Software',
    updatedAt: new Date().toISOString(),
  },
];

const mockHandlers: {
  [K in keyof ServerFunctions]: (
    ...args: Parameters<ServerFunctions[K]>
  ) => ReturnType<ServerFunctions[K]>;
} = {
  pingServer: () => ({
    status: 'MOCK MODE (Vite Local Dev Server)',
    timestamp: new Date().toISOString(),
  }),
  apiGetItems: () => [...mockItemsStore],
  apiAddItem: (payload: { name: string; category: string }) => {
    const newItem: ItemRecord = {
      id: `mock-${Math.random().toString(36).substring(2, 8)}`,
      name: payload.name,
      category: payload.category,
      updatedAt: new Date().toISOString(),
    };
    mockItemsStore.unshift(newItem);
    return newItem;
  },
};

/**
 * Mengecek apakah aplikasi berjalan di dalam iframe Google Apps Script
 */
export function isGasEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).google !== 'undefined' &&
    Boolean((window as any).google?.script?.run)
  );
}

export function callGas<K extends keyof ServerFunctions>(
  functionName: K,
  ...args: Parameters<ServerFunctions[K]>
): Promise<ReturnType<ServerFunctions[K]>> {
  return runGas(functionName, ...args);
}

/**
 * Wrapper Promise untuk google.script.run dengan auto-fallback ke mock data saat npm run dev
 */
export function runGas<K extends keyof ServerFunctions>(
  functionName: K,
  ...args: Parameters<ServerFunctions[K]>
): Promise<ReturnType<ServerFunctions[K]>> {
  return new Promise((resolve, reject) => {
    if (isGasEnvironment()) {
      (window as any).google.script.run
        .withSuccessHandler((result: ReturnType<ServerFunctions[K]>) => resolve(result))
        .withFailureHandler((error: Error) => reject(error))
        [functionName](...args);
    } else {
      setTimeout(() => {
        try {
          const handler = mockHandlers[functionName];
          if (!handler) {
            throw new Error(`Mock untuk fungsi "${String(functionName)}" belum didefinisikan.`);
          }
          const result = handler(...args);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }, 350);
    }
  });
}
