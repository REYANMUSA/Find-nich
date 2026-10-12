import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, SlidersHorizontal, PackageSearch, RefreshCw } from 'lucide-react';
import { Product, Category } from '../types';
import { fetchCategories, fetchProducts } from '../lib/api';
import { ProductCard } from '../components/ProductCard';

interface HomePageProps {
  onViewProduct: (slug: string) => void;
  initialQuery?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ onViewProduct, initialQuery = '' }) => {
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
    } catch (err: any) {
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Editorial Header - Restrained per PRD */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
          Evaluated Tech & Utility Gear
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-xl">
          Clean, thoughtful technology tools and daily necessities. Browse by category or search by permanent item number.
        </p>
      </div>

      {/* Controls Section: Search & Category Filter */}
      <div className="space-y-3.5 bg-zinc-50/70 p-3 sm:p-4 rounded-lg border border-zinc-200">
        
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or item # (e.g. #001, 002, charger)..."
            className="w-full h-11 pl-10 pr-10 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-700 min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories Bar & Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          
          {/* Horizontal scrollable category tabs - Mobile thumb friendly */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              All Gear
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-[36px] px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                      : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 text-xs text-zinc-600">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-medium">Sort:</span>
            </div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="latest">Latest Added</option>
              <option value="num_asc">Product # (Ascending)</option>
              <option value="num_desc">Product # (Descending)</option>
              <option value="clicks">Most Interested</option>
            </select>
          </div>

        </div>

      </div>

      {/* Results Header Counter */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <div>
          {loading ? (
            <span>Scanning catalog...</span>
          ) : (
            <span>
              Showing <strong className="text-zinc-900 tabular-nums">{products.length}</strong> {products.length === 1 ? 'product' : 'products'}
              {searchQuery && (
                <span> for "<strong className="text-zinc-800">{searchQuery}</strong>"</span>
              )}
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-400">
          Official Amazon Associates links
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 animate-pulse space-y-3">
              <div className="aspect-[4/3] bg-zinc-200 rounded" />
              <div className="h-3 bg-zinc-200 rounded w-1/3" />
              <div className="h-4 bg-zinc-200 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 rounded w-full" />
              <div className="h-10 bg-zinc-200 rounded mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-8 text-center border border-zinc-200 rounded-lg bg-zinc-50 space-y-3">
          <p className="text-sm text-zinc-700">{error}</p>
          <button
            onClick={() => loadData(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded hover:bg-zinc-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="p-12 text-center border border-zinc-200 rounded-lg bg-white space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <PackageSearch className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">No products found</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            No matching tech items found for your criteria. Try searching by generic name (e.g. "charger", "power bank") or item number like "#001".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* Product Grid - 2 columns on mobile, 3-4 on desktop */}
      {!loading && !error && products.length > 0 && (
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
      )}

      {/* Load More Control */}
      {!loading && hasMore && (
        <div className="pt-6 text-center">
          <button
            onClick={() => loadData(false)}
            disabled={loadingMore}
            className="min-h-[44px] px-6 py-2.5 bg-white border border-zinc-300 hover:border-zinc-900 text-zinc-900 text-xs font-semibold rounded transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading next products...' : 'Load more products'}
          </button>
        </div>
      )}

      {/* In-Catalog Compliance Reminder */}
      <div className="mt-12 pt-6 border-t border-zinc-100 text-center">
        <p className="text-[11px] text-zinc-400">
          Find Niche is an independent curated catalog. Clicking “Check price on Amazon” opens the product directly on the official Amazon marketplace.
        </p>
      </div>

    </div>
  );
};
