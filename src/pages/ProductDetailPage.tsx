import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { Product, Category } from '../types';
import { fetchProductBySlug, fetchCategories, fetchProducts, trackOutboundClick } from '../lib/api';
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setImageError(false);

    Promise.all([
      fetchProductBySlug(slug),
      fetchCategories(),
    ]).then(([prod, cats]) => {
      setProduct(prod);
      setCategories(cats);

      if (prod) {
        // Fetch related products from the same category
        fetchProducts({ category: prod.category_id, limit: 4 }).then((res) => {
          setRelatedProducts(res.products.filter((p) => p.id !== prod.id).slice(0, 3));
        });
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 animate-pulse space-y-6">
        <div className="h-4 w-28 bg-zinc-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-[4/3] bg-zinc-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-4 w-20 bg-zinc-200 rounded" />
            <div className="h-8 w-3/4 bg-zinc-200 rounded" />
            <div className="h-16 w-full bg-zinc-200 rounded" />
            <div className="h-12 w-full bg-zinc-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
          <Package className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900">Product Not Found</h1>
        <p className="text-xs text-zinc-500">
          The item you requested does not exist or may have been unlisted by the store owner.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded hover:bg-zinc-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Catalog</span>
        </button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === product.category_id)?.name || 'Tech';
  const formattedNumber = `#${product.product_number.toString().padStart(3, '0')}`;

  const handleAmazonOutbound = () => {
    trackOutboundClick(product.id, 'product_detail');
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer,sponsored');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to catalog</span>
        </button>
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
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 p-6">
                <Package className="w-12 h-12 stroke-[1.5] mb-2 text-zinc-400" />
                <span className="text-sm font-mono text-zinc-500">{formattedNumber}</span>
              </div>
            )}

            {/* Permanent Number floating badge */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded text-xs font-mono font-semibold text-zinc-900 border border-zinc-200 shadow-xs">
              Item {formattedNumber}
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 text-center">
            Original photo reference · Evaluated for Find Niche catalog
          </p>
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="space-y-6">
          <div className="space-y-2">
            {/* Category & Region Metadata */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <span>{categoryName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Item {formattedNumber}</span>
              <span aria-hidden="true">·</span>
              <span>Amazon {product.marketplace_code || 'US'}</span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 leading-tight">
              {product.name}
            </h1>

            {/* Short Kicker Recommendation */}
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal pt-1">
              {product.short_description}
            </p>
          </div>

          {/* Primary Affiliate Action Box */}
          <div className="p-4 sm:p-5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
            <button
              onClick={handleAmazonOutbound}
              className="w-full min-h-[48px] px-5 py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>Check price on Amazon</span>
              <ExternalLink className="w-4 h-4 shrink-0 opacity-80" />
            </button>

            {/* Amazon Associates Immediate Disclosure */}
            <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-500 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
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

          {/* What it is useful for */}
          {product.useful_for && product.useful_for.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wider text-xs">
                Best For & Ideal Scenarios
              </h2>
              <ul className="space-y-2">
                {product.useful_for.map((useCase, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-600">
                    <span className="text-zinc-400 font-mono">0{i + 1}.</span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Right 1 Col: Buying Considerations & Constraints (Honest Advice) */}
        <div className="space-y-6">
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
              <AlertCircle className="w-4 h-4 text-zinc-700" />
              <span>Buying Considerations</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {product.considerations || 'No notable compatibility caveats recorded for this hardware model.'}
            </p>
          </div>

          <div className="p-4 border border-zinc-100 rounded-lg space-y-2 text-xs text-zinc-500">
            <p className="font-semibold text-zinc-800">
              Pricing Transparency Note
            </p>
            <p className="leading-relaxed">
              In accordance with Amazon Operating Policies, Find Niche does not scrape or display static prices to avoid outdated information. Check the real-time price on Amazon directly.
            </p>
          </div>
        </div>

      </div>

      {/* Related Products in Same Category */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-zinc-200 space-y-6">
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

      {/* Fixed Sticky Mobile Buy Bar - Ergonomic Thumb Zone per Section 2 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-zinc-200 z-30 shadow-lg">
        <button
          onClick={handleAmazonOutbound}
          className="w-full min-h-[44px] px-4 py-2.5 bg-zinc-950 text-white text-xs font-semibold rounded flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <span>Check price on Amazon</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>

    </div>
  );
};
