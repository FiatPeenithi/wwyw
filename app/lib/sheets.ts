// lib/sheets.ts
// Service Account–only Google Sheets helper
// tsconfig ต้องมี: "resolveJsonModule": true, "esModuleInterop": true

import { google } from "googleapis";
import keys from "../../spreadsheet-keys.json";

// === Config ===
const SPREADSHEET_ID = "1Jtyaba7Gse_OBSKroatDxMw6GwqMn3pkPStamNvvEFo" as const;

// All ranges must match the *tab names* in the Google Sheet.
// If your first row is the header row, use A1:Z for an open-ended range.
const RANGES = {
  category: "category!A1:Z",
  temple_th: "temple_th!A1:Z",
  temple_en: "temple_en!A1:Z",
  community_th: "community_th!A1:Z",
  community_en: "community_en!A1:Z",
  sacred_th: "sacred_th!A1:Z",
  sacred_en: "sacred_en!A1:Z",
  store_th: "store_th!A1:Z",
  store_en: "store_en!A1:Z",
} as const;

// === Types: every field is a string ===
export type Category = {
  id: string;
  category_th: string;
  category_en: string;
  thumbnail: string;
};

export type TempleTH = {
  id: string;
  name_th: string;
  short_th: string;
  open_at: string;
  close_at: string;
  tel: string;
  parking: string;
  maps: string;
  thumbnail: string;
};

export type TempleEN = {
  id: string;
  temple_th_id: string;
  name_en: string;
  short_en: string;
};

export type CommunityTH = {
  id: string;
  temple_id: string;
  name_th: string;
  short_th: string;
  history_th: string;
  highlight_th: string;
  parking: string;
  maps: string;
  thumbnail: string;
};

export type CommunityEN = {
  id: string;
  community_th_id: string;
  name_en: string;
  short_en: string;
  history_en: string;
  hightlight_en: string; // note: spelled as in schema
};

export type SacredTH = {
  id: string;
  category_id: string;
  temple_th_id: string;
  sorting: string;
  name_th: string;
  prayers_th: string;
  worship_th: string;
  isHighlight: string;
  thumbnail: string;
};

export type SacredEN = {
  id: string;
  sacred_th_id: string;
  name_en: string;
  prayers_en: string;
  worship_en: string;
};

export type StoreTH = {
  id: string;
  community_th_id: string;
  name_th: string;
  short_th: string;
  tel: string;
  open_at: string;
  close_at: string;
  off_days: string;
  thumbnail: string;
};

export type StoreEN = {
  id: string;
  store_th_id: string;
  name_en: string;
  short_en: string;
};

export type SheetsPayload = {
  category: Category[];
  temple_th: TempleTH[];
  temple_en: TempleEN[];
  community_th: CommunityTH[];
  community_en: CommunityEN[];
  sacred_th: SacredTH[];
  sacred_en: SacredEN[];
  store_th: StoreTH[];
  store_en: StoreEN[];
};

// ————————————————————————————————————————————————————————————————————————
// Utilities

function normalizePrivateKey(k?: string) {
  // ถ้าคีย์ใน JSON มี \n เป็นตัวอักษรจริง ให้แปลงเป็น newline
  return (k || "").replace(/\\n/g, "\n");
}

function assertServiceAccountJson() {
  const required = ["client_email", "private_key", "type"];
  for (const field of required) {
    if (!(keys as any)[field]) {
      throw new Error(`Missing '${field}' in spreadsheet-keys.json`);
    }
  }
  if ((keys as any).type !== "service_account") {
    throw new Error(`'type' must be 'service_account'`);
  }
}

function s(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function rowsToObjects<T extends Record<string, string>>(rows: any[][]): T[] {
  if (!rows || rows.length === 0) return [] as T[];
  const [header, ...data] = rows;
  const keys = header.map((h) => s(h).trim());
  return data.map((row) => {
    const obj: Record<string, string> = {};
    keys.forEach((k, i) => {
      obj[k] = s(row?.[i]);
    });
    return obj as T;
  });
}

// ————————————————————————————————————————————————————————————————————————
// Auth & client (ใช้ JWT โดยตรง, ตัด token_url/universe_domain ที่ไม่จำเป็น)

async function getSheetsClient() {
  assertServiceAccountJson();

  const auth = new google.auth.JWT({
    email: (keys as any).client_email,
    key: normalizePrivateKey((keys as any).private_key),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"], // หรือ readonly ก็ได้
    keyId: (keys as any).private_key_id, // ไม่จำเป็นแต่ช่วยระบุ key ที่ใช้เซ็น
  });

  // ตรวจว่าเซ็นและแลก token ได้จริง
  await auth.authorize();

  return google.sheets({ version: "v4", auth });
}

// ————————————————————————————————————————————————————————————————————————
// Batch load all tabs defined in RANGES

export async function fetchAllSheets(): Promise<SheetsPayload> {
  const sheets = await getSheetsClient();
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: Object.values(RANGES),
  });

  const map = new Map<string, any[][]>();
  for (const r of data.valueRanges ?? []) {
    const tab = (r.range || "").split("!")[0].replace(/^'?|'?$/g, "");
    map.set(tab, r.values ?? []);
  }

  return {
    category: rowsToObjects<Category>(map.get("category")!),
    temple_th: rowsToObjects<TempleTH>(map.get("temple_th")!),
    temple_en: rowsToObjects<TempleEN>(map.get("temple_en")!),
    community_th: rowsToObjects<CommunityTH>(map.get("community_th")!),
    community_en: rowsToObjects<CommunityEN>(map.get("community_en")!),
    sacred_th: rowsToObjects<SacredTH>(map.get("sacred_th")!),
    sacred_en: rowsToObjects<SacredEN>(map.get("sacred_en")!),
    store_th: rowsToObjects<StoreTH>(map.get("store_th")!),
    store_en: rowsToObjects<StoreEN>(map.get("store_en")!),
  };
}

// Fetch a single tab by key
export async function fetchTab<T extends Record<string, string>>(
  tab: keyof typeof RANGES
) {
  const sheets = await getSheetsClient();
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [RANGES[tab]],
  });
  return rowsToObjects<T>(data.valueRanges?.[0]?.values ?? []);
}

// Convenience wrappers
export const fetchCategories = () => fetchTab<Category>("category");
export const fetchTemplesTH = () => fetchTab<TempleTH>("temple_th");
export const fetchTemplesEN = () => fetchTab<TempleEN>("temple_en");
export const fetchCommunitiesTH = () => fetchTab<CommunityTH>("community_th");
export const fetchCommunitiesEN = () => fetchTab<CommunityEN>("community_en");
export const fetchSacredTH = () => fetchTab<SacredTH>("sacred_th");
export const fetchSacredEN = () => fetchTab<SacredEN>("sacred_en");
export const fetchStoresTH = () => fetchTab<StoreTH>("store_th");
export const fetchStoresEN = () => fetchTab<StoreEN>("store_en");
