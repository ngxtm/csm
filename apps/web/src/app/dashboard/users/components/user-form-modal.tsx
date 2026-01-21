'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import type { User, CreateUserRequest } from '@/lib/api/users';
import type { Store } from '@repo/types';
import type { UserRole } from '@/lib/stores/auth.store';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'ck_staff', label: 'CK Staff' },
  { value: 'store_staff', label: 'Store Staff' },
  { value: 'coordinator', label: 'Coordinator' },
];

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
  editingUser: User | null;
  stores: Store[];
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
  stores,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'store_staff',
    storeId: undefined,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setFormData({
          email: editingUser.email,
          password: '',
          fullName: editingUser.fullName || '',
          phone: editingUser.phone || '',
          role: editingUser.role,
          storeId: editingUser.storeId || undefined,
        });
      } else {
        setFormData({
          email: '',
          password: '',
          fullName: '',
          phone: '',
          role: 'store_staff',
          storeId: undefined,
        });
      }
      setError(null);
    }
  }, [isOpen, editingUser]);

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
      title={editingUser ? 'Edit User' : 'Add User'}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
        )}
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={!!editingUser}
        />
        {!editingUser && (
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            minLength={6}
          />
        )}
        <Input
          label="Full Name"
          value={formData.fullName || ''}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
        />
        <Input
          label="Phone"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        {!editingUser && (
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as UserRole })
            }
            required
          />
        )}
        <Select
          label="Store"
          options={[
            { value: '', label: 'No Store' },
            ...stores.map((s) => ({ value: s.id.toString(), label: s.name })),
          ]}
          value={formData.storeId?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              storeId: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
