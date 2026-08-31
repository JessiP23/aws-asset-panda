import { NextRequest, NextResponse } from "next/server";
import type { DualSearchResponse, SearchEngineResult, SearchHit } from "@/lib/types";
import { searchNearText } from "@/lib/weaviate";
export const runtime = "nodejs";
async function timedHits(fn: () => Promise<SearchHit[]>): Promise<SearchEngineResult> {
    const started = Date.now();
    try {
        return { hits: await fn(), ms: Date.now() - started };
    } catch (err) {
        return {
            hits: [],
            ms: Date.now() - started,
            error: err instanceof Error ? err.message : "search failed",
        };
    }
}
export async function POST(req: NextRequest) {
    const body = await req.json() as { query?: string; tenantId?: string };
    const query = body.query?.trim();
    if (!query) {
        return NextResponse.json({ error: "query is required" }, { status: 400 });
    }
    const tenantId = body.tenantId ?? "tenant-a";
    const weaviate = await timedHits(async () => {
        const hits = await searchNearText({ query, tenantId, limit: 8 });
        return hits.map(({ id, text, score }) => ({ id, text, score }));
    });
    const response: DualSearchResponse = {
        opensearch: { hits: [], ms: 0, error: "OpenSearch is not wired yet" },
        weaviate,
    };
    return NextResponse.json(response);
}