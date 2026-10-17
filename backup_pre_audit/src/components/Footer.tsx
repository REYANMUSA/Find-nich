import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/50 mt-16 pt-12 pb-16 text-zinc-600 text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Amazon Associates Mandatory Compliance Disclosure Box */}
        <div className="mb-10 p-4 sm:p-5 bg-white border border-zinc-200 rounded-lg">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-zinc-900 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-zinc-900">
                “As an Amazon Associate I earn from qualifying purchases.”
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Find Niche participates in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon. Product prices and availability are accurate as of the date/time indicated and are subject to change. Any price and availability information displayed on Amazon at the time of purchase will apply to the purchase of this product.
              </p>
            </div>
          </div>
        </div>

        {/* Brand & Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-zinc-900 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                FN
              </span>
              <span className="font-bold text-zinc-900">Find Niche</span>
            </div>
            <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
              A clean, mobile-first technology discovery catalog. We curate honest, useful gear and provide direct, verified links to official Amazon listings.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-3">
              Explore
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-zinc-900 transition-colors"
                >
                  Product Catalog
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-zinc-900 transition-colors"
                >
                  About Find Niche
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/affiliate-disclosure')}
                  className="hover:text-zinc-900 transition-colors"
                >
                  Affiliate Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-zinc-900 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-3">
              Administration
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/admin')}
                  className="hover:text-zinc-900 transition-colors text-left"
                >
                  Owner Portal
                </button>
              </li>
              <li className="text-zinc-400">
                Independent Curation
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & Bottom note */}
        <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} Find Niche. All rights reserved.</p>
          <p>Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.</p>
        </div>

      </div>
    </footer>
  );
};
