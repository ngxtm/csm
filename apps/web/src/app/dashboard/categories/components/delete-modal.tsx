'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteModal({ isOpen, onClose, onConfirm }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Category">
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>}
      <p className="text-gray-600">
        Are you sure you want to delete this category? This action cannot be undone.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={handleConfirm} loading={loading}>Delete</Button>
      </div>
    </Modal>
  );
}
