import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Product, Category } from '../../types';
import {
  adminFetchProducts,
  adminFetchCategories,
  adminPublishProduct,
  adminHideProduct,
  adminDeleteProduct,
  adminHardDeleteProduct,
} from '../../lib/api';
import { useSiteSettings } from '../../lib/settingsStore';
import { getTheme } from '../../lib/themes';

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
  const { settings } = useSiteSettings();
  const currentTheme = getTheme(settings.admin_theme || 'helios');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'hidden' | 'archived'>('all');

  // Feedback & Modal state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
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
    setMessage(null);
    try {
      if (isPermanentDelete) {
        await adminHardDeleteProduct(productToDelete.id);
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setMessage({
          type: 'success',
          text: `Product #${productToDelete.product_number} ("${productToDelete.name}") deleted permanently from database and file records!`,
        });
      } else {
        await adminDeleteProduct(productToDelete.id);
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setMessage({
          type: 'success',
          text: `Item #${productToDelete.product_number} archived. Permanent number reserved.`,
        });
      }
      setProductToDelete(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete product.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
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
    <div className="space-y-6 text-left">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Product Catalog</span>
            <span className="text-xs font-mono font-normal text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              {products.length} Items Total
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your curated gear, verified photographs, affiliate links, and visibility status.
          </p>
        </div>

        <button
          onClick={onAddNewProduct}
          className={`min-h-[44px] px-5 py-2.5 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all self-start sm:self-auto`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Product</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
              : 'bg-red-950/60 border-red-700/60 text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{message.text}</span>
        </div>
      )}

      {/* Filter and Search Bar for Phone & PC */}
      <div className="bg-[#131722]/90 border border-white/10 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md shadow-md flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, # number, or keywords..."
            className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
        </div>

        {/* Status Filter Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto p-1 bg-black/40 rounded-xl border border-white/10">
          {(['all', 'published', 'draft', 'hidden'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Product List: Responsive Cards on Mobile + Table on Desktop */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-400" />
          <span>Loading catalog...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#131722]/90 border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No products found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchQuery
              ? `No catalog items matched "${searchQuery}". Try a different keyword.`
              : 'Your catalog is empty. Start by adding your first product.'}
          </p>
          <button
            onClick={onAddNewProduct}
            className={`min-h-[40px] px-4 py-2 ${currentTheme.classes.accentBg} text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Product Cards (Phone-Friendly) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredProducts.map((p) => {
              const cat = categories.find((c) => c.id === p.category_id);
              return (
                <div
                  key={p.id}
                  className="bg-[#131722]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-md shadow-md text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail Photo */}
                    <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0 relative flex items-center justify-center">
                      {p.image_path ? (
                        <img
                          src={p.image_path}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-zinc-600" />
                      )}
                      <span className="absolute bottom-0 right-0 bg-black/80 text-white font-mono text-[9px] px-1 font-bold">
                        #{p.product_number.toString().padStart(3, '0')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            p.status === 'published'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : p.status === 'draft'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {p.status}
                        </span>
                        {cat && (
                          <span className="text-[10px] text-zinc-400 truncate">
                            {cat.name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {p.short_description}
                      </p>
                    </div>
                  </div>

                  {/* Metrics and Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <div className="flex items-center gap-3 font-mono text-zinc-400 text-[11px]">
                      <span>{p.click_count || 0} clicks</span>
                      <span>·</span>
                      <span>{p.view_count || 0} views</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePublish(p)}
                        className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          p.status === 'published'
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                        title={p.status === 'published' ? 'Hide item' : 'Publish item'}
                      >
                        {p.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{p.status === 'published' ? 'Hide' : 'Publish'}</span>
                      </button>

                      <button
                        onClick={() => onEditProduct(p.id)}
                        className="min-h-[36px] px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setProductToDelete(p);
                          setIsPermanentDelete(true);
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-white transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-[#131722]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 font-mono bg-black/20">
                    <th className="py-3 px-4">Item #</th>
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Product Name & Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Clicks</th>
                    <th className="py-3 px-4 text-right">Views</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.category_id);
                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-zinc-300">
                          #{p.product_number.toString().padStart(3, '0')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-11 h-11 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
                            {p.image_path ? (
                              <img
                                src={p.image_path}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-zinc-600" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-bold text-white truncate text-sm">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span>{cat?.name || 'Uncategorized'}</span>
                            <span>·</span>
                            <span className="truncate">{p.short_description}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                              p.status === 'published'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                : p.status === 'draft'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 tabular-nums">
                          {p.click_count || 0}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-zinc-400 tabular-nums">
                          {p.view_count || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleTogglePublish(p)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                                p.status === 'published'
                                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                              title={p.status === 'published' ? 'Hide item' : 'Publish item'}
                            >
                              {p.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{p.status === 'published' ? 'Hide' : 'Publish'}</span>
                            </button>

                            <button
                              onClick={() => onEditProduct(p.id)}
                              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => {
                                setProductToDelete(p);
                                setIsPermanentDelete(true);
                              }}
                              className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-white transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131722] border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400 mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Delete #{productToDelete.product_number.toString().padStart(3, '0')}: "{productToDelete.name}"?
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Choose whether you want to permanently delete this product from the database or archive it.
              </p>
            </div>

            <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-zinc-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="delType"
                  checked={isPermanentDelete}
                  onChange={() => setIsPermanentDelete(true)}
                  className="text-red-600 focus:ring-0"
                />
                <span className="font-bold text-red-400">
                  Permanent Delete (Wipes product, photos, and records forever)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="delType"
                  checked={!isPermanentDelete}
                  onChange={() => setIsPermanentDelete(false)}
                  className="text-violet-600 focus:ring-0"
                />
                <span className="text-zinc-300">
                  Archive / Soft Delete (Hides from store, reserves product #)
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30 transition-all"
              >
                {actionLoading ? 'Deleting...' : isPermanentDelete ? 'Permanently Delete' : 'Archive Item'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
