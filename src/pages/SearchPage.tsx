import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Flame,
  ArrowRight,
  Hash,
} from 'lucide-react';
import { Product, Category } from '../types';
import { fetchCategories, fetchProducts } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface SearchPageProps {
  onViewProduct: (slug: string) => void;
  initialQuery?: string;
}

const DEFAULT_RECENT_SEARCHES = ['#07#00', 'kettle', 'charger', '#07', 'desk'];

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
  const [allCatalogProducts, setAllCatalogProducts] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('fn_recent_searches');
      return stored ? JSON.parse(stored) : DEFAULT_RECENT_SEARCHES;
    } catch {
      return DEFAULT_RECENT_SEARCHES;
    }
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories and catalog baseline
  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchProducts({ limit: 48, sort: 'popular' })
      .then((res) => {
        setAllCatalogProducts(res.products);
        setSuggestedProducts(res.products.slice(0, 8));
      })
      .catch(() => {});
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

  // Live Auto-Suggestions calculation
  const liveSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const cleanNum = q.replace(/[^0-9]/g, '');
    const results: { type: 'item_number' | 'product' | 'category'; label: string; sublabel?: string; value: string; slug?: string }[] = [];

    // 1. Matches by category
    categories.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)) {
        results.push({
          type: 'category',
          label: `${c.name} Department`,
          sublabel: 'Filter category',
          value: c.slug,
        });
      }
    });

    // 2. Matches by product custom code or number
    allCatalogProducts.forEach((p) => {
      const code = (p.custom_code || `#${p.product_number}`).toLowerCase();
      const numStr = String(p.product_number);
      const isNumMatch = cleanNum && (numStr.includes(cleanNum) || code.includes(q));
      const isNameMatch = p.name.toLowerCase().includes(q);

      if (isNumMatch) {
        results.push({
          type: 'item_number',
          label: p.custom_code || `#${p.product_number}`,
          sublabel: p.name,
          value: p.custom_code || `#${p.product_number}`,
          slug: p.slug,
        });
      } else if (isNameMatch) {
        results.push({
          type: 'product',
          label: p.name,
          sublabel: p.custom_code || `#${p.product_number}`,
          value: p.name,
          slug: p.slug,
        });
      }
    });

    return results.slice(0, 6);
  }, [query, categories, allCatalogProducts]);

  const handleSelectSuggestion = (item: { value: string; slug?: string; type: string }) => {
    setShowSuggestions(false);
    if (item.type === 'category') {
      setSelectedCategory(item.value);
      setQuery('');
    } else if (item.slug) {
      onViewProduct(item.slug);
    } else {
      setQuery(item.value);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 text-left pb-28">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.classes.textPrimary}`}>
          Search Catalog
        </h1>
        <p className={`text-xs sm:text-sm ${theme.classes.textMuted} mt-1`}>
          Instant search with live suggestions by item number (e.g. #07#00, #01) or product name.
        </p>
      </div>

      {/* Modern App Search Bar with Real-Time Suggestions */}
      <div className="relative">
        <div className="relative z-20">
          <SearchIcon className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            placeholder="Search item numbers (e.g. #07#00, #01, #12) or keywords..."
            autoFocus={!initialQuery}
            className={`w-full h-12 pl-11 pr-11 text-sm ${theme.classes.inputBg} ${theme.classes.inputBorder} rounded-2xl ${theme.classes.textPrimary} placeholder:text-zinc-500 focus:outline-none focus:ring-1 shadow-md transition-colors`}
            style={{ borderColor: query ? theme.swatch.accent : undefined }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setShowSuggestions(false);
              }}
              className={`absolute right-3.5 top-3.5 p-1 ${theme.classes.textMuted} hover:${theme.classes.textPrimary}`}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Auto-Suggestions Dropdown */}
        {showSuggestions && liveSuggestions.length > 0 && (
          <div className={`absolute top-14 left-0 right-0 z-30 ${
            theme.isDark ? 'bg-[#0E121D]/95 border-white/15' : 'bg-white border-zinc-200'
          } border backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden divide-y ${
            theme.isDark ? 'divide-white/[0.06]' : 'divide-zinc-100'
          } animate-in fade-in slide-in-from-top-2 duration-150`}>
            <div className={`p-2 text-[10px] uppercase font-bold ${theme.classes.textMuted} px-3 flex items-center justify-between`}>
              <span>Suggestions</span>
              <button
                onClick={() => setShowSuggestions(false)}
                className={`${theme.classes.textMuted} hover:${theme.classes.textPrimary}`}
              >
                Close
              </button>
            </div>
            {liveSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.08] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: theme.swatch.accent + '25',
                      color: theme.swatch.accent,
                    }}
                  >
                    {item.type === 'item_number' ? (
                      <Hash className="w-3.5 h-3.5" />
                    ) : item.type === 'category' ? (
                      <LayoutGrid className="w-3.5 h-3.5" />
                    ) : (
                      <SearchIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate group-hover:text-violet-300">
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="text-[11px] text-zinc-400 block truncate">
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category Selection in LOGO FORM */}
      <div className="space-y-2">
        <span className={`text-[11px] font-semibold ${theme.classes.textMuted} uppercase tracking-wider block`}>
          Filter by Department Logo
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
          {/* First Button: All Gear */}
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
            <span className="text-xs font-bold">All Gear</span>
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

      {/* Product Results / Blurred Feed Loading / Suggested Gear Fallback */}
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
        <div className="space-y-8">
          {/* Friendly notice */}
          <div className="py-10 text-center bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-2.5">
            <Package className="w-9 h-9 text-zinc-500 mx-auto" />
            <h3 className="text-base font-bold text-white">
              No exact match for "{query}"
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Check out our recommended essentials below, or search by numbers like #07#00, #01, or #12.
            </p>
          </div>

          {/* Suggested Gear Fallback: NEVER a dead end! */}
          {suggestedProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-extrabold text-white tracking-tight">
                  Suggested Gear for You
                </h2>
                <span className="text-[11px] text-zinc-400">
                  (Popular verified catalog gear)
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {suggestedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    categories={categories}
                    onViewDetails={onViewProduct}
                  />
                ))}
              </div>
            </div>
          )}
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
