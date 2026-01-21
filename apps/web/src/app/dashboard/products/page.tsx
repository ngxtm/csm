'use client';

import { useEffect, useState, useCallback } from 'react';
import { productsApi, categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui';
import { ProductFormModal, DeleteModal } from './components';
import type { Product, CreateProductDto, Category, ItemType } from '@repo/types';

const ITEM_TYPE_OPTIONS = [
  { value: 'material', label: 'Material' },
  { value: 'semi_finished', label: 'Semi-Finished' },
  { value: 'finished_product', label: 'Finished Product' },
];

const TYPE_COLORS: Record<string, string> = {
  material: 'bg-yellow-100 text-yellow-700',
  semi_finished: 'bg-orange-100 text-orange-700',
  finished_product: 'bg-green-100 text-green-700',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsApi.getAll({
        page,
        limit: 20,
        search: search || undefined,
        type: (typeFilter as ItemType) || undefined,
        categoryId: categoryFilter ? parseInt(categoryFilter) : undefined,
      });
      setProducts(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, categoryFilter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { categoriesApi.getAll().then(setCategories).catch(console.error); }, []);

  async function handleFormSubmit(data: CreateProductDto) {
    if (editingProduct) {
      await productsApi.update(editingProduct.id, data);
    } else {
      await productsApi.create(data);
    }
    loadProducts();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await productsApi.delete(deleteId);
    setDeleteId(null);
    loadProducts();
  }

  function handleFilterChange(setter: (val: string) => void) {
    return (value: string) => { setter(value); setPage(1); };
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500">{total} products total</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}>Add Product</Button>
      </div>

      {error && <div className="mt-4 rounded bg-red-50 p-3 text-red-600">{error}</div>}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-4">
        <input type="text" placeholder="Search name or SKU..." value={search} onChange={(e) => handleFilterChange(setSearch)(e.target.value)} className="rounded border p-2" />
        <select value={typeFilter} onChange={(e) => handleFilterChange(setTypeFilter)(e.target.value)} className="rounded border p-2">
          <option value="">All Types</option>
          {ITEM_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => handleFilterChange(setCategoryFilter)(e.target.value)} className="rounded border p-2">
          <option value="">All Categories</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
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
                <th className="p-3 font-medium text-gray-600">SKU</th>
                <th className="p-3 font-medium text-gray-600">Name</th>
                <th className="p-3 font-medium text-gray-600">Category</th>
                <th className="p-3 font-medium text-gray-600">Type</th>
                <th className="p-3 font-medium text-gray-600">Unit</th>
                <th className="p-3 font-medium text-gray-600">Status</th>
                <th className="p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{product.sku}</td>
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-gray-500">{product.categoryName || '-'}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-xs ${TYPE_COLORS[product.type] || 'bg-gray-100'}`}>
                      {product.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3">{product.unit}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-xs ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="mr-2 text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => setDeleteId(product.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-500">No products found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-gray-600">Page {page} of {totalPages}</span>
          <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} editingProduct={editingProduct} categories={categories} />
      <DeleteModal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
