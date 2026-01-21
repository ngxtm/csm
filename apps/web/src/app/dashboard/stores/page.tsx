'use client';

import { useEffect, useState } from 'react';
import { storesApi } from '@/lib/api';
import { Button } from '@/components/ui';
import { StoreFormModal, DeleteModal } from './components';
import type { Store, CreateStoreDto, StoreType } from '@repo/types';

const STORE_TYPE_OPTIONS = [
  { value: 'franchise', label: 'Franchise' },
  { value: 'central_kitchen', label: 'Central Kitchen' },
];

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deleteStore, setDeleteStore] = useState<Store | null>(null);

  useEffect(() => {
    loadStores();
  }, [typeFilter]);

  async function loadStores() {
    try {
      setLoading(true);
      setError(null);
      const data = await storesApi.getAll({ type: typeFilter as StoreType | undefined });
      setStores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleFormSubmit(data: CreateStoreDto) {
    if (editingStore) {
      await storesApi.update(editingStore.id, data);
    } else {
      await storesApi.create(data);
    }
    loadStores();
  }

  async function handleDelete() {
    if (!deleteStore) return;
    await storesApi.delete(deleteStore.id);
    setDeleteStore(null);
    loadStores();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Stores</h1>
        <Button onClick={() => { setEditingStore(null); setIsFormOpen(true); }}>Add Store</Button>
      </div>

      {error && <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>}

      {/* Filters */}
      <div className="mt-4 flex gap-4">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded border p-2">
          <option value="">All Types</option>
          {STORE_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="mt-6">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3 font-medium text-gray-600">ID</th>
                <th className="p-3 font-medium text-gray-600">Name</th>
                <th className="p-3 font-medium text-gray-600">Type</th>
                <th className="p-3 font-medium text-gray-600">Phone</th>
                <th className="p-3 font-medium text-gray-600">Status</th>
                <th className="p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{store.id}</td>
                  <td className="p-3 font-medium">{store.name}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-xs ${store.type === 'central_kitchen' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {store.type}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{store.phone || '-'}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-xs ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {store.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => { setEditingStore(store); setIsFormOpen(true); }} className="mr-2 text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => setDeleteStore(store)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No stores found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <StoreFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} editingStore={editingStore} />
      <DeleteModal isOpen={deleteStore !== null} storeName={deleteStore?.name || ''} onClose={() => setDeleteStore(null)} onConfirm={handleDelete} />
    </div>
  );
}
