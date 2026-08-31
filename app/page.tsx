'use client';

import { useCallback, useEffect, useState } from 'react';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { DynamicFieldsForm } from '@/components/DynamicFieldsForm';
import { AssetTable } from '@/components/AssetTable';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { PhotoUploader } from '@/components/PhotoUploader';
import { getAssets, createAsset, updateAssetStatus, updateAssetPhoto, getNotifications } from '@/lib/api-client';
import type { AssetRecord } from '@/lib/types';

const TENANTS = [{ id: 'tenant-a', label: 'Tenant A — Vehicles' }, { id: 'tenant-b', label: 'Tenant B — Laptops' }];
const GROUP_BY_TENANT: Record<string, string> = { 'tenant-a': 'vehicles', 'tenant-b': 'laptops' };

export default function DashboardPage() {
  const [tenantId, setTenantId] = useState(TENANTS[0].id);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);
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

  const handlePhotoUploaded = async (key: string) => {
    if (!selectedAsset) return;
    await updateAssetPhoto({ PK: selectedAsset.PK, SK: selectedAsset.SK }, key);
    await loadAssets();
  };

  const fetchNotifications = useCallback(
    () => getNotifications(tenantId),
    [tenantId],
  );

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">AssetIQ</h1>
        <TenantSwitcher tenants={TENANTS} value={tenantId} onChange={(id) => { setTenantId(id); setSelectedAsset(null); }} />
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">Add asset</h2>
        <DynamicFieldsForm onSubmit={handleCreate} submitLabel="Create asset" />
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Assets</h2>
        <AssetTable
          assets={assets}
          onStatusChange={handleStatusChange}
          onRowClick={setSelectedAsset}
          selectedSK={selectedAsset?.SK}
        />
        <div className="mt-3">
          {selectedAsset ? (
            <PhotoUploader
              onUploaded={handlePhotoUploaded}
              label={`Upload photo for ${selectedAsset.SK.split("#").pop()}`}
            />
          ) : (
            <p className="text-xs text-gray-400">Select an asset to attach a photo.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Live notifications</h2>
        <NotificationsPanel fetchNotifications={fetchNotifications} />
      </section>
    </main>
  );
}