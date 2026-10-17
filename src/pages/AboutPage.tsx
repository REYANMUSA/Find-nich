import React from 'react';
import { ArrowLeft, Check, Compass, Shield, Eye } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
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
          About Find Niche
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          A minimalist tech product discovery catalog created to help you discover genuinely useful hardware tools and accessories without wading through manufactured reviews or bloated affiliate landing pages.
        </p>
      </div>

      {/* Core Principles */}
      <div className="space-y-6 pt-4 border-t border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-900">
          Our Curation Principles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50/50 space-y-2">
            <Compass className="w-5 h-5 text-[#2E5B3E]" />
            <h3 className="text-sm font-semibold text-zinc-900">Restraint Over Volume</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              We do not catalog thousands of generic items. Every item is indexed with a permanent item number and selected for everyday practical utility.
            </p>
          </div>

          <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50/50 space-y-2">
            <Eye className="w-5 h-5 text-[#2E5B3E]" />
            <h3 className="text-sm font-semibold text-zinc-900">Honest Evaluation</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              We highlight both advantages and limitations. If a power bank is only 5,000mAh or a mouse is right-hand only, we state it plainly.
            </p>
          </div>

          <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50/50 space-y-2">
            <Shield className="w-5 h-5 text-[#2E5B3E]" />
            <h3 className="text-sm font-semibold text-zinc-900">Direct Compliance</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              We link directly to official Amazon listings using transparent Special Links. Checkout, fulfillment, and customer support are handled by Amazon.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-4 pt-4 border-t border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-900">
          How Find Niche Works
        </h2>
        <div className="space-y-3 text-sm text-zinc-700 leading-relaxed">
          <p>
            When you see an item you like on Find Niche, clicking the <strong>“Check price on Amazon”</strong> button routes you straight to the corresponding product listing on Amazon.
          </p>
          <p>
            If you decide to make a purchase, Amazon pays us a modest affiliate commission. This commission comes at <strong>zero extra cost</strong> to you. The price you pay on Amazon is identical whether you used our link or navigated there independently.
          </p>
          <p>
            Find Niche does not store your payment information, process orders, or collect personal browsing logs.
          </p>
        </div>
      </div>

      {/* Permanent Product Numbers */}
      <div className="space-y-3 p-5 bg-zinc-50 border border-zinc-200 rounded-lg">
        <h3 className="text-sm font-bold text-zinc-950">
          Why We Use Permanent Numbers (#001, #002...)
        </h3>
        <p className="text-xs text-zinc-600 leading-relaxed">
          In our video demonstrations on TikTok, YouTube Shorts, and Instagram, we reference short item numbers (e.g. <em>"Check Item #002 on Find Niche"</em>). You can type that number directly into the search bar at any time to land on the exact product without scrolling.
        </p>
      </div>

    </div>
  );
};
