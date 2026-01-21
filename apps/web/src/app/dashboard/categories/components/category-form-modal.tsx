'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button } from '@/components/ui';
import type { Category, CreateCategoryDto } from '@repo/types';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryDto) => Promise<void>;
  editingCategory: Category | null;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingCategory,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setFormData({
          name: editingCategory.name,
          description: editingCategory.description || '',
        });
      } else {
        setFormData({ name: '', description: '' });
      }
      setError(null);
    }
  }, [isOpen, editingCategory]);

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
    <Modal isOpen={isOpen} onClose={onClose} title={editingCategory ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>}
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          minLength={2}
          maxLength={255}
        />
        <Textarea
          label="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={500}
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{editingCategory ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
