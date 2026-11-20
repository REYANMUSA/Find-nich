import React from 'react';
import { ArrowLeft, Search, FileQuestion } from 'lucide-react';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface NotFoundPageProps {
  onBack: () => void;
  onSearch: (query: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBack, onSearch }) => {
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || 'helios');

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className={`w-16 h-16 rounded-2xl ${theme.classes.bgCard} border ${theme.classes.borderCard} flex items-center justify-center mx-auto ${theme.classes.textMuted}`}>
        <FileQuestion className="w-8 h-8 stroke-[1.5]" />
      </div>

      <div className="space-y-2">
        <h1 className={`text-2xl font-extrabold tracking-tight ${theme.classes.textPrimary}`}>
          Page Not Found (404)
        </h1>
        <p className={`text-xs sm:text-sm ${theme.classes.textSecondary} leading-relaxed`}>
          The link you followed does not exist on {settings.logo_name || 'Find Niche'}, or the product may have been relocated or archived.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 ${theme.classes.accentButton} text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
        <button
          type="button"
          onClick={() => onSearch('')}
          className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 border text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors ${
            theme.isDark
              ? 'bg-white/[0.05] border-white/10 hover:bg-white/[0.1] text-zinc-200'
              : 'bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-800'
          }`}
        >
          <Search className={`w-3.5 h-3.5 ${theme.classes.textMuted}`} />
          <span>Search Products</span>
        </button>
      </div>
    </div>
  );
};
