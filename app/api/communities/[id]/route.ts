// app/api/communities/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  fetchTemplesTH,
  fetchTemplesEN,
  fetchCommunitiesTH,
  fetchCommunitiesEN,
  fetchStoresTH,
  fetchStoresEN,
  TempleTH,
  TempleEN,
  CommunityTH,
  CommunityEN,
  StoreTH,
  StoreEN,
} from "@/app/lib/sheets";

// ——— Helpers ———
function parseLeadingId(input: string): string {
  if (!input) return "";
  const m = input.trim().match(/^(\d+)/);
  return m?.[1] ?? "";
}

function toBool(v?: string) {
  if (!v) return false;
  return /^(1|true|yes|y)$/i.test(v.trim());
}

type FetchedData = [
  TempleTH[],
  TempleEN[],
  CommunityTH[],
  CommunityEN[],
  StoreTH[],
  StoreEN[]
];

// ——— GET ———
// Next 16: context.params เป็น Promise
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") ?? "th").toLowerCase();

  if (!id) {
    return NextResponse.json({ error: "Missing community id" }, { status: 400 });
  }

  try {
    const [
      templesTH,
      templesEN,
      communitiesTH,
      communitiesEN,
      storesTH,
      storesEN,
    ] = (await Promise.all([
      fetchTemplesTH(),
      fetchTemplesEN(),
      fetchCommunitiesTH(),
      fetchCommunitiesEN(),
      fetchStoresTH(),
      fetchStoresEN(),
    ])) as FetchedData;

    const cth = communitiesTH.find((c) => c.id === id);
    if (!cth) {
      return NextResponse.json(
        { error: `Community not found: ${id}` },
        { status: 404 }
      );
    }

    // แผนที่ EN lookup
    const communityEnByThId = new Map<string, CommunityEN>();
    for (const c of communitiesEN) {
      const thId = parseLeadingId(c.community_th_id);
      if (thId) communityEnByThId.set(thId, c);
    }

    const templeEnByThId = new Map<string, TempleEN>();
    for (const t of templesEN) {
      const thId = parseLeadingId(t.temple_th_id);
      if (thId) templeEnByThId.set(thId, t);
    }

    const storeEnByThId = new Map<string, StoreEN>();
    for (const s of storesEN) {
      const thId = parseLeadingId(s.store_th_id);
      if (thId) storeEnByThId.set(thId, s);
    }

    // temple ที่ relate (จาก community_th.temple_id = "id - name_th")
    const relatedTempleId = parseLeadingId(cth.temple_id);
    const tth = templesTH.find((t) => t.id === relatedTempleId);

    // payload: community (ตาม locale)
    const cen = communityEnByThId.get(cth.id);
    const community = {
      id: cth.id,
      name: locale === "en" ? cen?.name_en || cth.name_th : cth.name_th,
      short: locale === "en" ? cen?.short_en || cth.short_th : cth.short_th,
      history: locale === "en" ? cen?.history_en || cth.history_th : cth.history_th,
      thumbnail: cth.thumbnail,
      parking: toBool(cth.parking),
      maps: cth.maps, // ยังส่งใน payload (ไว้ใช้ปุ่มด้านล่าง เหมือน temple page)
    };

    // payload: temple ที่เกี่ยวข้อง (ชื่อเท่านั้นก็พอสำหรับหน้าเพจ)
    let relatedTemple: { id: string; name: string } | null = null;
    if (tth) {
      const ten = templeEnByThId.get(tth.id);
      relatedTemple = {
        id: tth.id,
        name: locale === "en" ? ten?.name_en || tth.name_th : tth.name_th,
      };
    }

    // stores ที่ relate กับชุมชนนี้ (store_th.community_th_id = "id - name_th")
    const stores = storesTH
      .filter((s) => parseLeadingId(s.community_th_id) === id)
      .map((s) => {
        const sen = storeEnByThId.get(s.id);
        return {
          id: s.id,
          name: locale === "en" ? sen?.name_en || s.name_th : s.name_th,
          short: locale === "en" ? sen?.short_en || s.short_th : s.short_th,
          tel: s.tel,
          open_at: s.open_at,
          close_at: s.close_at,
          off_days: s.off_days,
          thumbnail: s.thumbnail,
        };
      });

    return NextResponse.json(
      { community, temple: relatedTemple, stores },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
