import React, { useState } from 'react';
import { ExternalLink, ArrowRight, Package } from 'lucide-react';
import { Product, Category } from '../types';
import { trackOutboundClick } from '../lib/api';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';
import { OptimizedImage } from './OptimizedImage';

interface ProductCardProps {
  product: Product;
  categories: Category[];
  onViewDetails: (slug: string) => void;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  categories,
  onViewDetails,
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || settings.admin_theme || 'helios');
  const isManasa = theme.id === 'manasa';

  const categoryName = categories.find((c) => c.id === product.category_id)?.name || 'Tech';
  const displayCode = product.custom_code || `#${product.product_number.toString().padStart(2, '0')}`;

  const handleAmazonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackOutboundClick(product.id, 'catalog_card');
  };

  if (isManasa) {
    return (
      <article
        onClick={() => onViewDetails(product.slug)}
        className="group flex flex-col bg-white border border-zinc-200 hover:border-zinc-400 rounded-xl overflow-hidden transition-all duration-150 hover:-translate-y-0.5 cursor-pointer text-left"
      >
        {/* Clean 4:3 Product Photography without badge clutter */}
        <div className="relative aspect-[4/3] w-full bg-zinc-50 overflow-hidden border-b border-zinc-100">
          {!imageError && product.image_path ? (
            <OptimizedImage
              src={product.image_path}
              alt={product.name}
              width={800}
              height={600}
              priority={priority}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-500 p-4 text-center">
              <Package className="w-7 h-7 stroke-[1.5] mb-1.5 text-zinc-400" />
              <span className="text-[11px] font-mono tabular-nums text-zinc-500">{displayCode}</span>
            </div>
          )}
        </div>

        {/* Clean Editorial Card Body */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
          <div className="space-y-1.5">
            {/* Unboxed Metadata with Typographic Separator */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 tabular-nums">
              <span className="uppercase tracking-wide text-zinc-700 font-semibold truncate">
                {categoryName}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{displayCode}</span>
            </div>

            {/* Product Title */}
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-950 line-clamp-2 leading-snug group-hover:underline decoration-zinc-400 underline-offset-2">
              {product.name}
            </h3>

            {/* Short Useful Description */}
            <p className="text-[11px] sm:text-xs text-zinc-600 line-clamp-2 leading-relaxed">
              {product.short_description}
            </p>
          </div>

          {/* Purchase Action & Notes */}
          <div className="pt-2.5 border-t border-zinc-100 flex flex-col gap-1.5 mt-auto">
            <a
              href={product.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={handleAmazonClick}
              className="w-full min-h-[40px] px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] sm:text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title={`Check price for ${product.name} on Amazon`}
            >
              <span className="truncate">Check price on Amazon</span>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            </a>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product.slug);
              }}
              className="w-full min-h-[32px] py-1 text-center text-[11px] font-medium text-zinc-600 hover:text-zinc-950 flex items-center justify-center gap-1 transition-colors"
            >
              <span>View details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onViewDetails(product.slug)}
      className={`group relative flex flex-col ${theme.classes.bgCard} ${theme.classes.borderCard} hover:border-current rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.25)] ${theme.classes.bgCardHover} hover:-translate-y-1 cursor-pointer text-left`}
    >
      {/* Product Image Area - 4:3 Aspect Ratio */}
      <div className="relative aspect-[4/3] w-full bg-black/30 overflow-hidden border-b border-white/[0.06]">
        {!imageError && product.image_path ? (
          <OptimizedImage
            src={product.image_path}
            alt={product.name}
            width={800}
            height={600}
            priority={priority}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 text-zinc-500 p-3 sm:p-4 text-center">
            <Package className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5] mb-1 sm:mb-2 text-zinc-500" />
            <span className="text-[10px] sm:text-xs font-mono text-zinc-400">{displayCode}</span>
          </div>
        )}

        {/* Permanent Item Code Badge */}
        <div
          className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold shadow-md border"
          style={{
            backgroundColor: theme.isDark ? 'rgba(11, 13, 20, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            color: theme.swatch.accent,
            borderColor: theme.swatch.accent + '40',
          }}
        >
          {displayCode}
        </div>

        {/* Amazon Quick Icon */}
        <a
          href={product.affiliate_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleAmazonClick}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:text-amber-400 hover:border-amber-400/40 transition-colors shadow-md"
          title="Direct Amazon Link"
          aria-label="Direct Amazon Link"
        >
          <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </a>
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-4.5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          {/* Metadata */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium">
            <span
              className="font-bold truncate max-w-[95px] sm:max-w-none"
              style={{ color: theme.swatch.accent }}
            >
              {categoryName}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className={`font-mono text-[10px] ${theme.classes.textMuted}`}>{product.marketplace_code || 'US'}</span>
          </div>

          {/* Product Name */}
          <h3 className={`text-xs sm:text-sm font-bold ${theme.classes.textPrimary} line-clamp-2 leading-snug transition-colors`}>
            {product.name}
          </h3>

          {/* Short Editorial Summary */}
          <p className={`text-[11px] sm:text-xs ${theme.classes.textMuted} line-clamp-2 leading-relaxed`}>
            {product.short_description}
          </p>
        </div>

        {/* Card Actions */}
        <div className="pt-2 sm:pt-3 border-t border-white/[0.08] flex flex-col gap-2 mt-auto">
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleAmazonClick}
            className={`w-full min-h-[36px] sm:min-h-[40px] px-2.5 py-1.5 ${theme.classes.accentButton} text-[11px] sm:text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer`}
            title={`Check price for ${product.name} on Amazon`}
          >
            <span>Check price on Amazon</span>
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 opacity-90" />
          </a>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product.slug);
            }}
            className={`w-full py-1 text-center text-[10px] sm:text-xs font-medium ${theme.classes.textMuted} hover:${theme.classes.textPrimary} flex items-center justify-center gap-1 transition-colors`}
          >
            <span>View Full Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </article>
  );
});
