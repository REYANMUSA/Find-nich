import React, { useState, useEffect } from 'react';
import { ChevronRight, Smartphone, Laptop, Home, Dumbbell, Shield, Sparkles, Package } from 'lucide-react';
import { Category, Product } from '../types';
import { fetchCategories, fetchProducts } from '../lib/api';
import { ProductCard } from '../components/ProductCard';

interface CategoriesPageProps {
  onSelectCategory: (categoryId: string) => void;
  onViewProduct: (slug: string) => void;
}

// Icon mapper for categories
const getCategoryIcon = (slug: string) => {
  const s = slug.toLowerCase();
  if (s.includes('phone')) return Smartphone;
  if (s.includes('tech') || s.includes('electronic')) return Laptop;
  if (s.includes('home') || s.includes('kitchen')) return Home;
  if (s.includes('body') || s.includes('sport') || s.includes('health')) return Dumbbell;
  return Package;
};

const getCategorySubtitle = (slug: string) => {
  const s = slug.toLowerCase();
  if (s.includes('phone')) return 'MagSafe gear, charging docks, stands & EDC cables';
  if (s.includes('tech') || s.includes('electronic')) return 'GaN fast chargers, ergonomic peripherals & tools';
  if (s.includes('home')) return 'Monitor light bars, desk cable docks & ambient gear';
  if (s.includes('body')) return 'Posture reminders, ergonomic wearables & massagers';
  return 'Curated hardware & useful everyday accessories';
};

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onSelectCategory,
  onViewProduct,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then((cats) => {
      setCategories(cats);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts({
      category: selectedCatId === 'all' ? undefined : selectedCatId,
      limit: 12,
    }).then((res) => {
      setProducts(res.products);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedCatId]);

  return (
    <div className="max-w-md md:max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      
      {/* Screen Header matching Screen 2 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            Categories
          </h1>
          <p className="text-xs text-zinc-500">
            Browse handpicked tech tools by department.
          </p>
        </div>
      </div>

      {/* Horizontal Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCatId('all')}
          className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCatId === 'all'
              ? 'bg-[#2E5B3E] text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCatId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-[#2E5B3E] text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* If "All" selected, show the visual category list rows matching Screen 2 */}
      {selectedCatId === 'all' && (
        <div className="space-y-3">
          <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 overflow-hidden shadow-xs">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.slug);
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-zinc-50/70 cursor-pointer transition-colors active:bg-zinc-100"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/60">
                      <Icon className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div className="truncate">
                      <h2 className="text-sm font-bold text-zinc-900">{cat.name}</h2>
                      <p className="text-xs text-zinc-500 truncate">{getCategorySubtitle(cat.slug)}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products list under selected category */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="font-semibold text-zinc-800">
            {selectedCatId === 'all' ? 'Featured Items' : categories.find(c => c.id === selectedCatId)?.name}
          </span>
          <span>{products.length} products</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-zinc-100 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 rounded-lg">
            No products in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
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

    </div>
  );
};
