import React, { useState, useEffect } from 'react';
import { Bookmark, ArrowRight, Trash2, Package } from 'lucide-react';
import { Product, Category } from '../types';
import { fetchProducts, fetchCategories } from '../lib/api';
import { useSavedProducts } from '../lib/savedStore';
import { ProductCard } from '../components/ProductCard';

interface SavedPageProps {
  onViewProduct: (slug: string) => void;
  onNavigateHome: () => void;
}

export const SavedPage: React.FC<SavedPageProps> = ({
  onViewProduct,
  onNavigateHome,
}) => {
  const { savedIds, toggleSave } = useSavedProducts();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (savedIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch all products to filter the saved ones
    fetchProducts({ limit: 100 })
      .then((res) => {
        const savedList = res.products.filter((p) => savedIds.includes(p.id));
        setProducts(savedList);
      })
      .finally(() => setLoading(false));
  }, [savedIds]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            <Bookmark className="w-6 h-6 stroke-[2.2] fill-[#2E5B3E] text-[#2E5B3E]" />
            <span>Saved Products</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Quick access to your bookmarked gear and wishlist tools.
          </p>
        </div>

        {products.length > 0 && (
          <span className="text-xs font-mono text-zinc-500">
            {products.length} {products.length === 1 ? 'item saved' : 'items saved'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-zinc-100 rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-[#2E5B3E]/10 border border-[#2E5B3E]/20 flex items-center justify-center mx-auto text-[#2E5B3E]">
            <Bookmark className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900">
              No saved products yet
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              When browsing, tap the bookmark icon on any product card to save it here for easy review later.
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2E5B3E] text-white text-xs font-semibold rounded-lg hover:bg-[#234832] transition-colors shadow-xs active:scale-[0.99]"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              categories={categories}
              onViewDetails={onViewProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
