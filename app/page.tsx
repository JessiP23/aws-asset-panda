'use client';

import { useCallback, useEffect, useState } from 'react';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { DynamicFieldsForm } from '@/components/DynamicFieldsForm';
import { AssetTable } from '@/components/AssetTable';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { getAssets, createAsset, updateAssetStatus, getNotifications } from '@/lib/api-client';
import type { AssetRecord } from '@/lib/types';

const TENANTS = [{ id: 'tenant-a', label: 'Tenant A — Vehicles' }, { id: 'tenant-b', label: 'Tenant B — Laptops' }];
const GROUP_BY_TENANT: Record<string, string> = { 'tenant-a': 'vehicles', 'tenant-b': 'laptops' };

export default function DashboardPage() {
  const [tenantId, setTenantId] = useState(TENANTS[0].id);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const groupId = GROUP_BY_TENANT[tenantId];

  const loadAssets = useCallback(async () => {
    setAssets(await getAssets(tenantId, groupId));
  }, [tenantId, groupId]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const handleCreate = async (attributes: Record<string, string>) => {
    await createAsset({ tenantId, groupId, attributes });
    await loadAssets();
  };

  const handleStatusChange = async (asset: AssetRecord, newStatus: string) => {
    await updateAssetStatus({ PK: asset.PK, SK: asset.SK }, newStatus);
    await loadAssets();
  };

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">AssetIQ</h1>
        <TenantSwitcher tenants={TENANTS} value={tenantId} onChange={setTenantId} />
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">Add asset</h2>
        <DynamicFieldsForm onSubmit={handleCreate} submitLabel="Create asset" />
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Assets</h2>
        <AssetTable assets={assets} onStatusChange={handleStatusChange} />
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Live notifications</h2>
        <NotificationsPanel fetchNotifications={() => getNotifications(tenantId)} />
      </section>
    </main>
  );
}