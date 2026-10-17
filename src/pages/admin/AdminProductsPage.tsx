import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, EyeOff, Edit3, Trash2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product, Category } from '../../types';
import { adminFetchProducts, adminFetchCategories, adminPublishProduct, adminHideProduct, adminDeleteProduct } from '../../lib/api';

interface AdminProductsPageProps {
  onAddNewProduct: () => void;
  onEditProduct: (id: string) => void;
  onPreviewProduct: (slug: string) => void;
}

export const AdminProductsPage: React.FC<AdminProductsPageProps> = ({
  onAddNewProduct,
  onEditProduct,
  onPreviewProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'hidden'>('all');
  
  // Feedback & Modal state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        adminFetchProducts(),
        adminFetchCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load products list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePublish = async (product: Product) => {
    setActionLoading(true);
    setMessage(null);
    try {
      if (product.status === 'published') {
        const updated = await adminHideProduct(product.id);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setMessage({ type: 'success', text: `Item #${product.product_number} marked as hidden.` });
      } else {
        const updated = await adminPublishProduct(product.id);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setMessage({ type: 'success', text: `Item #${product.product_number} is now published.` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setActionLoading(true);
    try {
      await adminDeleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setMessage({
        type: 'success',
        text: `Item #${productToDelete.product_number} was soft-deleted. The permanent number will not be reused.`,
      });
      setProductToDelete(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete product.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    // Status filter
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const numMatch = q.match(/^#?0*(\d+)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      return p.product_number === num || p.name.toLowerCase().includes(q);
    }
    return p.name.toLowerCase().includes(q) || p.short_description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-950">Catalog Products</h1>
          <p className="text-xs text-zinc-500">
            Manage, publish, hide, or edit products. Product numbers are permanent.
          </p>
        </div>

        <button
          onClick={onAddNewProduct}
          className="min-h-[40px] px-4 py-2 bg-[#2E5B3E] hover:bg-[#234832] text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
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
          <button
            onClick={() => setMessage(null)}
            className="text-xs underline ml-2 opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls: Search & Status Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-zinc-200">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {(['all', 'published', 'draft', 'hidden'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`min-h-[34px] px-3 py-1.5 text-xs font-semibold rounded capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {st} ({st === 'all' ? products.length : products.filter((p) => p.status === st).length})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or #001..."
            className="w-full h-9 pl-8 pr-3 text-xs bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
          />
        </div>

      </div>

      {/* Products Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
        
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
            Loading catalog database...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <p className="text-sm font-semibold">No products found</p>
            <p className="text-xs text-zinc-400">Try adjusting your status filter or search query.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-20">Item #</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Clicks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredProducts.map((p) => {
                    const catName = categories.find((c) => c.id === p.category_id)?.name || 'General';
                    const isPub = p.status === 'published';
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                          #{p.product_number.toString().padStart(3, '0')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-900 truncate max-w-xs">{p.name}</div>
                          <div className="text-[11px] text-zinc-400 truncate max-w-sm">{p.short_description}</div>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 font-medium">
                          {catName}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                            isPub ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-zinc-700 tabular-nums">
                          {p.click_count || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview */}
                            <button
                              onClick={() => onPreviewProduct(p.slug)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded hover:bg-zinc-100"
                              title="Preview Public Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            {/* Publish / Hide toggle */}
                            <button
                              onClick={() => handleTogglePublish(p)}
                              disabled={actionLoading}
                              className={`p-1.5 rounded transition-colors ${
                                isPub
                                  ? 'text-zinc-600 hover:text-amber-700 hover:bg-amber-50'
                                  : 'text-zinc-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={isPub ? 'Hide from store' : 'Publish to store'}
                            >
                              {isPub ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => onEditProduct(p.id)}
                              className="p-1.5 text-zinc-600 hover:text-zinc-950 rounded hover:bg-zinc-100"
                              title="Edit product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-zinc-100">
              {filteredProducts.map((p) => {
                const catName = categories.find((c) => c.id === p.category_id)?.name || 'General';
                const isPub = p.status === 'published';
                return (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-zinc-500">
                          #{p.product_number.toString().padStart(3, '0')}
                        </span>
                        <h3 className="text-sm font-semibold text-zinc-900 leading-snug">{p.name}</h3>
                        <p className="text-xs text-zinc-500">{catName} · {p.click_count || 0} clicks</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize shrink-0 ${
                        isPub ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    {/* Mobile Touch Actions (44px hitboxes) */}
                    <div className="grid grid-cols-4 gap-2 pt-1 border-t border-zinc-100">
                      <button
                        onClick={() => onPreviewProduct(p.slug)}
                        className="min-h-[44px] flex flex-col items-center justify-center text-[10px] text-zinc-600 bg-zinc-50 rounded hover:bg-zinc-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mb-0.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleTogglePublish(p)}
                        className={`min-h-[44px] flex flex-col items-center justify-center text-[10px] rounded ${
                          isPub
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {isPub ? <EyeOff className="w-3.5 h-3.5 mb-0.5" /> : <Eye className="w-3.5 h-3.5 mb-0.5" />}
                        <span>{isPub ? 'Hide' : 'Publish'}</span>
                      </button>

                      <button
                        onClick={() => onEditProduct(p.id)}
                        className="min-h-[44px] flex flex-col items-center justify-center text-[10px] text-zinc-800 bg-zinc-50 rounded hover:bg-zinc-100"
                      >
                        <Edit3 className="w-3.5 h-3.5 mb-0.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setProductToDelete(p)}
                        className="min-h-[44px] flex flex-col items-center justify-center text-[10px] text-red-600 bg-red-50/60 rounded hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 mb-0.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-lg max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-zinc-950">
              Confirm Item Deletion
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Are you sure you want to remove Item #{productToDelete.product_number.toString().padStart(3, '0')} ("{productToDelete.name}")?
            </p>
            <p className="text-[11px] text-zinc-400 bg-zinc-50 p-2.5 rounded border border-zinc-200 leading-normal">
              <strong>Sequence Safety Rule:</strong> Product #{productToDelete.product_number} is permanent and will never be reused, preserving your video links and external references.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="min-h-[38px] px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="min-h-[38px] px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
