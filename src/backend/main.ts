import { getMasterItems, addMasterItem, ItemRecord } from './services/sheetService';

/**
 * Entry point Web App Google Apps Script
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('GAS Modern Starter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Mengambil seluruh daftar data master (menggunakan CacheService & batch getValues)
 */
function apiGetItems(): ItemRecord[] {
  return getMasterItems();
}

/**
 * Menambahkan item baru ke Google Sheets (menggunakan LockService)
 */
function apiAddItem(payload: { name: string; category: string }): ItemRecord {
  return addMasterItem(payload);
}

/**
 * Health check endpoint untuk memastikan koneksi frontend-backend
 */
function pingServer(): { status: string; timestamp: string } {
  return {
    status: 'OK - Terhubung ke Google Apps Script V8',
    timestamp: new Date().toISOString(),
  };
}

// Semua fungsi yang dipanggil via google.script.run WAJIB diekspos ke globalThis
(globalThis as any).doGet = doGet;
(globalThis as any).apiGetItems = apiGetItems;
(globalThis as any).apiAddItem = apiAddItem;
(globalThis as any).pingServer = pingServer;
