import React from 'react';
import { ArrowLeft, Lock, Shield, EyeOff } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Find Niche is designed with privacy-first principles. We do not require visitor accounts, do not sell personal data, and do not employ invasive cross-site ad trackers.
        </p>
      </div>

      {/* Privacy Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200">
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
          <EyeOff className="w-5 h-5 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-900">No Visitor Accounts</h3>
          <p className="text-xs text-zinc-600">
            Browse freely without signing up, providing an email, or creating passwords.
          </p>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
          <Lock className="w-5 h-5 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-900">Zero Payment Storage</h3>
          <p className="text-xs text-zinc-600">
            Find Niche never requests or stores credit cards or financial data.
          </p>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
          <Shield className="w-5 h-5 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-900">Aggregate Clicks Only</h3>
          <p className="text-xs text-zinc-600">
            Product interest metrics are coarse and anonymous without personal tracking.
          </p>
        </div>
      </div>

      {/* Full Privacy Details */}
      <div className="space-y-6 text-sm text-zinc-700 leading-relaxed">
        
        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            1. Information We Collect
          </h2>
          <p>
            When you visit Find Niche, our web server processes standard, non-identifying request data necessary to deliver web pages (such as your browser's user-agent string and request timestamps).
          </p>
          <p>
            When you click an outbound link to Amazon, we record an anonymous counter increment (e.g. <em>"Product #001 was clicked from catalog card"</em>). This event contains zero personal information, no cookie identifiers, and no persistent tracking IDs.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            2. Cookies & Local Storage
          </h2>
          <p>
            Find Niche does not use commercial marketing or cross-site advertising cookies. We use standard browser local storage solely to cache catalog categories for faster offline/mobile loading speed, and for store owner authentication sessions.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            3. Third-Party Websites & Amazon
          </h2>
          <p>
            When you click a link labeled “Check price on Amazon”, you are leaving Find Niche and navigating to Amazon. Amazon operates under its own distinct Privacy Notice and Conditions of Use. We encourage you to review Amazon's privacy policies to understand how they handle customer data on their platform.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            4. Data Retention & Privacy Inquiries
          </h2>
          <p>
            Aggregate click counts are kept for catalog optimization. If you have any questions regarding privacy on Find Niche, you may contact the store owner.
          </p>
        </div>

      </div>

      <div className="pt-6 border-t border-zinc-200 text-xs text-zinc-500">
        <p>Effective Date: October 2026.</p>
      </div>

    </div>
  );
};
