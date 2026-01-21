'use client';

import { useEffect, useState } from 'react';
import { categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui';
import { CategoryFormModal, DeleteModal } from './components';
import type { Category, CreateCategoryDto } from '@repo/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleFormSubmit(data: CreateCategoryDto) {
    if (editingCategory) {
      await categoriesApi.update(editingCategory.id, data);
    } else {
      await categoriesApi.create(data);
    }
    loadCategories();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await categoriesApi.delete(deleteId);
    setDeleteId(null);
    loadCategories();
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <Button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }}>Add Category</Button>
      </div>

      {error && <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>}

      <div className="mt-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3 font-medium text-gray-600">ID</th>
              <th className="p-3 font-medium text-gray-600">Name</th>
              <th className="p-3 font-medium text-gray-600">Description</th>
              <th className="p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{cat.id}</td>
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3 text-gray-500">{cat.description || '-'}</td>
                <td className="p-3">
                  <button onClick={() => { setEditingCategory(cat); setIsFormOpen(true); }} className="mr-2 text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => setDeleteId(cat.id)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No categories found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CategoryFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} editingCategory={editingCategory} />
      <DeleteModal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
