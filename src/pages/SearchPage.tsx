import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, SlidersHorizontal, LayoutGrid, List, ExternalLink, ArrowRight, Package } from 'lucide-react';
import { Product, Category } from '../types';
import { fetchCategories, fetchProducts, trackOutboundClick } from '../lib/api';
import { ProductCard } from '../components/ProductCard';

interface SearchPageProps {
  onViewProduct: (slug: string) => void;
  initialQuery?: string;
}

const DEFAULT_RECENT_SEARCHES = ['power bank', 'charger', 'light bar', 'mouse', '#001', 'cable'];

export const SearchPage: React.FC<SearchPageProps> = ({
  onViewProduct,
  initialQuery = '',
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('latest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
      limit: 20,
    }).then((res) => {
      setProducts(res.products);
      setLoading(false);
    }).catch(() => setLoading(false));

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

  const handleAmazonClick = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    trackOutboundClick(p.id, 'catalog_card');
  };

  return (
    <div className="max-w-md md:max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      
      {/* Search Bar matching Screen 3 & 6 */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products or item number (#001)..."
          autoFocus={!initialQuery}
          className="w-full h-11 pl-10 pr-10 text-sm bg-zinc-100/80 border border-zinc-200/80 rounded-xl text-zinc-950 placeholder:text-zinc-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E5B3E] focus:border-[#2E5B3E] transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-3 p-1 text-zinc-400 hover:text-zinc-700"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recent Searches Pills (matching Screen 6) */}
      {!query && recentSearches.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-900">Recent Searches</span>
            <button
              onClick={handleClearRecents}
              className="text-[#2E5B3E] hover:text-[#234832] font-semibold transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-xs font-medium transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Chips Bar (matching Screen 3) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`min-h-[34px] px-3.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#2E5B3E] text-white shadow-xs'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          All
        </button>
        {categories.map((c) => {
          const isSelected = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`min-h-[34px] px-3.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-[#2E5B3E] text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Results Header: Count, Sort & View Toggle */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-100">
        <div>
          <span className="font-semibold text-zinc-900">{products.length}</span> {products.length === 1 ? 'result' : 'results'}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-transparent text-xs font-medium text-zinc-700 border-none focus:outline-none cursor-pointer"
          >
            <option value="latest">Latest</option>
            <option value="clicks">Popular</option>
            <option value="num_asc">Item # (Asc)</option>
            <option value="num_desc">Item # (Desc)</option>
          </select>

          {/* List / Grid Toggle */}
          <div className="flex items-center border border-zinc-200 rounded-md p-0.5 bg-zinc-50">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-xs text-zinc-950' : 'text-zinc-400'}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-zinc-950' : 'text-zinc-400'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Rendering */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-100 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 space-y-2 bg-zinc-50 rounded-xl">
          <p className="text-sm font-semibold text-zinc-800">No matching products</p>
          <p className="text-xs text-zinc-500">
            Try searching by item number like "#001" or generic term like "charger".
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* Compact List Layout matching Screen 3 */
        <div className="space-y-3">
          {products.map((p) => {
            const formattedNum = `#${p.product_number.toString().padStart(3, '0')}`;
            return (
              <div
                key={p.id}
                onClick={() => onViewProduct(p.slug)}
                className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-300 transition-all cursor-pointer shadow-xs active:bg-zinc-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200/80">
                    <img
                      src={p.image_path}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-zinc-500">
                      {formattedNum}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 truncate max-w-xs">
                      {p.short_description}
                    </p>
                  </div>
                </div>

                {/* Amazon Buy Button */}
                <a
                  href={p.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={(e) => handleAmazonClick(e, p)}
                  className="min-h-[38px] px-3.5 py-1.5 bg-[#2E5B3E] hover:bg-[#254b33] text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1 transition-colors shadow-xs"
                >
                  <span>Amazon</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid Layout */
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
  );
};
