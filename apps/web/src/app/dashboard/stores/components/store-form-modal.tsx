'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import type { Store, CreateStoreDto, StoreType } from '@repo/types';

const STORE_TYPE_OPTIONS = [
  { value: 'franchise', label: 'Franchise' },
  { value: 'central_kitchen', label: 'Central Kitchen' },
];

interface StoreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStoreDto) => Promise<void>;
  editingStore: Store | null;
}

export function StoreFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingStore,
}: StoreFormModalProps) {
  const [formData, setFormData] = useState<CreateStoreDto>({
    name: '',
    type: 'franchise',
    address: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingStore) {
        setFormData({
          name: editingStore.name,
          type: editingStore.type as StoreType,
          address: editingStore.address || '',
          phone: editingStore.phone || '',
        });
      } else {
        setFormData({ name: '', type: 'franchise', address: '', phone: '' });
      }
      setError(null);
    }
  }, [isOpen, editingStore]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingStore ? 'Edit Store' : 'Add Store'}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
        )}
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          minLength={2}
          maxLength={255}
        />
        <Select
          label="Type"
          options={STORE_TYPE_OPTIONS}
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value as StoreType })
          }
          required
        />
        <Input
          label="Address"
          value={formData.address || ''}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          maxLength={500}
        />
        <Input
          label="Phone"
          value={formData.phone || ''}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
          maxLength={20}
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {editingStore ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
