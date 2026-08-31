'use client';

import { useState } from 'react';
import { SearchResultColumn } from '@/components/SearchResultColumn';
import { searchAssets, debugEmbed } from '@/lib/api-client';
import type { DualSearchResponse, EmbeddingDebugResponse } from '@/lib/types';

export default function SearchLabPage() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<DualSearchResponse | null>(null);
    const [embedResult, setEmbedResult] = useState<EmbeddingDebugResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [embedLoading, setEmbedLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        try {
            setResult(await searchAssets(query, 'tenant-a'));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const runEmbed = async (index: boolean) => {
        if (!query.trim()) return;
        setEmbedLoading(true);
        setError(null);
        try {
            setEmbedResult(await debugEmbed(query, { tenantId: 'tenant-a', index }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Embed failed');
        } finally {
            setEmbedLoading(false);
        }
    };

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <p className="text-xs"><a href="/" className="text-blue-600">← Assets</a></p>
      <h1 className="text-xl font-semibold">Search Lab — OpenSearch vs. Weaviate</h1>
      <p className="text-xs text-gray-500">
        First call downloads MiniLM (can take a minute). Embed only proves 384-d vectors.
        Embed + index writes a probe into Weaviate so Search can hit it without a document corpus.
      </p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          placeholder="e.g. assets that need tires"
          className="border rounded-md px-3 py-2 text-sm flex-1"
        />
        <button onClick={runSearch} className="bg-black text-white text-sm px-4 rounded-md">Search</button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => runEmbed(false)} className="border text-sm px-3 py-1.5 rounded-md">
          {embedLoading ? 'Embedding…' : 'Embed only'}
        </button>
        <button onClick={() => runEmbed(true)} className="border text-sm px-3 py-1.5 rounded-md">
          Embed + index probe
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {embedResult && (
        <p className="text-xs text-gray-600 font-mono">
          {embedResult.model} · dim {embedResult.dimensions} · {embedResult.embedMs}ms · preview [{embedResult.preview.map((n) => n.toFixed(4)).join(', ')}]
          {embedResult.roundtrip && ` · indexed score ${embedResult.roundtrip.topScore.toFixed(3)}`}
        </p>
      )}
      <div className="flex gap-4">
        <SearchResultColumn title="OpenSearch" result={result?.opensearch ?? null} loading={loading} />
        <SearchResultColumn title="Weaviate" result={result?.weaviate ?? null} loading={loading} />
      </div>
    </main>
  );
}
