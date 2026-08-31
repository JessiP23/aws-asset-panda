import { upsertDocuments, searchNearText } from "@/lib/weaviate";

async function main() {
    const sentence = 'The forklift needs a new hydraulic hose.';
    await upsertDocuments([{ text: sentence, tenantId: 'tenant-a' }]);
    const hits = await searchNearText({ query: sentence, tenantId: "tenant-a" });
    console.log(hits);
}

main();