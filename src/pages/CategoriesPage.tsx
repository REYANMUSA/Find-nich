import React, { useState, useEffect } from 'react';
import {
  Home as HomeIcon,
  CookingPot,
  Cpu,
  Monitor,
  Smartphone,
  Compass,
  Sparkles,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { Category, Product } from '../types';
import { fetchCategories, fetchProducts } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface CategoriesPageProps {
  onSelectCategory: (categoryId: string) => void;
  onViewProduct: (slug: string) => void;
}

function getCategoryIcon(slug: string) {
  switch (slug.toLowerCase()) {
    case 'home':
      return HomeIcon;
    case 'kitchen':
      return CookingPot;
    case 'tech':
      return Cpu;
    case 'desk':
      return Monitor;
    case 'phone':
      return Smartphone;
    case 'edc':
      return Compass;
    case 'body':
      return Sparkles;
    default:
      return LayoutGrid;
  }
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onViewProduct,
}) => {
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || 'helios');
  const isManasa = theme.id === 'manasa';

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
      limit: 24,
    })
      .then((res) => {
        setProducts(res.products);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCatId]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 text-left pb-24">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.classes.textPrimary}`}>
          Explore by Department
        </h1>
        <p className={`text-xs sm:text-sm ${theme.classes.textMuted} mt-1`}>
          Select any department to view curated gear and testing notes.
        </p>
      </div>

      {/* Category Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* First Button: All Gear */}
        {(() => {
          const isAllSelected = selectedCatId === 'all';
          if (isManasa) {
            return (
              <button
                type="button"
                onClick={() => setSelectedCatId('all')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-colors text-center ${
                  isAllSelected
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-white border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-700 hover:text-zinc-950'
                }`}
                title="All Gear (Entire Catalog)"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                    isAllSelected ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold tracking-tight">All Gear</span>
              </button>
            );
          }
          return (
            <button
              type="button"
              onClick={() => setSelectedCatId('all')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-200 text-center ${
                isAllSelected
                  ? 'text-white scale-[1.02]'
                  : theme.isDark
                    ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 text-zinc-300 hover:text-white'
                    : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950'
              }`}
              style={
                isAllSelected
                  ? {
                      backgroundColor: theme.swatch.accent + '25',
                      borderColor: theme.swatch.accent,
                      boxShadow: `0 0 25px ${theme.swatch.accent}55`,
                    }
                  : undefined
              }
              title="All Gear (Entire Catalog)"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors"
                style={
                  isAllSelected
                    ? { backgroundColor: theme.swatch.accent, color: '#ffffff' }
                    : {
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        color: theme.isDark ? '#a1a1aa' : '#52525b',
                      }
                }
              >
                <LayoutGrid className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold tracking-tight">All Gear</span>
            </button>
          );
        })()}

        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.slug);
          const isSelected = selectedCatId === cat.id || selectedCatId === cat.slug;

          if (isManasa) {
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.slug)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-colors text-center ${
                  isSelected
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-white border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-700 hover:text-zinc-950'
                }`}
                title={`Explore ${cat.name}`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                    isSelected ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold tracking-tight">{cat.name}</span>
              </button>
            );
          }

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCatId(cat.slug)}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-200 text-center ${
                isSelected
                  ? 'text-white scale-[1.02]'
                  : theme.isDark
                    ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 text-zinc-300 hover:text-white'
                    : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: theme.swatch.accent + '25',
                      borderColor: theme.swatch.accent,
                      boxShadow: `0 0 25px ${theme.swatch.accent}55`,
                    }
                  : undefined
              }
              title={`Explore ${cat.name}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors"
                style={
                  isSelected
                    ? { backgroundColor: theme.swatch.accent, color: '#ffffff' }
                    : {
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        color: theme.isDark ? '#a1a1aa' : '#52525b',
                      }
                }
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold tracking-tight">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Products in selected Category */}
      {loading ? (
        isManasa ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden p-3.5 space-y-3"
              >
                <div className="aspect-[4/3] rounded-lg bg-zinc-100 animate-pulse" />
                <div className="h-3 w-1/3 rounded bg-zinc-100 animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-zinc-100 animate-pulse" />
                <div className="h-9 w-full rounded-lg bg-zinc-100 animate-pulse mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative py-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 filter blur-[7px] opacity-40 pointer-events-none select-none transition-all duration-300">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`${theme.classes.bgCard} ${theme.classes.borderCard} rounded-2xl overflow-hidden p-3.5 space-y-3 shadow-lg`}
                >
                  <div className="aspect-[4/3] rounded-xl bg-white/10 animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-white/10 animate-pulse" />
                  <div className="h-4 w-4/5 rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-white/10 animate-pulse" />
                  <div className="h-9 w-full rounded-xl bg-white/10 animate-pulse mt-3" />
                </div>
              ))}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] animate-in fade-in duration-200">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" style={{ color: theme.swatch.accent }} />
                <span className="text-xs font-bold text-white tracking-tight">
                  Loading department items...
                </span>
              </div>
            </div>
          </div>
        )
      ) : products.length === 0 ? (
        <div
          className={`py-16 text-center border rounded-xl p-8 ${
            theme.isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-zinc-200'
          }`}
        >
          <p className={`text-xs ${theme.classes.textMuted}`}>No items available in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {products.map((p, index) => (
            <ProductCard
              key={p.id}
              product={p}
              categories={categories}
              onViewDetails={onViewProduct}
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
};
