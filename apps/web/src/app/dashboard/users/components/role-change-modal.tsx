'use client';

import { useState } from 'react';
import { Modal, Select, Button } from '@/components/ui';
import type { User } from '@/lib/api/users';
import type { UserRole } from '@/lib/stores/auth.store';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'ck_staff', label: 'CK Staff' },
  { value: 'store_staff', label: 'Store Staff' },
  { value: 'coordinator', label: 'Coordinator' },
];

interface RoleChangeModalProps {
  user: User | null;
  onClose: () => void;
  onConfirm: (userId: string, role: UserRole) => Promise<void>;
}

export function RoleChangeModal({
  user,
  onClose,
  onConfirm,
}: RoleChangeModalProps) {
  const [newRole, setNewRole] = useState<UserRole>(user?.role || 'store_staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      await onConfirm(user.id, newRole);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={user !== null} onClose={onClose} title="Change Role">
      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
      )}
      <p className="mb-4 text-gray-600">
        Change role for <strong>{user?.email}</strong>
      </p>
      <Select
        label="New Role"
        options={ROLE_OPTIONS}
        value={newRole}
        onChange={(e) => setNewRole(e.target.value as UserRole)}
      />
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} loading={loading}>
          Change Role
        </Button>
      </div>
    </Modal>
  );
}
