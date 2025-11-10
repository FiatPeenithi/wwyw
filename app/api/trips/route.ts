// app/api/trips/route.ts
import { NextResponse } from "next/server";
import { fetchTrip, Trip, fetchCategories } from "@/app/lib/sheets"; // ⬅️ เพิ่ม fetchCategories
import { getCategoryIdsFromTripCategory } from "@/app/lib/parse";    // ⬅️ ใช้ helper ตัวใหม่

type TripItem = {
  id: string;
  name: string;
  short: string;
  matchCount: number;
  categoryIds: string[];     // id ที่ match
  categoryNames: string[];   // name ที่ match (จากแท็บ category)
};

export async function GET(req: Request) {
  const url = new URL(req.url);

  // รับ categoryIds รูปแบบ "5,2"
  const idsParam = url.searchParams.get("categoryIds") ?? "";
  const selectedIds = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // locale ไม่ส่งมา default เป็น th
  const locale = (url.searchParams.get("locale") ?? "th").toLowerCase();

  if (selectedIds.length === 0) {
    return NextResponse.json<TripItem[]>([]);
  }

  const selectedSet = new Set(selectedIds);

  // ดึง trips + categories
  const [trips, categories] = await Promise.all([fetchTrip(), fetchCategories()]);

  // ทำแผนที่ id -> ชื่อ (ตาม locale)
  const idToName = new Map<string, string>();
  for (const c of categories) {
    const name = locale === "en" ? c.category_en : c.category_th;
    idToName.set(c.id, name);
  }

  const enriched: TripItem[] = trips
    .map((t) => {
      // ดึง "เฉพาะ id" ที่อยู่ในคอลัมน์ trip.category
      const catIdsInTrip = getCategoryIdsFromTripCategory(t.category);

      // เฉพาะ id ที่ผู้ใช้เลือก
      const matchedIds = catIdsInTrip.filter((id) => selectedSet.has(id));
      const matchCount = matchedIds.length;

      const name = locale === "en" ? t.name_en : t.name_th;
      const short = locale === "en" ? t.short_en : t.short_th;

      return {
        id: t.id,
        name,
        short,
        matchCount,
        categoryIds: matchedIds,                              // ✅ id ที่แมตช์
        categoryNames: matchedIds.map((id) => idToName.get(id) ?? id), // ✅ ชื่อจากแท็บ category (fallback เป็น id ถ้าไม่เจอ)
      };
    })
    .filter((it) => it.matchCount > 0)
    .sort((a, b) => {
      // 1) มาก → น้อย ตามจำนวนที่แมตช์
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;

      // 2) จัดตามลำดับที่ผู้ใช้เลือก
      const rank = (x: TripItem) =>
        selectedIds.findIndex((sid) => x.categoryIds.includes(sid));

      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;

      // 3) fallback: ตาม id
      return Number(a.id) - Number(b.id);
    });

  return NextResponse.json<TripItem[]>(enriched, { status: 200 });
}
