import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/embeddings";
import { upsertDocuments, searchNearText } from "@/lib/weaviate";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const body = await req.json() as {
        text?: string;
        tenantId?: string;
        index?: boolean;
    };
    const text = body.text?.trim();
    if (!text) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const started = Date.now();
    const { vector, model, dim } = await embed(text);
    const embedMs = Date.now() - started;

    let roundtrip: { id: string; topScore: number; hitText: string } | undefined;
    if (body.index) {
        const tenantId = body.tenantId ?? "tenant-a";
        const { ids } = await upsertDocuments([{ text, tenantId, kind: "probe" }]);
        const hits = await searchNearText({ query: text, tenantId, kind: "probe", limit: 1 });
        roundtrip = {
            id: ids[0],
            topScore: hits[0]?.score ?? 0,
            hitText: hits[0]?.text ?? "",
        };
    }

    return NextResponse.json({
        dimensions: dim,
        model,
        preview: vector.slice(0, 5),
        embedMs,
        roundtrip,
    });
}
