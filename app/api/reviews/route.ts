// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RANGES } from "@/app/lib/sheets";
import { google } from "googleapis";

// ====== ใช้ ENV เดียวกับ lib/sheets.ts ======
const SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID as string;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL as string;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const GOOGLE_PRIVATE_KEY_ID = process.env.GOOGLE_PRIVATE_KEY_ID || undefined;

function assertEnv() {
  const missing: string[] = [];
  if (!SPREADSHEET_ID) missing.push("SHEETS_SPREADSHEET_ID");
  if (!GOOGLE_CLIENT_EMAIL) missing.push("GOOGLE_CLIENT_EMAIL");
  if (!GOOGLE_PRIVATE_KEY) missing.push("GOOGLE_PRIVATE_KEY");
  if (missing.length) throw new Error(`Missing ENV: ${missing.join(", ")}`);
}

async function getSheetsClient() {
  assertEnv();
  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    keyId: GOOGLE_PRIVATE_KEY_ID,
  });
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

// ====== Utilities ======
type ReviewRow = {
  id: string;
  name: string;
  email: string;
  comment: string;
  rating: string;  // เก็บเป็น string ในชีท (แปลงเลขตอนใช้งานได้)
  trip_id: string;
  created_at: string; // ISO string
};

function rowsToObjects<T extends Record<string, string>>(rows: any[][]): T[] {
  if (!rows || rows.length === 0) return [] as T[];
  const [header, ...data] = rows;
  const keys = header.map((h) => String(h ?? "").trim());
  return data.map((row) => {
    const obj: Record<string, string> = {};
    keys.forEach((k, i) => {
      obj[k] = String(row?.[i] ?? "");
    });
    return obj as T;
  });
}

function sanitizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function randomId() {
  // ใช้ Crypto แบบ built-in (Node 18+)
  return crypto.randomUUID();
}

// ====== GET: /api/reviews?tripId=xxx ======
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const tripId = searchParams.get('tripId');
    if (!tripId) {
      return NextResponse.json({ error: "Missing tripId" }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    const range = (RANGES as any).reviews ?? "reviews!A1:Z";
    const { data } = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [range],
    });

    const rows = data.valueRanges?.[0]?.values ?? [];
    const list = rowsToObjects<ReviewRow>(rows)
      .filter((r) => r.trip_id === tripId)
      // เรียงใหม่ล่าสุดก่อน
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    // แปลง rating เป็น number ตอนตอบกลับเพื่อสะดวกฝั่ง UI
    const json = list.map((r) => ({
      ...r,
      rating: Number.isNaN(Number(r.rating)) ? null : Number(r.rating),
    }));

    return NextResponse.json({ items: json }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}

// ====== POST: /api/reviews ======
// body: { name, email, comment, rating, trip_id }
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));

    const name = String(payload?.name ?? "").trim();
    const email = sanitizeEmail(String(payload?.email ?? ""));
    const comment = String(payload?.comment ?? "").trim();
    const ratingRaw = payload?.rating;
    const trip_id = String(payload?.trip_id ?? "").trim();

    const ratingNum = Number(ratingRaw);
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
    if (!trip_id) return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
    if (!comment) return NextResponse.json({ error: "comment is required" }, { status: 400 });
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "rating must be 1..5" }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    const range = (RANGES as any).reviews ?? "reviews!A1:Z";

    // --- NEW: ตรวจอีเมลซ้ำในทริปเดียวกันก่อน ---
    {
      const { data } = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SPREADSHEET_ID,
        ranges: [range],
      });
      const rows = data.valueRanges?.[0]?.values ?? [];
      const list = rowsToObjects<ReviewRow>(rows);

      const isDup = list.some(
        (r) => sanitizeEmail(r.email) === email && String(r.trip_id).trim() === trip_id
      );

      if (isDup) {
        return NextResponse.json(
          { error: "อีเมลนี้ได้ส่งรีวิวในทริปนี้ไว้แล้ว" },
          { status: 409 }
        );
      }
    }
    // --- END NEW ---

    const id = randomId();
    const created_at = new Date().toISOString();

    // เตรียมแถวให้ตรงหัวตารางเป๊ะ
    const row: ReviewRow = {
      id,
      name,
      email,
      comment,
      rating: String(ratingNum),
      trip_id,
      created_at,
    };

    // Append แบบ RAW เพื่อคุมรูปแบบ
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[
          row.id,
          row.name,
          row.email,
          row.comment,
          row.rating,
          row.trip_id,
          row.created_at,
        ]],
      },
    });

    return NextResponse.json({ ok: true, id, created_at }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
