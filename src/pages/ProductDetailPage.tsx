import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Package, Bookmark } from 'lucide-react';
import { Product, Category } from '../types';
import { fetchProductBySlug, fetchCategories, fetchProducts, trackOutboundClick, adminFetchProductBySlug, isAuthenticated } from '../lib/api';
import { useSavedProducts } from '../lib/savedStore';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigateProduct: (slug: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  slug,
  onBack,
  onNavigateProduct,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isAdminPreview, setIsAdminPreview] = useState(false);
  const { isSaved, toggleSave } = useSavedProducts();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setImageError(false);
    setIsAdminPreview(false);

    Promise.all([
      fetchProductBySlug(slug),
      fetchCategories(),
    ]).then(async ([prod, cats]) => {
      let finalProd = prod;

      // If public fetch returned null (e.g. draft/hidden), check if authorized preview is allowed
      if (!finalProd && isAuthenticated()) {
        try {
          finalProd = await adminFetchProductBySlug(slug);
          if (finalProd) {
            setIsAdminPreview(true);
          }
        } catch {
          // not found
        }
      }

      setProduct(finalProd);
      setCategories(cats);

      if (finalProd) {
        // Fetch related products in same category
        fetchProducts({
          category: finalProd.category_id,
          limit: 4,
        }).then((rel) => {
          setRelatedProducts(rel.products.filter((p) => p.id !== finalProd?.id).slice(0, 3));
        });
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 animate-pulse">
        <div className="w-16 h-16 bg-zinc-100 rounded-full mx-auto" />
        <div className="h-4 bg-zinc-100 rounded w-48 mx-auto" />
        <div className="h-3 bg-zinc-100 rounded w-32 mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
          <Package className="w-8 h-8 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-950">Item Not Found</h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            This item may be inactive, out of stock, or archived from the public catalog.
          </p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E5B3E] text-white text-xs font-semibold rounded hover:bg-[#234832] transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Catalog</span>
        </button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === product.category_id)?.name || 'Tech';
  const formattedNumber = `#${product.product_number.toString().padStart(3, '0')}`;
  const saved = isSaved(product.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 pb-28 md:pb-12">
      {/* Back Button & Preview Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to catalog</span>
        </button>

        {isAdminPreview && (
          <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Private Preview Mode: Item status is currently &quot;{product.status}&quot;</span>
          </div>
        )}
      </div>

      {/* Hero Split Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Column: Visual Presentation */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full bg-zinc-100 rounded-lg border border-zinc-200 overflow-hidden shadow-xs">
            {!imageError && product.image_path ? (
              <img
                src={product.image_path}
                alt={product.name}
                loading="eager"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 p-8 text-center">
                <Package className="w-12 h-12 stroke-[1.5] mb-2 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-500">{formattedNumber}</span>
              </div>
            )}

            {/* Permanent Tag */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded text-xs font-mono font-bold text-zinc-900 border border-zinc-200 shadow-xs">
              {formattedNumber}
            </div>

            {/* Bookmark button on image */}
            <button
              onClick={() => toggleSave(product.id)}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                saved
                  ? 'bg-[#2E5B3E] text-white shadow-xs'
                  : 'bg-white/95 backdrop-blur-xs text-zinc-600 hover:text-zinc-950 hover:bg-white border border-zinc-200 shadow-xs'
              }`}
              title={saved ? 'Remove from saved' : 'Save product'}
              aria-label={saved ? 'Remove from saved' : 'Save product'}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-white stroke-white' : 'stroke-[2]'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
            <span>Find Niche Curated Hardware</span>
            <span>Permanent ID: {product.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="space-y-6">
          <div className="space-y-2">
            {/* Category Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <span className="uppercase tracking-wider font-semibold text-zinc-900">{categoryName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{formattedNumber}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-zinc-600">Amazon {product.marketplace_code || 'US'}</span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 leading-tight">
              {product.name}
            </h1>

            {/* Short High-Impact Verdict */}
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal pt-1">
              {product.short_description}
            </p>
          </div>

          {/* Primary Affiliate Action Box */}
          <div className="p-4 sm:p-5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <a
                href={product.affiliate_url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackOutboundClick(product.id, 'product_detail')}
                className="flex-1 min-h-[48px] px-5 py-3 bg-[#2E5B3E] hover:bg-[#234832] text-white text-sm font-semibold rounded flex items-center justify-center gap-2 transition-colors shadow-xs active:scale-[0.99]"
              >
                <span>Check price on Amazon</span>
                <ExternalLink className="w-4 h-4 shrink-0 opacity-90" />
              </a>

              <button
                onClick={() => toggleSave(product.id)}
                className={`w-12 h-12 shrink-0 rounded flex items-center justify-center border transition-colors ${
                  saved
                    ? 'bg-[#2E5B3E] text-white border-[#2E5B3E] shadow-xs'
                    : 'bg-white text-zinc-700 hover:text-zinc-950 border-zinc-200 hover:border-zinc-300'
                }`}
                title={saved ? 'Saved' : 'Save'}
                aria-label={saved ? 'Remove from saved' : 'Save'}
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-white stroke-white' : 'stroke-[2]'}`} />
              </button>
            </div>

            {/* Amazon Associates Immediate Disclosure */}
            <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-500 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#2E5B3E] shrink-0 mt-0.5" />
              <p>
                <strong>Affiliate Link:</strong> As an Amazon Associate I earn from qualifying purchases. Clicking routes directly to official Amazon listings where current price and shipping details are verified.
              </p>
            </div>
          </div>

          {/* Quick Snapshot Specs */}
          <div className="pt-2 border-t border-zinc-100 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block text-[11px]">Item Identifier</span>
              <span className="font-mono font-medium text-zinc-800">{formattedNumber}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Approved Marketplace</span>
              <span className="font-medium text-zinc-800">Amazon {product.marketplace_code || 'US'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Content Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-zinc-200">
        {/* Left 2 Cols: Honest Long Description & Highlights */}
        <div className="md:col-span-2 space-y-8">
          {/* Detailed Editorial Recommendation */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wider text-xs">
              Recommendation Notes
            </h2>
            <div className="text-sm text-zinc-700 leading-relaxed space-y-3">
              <p>{product.description}</p>
            </div>
          </div>

          {/* Key Features */}
          {product.key_points && product.key_points.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wider text-xs">
                Key Features
              </h2>
              <ul className="space-y-2">
                {product.key_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Useful For Scenarios */}
          {product.useful_for && product.useful_for.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wider text-xs">
                Best Suited For
              </h2>
              <div className="flex flex-wrap gap-2">
                {product.useful_for.map((use, i) => (
                  <span
                    key={i}
                    className="text-xs bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-full font-medium"
                  >
                    {use}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Honest Limitations / Considerations */}
        <div className="space-y-6">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-zinc-900">
              <AlertCircle className="w-4 h-4 text-zinc-800" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Honest Buying Notes
              </h3>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {product.considerations || 'Ensure dimensions and device ports match your setup before ordering. All purchases are backed by standard Amazon return policies.'}
            </p>
          </div>

          <div className="text-xs text-zinc-400 space-y-1.5 p-4 border border-zinc-100 rounded-lg">
            <p className="font-semibold text-zinc-700">Need help or questions?</p>
            <p>Every product link routes to Amazon for current real-time inventory and customer reviews.</p>
          </div>
        </div>
      </div>

      {/* Related Products in Same Category */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-zinc-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-zinc-950">
              More in {categoryName}
            </h2>
            <button
              onClick={onBack}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-950"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                categories={categories}
                onViewDetails={onNavigateProduct}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fixed Sticky Mobile Buy Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-zinc-200 z-30 shadow-lg pb-[calc(12px+env(safe-area-inset-bottom))]">
        <a
          href={product.affiliate_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => trackOutboundClick(product.id, 'product_detail')}
          className="w-full min-h-[44px] px-4 py-2.5 bg-[#2E5B3E] hover:bg-[#234832] text-white text-xs font-semibold rounded flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-xs"
        >
          <span>Check price on Amazon</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-90" />
        </a>
      </div>
    </div>
  );
};
