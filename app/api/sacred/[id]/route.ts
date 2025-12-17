import { NextRequest, NextResponse } from "next/server";
import {
    fetchSacredTH,
    fetchSacredEN,
    fetchTemplesTH,
    fetchTemplesEN,
    SacredTH,
    SacredEN,
    TempleTH,
    TempleEN,
} from "@/app/lib/sheets";

// ——— Helpers ———
function parseLeadingId(input: string): string {
    if (!input) return "";
    const m = input.trim().match(/^(\d+)/);
    return m?.[1] ?? "";
}

type FetchedData = [
    SacredTH[],
    SacredEN[],
    TempleTH[],
    TempleEN[]
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
        return NextResponse.json({ error: "Missing sacred id" }, { status: 400 });
    }

    try {
        const [sacredsTH, sacredsEN, templesTH, templesEN] =
            (await Promise.all([
                fetchSacredTH(),
                fetchSacredEN(),
                fetchTemplesTH(),
                fetchTemplesEN(),
            ])) as FetchedData;

        const sth = sacredsTH.find((s) => s.id === id);
        if (!sth) {
            return NextResponse.json(
                { error: `Sacred item not found: ${id}` },
                { status: 404 }
            );
        }

        // Lookup EN Sacred
        const sacredEnByThId = new Map<string, SacredEN>();
        for (const s of sacredsEN) {
            const thId = parseLeadingId(s.sacred_th_id);
            if (thId) sacredEnByThId.set(thId, s);
        }
        const sen = sacredEnByThId.get(sth.id);

        // Lookup Temple
        const templeId = parseLeadingId(sth.temple_th_id);
        const tth = templesTH.find((t) => t.id === templeId);

        // Lookup EN Temple
        const templeEnByThId = new Map<string, TempleEN>();
        for (const t of templesEN) {
            const thId = parseLeadingId(t.temple_th_id);
            if (thId) templeEnByThId.set(thId, t);
        }
        const ten = tth ? templeEnByThId.get(tth.id) : undefined;

        // Construct Payload
        const sacred = {
            id: sth.id,
            name: locale === "en" ? sen?.name_en || sth.name_th : sth.name_th,
            category: "", // SacredTH doesn't seems to have direct category name, usually linked to Category sheet if needed. But keeping simplified for now or rely on sth.category_id if logic exists. 
            // Update: sth.category_id exists, but for details page name/prayers are prioritized.
            prayers: locale === "en" ? sen?.prayers_en || sth.prayers_th : sth.prayers_th,
            worship: locale === "en" ? sen?.worship_en || sth.worship_th : sth.worship_th,
            isHighlight: sth.isHighlight,
            thumbnail: sth.thumbnail,
        };

        let relatedTemple = null;
        if (tth) {
            relatedTemple = {
                id: tth.id,
                name: locale === "en" ? ten?.name_en || tth.name_th : tth.name_th,
            };
        }

        return NextResponse.json(
            { sacred, relatedTemple },
            { status: 200 }
        );
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message ?? "Internal Server Error" },
            { status: 500 }
        );
    }
}
