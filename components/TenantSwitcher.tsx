'use client'

import type { Tenant } from "@/lib/types"

interface Props {
    tenants: Tenant[];
    value: string;
    onChange: (tenantId: string) => void;
}

export function TenantSwitcher({ tenants, value, onChange }: Props) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
        >
            {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
            ))}
        </select>
    )
}