import React from 'react';
import { ArrowLeft, Lock, Shield, EyeOff } from 'lucide-react';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
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
          Privacy Policy
        </h1>
        <p className={`text-sm ${theme.classes.textSecondary} leading-relaxed font-normal`}>
          {settings.logo_name || 'Find Niche'} is designed with strict privacy-first principles. We do not require visitor accounts, do not collect payment details, do not sell data to advertisers, and do not employ invasive cross-site tracking pixels.
        </p>
      </div>

      {/* Privacy Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
        <div className={`p-4.5 rounded-2xl border ${theme.classes.borderCard} ${theme.classes.bgCard} space-y-1.5 backdrop-blur-md shadow-md`}>
          <EyeOff className="w-5 h-5 text-cyan-400" />
          <h3 className={`text-xs font-bold ${theme.classes.textPrimary}`}>No Visitor Accounts</h3>
          <p className={`text-xs ${theme.classes.textMuted} leading-relaxed`}>
            Browse and search products freely without registration or email forms.
          </p>
        </div>

        <div className={`p-4.5 rounded-2xl border ${theme.classes.borderCard} ${theme.classes.bgCard} space-y-1.5 backdrop-blur-md shadow-md`}>
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className={`text-xs font-bold ${theme.classes.textPrimary}`}>Zero Payment Storage</h3>
          <p className={`text-xs ${theme.classes.textMuted} leading-relaxed`}>
            All purchases take place on Amazon. We never see or store billing data.
          </p>
        </div>

        <div className={`p-4.5 rounded-2xl border ${theme.classes.borderCard} ${theme.classes.bgCard} space-y-1.5 backdrop-blur-md shadow-md`}>
          <Shield className="w-5 h-5 text-violet-400" />
          <h3 className={`text-xs font-bold ${theme.classes.textPrimary}`}>Coarse Click Metrics</h3>
          <p className={`text-xs ${theme.classes.textMuted} leading-relaxed`}>
            Outbound interest counts contain zero personal information or cookies.
          </p>
        </div>
      </div>

      {/* Full Privacy Details */}
      <div className="space-y-6 text-sm leading-relaxed">
        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            1. Hosting & Infrastructure Information
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            When you visit {settings.logo_name || 'Find Niche'}, our hosting environment processes standard HTTP request data (such as IP addresses, browser user-agent strings, and request timestamps) strictly as required to securely serve web assets and prevent DDoS attacks.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            2. Product Interest & Click Analytics
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            When you click “Check price on Amazon”, the server records an aggregate counter increment (e.g. <em className="text-white">“Item #07 was clicked from the catalog grid”</em>). We do not correlate clicks with your identity, do not set third-party tracking beacons, and do not track your activity across other websites.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            3. Cookies & Session Storage
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            <strong className="text-white">Public Visitors:</strong> {settings.logo_name || 'Find Niche'} does not set tracking or advertising cookies on public visitors. Browser local storage is used solely to cache catalog categories for faster offline/mobile navigation.
          </p>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            <strong className="text-white">Store Administrator:</strong> When the verified store owner signs into the private administration dashboard, an encrypted session cookie (<code className="text-violet-300">fn_admin_session</code>) is set to maintain session security. This cookie is not issued to public visitors.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            4. External Amazon Links
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            When you follow an affiliate link to Amazon, you leave {settings.logo_name || 'Find Niche'}. Commercial transactions, account management, payments, shipping, and data handling on Amazon are governed exclusively by Amazon's Privacy Notice and Conditions of Use.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className={`text-base font-bold ${theme.classes.textPrimary}`}>
            5. Data Retention & Policy Inquiries
          </h2>
          <p className={`${theme.classes.textSecondary} font-normal`}>
            Aggregate click counts are maintained for catalog optimization. If you have any privacy questions or requests regarding {settings.logo_name || 'Find Niche'}, please contact the store owner.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-white/10 text-xs text-zinc-500">
        <p>Last verified: October 2026.</p>
      </div>
    </div>
  );
};

