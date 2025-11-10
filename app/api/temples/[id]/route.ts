// app/api/temples/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  fetchTemplesTH,
  fetchTemplesEN,
  fetchSacredTH,
  fetchSacredEN,
  fetchCommunitiesTH,
  fetchCommunitiesEN,
  fetchCategories,
  TempleTH,
  TempleEN,
  SacredTH,
  SacredEN,
  CommunityTH,
  CommunityEN,
  Category,
} from "@/app/lib/sheets";

type FetchedData = [
  TempleTH[],
  TempleEN[],
  SacredTH[],
  SacredEN[],
  CommunityTH[],
  CommunityEN[],
  Category[]
];

function parseLeadingId(input: string): string {
  if (!input) return "";
  const m = input.trim().match(/^(\d+)/);
  return m?.[1] ?? "";
}

function toBool(v?: string) {
  if (!v) return false;
  return /^(1|true|yes|y)$/i.test(v.trim());
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // Next 16: params เป็น Promise

  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") ?? "th").toLowerCase();

  if (!id) {
    return NextResponse.json({ error: "Missing temple id" }, { status: 400 });
  }

  try {
    const [
      templesTH,
      templesEN,
      sacredTH,
      sacredEN,
      communitiesTH,
      communitiesEN,
      categories,
    ] = (await Promise.all([
      fetchTemplesTH(),
      fetchTemplesEN(),
      fetchSacredTH(),
      fetchSacredEN(),
      fetchCommunitiesTH(),
      fetchCommunitiesEN(),
      fetchCategories(),
    ])) as FetchedData;

    const th = templesTH.find((t) => t.id === id);
    if (!th) {
      return NextResponse.json(
        { error: `Temple not found: ${id}` },
        { status: 404 }
      );
    }

    // maps for quick lookup
    const enByTempleThId = new Map<string, TempleEN>();
    for (const e of templesEN) {
      const thId = parseLeadingId(e.temple_th_id);
      if (thId) enByTempleThId.set(thId, e);
    }

    const sacredEnByThId = new Map<string, SacredEN>();
    for (const s of sacredEN) {
      const sacredThId = parseLeadingId(s.sacred_th_id);
      if (sacredThId) sacredEnByThId.set(sacredThId, s);
    }

    const communityEnByThId = new Map<string, CommunityEN>();
    for (const c of communitiesEN) {
      const cThId = parseLeadingId(c.community_th_id);
      if (cThId) communityEnByThId.set(cThId, c);
    }

    // category id -> localized name
    const categoryNameById = new Map<string, { th: string; en: string }>();
    for (const cat of categories) {
      const idStr = String(cat.id).trim();
      categoryNameById.set(idStr, {
        th: cat.category_th,
        en: cat.category_en,
      });
    }

    const getCategoryName = (raw: string) => {
      const catId = parseLeadingId(raw);
      const item = categoryNameById.get(catId);
      if (!item) return raw; // fallback
      return locale === "en" ? item.en || item.th : item.th;
    };

    // sacred ที่ relate กับ temple นี้
    const sacredForTemple = sacredTH
      .filter((s) => parseLeadingId(s.temple_th_id) === id)
      .map((s) => {
        const category = getCategoryName(s.category_id);
        if (locale === "en") {
          const en = sacredEnByThId.get(s.id);
          return {
            id: s.id,
            name: en?.name_en || s.name_th,
            prayers: en?.prayers_en || s.prayers_th,
            worship: en?.worship_en || s.worship_th,
            thumbnail: s.thumbnail,
            isHighlight: toBool(s.isHighlight), // yes/no -> boolean
            category, // ส่งเฉพาะชื่อ (ตาม locale)
          };
        }
        return {
          id: s.id,
          name: s.name_th,
          prayers: s.prayers_th,
          worship: s.worship_th,
          thumbnail: s.thumbnail,
          isHighlight: toBool(s.isHighlight), // yes/no -> boolean
          category, // ส่งเฉพาะชื่อ (ตาม locale)
        };
      });

    // community ที่ relate กับ temple นี้: community_th.temple_id = "id - name_th"
    const communitiesForTemple = communitiesTH
      .filter((c) => parseLeadingId(c.temple_id) === id)
      .map((c) => {
        if (locale === "en") {
          const en = communityEnByThId.get(c.id);
          return {
            id: c.id,
            name: en?.name_en || c.name_th,
            short: en?.short_en || c.short_th,
            history: en?.history_en || c.history_th,
            thumbnail: c.thumbnail,
            parking: toBool(c.parking),
            maps: c.maps,
            highlight: c.highlight_th,
          };
        }
        return {
          id: c.id,
          name: c.name_th,
          short: c.short_th,
          history: c.history_th,
          thumbnail: c.thumbnail,
          parking: toBool(c.parking),
          maps: c.maps,
          highlight: c.highlight_th,
        };
      });

    // payload ตาม locale
    const en = enByTempleThId.get(th.id);
    const temple = {
      id: th.id,
      name: locale === "en" ? en?.name_en || th.name_th : th.name_th,
      short: locale === "en" ? en?.short_en || th.short_th : th.short_th,
      history: locale === "en" ? en?.history_en || th.history_th : th.history_th,
      open_at: th.open_at,
      close_at: th.close_at,
      tel: th.tel,
      parking: toBool(th.parking),
      maps: th.maps,
      thumbnail: th.thumbnail,
    };

    return NextResponse.json(
      { temple, sacred: sacredForTemple, communities: communitiesForTemple },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
