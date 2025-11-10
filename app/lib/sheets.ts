// lib/sheets.ts
// Next.js + Google Sheets (Service Account) แบบไม่ต้อง commit คีย์ขึ้น GitHub
// ต้องมีใน tsconfig: "resolveJsonModule": true, "esModuleInterop": true (จริงๆ ไฟล์นี้ไม่ใช้ import JSON แล้วก็ได้)

import { google } from "googleapis";

// === Config from ENV ===
// ตั้งใน .env.local (ดูตัวอย่างในไฟล์ .env.example ด้านล่าง)
const SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID as string;

// แนะนำให้ตั้งทั้งสองตัวแปรนี้แทนการ import JSON
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL as string;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const GOOGLE_PRIVATE_KEY_ID = process.env.GOOGLE_PRIVATE_KEY_ID || undefined;

// --- เช็คคอนฟิกพื้นฐาน ---
function assertEnv() {
  const missing: string[] = [];
  if (!SPREADSHEET_ID) missing.push("SHEETS_SPREADSHEET_ID");
  if (!GOOGLE_CLIENT_EMAIL) missing.push("GOOGLE_CLIENT_EMAIL");
  if (!GOOGLE_PRIVATE_KEY) missing.push("GOOGLE_PRIVATE_KEY");
  if (missing.length) {
    throw new Error(`Missing ENV: ${missing.join(", ")}`);
  }
}

// === Ranges (ต้องตรงกับชื่อแท็บใน Google Sheet) ===
export const RANGES = {
  category: "category!A1:Z",
  temple_th: "temple_th!A1:Z",
  temple_en: "temple_en!A1:Z",
  community_th: "community_th!A1:Z",
  community_en: "community_en!A1:Z",
  sacred_th: "sacred_th!A1:Z",
  sacred_en: "sacred_en!A1:Z",
  store_th: "store_th!A1:Z",
  store_en: "store_en!A1:Z",
  trip: "trip!A1:Z",
  trip_temple: "trip_temple!A1:Z",
  trip_community: "trip_community!A1:Z",
} as const;

// === Types ===
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
  history_th: string;
  open_at: string;
  close_at: string;
  tel: string;
  parking: string;
  maps: string;
  thumbnail: string;
};

export type TempleEN = {
  id: string;
  temple_th_id: string; //format => id - name_th
  name_en: string;
  short_en: string;
  history_en: string;
};

export type CommunityTH = {
  id: string;
  temple_id: string; //format => id - name_th
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
  community_th_id: string; //format => id - name_th
  name_en: string;
  short_en: string;
  history_en: string;
  hightlight_en: string; // ตาม schema เดิม
};

export type SacredTH = {
  id: string;
  category_id: string;
  temple_th_id: string; //format => id - name_th
  sorting: string;
  name_th: string;
  prayers_th: string;
  worship_th: string;
  isHighlight: string; // yes/no
  thumbnail: string;
};

export type SacredEN = {
  id: string;
  sacred_th_id: string; //format => id - name_th
  name_en: string;
  prayers_en: string;
  worship_en: string;
};

export type StoreTH = {
  id: string;
  community_th_id: string; //format => id - name_th
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
  store_th_id: string; //format => id - name_th
  name_en: string;
  short_en: string;
};
export type Trip = {
  id: string;
  name_th: string;
  name_en: string;
  short_th: string;
  short_en: string;
  category: string; // ex. 1-ความรัก, 2-สุขภาพ รูปแบบคือ id - name_th
};
export type TripTemple = {
  id: string;
  trip: string; // ex. 1 - Love and Wellness trip
  temple: string; //format => id - name_th
  sorting: string; // การเรียงลำดับวัดภายในทริป
};
export type TripCommunity = {
  id: string;
  trip: string; // ex. 1 - Love and Wellness trip
  community: string; //format => id - name_th
  sorting: string; // การเรียงลำดับชุมชนภายในทริป
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
  trip: Trip[];
  trip_temple: TripTemple[];
  trip_community: TripCommunity[];
};

// —————————————————————————————————————————————————————————————
// Utilities

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

// —————————————————————————————————————————————————————————————
// Auth & client (ใช้ JWT)

async function getSheetsClient() {
  assertEnv();

  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    keyId: GOOGLE_PRIVATE_KEY_ID,
  });

  await auth.authorize(); // ตรวจสอบว่าแลก token ได้จริง
  return google.sheets({ version: "v4", auth });
}

// —————————————————————————————————————————————————————————————
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
    trip: rowsToObjects<Trip>(map.get("trip")!),
    trip_temple: rowsToObjects<TripTemple>(map.get("trip_temple")!),
    trip_community: rowsToObjects<TripCommunity>(map.get("trip_community")!),
  };
}

// Fetch single tab
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
export const fetchTrip = () => fetchTab<Trip>("trip");
export const fetchTripTemple = () => fetchTab<TripTemple>("trip_temple");
export const fetchTripCommunity = () => fetchTab<TripCommunity>("trip_community");
