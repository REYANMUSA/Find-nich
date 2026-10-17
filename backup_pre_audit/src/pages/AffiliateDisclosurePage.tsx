import React from 'react';
import { ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AffiliateDisclosurePageProps {
  onBack: () => void;
}

export const AffiliateDisclosurePage: React.FC<AffiliateDisclosurePageProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to catalog</span>
        </button>
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
          Affiliate Relationship & Disclosure
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Find Niche believes in full transparency regarding affiliate partnerships, compensations, and how our recommendations are formed.
        </p>
      </div>

      {/* Mandatory Associates Statement */}
      <div className="p-5 bg-zinc-50 border-2 border-zinc-900 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-zinc-900" />
          <span>Official Amazon Associates Program Statement</span>
        </div>
        <p className="text-base font-semibold text-zinc-950 italic">
          “As an Amazon Associate I earn from qualifying purchases.”
        </p>
        <p className="text-xs text-zinc-600 leading-relaxed pt-1">
          This statement is published in accordance with the Amazon Associates Program Operating Agreement and Program Policies.
        </p>
      </div>

      {/* Detailed Policies */}
      <div className="space-y-6 pt-2 text-sm text-zinc-700 leading-relaxed">
        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            What are Special Links?
          </h2>
          <p>
            When you click on the “Check price on Amazon” button on any product card or detail page on Find Niche, you follow an approved Amazon Special Link containing our unique Associates tracking tag. This link signals to Amazon that you were referred by Find Niche.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            Does using your link cost me more?
          </h2>
          <p>
            <strong>No, absolutely not.</strong> The purchase price, taxes, Prime benefits, return window, shipping options, and warranty conditions are completely identical whether you click through our link or search for the product independently on Amazon. The referral commission is paid directly by Amazon out of their standard operating margin.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            Does Find Niche sell products or collect payments?
          </h2>
          <p>
            No. Find Niche is strictly an editorial product discovery catalog. All commercial transactions—including order processing, billing, credit card security, shipping, package tracking, and customer support—take place exclusively on Amazon's official platform under Amazon's terms of service.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            Why do we not display static prices?
          </h2>
          <p>
            Amazon prices change dynamically based on deals, coupons, inventory, and seller selections. In compliance with Amazon's Operating Policies, we do not scrape or display static prices to prevent displaying inaccurate or outdated price claims. We invite you to view live prices directly on Amazon.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            Our Editorial Independence
          </h2>
          <p>
            Products are chosen based on practical design, utility, and build quality. We do not accept sponsored payments to alter our descriptions, nor do we falsely claim hands-on testing that never took place.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-200 text-xs text-zinc-500">
        <p>Last updated: October 2026. For questions regarding our affiliate disclosures, reach out via the owner contact channels.</p>
      </div>

    </div>
  );
};
