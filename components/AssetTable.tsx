'use client';

import { AssetRecord } from "@/lib/types";

interface Props {
    assets: AssetRecord[];
    onStatusChange: (asset: AssetRecord, newStatus: string) => void;
    onRowClick?: (asset: AssetRecord) => void;
    selectedSK?: string;
}

const STATUS_OPTIONS = ["Operational", "In Maintenance", "Disposed"]

export function AssetTable({ assets, onStatusChange, onRowClick, selectedSK }: Props) {
    const attributeKeys = Array.from(new Set(assets.flatMap((a) => Object.keys(a.attributes ?? {}))));

    return (
        <table className="w-full text-sm border-collapse">
            <thead>
                <tr className="text-left border-b">
                    <th className="py-2 pr-4">Record</th>
                    {attributeKeys.map((k) => (
                        <th key={k} className="py-2 pr-4">{k}</th>
                    ))}
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Photo</th>
                </tr>
            </thead>
            <tbody>
                {assets.map((asset) => (
                    <tr
                        key={asset.SK}
                        className={`border-b hover:bg-gray-50 cursor-pointer ${selectedSK === asset.SK ? "bg-blue-50" : ""}`}
                        onClick={() => onRowClick?.(asset)}
                    >
                        <td className="py-2 pr-4 font-mono text-xs">{asset.SK.split('#').pop()}</td>
                            {attributeKeys.map((k) => (
                                <td key={k} className="py-2 pr-4">{asset.attributes?.[k] ?? '—'}</td>
                            ))}
                            <td className="py-2 pr-4" onClick={(e) => e.stopPropagation()}>
                            <select
                                value={asset.status}
                                onChange={(e) => onStatusChange(asset, e.target.value)}
                                className="border rounded px-2 py-1 text-xs"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </td>
                        <td className="py-2 pr-4 text-xs text-gray-500">{asset.photoUrl ? "Yes" : "—"}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}