import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Check, X, FolderTree, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Category } from '../../types';
import { adminFetchCategories, adminCreateCategory, adminUpdateCategory } from '../../lib/api';
import { useSiteSettings } from '../../lib/settingsStore';
import { getTheme } from '../../lib/themes';

export const AdminCategoriesPage: React.FC = () => {
  const { settings } = useSiteSettings();
  const currentTheme = getTheme(settings.admin_theme || 'helios');

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
      setMessage({ type: 'success', text: `Category "${created.name}" created and saved permanently.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create category.' });
    }
  };

  const handleSaveEdit = async (cat: Category) => {
    if (!editingName.trim()) return;
    try {
      const updated = await adminUpdateCategory(cat.id, { name: editingName.trim() });
      if (updated) {
        setCategories(categories.map((c) => (c.id === updated.id ? { ...c, name: updated.name } : c)));
      }
      setEditingId(null);
      setMessage({ type: 'success', text: `Renamed to "${editingName.trim()}".` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update category.' });
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const nextActive = !cat.is_active;
      const updated = await adminUpdateCategory(cat.id, { is_active: nextActive });
      if (updated) {
        setCategories(categories.map((c) => (c.id === updated.id ? { ...c, is_active: nextActive } : c)));
      }
      setMessage({
        type: 'success',
        text: `Category "${cat.name}" is now ${nextActive ? 'active' : 'hidden'}.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update category.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-violet-400" />
            <span>Category Niches</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Organize products by niche categories. Active categories appear in the storefront filter.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className={`min-h-[44px] px-4 py-2 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all self-start sm:self-auto`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
              : 'bg-red-950/60 border-red-700 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
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
        <form
          onSubmit={handleCreate}
          className="p-5 bg-[#131722]/90 border border-white/10 rounded-2xl space-y-4 backdrop-blur-md shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Add New Category</h2>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Audio, Desk Setup, Travel EDC..."
              required
              autoFocus
              className="w-full sm:flex-1 h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-none min-h-[44px] px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-md"
              >
                Save Category
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="min-h-[44px] px-4 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Category List */}
      <div className="bg-[#131722]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-400" />
            <span>Loading categories...</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 font-mono text-xs font-bold">
                    {cat.display_order}
                  </div>

                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-9 px-3 text-sm bg-[#0E101A] border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(cat)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 text-zinc-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {cat.name}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">
                          /{cat.slug}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        {cat.product_count || 0} products currently in this niche
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
                      cat.is_active
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </button>

                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditingName(cat.name);
                    }}
                    className="min-h-[36px] px-3 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
