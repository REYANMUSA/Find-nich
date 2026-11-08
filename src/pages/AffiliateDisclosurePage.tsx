import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface AffiliateDisclosurePageProps {
  onBack: () => void;
}

export const AffiliateDisclosurePage: React.FC<AffiliateDisclosurePageProps> = ({ onBack }) => {
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || 'helios');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 text-left">
      <div>
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            theme.isDark
              ? 'text-zinc-400 hover:text-white bg-white/[0.04] border-white/10'
              : 'text-zinc-600 hover:text-zinc-950 bg-zinc-100 border-zinc-200'
          } transition-colors py-1.5 px-3 rounded-lg border`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to catalog</span>
        </button>
      </div>

      <div className="space-y-3">
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.classes.textPrimary}`}>
          Affiliate Relationship & Disclosure
        </h1>
        <p className={`text-sm ${theme.classes.textSecondary} leading-relaxed font-normal`}>
          {settings.logo_name || 'Find Niche'} believes in full transparency regarding affiliate partnerships, compensations, and how our recommendations are formed.
        </p>
      </div>

      {/* Mandatory Associates Statement */}
      <div className={`p-5 rounded-2xl border ${theme.classes.borderCard} ${theme.classes.bgCard} backdrop-blur-md shadow-xl space-y-2`}>
        <div className={`flex items-center gap-2 font-bold text-sm ${theme.classes.textPrimary}`}>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Official Amazon Associates Program Statement</span>
        </div>
        <p className={`text-base font-bold italic tracking-wide ${theme.classes.textPrimary}`}>
          “As an Amazon Associate I earn from qualifying purchases.”
        </p>
        <p className={`text-xs ${theme.classes.textMuted} leading-relaxed pt-1`}>
          This statement is published in accordance with the Amazon Associates Program Operating Agreement and Program Policies.
        </p>
      </div>

      {/* Detailed Policies */}
      <div className="space-y-6 pt-2 text-sm leading-relaxed">
        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            What are Special Links?
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            When you click on the “Check price on Amazon” button on any product card or detail page on {settings.logo_name || 'Find Niche'}, you follow an approved Amazon Special Link containing our unique Associates tracking tag. This link signals to Amazon that you were referred by {settings.logo_name || 'Find Niche'}.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            Does using your link cost me more?
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            <strong className="text-white">No, absolutely not.</strong> The purchase price, taxes, Prime benefits, return window, shipping options, and warranty conditions are completely identical whether you click through our link or search for the product independently on Amazon. The referral commission is paid directly by Amazon out of their standard operating margin.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            Does {settings.logo_name || 'Find Niche'} sell products or collect payments?
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            No. {settings.logo_name || 'Find Niche'} is strictly an editorial product discovery catalog. All commercial transactions—including order processing, billing, credit card security, shipping, package tracking, and customer support—take place exclusively on Amazon's official platform under Amazon's terms of service.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            Why do we not display static prices?
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            Amazon prices change dynamically based on deals, coupons, inventory, and seller selections. In compliance with Amazon's Operating Policies, we do not scrape or display static prices to prevent displaying inaccurate or outdated price claims. We invite you to view live prices directly on Amazon.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            Our Editorial Independence
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            Products are chosen based on practical design, utility, and build quality. We do not accept sponsored payments to alter our descriptions, nor do we falsely claim hands-on testing that never took place.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-white/10 text-xs text-zinc-500">
        <p>Last updated: October 2026. For questions regarding our affiliate disclosures, reach out via the owner contact channels.</p>
      </div>
    </div>
  );
};
