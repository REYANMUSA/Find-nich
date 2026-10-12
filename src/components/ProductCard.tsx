import React, { useState } from 'react';
import { ExternalLink, ArrowRight, Package } from 'lucide-react';
import { Product, Category } from '../types';
import { trackOutboundClick } from '../lib/api';

interface ProductCardProps {
  product: Product;
  categories: Category[];
  onViewDetails: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categories,
  onViewDetails,
}) => {
  const [imageError, setImageError] = useState(false);
  const categoryName = categories.find((c) => c.id === product.category_id)?.name || 'Tech';

  const formattedNumber = `#${product.product_number.toString().padStart(3, '0')}`;

  const handleAmazonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackOutboundClick(product.id, 'catalog_card');
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer,sponsored');
  };

  return (
    <article
      onClick={() => onViewDetails(product.slug)}
      className="group relative flex flex-col bg-white border border-zinc-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-zinc-400 hover:shadow-sm cursor-pointer"
    >
      {/* Product Image Area - 4:3 Aspect Ratio */}
      <div className="relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden">
        {!imageError && product.image_path ? (
          <img
            src={product.image_path}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 p-4 text-center">
            <Package className="w-8 h-8 stroke-[1.5] mb-2 text-zinc-400" />
            <span className="text-xs font-mono text-zinc-500">{formattedNumber}</span>
          </div>
        )}

        {/* Permanent Number floating micro-tag in image corner */}
        <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono font-medium text-zinc-800 border border-zinc-200/80 shadow-xs">
          {formattedNumber}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          {/* Metadata - unboxed text per Zero-Pill Constitution */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <span>{categoryName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{product.marketplace_code || 'US'}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-sm sm:text-base font-semibold text-zinc-950 line-clamp-2 leading-snug group-hover:text-zinc-800">
            {product.name}
          </h3>

          {/* Short Original Description */}
          <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        </div>

        {/* Card Actions Area */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2 mt-auto">
          {/* Action 1: Primary Amazon Outbound Button */}
          <button
            type="button"
            onClick={handleAmazonClick}
            className="w-full min-h-[44px] px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-zinc-900"
            title={`View ${product.name} on Amazon`}
          >
            <span>Check price on Amazon</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
          </button>

          {/* Action 2: Secondary View Product Detail Link */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product.slug);
            }}
            className="w-full py-1.5 text-center text-xs font-medium text-zinc-600 hover:text-zinc-950 flex items-center justify-center gap-1 transition-colors"
          >
            <span>View details & notes</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
          </button>
        </div>
      </div>
    </article>
  );
};
