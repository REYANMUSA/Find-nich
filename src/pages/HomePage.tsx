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

  // Active social accounts for the homepage
  const homepageSocials = [
    {
      id: 'instagram',
      name: 'Instagram',
      url: settings.social_instagram,
      badgeClass: 'bg-gradient-to-r from-[#833ab4]/15 via-[#fd1d1d]/15 to-[#fcb045]/15 border-[#e4405f]/40 text-[#e4405f] hover:bg-[#e4405f] hover:text-white',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      url: settings.social_tiktok,
      badgeClass: 'bg-[#ff0050]/10 border-[#ff0050]/40 text-[#ff0050] hover:bg-[#ff0050] hover:text-white',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.49 2.79 1.54-.04 2.89-1.08 3.23-2.58.11-.53.13-1.07.13-1.61V.02h-.03z" />
        </svg>
      ),
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: settings.social_youtube,
      badgeClass: 'bg-[#ff0000]/10 border-[#ff0000]/40 text-[#ff0000] hover:bg-[#ff0000] hover:text-white',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      url: settings.social_x,
      badgeClass: theme.isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-black' : 'bg-black/5 border-black/20 text-black hover:bg-black hover:text-white',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      url: settings.social_snapchat,
      badgeClass: 'bg-[#fffc00]/15 border-[#fffc00]/40 text-[#d4b000] hover:bg-[#fffc00] hover:text-black',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12.298 2.002c-3.649 0-5.83 2.684-5.83 5.485 0 .894.27 1.835.632 2.474.135.238.162.46.081.704-.108.324-.46.541-.839.676-.757.27-1.407.649-1.624 1.19-.19.46.082.974.623 1.245 1.056.514 1.894.19 2.597-.109.217-.081.433-.162.677-.162.324 0 .54.108.73.27.46.406.893 1.11 1.19 1.624.433.785.92 1.353 1.76 1.353.784 0 1.325-.568 1.758-1.353.298-.514.73-1.218 1.19-1.624.19-.162.406-.27.73-.27.244 0 .46.081.677.162.703.299 1.541.623 2.597.109.541-.271.813-.785.623-1.245-.217-.541-.867-.92-1.624-1.19-.379-.135-.731-.352-.839-.676-.081-.244-.054-.466.081-.704.362-.639.632-1.58.632-2.474 0-2.801-2.181-5.485-5.83-5.485z" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      url: settings.social_facebook,
      badgeClass: 'bg-[#1877f2]/10 border-[#1877f2]/40 text-[#1877f2] hover:bg-[#1877f2] hover:text-white',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  const activeHomepageSocials = homepageSocials.filter((s) => s.url && s.url.trim().length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 text-left">
      
      {/* Editorial Hero Header */}
      <div className="space-y-3">
        <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${theme.classes.textPrimary}`}>
          {settings.hero_headline || 'Curated Tech & Gear. Tested Without Bias.'}
        </h1>
        <p className={`text-xs sm:text-sm ${theme.classes.textSecondary} max-w-2xl leading-relaxed`}>
          {settings.hero_subheadline ||
            'Handpicked EDC, minimalist desk setups, kitchen tools, and everyday utility gear with genuine editorial notes and direct Amazon access.'}
        </p>

        {/* Dynamic Social Accounts Badges - Prominently visible on Homepage */}
        {activeHomepageSocials.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${theme.classes.textMuted} mr-1`}>
              Find & Follow:
            </span>
            {activeHomepageSocials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${social.badgeClass}`}
                title={`Visit ${social.name} channel`}
              >
                {social.icon}
                <span>{social.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Glassmorphic Controls Section */}
      <div className={`${theme.classes.bgCard} backdrop-blur-2xl border ${theme.classes.borderCard} rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 transition-colors`}>
        
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
            {/* 'All Gear' Category Logo Button - The first one has to be All Gear */}
            {(() => {
              const isSelected = selectedCategory === 'all';
              return (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-200 shrink-0 ${
                    isSelected
                      ? 'text-white'
                      : theme.isDark
                        ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/20 text-zinc-300 hover:text-white'
                        : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950'
                  }`}
                  style={isSelected ? {
                    backgroundColor: theme.swatch.accent + '25',
                    borderColor: theme.swatch.accent,
                    boxShadow: `0 0 20px ${theme.swatch.accent}55`,
                  } : undefined}
                  title="All Gear (Entire Catalog)"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={isSelected ? {
                      backgroundColor: theme.swatch.accent,
                      color: '#ffffff',
                    } : {
                      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      color: theme.isDark ? '#a1a1aa' : '#52525b',
                    }}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-tight">All Gear</span>
                </button>
              );
            })()}

            {/* Dynamic Category Logo Buttons (Home, Kitchen, Tech, Desk, Phone, EDC, Body) */}
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.slug);
              const isSelected = selectedCategory === cat.slug;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-200 shrink-0 ${
                    isSelected
                      ? 'text-white'
                      : theme.isDark
                        ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/20 text-zinc-300 hover:text-white'
                        : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950'
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
                      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      color: theme.isDark ? '#a1a1aa' : '#52525b',
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
