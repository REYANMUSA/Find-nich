import React from 'react';
import { ArrowLeft, Lock, Shield, EyeOff, Server, ExternalLink } from 'lucide-react';

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
          Find Niche is designed with strict privacy-first principles. We do not require visitor accounts, do not collect payment details, do not sell data to advertisers, and do not employ invasive cross-site tracking pixels.
        </p>
      </div>

      {/* Privacy Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200">
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
          <EyeOff className="w-5 h-5 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-900">No Visitor Accounts</h3>
          <p className="text-xs text-zinc-600">
            Browse and search products freely without registration or email forms.
          </p>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
          <Lock className="w-5 h-5 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-900">Zero Payment Storage</h3>
          <p className="text-xs text-zinc-600">
            All purchases take place on Amazon. We never see or store billing data.
          </p>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
          <Shield className="w-5 h-5 text-zinc-900" />
          <h3 className="text-xs font-bold text-zinc-900">Coarse Click Metrics</h3>
          <p className="text-xs text-zinc-600">
            Outbound interest counts contain zero personal information or cookies.
          </p>
        </div>
      </div>

      {/* Full Privacy Details */}
      <div className="space-y-6 text-sm text-zinc-700 leading-relaxed">
        
        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            1. Hosting & Infrastructure Information
          </h2>
          <p>
            When you visit Find Niche, our hosting environment processes standard HTTP request data (such as IP addresses, browser user-agent strings, and request timestamps) strictly as required to securely serve web assets and prevent DDoS attacks. This infrastructure data is processed in accordance with the host's standard operational security policies.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            2. Product Interest & Click Analytics
          </h2>
          <p>
            When you click “Check price on Amazon”, the server records an aggregate counter increment (e.g. <em>“Item #001 was clicked from the catalog grid”</em>). We do not correlate clicks with your identity, do not set third-party tracking beacons, and do not track your activity across other websites.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            3. Cookies & Session Storage
          </h2>
          <p>
            <strong>Public Visitors:</strong> Find Niche does not set tracking or advertising cookies on public visitors. Browser local storage is used solely to cache catalog categories for faster offline/mobile navigation.
          </p>
          <p>
            <strong>Store Administrator:</strong> When the verified store owner signs into the private administration dashboard, an encrypted, HttpOnly session cookie (<code>fn_admin_session</code>) is set to maintain session security. This cookie is not issued to public visitors.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            4. External Amazon Links
          </h2>
          <p>
            When you follow an affiliate link to Amazon, you leave Find Niche. Commercial transactions, account management, payments, shipping, and data handling on Amazon are governed exclusively by Amazon's Privacy Notice and Conditions of Use. We encourage you to review Amazon's policies before completing purchases.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">
            5. Data Retention & Policy Inquiries
          </h2>
          <p>
            Aggregate click counts are maintained for catalog optimization. If you have any privacy questions or requests regarding Find Niche, please contact the store owner.
          </p>
        </div>

      </div>

      <div className="pt-6 border-t border-zinc-200 text-xs text-zinc-500">
        <p>Last verified: October 2026.</p>
      </div>

    </div>
  );
};
