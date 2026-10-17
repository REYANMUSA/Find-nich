import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Check, X, FolderTree, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Category } from '../../types';
import { adminFetchCategories, adminCreateCategory, adminUpdateCategory } from '../../lib/api';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<(Category & { product_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Category Input
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const loadCategories = async () => {
    try {
      const data = await adminFetchCategories();
      setCategories(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load categories.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setMessage(null);
    try {
      const created = await adminCreateCategory(newCategoryName.trim(), categories.length + 1);
      setCategories([...categories, { ...created, product_count: 0 }]);
      setNewCategoryName('');
      setIsAdding(false);
      setMessage({ type: 'success', text: `Category "${created.name}" created.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create category.' });
    }
  };

  const handleSaveEdit = async (cat: Category) => {
    if (!editingName.trim()) return;
    try {
      const updated = await adminUpdateCategory(cat.id, { name: editingName.trim() });
      setCategories(categories.map((c) => (c.id === updated.id ? { ...c, name: updated.name } : c)));
      setEditingId(null);
      setMessage({ type: 'success', text: `Renamed to "${updated.name}".` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update category.' });
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const updated = await adminUpdateCategory(cat.id, { is_active: !cat.is_active });
      setCategories(categories.map((c) => (c.id === updated.id ? { ...c, is_active: updated.is_active } : c)));
      setMessage({
        type: 'success',
        text: `Category "${cat.name}" is now ${updated.is_active ? 'active' : 'inactive'}.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to toggle status.' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-950">Store Categories</h1>
          <p className="text-xs text-zinc-500">
            Manage public catalog filter tabs. Deactivating a category hides it from the filter bar without deleting items.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="min-h-[40px] px-4 py-2 bg-[#2E5B3E] hover:bg-[#234832] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-3 rounded text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs underline ml-2 opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Add Category Form Box */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-4 bg-white border border-zinc-200 rounded-lg space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-900">Add New Category</h2>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Audio, Desk, Travel..."
              required
              autoFocus
              className="flex-1 h-10 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded hover:bg-zinc-800 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="min-h-[40px] px-3 py-2 bg-zinc-100 text-zinc-700 text-xs font-medium rounded hover:bg-zinc-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories List */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
            Loading categories...
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {categories.map((cat) => {
              const isEditingRow = editingId === cat.id;
              return (
                <div key={cat.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/60 transition-colors">
                  
                  {/* Category Info */}
                  <div className="min-w-0 flex items-center gap-3">
                    <FolderTree className="w-4 h-4 text-zinc-400 shrink-0" />
                    {isEditingRow ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 px-2 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat)}
                          className="p-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900">{cat.name}</span>
                          {!cat.is_active && (
                            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {cat.product_count || 0} items assigned · slug: /{cat.slug}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat)}
                      className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                        cat.is_active
                          ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {cat.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    {!isEditingRow && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                        className="p-2 text-zinc-500 hover:text-zinc-900 rounded hover:bg-zinc-100"
                        title="Rename Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
