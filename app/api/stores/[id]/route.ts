import { NextRequest, NextResponse } from "next/server";
import {
    fetchStoresTH,
    fetchStoresEN,
    fetchCommunitiesTH,
    fetchCommunitiesEN,
    StoreTH,
    StoreEN,
    CommunityTH,
    CommunityEN,
} from "@/app/lib/sheets";

// ——— Helpers ———
function parseLeadingId(input: string): string {
    if (!input) return "";
    const m = input.trim().match(/^(\d+)/);
    return m?.[1] ?? "";
}

type FetchedData = [
    StoreTH[],
    StoreEN[],
    CommunityTH[],
    CommunityEN[]
];

// ——— GET ———
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    const url = new URL(req.url);
    const locale = (url.searchParams.get("locale") ?? "th").toLowerCase();

    if (!id) {
        return NextResponse.json({ error: "Missing store id" }, { status: 400 });
    }

    try {
        const [storesTH, storesEN, communitiesTH, communitiesEN] =
            (await Promise.all([
                fetchStoresTH(),
                fetchStoresEN(),
                fetchCommunitiesTH(),
                fetchCommunitiesEN(),
            ])) as FetchedData;

        const sth = storesTH.find((s) => s.id === id);
        if (!sth) {
            return NextResponse.json(
                { error: `Store not found: ${id}` },
                { status: 404 }
            );
        }

        // Lookup EN Store
        const storeEnByThId = new Map<string, StoreEN>();
        for (const s of storesEN) {
            const thId = parseLeadingId(s.store_th_id);
            if (thId) storeEnByThId.set(thId, s);
        }
        const sen = storeEnByThId.get(sth.id);

        // Lookup Community (for linking back or showing context)
        const communityId = parseLeadingId(sth.community_th_id);
        const cth = communitiesTH.find((c) => c.id === communityId);

        // Lookup EN Community
        const communityEnByThId = new Map<string, CommunityEN>();
        for (const c of communitiesEN) {
            const thId = parseLeadingId(c.community_th_id);
            if (thId) communityEnByThId.set(thId, c);
        }
        const cen = cth ? communityEnByThId.get(cth.id) : undefined;

        // Construct Payload
        const store = {
            id: sth.id,
            name: locale === "en" ? sen?.name_en || sth.name_th : sth.name_th,
            short: locale === "en" ? sen?.short_en || sth.short_th : sth.short_th,
            tel: sth.tel,
            open_at: sth.open_at,
            close_at: sth.close_at,
            off_days: sth.off_days,
            thumbnail: sth.thumbnail,
        };

        let relatedCommunity = null;
        if (cth) {
            relatedCommunity = {
                id: cth.id,
                name: locale === "en" ? cen?.name_en || cth.name_th : cth.name_th,
            };
        }

        return NextResponse.json(
            { store, relatedCommunity },
            { status: 200 }
        );
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message ?? "Internal Server Error" },
            { status: 500 }
        );
    }
}
