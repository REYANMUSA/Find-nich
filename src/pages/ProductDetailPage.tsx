import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { Product, Category } from '../types';
import { fetchProductBySlug, fetchCategories, fetchProducts, trackOutboundClick, adminFetchProductBySlug, isAuthenticated } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

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
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || 'helios');

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isAdminPreview, setIsAdminPreview] = useState(false);

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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Loading product overview...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-zinc-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">Product Not Available</h2>
        <p className="text-xs text-zinc-400">
          This item could not be found or has been withdrawn from public view.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === product.category_id)?.name || 'Tech';
  const displayCode = product.custom_code || `#${product.product_number.toString().padStart(3, '0')}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 text-left pb-28 md:pb-16">
      {/* Back Button & Preview Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to catalog</span>
        </button>

        {isAdminPreview && (
          <div className="px-3 py-1 bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded-lg text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Preview Mode: Item status is &quot;{product.status}&quot;</span>
          </div>
        )}
      </div>

      {/* Hero Split Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Column: Visual Presentation with Glass Card */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
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
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/60 text-zinc-500 p-8 text-center">
                <Package className="w-12 h-12 stroke-[1.5] mb-2 text-zinc-600" />
                <span className="text-xs font-mono text-zinc-500">{displayCode}</span>
              </div>
            )}

            {/* Permanent Code Tag */}
            <div className="absolute top-3.5 left-3.5 bg-[#0B0D14]/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-violet-300 border border-white/10 shadow-lg">
              {displayCode}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
            <span>Verified Gear Curation</span>
            <span>ID: {product.id.slice(0, 10)}</span>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="space-y-6">
          <div className="space-y-3">
            {/* Category Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <span className="uppercase tracking-wider font-bold" style={{ color: theme.swatch.accent }}>{categoryName}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="font-mono text-zinc-300 font-bold">{displayCode}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="font-mono text-zinc-400">Amazon {product.marketplace_code || 'US'}</span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {product.name}
            </h1>

            {/* Short Verdict */}
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal pt-1">
              {product.short_description}
            </p>
          </div>

          {/* Primary Affiliate Action Box (Glassmorphism) */}
          <div className="p-5 sm:p-6 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl space-y-4 shadow-xl">
            <a
              href={product.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackOutboundClick(product.id, 'product_detail')}
              className={`w-full min-h-[48px] px-6 py-3.5 ${theme.classes.accentButton} text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]`}
            >
              <span>View Product on Amazon</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: theme.swatch.accent }} />
              <span>Direct official Amazon Associates access link</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Evaluation Section (Why it made the cut) */}
      <div className="space-y-8 pt-6 border-t border-white/[0.08]">
        {/* Full Editorial Note */}
        {product.description && (
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-3 shadow-lg">
            <h2 className="text-sm font-mono uppercase tracking-wider font-bold" style={{ color: theme.swatch.accent }}>
              Editorial Evaluation & Testing
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* 2-Column Evaluation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Points */}
          {product.key_points && product.key_points.length > 0 && (
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Key Technical Highlights</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                {product.key_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: theme.swatch.accent }} />
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Who it is useful for */}
          {product.useful_for && product.useful_for.length > 0 && (
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: theme.swatch.accent }} />
                <span>Best Suited For</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                {product.useful_for.map((use, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{use}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Considerations / Caveats */}
        {product.considerations && (
          <div className="p-5 bg-amber-950/30 border border-amber-800/40 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Honest Trade-offs to Consider</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed pl-6">
              {product.considerations}
            </p>
          </div>
        )}
      </div>

      {/* Related Products in Category */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-white/[0.08]">
          <div>
            <h2 className="text-lg font-bold text-white">More in {categoryName}</h2>
            <p className="text-xs text-zinc-400">Other curated picks in this department.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
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
    </div>
  );
};
