import { createHash } from "crypto";
import { pipeline, env } from "@huggingface/transformers";

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL!;
export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM);

export type EmbeddingResult = {
    vector: number[];
    model: string;
    dim: number;
};

env.allowLocalModels = false;
env.useBrowserCache = false;
env.cacheDir = `${process.cwd()}/.cache/transformers`;

type Extractor = Awaited<ReturnType<typeof pipeline<"feature-extraction">>>;
let extractorPromise: Promise<Extractor> | null = null;

function getExtractor(): Promise<Extractor> {
    if (!extractorPromise) {
        extractorPromise = pipeline("feature-extraction", EMBEDDING_MODEL);
    }
    return extractorPromise;
}

export function contentHash(text: string): string {
    return createHash("sha256").update(text).digest("hex");
}

export async function embedMany(texts: string[]): Promise<EmbeddingResult[]> {
    const cleaned = texts.map((t) => t.trim()).filter(Boolean);
    if (cleaned.length === 0) {
        throw new Error("text is required");
    }

    const extractor = await getExtractor();
    const output = await extractor(cleaned, { pooling: "mean", normalize: true });

    const dim = output.dims.at(-1) ?? EMBEDDING_DIM;
    const data = Array.from(output.data as Float32Array);

    return cleaned.map((_, i) => ({
        vector: data.slice(i * dim, (i + 1) * dim),
        model: EMBEDDING_MODEL,
        dim,
    }));
}

export async function embed(text: string): Promise<EmbeddingResult> {
    const [first] = await embedMany([text]);
    return first;
}
