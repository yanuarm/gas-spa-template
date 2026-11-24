export interface ItemRecord {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
}

const DEFAULT_SHEET_NAME = 'MasterData';
const CACHE_TTL_SECONDS = 300; // 5 menit

/**
 * Membaca data master dari Google Sheets dengan CacheService.getScriptCache()
 * dan operasi batch array getValues() sesuai aturan GEMINI.md.
 */
export function getMasterItems(sheetName: string = DEFAULT_SHEET_NAME): ItemRecord[] {
  const cache = CacheService.getScriptCache();
  const cacheKey = `MASTER_ITEMS_${sheetName}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData) as ItemRecord[];
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['ID', 'Name', 'Category', 'UpdatedAt']);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }

  // Wajib batch array getValues()
  const rawValues = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const items: ItemRecord[] = rawValues.map((row) => ({
    id: String(row[0] ?? ''),
    name: String(row[1] ?? ''),
    category: String(row[2] ?? ''),
    updatedAt: String(row[3] ?? ''),
  }));

  cache.put(cacheKey, JSON.stringify(items), CACHE_TTL_SECONDS);
  return items;
}

/**
 * Menulis/menambah baris ke Google Sheets menggunakan LockService.getScriptLock()
 * dan menghapus cache agar data tetap sinkron sesuai aturan GEMINI.md.
 */
export function addMasterItem(
  payload: { name: string; category: string },
  sheetName: string = DEFAULT_SHEET_NAME
): ItemRecord {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(['ID', 'Name', 'Category', 'UpdatedAt']);
    }

    const newItem: ItemRecord = {
      id: Utilities.getUuid(),
      name: payload.name.trim(),
      category: payload.category.trim(),
      updatedAt: new Date().toISOString(),
    };

    sheet.appendRow([newItem.id, newItem.name, newItem.category, newItem.updatedAt]);

    // Invalidate cache setelah operasi tulis
    CacheService.getScriptCache().remove(`MASTER_ITEMS_${sheetName}`);

    return newItem;
  } finally {
    lock.releaseLock();
  }
}
