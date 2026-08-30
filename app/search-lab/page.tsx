'use client';

import { useState } from 'react';
import { SearchResultColumn } from '@/components/SearchResultColumn';
import { searchAssets } from '@/lib/api-client';
import type { DualSearchResponse } from '@/lib/types';

export default function SearchLabPage() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<DualSearchResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const runSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            setResult(await searchAssets(query, 'tenant-a'));
        } finally {
            setLoading(false);
        }
    };

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-semibold">Search Lab — OpenSearch vs. Weaviate</h1>
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
      <div className="flex gap-4">
        <SearchResultColumn title="OpenSearch" result={result?.opensearch ?? null} loading={loading} />
        <SearchResultColumn title="Weaviate" result={result?.weaviate ?? null} loading={loading} />
      </div>
    </main>
  );
}