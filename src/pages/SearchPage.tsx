import React, { useState, useEffect } from 'react';
import {
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  Package,
  Home as HomeIcon,
  CookingPot,
  Cpu,
  Monitor,
  Smartphone,
  Compass,
  Sparkles,
  LayoutGrid,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Product, Category } from '../types';
import { fetchCategories, fetchProducts, trackOutboundClick } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface SearchPageProps {
  onViewProduct: (slug: string) => void;
  initialQuery?: string;
}

const DEFAULT_RECENT_SEARCHES = ['#07#00', 'kettle', 'pour over', 'charger', '#07', 'knife block', 'desk'];

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

export const SearchPage: React.FC<SearchPageProps> = ({
  onViewProduct,
  initialQuery = '',
}) => {
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || 'helios');

  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('latest');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('fn_recent_searches');
      return stored ? JSON.parse(stored) : DEFAULT_RECENT_SEARCHES;
    } catch {
      return DEFAULT_RECENT_SEARCHES;
    }
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const executeSearch = (searchTerm: string, cat = selectedCategory) => {
    setLoading(true);
    fetchProducts({
      q: searchTerm,
      category: cat === 'all' ? undefined : cat,
      sort: sortOption,
      limit: 24,
    })
      .then((res) => {
        setProducts(res.products);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Save to recents if not empty
    if (searchTerm.trim() && !recentSearches.includes(searchTerm.trim().toLowerCase())) {
      const updated = [searchTerm.trim().toLowerCase(), ...recentSearches.slice(0, 5)];
      setRecentSearches(updated);
      try {
        localStorage.setItem('fn_recent_searches', JSON.stringify(updated));
      } catch {}
    }
  };

  useEffect(() => {
    executeSearch(query, selectedCategory);
  }, [query, selectedCategory, sortOption]);

  const handleClearRecents = () => {
    setRecentSearches([]);
    localStorage.removeItem('fn_recent_searches');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 text-left pb-24">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.classes.textPrimary}`}>
          Search Catalog
        </h1>
        <p className={`text-xs sm:text-sm ${theme.classes.textMuted} mt-1`}>
          Find products by name, specs, or adjustable item numbers (e.g. #07#00, #07, #00, 07).
        </p>
      </div>

      {/* Glassmorphic Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products or item numbers (e.g. #07#00, #07, #00, kettle)..."
          autoFocus={!initialQuery}
          className={`w-full h-12 pl-11 pr-11 text-sm bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl ${theme.classes.textPrimary} placeholder:text-zinc-500 focus:outline-none focus:ring-1 shadow-md transition-colors`}
          style={{ borderColor: query ? theme.swatch.accent : undefined }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-3.5 p-1 text-zinc-400 hover:text-white"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Selection in LOGO FORM */}
      <div className="space-y-2">
        <span className={`text-[11px] font-semibold ${theme.classes.textMuted} uppercase tracking-wider block`}>
          Filter by Department Logo
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl border backdrop-blur-md transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'text-white'
                : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.06]'
            }`}
            style={selectedCategory === 'all' ? {
              backgroundColor: theme.swatch.accent + '25',
              borderColor: theme.swatch.accent,
              boxShadow: `0 0 15px ${theme.swatch.accent}55`,
            } : undefined}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
              style={selectedCategory === 'all' ? {
                backgroundColor: theme.swatch.accent,
                color: '#ffffff',
              } : {
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: '#a1a1aa',
              }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold">All</span>
          </button>

          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.slug);
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl border backdrop-blur-md transition-all shrink-0 ${
                  isSelected
                    ? 'text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                }`}
                style={isSelected ? {
                  backgroundColor: theme.swatch.accent + '25',
                  borderColor: theme.swatch.accent,
                  boxShadow: `0 0 15px ${theme.swatch.accent}55`,
                } : undefined}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                  style={isSelected ? {
                    backgroundColor: theme.swatch.accent,
                    color: '#ffffff',
                  } : {
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#a1a1aa',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Searches Tags */}
      {recentSearches.length > 0 && !query && (
        <div className="space-y-2">
          <div className={`flex items-center justify-between text-xs ${theme.classes.textMuted}`}>
            <span className="font-semibold uppercase tracking-wider text-[11px]">Recent Searches</span>
            <button
              onClick={handleClearRecents}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort and Count */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
        <span className={`font-mono ${theme.classes.textMuted}`}>
          {products.length} {products.length === 1 ? 'result' : 'results'}
        </span>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-[#0E101A] border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            style={{ borderColor: theme.swatch.accent + '44' }}
          >
            <option value="latest">Latest</option>
            <option value="num_asc">Item # (Ascending)</option>
            <option value="num_desc">Item # (Descending)</option>
            <option value="clicks">Most Clicked</option>
          </select>
        </div>
      </div>

      {/* Product Results / Blurred Feed Loading */}
      {loading ? (
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
                Searching catalog...
              </span>
            </div>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 space-y-3">
          <Package className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No items found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            No matches for "{query}". Try searching for #07#00, #07, #00, or a category like kitchen or home.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
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
