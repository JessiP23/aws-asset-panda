import weaviate, { ApiKey, Filters, generateUuid5, type WeaviateClient } from "weaviate-client";
import { EMBEDDING_MODEL, contentHash, embed, embedMany } from "@/lib/embeddings";

export type VectorDocument = {
    id?: string;
    text: string;
    tenantId: string;
    kind?: string;
};

export type VectorHit = {
    id: string;
    text: string;
    score: number;
    tenantId?: string;
    kind?: string;
};

const COLLECTION = process.env.WEAVIATE_COLLECTION!;

let clientPromise: Promise<WeaviateClient> | null = null;
let collectionReady: Promise<void> | null = null;

function clusterUrl(): string {
    const raw = process.env.WEAVIATE_URL?.trim();
    const key = process.env.WEAVIATE_API_KEY?.trim();
    if (!raw || !key) {
        throw new Error("WEAVIATE_URL and WEAVIATE_API_KEY are required");
    }
    return raw.startsWith("http") ? raw : `https://${raw}`;
}

async function getClient(): Promise<WeaviateClient> {
    if (!clientPromise) {
        clientPromise = weaviate.connectToWeaviateCloud(clusterUrl(), {
            authCredentials: new ApiKey(process.env.WEAVIATE_API_KEY!.trim()),
            skipInitChecks: true,
        });
    }
    return clientPromise;
}

async function ensureCollection(): Promise<void> {
    if (!collectionReady) {
        collectionReady = (async () => {
            const client = await getClient();
            if (await client.collections.exists(COLLECTION)) return;
            await client.collections.create({
                name: COLLECTION,
                vectorizers: weaviate.configure.vectors.selfProvided({
                    vectorIndexConfig: weaviate.configure.vectorIndex.hnsw({
                        distanceMetric: "cosine",
                    }),
                }),
                properties: [
                    { name: "text", dataType: "text" },
                    { name: "tenantId", dataType: "text" },
                    { name: "kind", dataType: "text" },
                    { name: "embeddingModel", dataType: "text" },
                    { name: "contentHash", dataType: "text" },
                ],
            });
        })();
    }
    await collectionReady;
}

function documentId(doc: VectorDocument): string {
    return doc.id ?? generateUuid5(`${doc.tenantId}:${doc.kind ?? "doc"}:${contentHash(doc.text)}`);
}

export async function upsertDocuments(docs: VectorDocument[]): Promise<{ ids: string[]; model: string }> {
    const valid = docs.filter((d) => d.text.trim());
    if (valid.length === 0) {
        throw new Error("at least one document with text is required");
    }

    await ensureCollection();
    const client = await getClient();
    const collection = client.collections.use(COLLECTION);
    const embeddings = await embedMany(valid.map((d) => d.text));

    const ids = await Promise.all(
        valid.map((doc, i) => {
            const id = documentId(doc);
            return collection.data.replace({
                id,
                properties: {
                    text: doc.text.trim(),
                    tenantId: doc.tenantId,
                    kind: doc.kind ?? 'doc',
                    embeddingModel: embeddings[i].model,
                    contentHash: contentHash(doc.text),
                },
                vectors: embeddings[i].vector,
            }).then(() => id)
        })
    )

    return { ids, model: EMBEDDING_MODEL };
}

function combineFilters(a?: ReturnType<typeof Filters.and>, b?: typeof a) {
    return a && b ? Filters.and(a, b) : a ?? b;
}

export async function searchNearText(input: {
    query: string;
    tenantId?: string;
    kind?: string;
    limit?: number;
}): Promise<VectorHit[]> {
    const { query, tenantId, kind, limit = 8 } = input;
    const { vector } = await embed(query);
    await ensureCollection();
    const client = await getClient();
    const collection = client.collections.use(COLLECTION);

    const filter = combineFilters(tenantId ? collection.filter.byProperty('tenantId').equal(tenantId) : undefined, kind ? collection.filter.byProperty('kind').equal(kind) : undefined);

    const result = await collection.query.nearVector(vector, {
        limit,
        returnMetadata: ["distance"],
        returnProperties: ["text", "tenantId", "kind", "embeddingModel"],
        ...(filter ? { filters: filter } : {}),
    });

    return result.objects.map((obj) => {
        const distance = obj.metadata?.distance ?? 1;
        const props = obj.properties as { text?: string; tenantId?: string; kind?: string };
        return {
            id: obj.uuid,
            text: props.text ?? "",
            score: 1 - distance,
            tenantId: props.tenantId,
            kind: props.kind,
        };
    });
}
