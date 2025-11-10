import { NextResponse, NextRequest } from "next/server";
import {
  fetchTrip,
  fetchTripTemple,
  fetchTripCommunity,
  fetchTemplesTH,
  fetchTemplesEN,
  fetchCommunitiesTH,
  fetchCommunitiesEN,
  Trip,
  TripTemple,
  TripCommunity,
  TempleTH,
  TempleEN,
  CommunityTH,
  CommunityEN,
} from "@/app/lib/sheets";

type FetchedData = [
  Trip[],
  TripTemple[],
  TripCommunity[],
  TempleTH[],
  TempleEN[],
  CommunityTH[],
  CommunityEN[]
];

function parseLeadingId(input: string): string {
  if (!input) return "";
  const m = input.trim().match(/^(\d+)/);
  return m?.[1] ?? "";
}

// Normalize locale to "th" | "en" (accepts "en-US", "TH", etc.)
function pickLocale(sp: URLSearchParams): "th" | "en" {
  const raw = sp.get("locale");
  const norm = raw?.toLowerCase().split("-")[0];
  return norm === "en" ? "en" : "th";
}

type ItemSummary = { id: string; name: string; short: string; thumbnail: string };

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") ?? "th").trim().toLowerCase();

  if (!id) {
    return NextResponse.json({ error: "Missing trip id" }, { status: 400 });
  }

  try {
    const [
      trips,
      tripTemples,
      tripCommunities,
      templesTH,
      templesEN,
      communitiesTH,
      communitiesEN,
    ] = (await Promise.all([
      fetchTrip(),
      fetchTripTemple(),
      fetchTripCommunity(),
      fetchTemplesTH(),
      fetchTemplesEN(),
      fetchCommunitiesTH(),
      fetchCommunitiesEN(),
    ])) as FetchedData;

    const trip = trips.find((x) => x.id === id);
    if (!trip) {
      return NextResponse.json({ error: `Trip not found: ${id}` }, { status: 404 });
    }

    // ✅ คีย์ฝั่ง EN ให้ใช้ "เลขนำหน้า" ของ *_th_id
    const templeTH = new Map(templesTH.map((x) => [x.id, x]));
    const templeEN = new Map(templesEN.map((x) => [parseLeadingId(x.temple_th_id), x]));

    const communityTH = new Map(communitiesTH.map((x) => [x.id, x]));
    const communityEN = new Map(communitiesEN.map((x) => [parseLeadingId(x.community_th_id), x]));

    const temples = tripTemples
      .filter((r) => parseLeadingId(r.trip) === id)
      .map((r) => {
        const thId = parseLeadingId(r.temple);
        const th = templeTH.get(thId);
        if (!th) return null;

        if (locale === "en") {
          const en = templeEN.get(th.id); // ตอนนี้ key ตรงกันแน่นอน ("2")
          return {
            id: th.id,
            name: en?.name_en || th.name_th,
            short: en?.short_en || th.short_th,
            thumbnail: th.thumbnail,
          };
        }

        return { id: th.id, name: th.name_th, short: th.short_th, thumbnail: th.thumbnail };
      })
      .filter(Boolean) as Array<{
        id: string;
        name: string;
        short: string;
        thumbnail: string;
      }>;

    const communities = tripCommunities
      .filter((r) => parseLeadingId(r.trip) === id)
      .map((r) => {
        const thId = parseLeadingId(r.community);
        const th = communityTH.get(thId);
        if (!th) return null;

        if (locale === "en") {
          const en = communityEN.get(th.id); // key ตรงกันแล้ว
          return {
            id: th.id,
            name: en?.name_en || th.name_th,
            short: en?.short_en || th.short_th,
            thumbnail: th.thumbnail,
          };
        }

        return { id: th.id, name: th.name_th, short: th.short_th, thumbnail: th.thumbnail };
      })
      .filter(Boolean) as Array<{
        id: string;
        name: string;
        short: string;
        thumbnail: string;
      }>;

    return NextResponse.json(
      {
        trip: {
          id: trip.id,
          name: locale === "en" ? trip.name_en : trip.name_th,
          short: locale === "en" ? trip.short_en : trip.short_th,
        },
        temples,
        communities,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
