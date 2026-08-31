import { NextRequest, NextResponse } from "next/server";
import type { DualSearchResponse, SearchEngineResult } from "@/lib/types";
import { searchNearText } from "@/lib/weaviate";

export const runtime = "nodejs";

async function timed<T>(fn: () => Promise<T>): Promise<{ value?: T; ms: number; error?: string }> {
    const started = Date.now();
    try {
        const value = await fn();
        return { value, ms: Date.now() - started };
    } catch (err) {
        return { ms: Date.now() - started, error: err instanceof Error ? err.message : "search failed" };
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json() as { query?: string; tenantId?: string };
    const query = body.query?.trim();
    if (!query) {
        return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const tenantId = body.tenantId ?? "tenant-a";

    const opensearch: SearchEngineResult = {
        hits: [],
        ms: 0,
        error: "OpenSearch is not wired yet",
    };

    const weaviateRun = await timed(() => searchNearText({ query, tenantId, limit: 8 }));
    const weaviate: SearchEngineResult = weaviateRun.error
        ? { hits: [], ms: weaviateRun.ms, error: weaviateRun.error }
        : {
            hits: (weaviateRun.value ?? []).map((h) => ({ id: h.id, text: h.text, score: h.score })),
            ms: weaviateRun.ms,
        };

    const response: DualSearchResponse = { opensearch, weaviate };
    return NextResponse.json(response);
}
