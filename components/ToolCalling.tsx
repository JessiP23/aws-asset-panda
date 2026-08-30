'use client'

import { ToolCallLogEntry } from "@/lib/types"

export function ToolCallLog({ entries }: { entries: ToolCallLogEntry[] }) {
    return (
        <div className="border rounded-md p-3 text-xs font-mono space-y-1 bg-gray-50">
            {entries.map((e, i) => (
                <div key={i}>
                    <span className="text-gray-400">[{e.role}]</span>{' '}
                    {e.toolName ? `called ${e.toolName}(${JSON.stringify(e.toolArgs)})` : e.content}
                </div>
            ))}
        </div>
    );
}