import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  PackageSearch,
  RefreshCw,
  Home as HomeIcon,
  CookingPot,
  Cpu,
  Monitor,
  Smartphone,
  Compass,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { Product, Category } from '../types';
import { fetchCategories, fetchProducts } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface HomePageProps {
  onViewProduct: (slug: string) => void;
  initialQuery?: string;
}

// Map category slug to recognizable logo icons
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

export const HomePage: React.FC<HomePageProps> = ({ onViewProduct, initialQuery = '' }) => {
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || 'helios');

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [sortOption, setSortOption] = useState<string>('latest');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Load categories
  useEffect(() => {
    fetchCategories().then((cats) => {
      setCategories(cats);
    });
  }, []);

  // Fetch initial or filtered products
  const loadData = async (resetPage = true) => {
    const targetPage = resetPage ? 1 : page + 1;
    if (resetPage) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await fetchProducts({
        q: searchQuery,
        category: selectedCategory,
        sort: sortOption,
        page: targetPage,
        limit: 12,
      });

      if (resetPage) {
        setProducts(res.products);
        setPage(1);
      } else {
        setProducts((prev) => [...prev, ...res.products]);
        setPage(targetPage);
      }
      setHasMore(res.pagination.hasMore);
    } catch {
      setError('Could not load products. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [selectedCategory, sortOption, searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 text-left">
      
      {/* Editorial Hero Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {settings.hero_headline || 'Curated Tech & Gear. Tested Without Bias.'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          {settings.hero_subheadline ||
            'Handpicked EDC, minimalist desk setups, kitchen tools, and everyday utility gear with genuine editorial notes and direct Amazon access.'}
        </p>
      </div>

      {/* Glassmorphic Controls Section */}
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-5">
        
        {/* Search Bar with Item # support */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, category, or code (e.g. #07#00, #07, #00, kitchen, kettle)..."
            className={`w-full h-12 pl-11 pr-11 text-sm ${theme.classes.inputBg} ${theme.classes.inputBorder} rounded-xl ${theme.classes.textPrimary} placeholder:text-zinc-500 focus:outline-none transition-colors shadow-inner`}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3.5 p-1 text-zinc-400 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Selection in LOGO FORM */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold ${theme.classes.textMuted} uppercase tracking-wider text-[11px]`}>
              Browse by Category
            </span>
            <span className={`${theme.classes.textMuted} text-[11px] hidden sm:inline`}>
              Touch any icon logo to filter
            </span>
          </div>

          {/* Category Logo Buttons Row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
            {/* 'Home' Category Logo Button - Restored with Home icon */}
            {(() => {
              const isSelected = selectedCategory === 'all' || selectedCategory === 'home';
              return (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-200 shrink-0 ${
                    isSelected
                      ? 'text-white'
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/20 text-zinc-300 hover:text-white'
                  }`}
                  style={isSelected ? {
                    backgroundColor: theme.swatch.accent + '25',
                    borderColor: theme.swatch.accent,
                    boxShadow: `0 0 20px ${theme.swatch.accent}55`,
                  } : undefined}
                  title="Home Catalog (All Items)"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={isSelected ? {
                      backgroundColor: theme.swatch.accent,
                      color: '#ffffff',
                    } : {
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: '#a1a1aa',
                    }}
                  >
                    <HomeIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold tracking-tight">Home</span>
                </button>
              );
            })()}

            {/* Dynamic Category Logo Buttons (Kitchen, Tech, Desk, Phone, EDC, Body) */}
            {categories
              .filter((c) => c.slug !== 'home')
              .map((cat) => {
                const Icon = getCategoryIcon(cat.slug);
                const isSelected = selectedCategory === cat.slug;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-200 shrink-0 ${
                      isSelected
                        ? 'text-white'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/20 text-zinc-300 hover:text-white'
                    }`}
                    style={isSelected ? {
                      backgroundColor: theme.swatch.accent + '25',
                      borderColor: theme.swatch.accent,
                      boxShadow: `0 0 20px ${theme.swatch.accent}55`,
                    } : undefined}
                    title={`Filter by ${cat.name}`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={isSelected ? {
                        backgroundColor: theme.swatch.accent,
                        color: '#ffffff',
                      } : {
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: '#a1a1aa',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold tracking-tight">{cat.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Sort and Result Count Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
          <div className={`font-mono ${theme.classes.textMuted}`}>
            {products.length} {products.length === 1 ? 'item' : 'items'} found
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className={`w-3.5 h-3.5 ${theme.classes.textMuted}`} />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className={`${theme.classes.inputBg} ${theme.classes.inputBorder} ${theme.classes.textPrimary} text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer`}
            >
              <option value="latest">Latest Additions</option>
              <option value="num_asc">Item # (Lowest first)</option>
              <option value="num_desc">Item # (Highest first)</option>
              <option value="clicks">Most Clicked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid / Blurred Feed Loading */}
      {loading ? (
        <div className="relative py-2">
          {/* Blurred Feed Grid */}
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

          {/* Centered Frosted Glass Pill Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] animate-in fade-in duration-200">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" style={{ color: theme.swatch.accent }} />
              <span className="text-xs font-bold text-white tracking-tight">
                Scanning catalog...
              </span>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-950/40 border border-red-800/40 rounded-2xl max-w-md mx-auto space-y-3">
          <p className="text-xs text-red-300">{error}</p>
          <button
            onClick={() => loadData(true)}
            className="px-4 py-2 bg-red-800/50 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8">
          <PackageSearch className="w-10 h-10 text-zinc-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-white">No products found</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            {searchQuery
              ? `No products match "${searchQuery}". Try searching by code (e.g. #07#00, #01) or a different term.`
              : 'There are no active products in this category yet.'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* 2 columns on mobile (one on left, one on right), 3-4 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                onViewDetails={onViewProduct}
              />
            ))}
          </div>

          {/* Load More Pagination */}
          {hasMore && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => loadData(false)}
                disabled={loadingMore}
                className="min-h-[44px] px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                {loadingMore && <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />}
                <span>{loadingMore ? 'Loading More Items...' : 'Load More Products'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
