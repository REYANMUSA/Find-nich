import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { Product, Category } from '../types';
import { fetchProductBySlug, fetchCategories, fetchProducts, trackOutboundClick, adminFetchProductBySlug, isAuthenticated } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { OptimizedImage } from '../components/OptimizedImage';
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
  const isManasa = theme.id === 'manasa';

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
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ borderColor: theme.swatch.accent, borderTopColor: 'transparent' }}
        />
        <p className={`text-xs ${theme.classes.textMuted} font-mono`}>Loading product overview...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Package className={`w-12 h-12 ${theme.classes.textMuted} mx-auto`} />
        <h2 className={`text-lg font-bold ${theme.classes.textPrimary}`}>Product Not Available</h2>
        <p className={`text-xs ${theme.classes.textMuted}`}>
          This item could not be found or has been withdrawn from public view.
        </p>
        <button
          type="button"
          onClick={onBack}
          className={`px-5 py-2.5 ${theme.classes.accentButton} text-xs font-semibold rounded-xl transition-colors`}
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === product.category_id)?.name || 'Tech';
  const displayCode = product.custom_code || `#${product.product_number.toString().padStart(2, '0')}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10 sm:space-y-12 text-left pb-28 md:pb-16">
      {/* Back Button & Preview Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex items-center gap-2 text-xs font-semibold transition-colors py-1.5 px-3 rounded-lg self-start ${
            theme.isDark
              ? 'text-zinc-400 hover:text-white hover:bg-white/5'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to catalog</span>
        </button>

        {isAdminPreview && (
          <div className="px-3 py-1 bg-amber-950/80 border border-amber-700 text-amber-200 rounded-lg text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Preview Mode: Item status is &quot;{product.status}&quot;</span>
          </div>
        )}
      </div>

      {/* Hero Split Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Column: Visual Presentation */}
        <div className="space-y-3">
          <div
            className={
              isManasa
                ? 'relative aspect-[4/3] w-full bg-white rounded-xl border border-zinc-200 overflow-hidden'
                : 'relative aspect-[4/3] w-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl'
            }
          >
            {!imageError && product.image_path ? (
              <OptimizedImage
                src={product.image_path}
                alt={product.name}
                width={800}
                height={600}
                priority={true}
                sizes="(max-width: 768px) 95vw, 560px"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${
                  theme.isDark ? 'bg-zinc-900/60 text-zinc-500' : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                <Package className="w-12 h-12 stroke-[1.5] mb-2 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-500">{displayCode}</span>
              </div>
            )}

            {/* Permanent Code Tag - omitted from corner photo in Manasa editorial mode */}
            {!isManasa && (
              <div
                className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border shadow-lg"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(11, 13, 20, 0.88)' : 'rgba(255, 255, 255, 0.94)',
                  color: theme.swatch.accent,
                  borderColor: theme.swatch.accent + '40',
                }}
              >
                {displayCode}
              </div>
            )}
          </div>

          <div className={`flex items-center justify-between text-[11px] ${theme.classes.textMuted} font-mono px-1`}>
            <span>Verified Gear Curation</span>
            <span>Item {displayCode}</span>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="space-y-6">
          <div className="space-y-3">
            {/* Category Breadcrumb */}
            <div className={`flex items-center gap-2 text-xs font-medium ${theme.classes.textMuted}`}>
              <span className="uppercase tracking-wider font-bold" style={{ color: theme.swatch.accent }}>
                {categoryName}
              </span>
              <span aria-hidden="true">·</span>
              <span className={`font-mono font-bold ${theme.classes.textPrimary}`}>{displayCode}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Amazon {product.marketplace_code || 'US'}</span>
            </div>

            {/* Product Title */}
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight ${theme.classes.textPrimary}`}>
              {product.name}
            </h1>

            {/* Short Verdict */}
            <p className={`text-sm sm:text-base ${theme.classes.textSecondary} leading-relaxed font-normal pt-1`}>
              {product.short_description}
            </p>
          </div>

          {/* Primary Affiliate Action Box */}
          <div
            className={
              isManasa
                ? 'p-5 sm:p-6 bg-[#F4F4F5] border border-zinc-200 rounded-xl space-y-3'
                : theme.isDark
                  ? 'p-5 sm:p-6 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl space-y-4 shadow-xl'
                  : 'p-5 sm:p-6 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4 shadow-xs'
            }
          >
            <a
              href={product.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackOutboundClick(product.id, 'product_detail')}
              className={`w-full min-h-[48px] px-6 py-3.5 ${theme.classes.accentButton} text-sm font-bold ${
                isManasa ? 'rounded-lg' : 'rounded-xl'
              } flex items-center justify-center gap-2 transition-all active:scale-[0.99]`}
            >
              <span>{isManasa ? 'Check price on Amazon' : 'View Product on Amazon'}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>

            <div className={`flex items-center gap-2 text-[11px] ${theme.classes.textMuted} justify-center text-center`}>
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: theme.swatch.accent }} />
              <span>
                {isManasa
                  ? 'Opens official Amazon product page · Affiliate link (no extra cost)'
                  : 'Direct official Amazon Associates access link'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Evaluation Section */}
      <div className={`space-y-6 sm:space-y-8 pt-6 border-t ${theme.isDark ? 'border-white/[0.08]' : 'border-zinc-200'}`}>
        {/* Full Editorial Note */}
        {product.description && (
          <div
            className={
              isManasa
                ? 'bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-3'
                : `${theme.classes.bgCard} border ${theme.classes.borderCard} rounded-2xl p-6 sm:p-8 space-y-3 shadow-lg`
            }
          >
            <h2 className="text-xs sm:text-sm font-mono uppercase tracking-wider font-bold" style={{ color: theme.swatch.accent }}>
              Editorial Evaluation & Notes
            </h2>
            <p className={`text-sm ${theme.classes.textSecondary} leading-relaxed whitespace-pre-line`}>
              {product.description}
            </p>
          </div>
        )}

        {/* 2-Column Evaluation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Points */}
          {product.key_points && product.key_points.length > 0 && (
            <div
              className={
                isManasa
                  ? 'bg-white border border-zinc-200 rounded-xl p-6 space-y-4'
                  : `${theme.classes.bgCard} border ${theme.classes.borderCard} rounded-2xl p-6 space-y-4 shadow-lg`
              }
            >
              <h3 className={`text-sm font-bold ${theme.classes.textPrimary} flex items-center gap-2`}>
                <CheckCircle2 className={`w-4 h-4 ${theme.isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span>Key Technical Highlights</span>
              </h3>
              <ul className={`space-y-2.5 text-xs ${theme.classes.textSecondary}`}>
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
            <div
              className={
                isManasa
                  ? 'bg-white border border-zinc-200 rounded-xl p-6 space-y-4'
                  : `${theme.classes.bgCard} border ${theme.classes.borderCard} rounded-2xl p-6 space-y-4 shadow-lg`
              }
            >
              <h3 className={`text-sm font-bold ${theme.classes.textPrimary} flex items-center gap-2`}>
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: theme.swatch.accent }} />
                <span>Best Suited For</span>
              </h3>
              <ul className={`space-y-2.5 text-xs ${theme.classes.textSecondary}`}>
                {product.useful_for.map((use, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${theme.isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                    <span className="leading-relaxed">{use}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Considerations / Caveats */}
        {product.considerations && (
          <div
            className={`p-5 rounded-xl border text-xs space-y-1.5 ${
              theme.isDark
                ? 'bg-amber-950/30 border-amber-800/40'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className={`flex items-center gap-2 font-bold ${theme.isDark ? 'text-amber-300' : 'text-amber-900'}`}>
              <AlertCircle className={`w-4 h-4 shrink-0 ${theme.isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>Honest Trade-offs to Consider</span>
            </div>
            <p className={`leading-relaxed pl-6 ${theme.isDark ? 'text-amber-200/90' : 'text-amber-900/90'}`}>
              {product.considerations}
            </p>
          </div>
        )}
      </div>

      {/* Related Products in Category */}
      {relatedProducts.length > 0 && (
        <div className={`space-y-6 pt-6 border-t ${theme.isDark ? 'border-white/[0.08]' : 'border-zinc-200'}`}>
          <div>
            <h2 className={`text-lg font-bold ${theme.classes.textPrimary}`}>More in {categoryName}</h2>
            <p className={`text-xs ${theme.classes.textMuted}`}>Other curated picks in this department.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
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
