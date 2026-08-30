'use client'

import { SearchEngineResult } from "@/lib/types"

interface Props {
    title: string;
    result: SearchEngineResult | null;
    loading: boolean;
}

export function SearchResultColumn({ title, result, loading }: Props) {
    return (
        <div className="flex-1 border rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">{title}</h3>
                {result && <span className="text-xs text-gray-400">{result.ms} ms</span>}
            </div>
            {loading && <p className="text-xs text-gray-400">Searching…</p>}
            {result?.error && <p className="text-xs text-red-500">{result.error}</p>}
            {result && !loading && (
                <ul className="space-y-1">
                    {result.hits.map((hit) => (
                        <li key={hit.id} className="text-xs border-b py-1">
                            <span className="text-gray-400">{hit.score.toFixed(3)}</span> — {hit.text}
                        </li>
                    ))}
                {result.hits.length === 0 && <p className="text-xs text-gray-400">No matches.</p>}
                </ul>
            )}
        </div>
    );
}