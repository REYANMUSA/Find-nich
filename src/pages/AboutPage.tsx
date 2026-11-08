import React from 'react';
import { ArrowLeft, Compass, Shield, Eye } from 'lucide-react';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || 'helios');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 text-left">
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-white/[0.04] border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to catalog</span>
        </button>
      </div>

      <div className="space-y-3">
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.classes.textPrimary}`}>
          About {settings.logo_name || 'Find Niche'}
        </h1>
        <p className={`text-sm ${theme.classes.textSecondary} leading-relaxed font-normal`}>
          A minimalist tech product discovery catalog created to help you discover genuinely useful hardware tools and accessories without wading through manufactured reviews or bloated affiliate landing pages.
        </p>
      </div>

      {/* Core Principles */}
      <div className="space-y-6 pt-4 border-t border-white/10">
        <h2 className={`text-lg font-bold ${theme.classes.textPrimary}`}>
          Our Curation Principles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-4.5 rounded-2xl border ${theme.classes.borderCard} ${theme.classes.bgCard} space-y-2 backdrop-blur-md shadow-md`}>
            <Compass className="w-5 h-5 text-emerald-400" />
            <h3 className={`text-sm font-bold ${theme.classes.textPrimary}`}>Restraint Over Volume</h3>
            <p className={`text-xs ${theme.classes.textMuted} leading-relaxed`}>
              We do not catalog thousands of generic items. Every item is indexed with an adjustable item number and selected for everyday practical utility.
            </p>
          </div>

          <div className={`p-4.5 rounded-2xl border ${theme.classes.borderCard} ${theme.classes.bgCard} space-y-2 backdrop-blur-md shadow-md`}>
            <Eye className="w-5 h-5 text-violet-400" />
            <h3 className={`text-sm font-bold ${theme.classes.textPrimary}`}>Honest Evaluation</h3>
            <p className={`text-xs ${theme.classes.textMuted} leading-relaxed`}>
              We highlight both advantages and limitations. If a power bank is only 5,000mAh or a mouse is right-hand only, we state it plainly.
            </p>
          </div>

          <div className={`p-4.5 rounded-2xl border ${theme.classes.borderCard} ${theme.classes.bgCard} space-y-2 backdrop-blur-md shadow-md`}>
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className={`text-sm font-bold ${theme.classes.textPrimary}`}>Direct Compliance</h3>
            <p className={`text-xs ${theme.classes.textMuted} leading-relaxed`}>
              We link directly to official Amazon listings using transparent Special Links. Checkout, fulfillment, and customer support are handled by Amazon.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h2 className={`text-lg font-bold ${theme.classes.textPrimary}`}>
          How {settings.logo_name || 'Find Niche'} Works
        </h2>
        <div className={`space-y-3 text-sm ${theme.classes.textSecondary} leading-relaxed font-normal`}>
          <p>
            When you see an item you like on {settings.logo_name || 'Find Niche'}, clicking the <strong className="text-white">“Check price on Amazon”</strong> button routes you straight to the corresponding product listing on Amazon.
          </p>
          <p>
            If you decide to make a purchase, Amazon pays us a modest affiliate commission. This commission comes at <strong className="text-white">zero extra cost</strong> to you. The price you pay on Amazon is identical whether you used our link or navigated there independently.
          </p>
          <p>
            {settings.logo_name || 'Find Niche'} does not store your payment information, process orders, or collect personal browsing logs.
          </p>
        </div>
      </div>

      {/* Permanent Product Numbers */}
      <div className={`space-y-3 p-5 rounded-2xl border ${theme.classes.borderCard} ${theme.classes.bgCard} backdrop-blur-md shadow-lg`}>
        <h3 className={`text-sm font-bold ${theme.classes.textPrimary}`}>
          Why We Use Product Item Numbers (#07#00, #01, #02...)
        </h3>
        <p className={`text-xs ${theme.classes.textSecondary} leading-relaxed`}>
          In our video demonstrations on TikTok, YouTube Shorts, and Instagram, we reference short item numbers (e.g. <em className="text-white">"Check Item #07 on Find Niche"</em>). You can type that number directly into the search bar at any time to land on the exact product without scrolling.
        </p>
      </div>
    </div>
  );
};

