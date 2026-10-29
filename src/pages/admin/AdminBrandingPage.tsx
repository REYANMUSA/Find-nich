import React, { useState } from 'react';
import { Sparkles, Check, Globe, RefreshCw, Palette, Save, Type, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSiteSettings } from '../../lib/settingsStore';
import { THEME_LIST, getTheme } from '../../lib/themes';
import { ThemeId } from '../../types/index.ts';
import { adminUpdateSiteSettings } from '../../lib/api';

export const AdminBrandingPage: React.FC = () => {
  const { settings, setLogoName, setTagline, setAdminTheme, setPublicTheme, setApplyToPublic } = useSiteSettings();

  const [logoNameInput, setLogoNameInput] = useState(settings.logo_name || 'Find Niche');
  const [taglineInput, setTaglineInput] = useState(settings.tagline || 'Better Products. Smarter Choices.');
  const [heroHeadlineInput, setHeroHeadlineInput] = useState(settings.hero_headline || 'Curated Tech Essentials. Tested Without Bias.');
  const [heroSubheadlineInput, setHeroSubheadlineInput] = useState(settings.hero_subheadline || 'Handpicked EDC, minimalist desk setups, and everyday tech gear with genuine editorial notes and direct Amazon access.');
  const [announcementInput, setAnnouncementInput] = useState(settings.announcement || '');
  const [selectedAdminTheme, setSelectedAdminTheme] = useState<ThemeId>(settings.admin_theme || 'helios');
  const [selectedPublicTheme, setSelectedPublicTheme] = useState<ThemeId>(settings.public_theme || 'helios');
  const [applyToPublicStore, setApplyToPublicStore] = useState(settings.apply_to_public || false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentTheme = getTheme(selectedAdminTheme);

  const handleSelectThemeOneTouch = (themeId: ThemeId) => {
    setSelectedAdminTheme(themeId);
    setAdminTheme(themeId);
    if (applyToPublicStore) {
      setSelectedPublicTheme(themeId);
      setPublicTheme(themeId);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        logo_name: logoNameInput.trim() || 'Find Niche',
        tagline: taglineInput.trim() || 'Better Products. Smarter Choices.',
        hero_headline: heroHeadlineInput.trim(),
        hero_subheadline: heroSubheadlineInput.trim(),
        announcement: announcementInput.trim(),
        admin_theme: selectedAdminTheme,
        public_theme: applyToPublicStore ? selectedAdminTheme : selectedPublicTheme,
        apply_to_public: applyToPublicStore,
      };

      const updated = await adminUpdateSiteSettings(payload);

      // Synchronize client store immediately
      setLogoName(updated.logo_name);
      setTagline(updated.tagline);
      setAdminTheme(updated.admin_theme);
      setPublicTheme(updated.public_theme);
      setApplyToPublic(updated.apply_to_public);

      setMessage({
        type: 'success',
        text: 'Branding and theme saved permanently to database and db.json! Changes will never be lost.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to save site settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-violet-400" />
            <span>Logo, Branding & Themes</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Change your site logo title, tagline, store announcement, and switch themes instantly with one touch.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={saving}
          className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 active:scale-95 transition-all self-start sm:self-auto"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Branding</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
              : 'bg-red-950/60 border-red-700/60 text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Live Brand Preview Card */}
      <div className="bg-[#131722]/90 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-3">
          Live Storefront Header Preview (Instant)
        </span>

        <div className="bg-[#0B0D14] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md shrink-0 transition-colors"
              style={{ backgroundColor: currentTheme.swatch.accent }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white" stroke="none" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-lg font-bold text-white tracking-tight block">
                {logoNameInput || 'Find Niche'}
              </span>
              <span className="text-xs text-zinc-400 block">
                {taglineInput || 'Better Products. Smarter Choices.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors"
              style={{
                borderColor: currentTheme.swatch.accent,
                color: currentTheme.swatch.accent,
                backgroundColor: `${currentTheme.swatch.accent}15`,
              }}
            >
              Theme: {currentTheme.name}
            </span>
          </div>
        </div>
      </div>

      {/* Brand Identity Inputs */}
      <div className="bg-[#131722]/90 border border-white/10 rounded-2xl p-5 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Type className="w-5 h-5 text-violet-400" />
            <span>Brand Names & Copywriting</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            You can change the brand logo name anytime you want. It immediately updates in the navbar, footer, and page titles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
          {/* Logo Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Logo Title / Brand Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={logoNameInput}
              onChange={(e) => setLogoNameInput(e.target.value)}
              placeholder="e.g. Find Niche or Helios Tech"
              className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
            <p className="text-[11px] text-zinc-400">
              Displayed in the top navigation bar, logo, and browser window title.
            </p>
          </div>

          {/* Tagline Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Brand Tagline
            </label>
            <input
              type="text"
              value={taglineInput}
              onChange={(e) => setTaglineInput(e.target.value)}
              placeholder="e.g. Better Products. Smarter Choices."
              className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
            <p className="text-[11px] text-zinc-400">
              Displayed under the logo and in social discovery cards.
            </p>
          </div>

          {/* Hero Headline */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Catalog Hero Headline
            </label>
            <input
              type="text"
              value={heroHeadlineInput}
              onChange={(e) => setHeroHeadlineInput(e.target.value)}
              placeholder="e.g. Curated Tech Essentials. Tested Without Bias."
              className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>

          {/* Hero Subheadline */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Catalog Subheadline Prose
            </label>
            <textarea
              value={heroSubheadlineInput}
              onChange={(e) => setHeroSubheadlineInput(e.target.value)}
              rows={2}
              placeholder="Description of the catalog mission..."
              className="w-full p-3.5 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Announcement Banner */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Storewide Announcement Banner (Optional)
            </label>
            <input
              type="text"
              value={announcementInput}
              onChange={(e) => setAnnouncementInput(e.target.value)}
              placeholder="e.g. 🎉 New 2026 ergonomic desk gear collection just published!"
              className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Multi-Theme Touch Gallery */}
      <div className="bg-[#131722]/90 border border-white/10 rounded-2xl p-5 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Theme Library (Touch to Switch Instantly)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select from multiple distinct visual themes. Touch any card to activate it immediately.
            </p>
          </div>

          {/* Toggle for Public Store application */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-colors self-start sm:self-auto">
            <input
              type="checkbox"
              checked={applyToPublicStore}
              onChange={(e) => {
                setApplyToPublicStore(e.target.checked);
                setApplyToPublic(e.target.checked);
              }}
              className="w-4 h-4 rounded text-violet-600 bg-zinc-900 border-zinc-700 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-semibold text-zinc-200">
              Apply Theme to Public Storefront Too
            </span>
          </label>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEME_LIST.map((theme) => {
            const isSelected = selectedAdminTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelectThemeOneTouch(theme.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 relative flex flex-col justify-between text-left ${
                  isSelected
                    ? 'ring-2 ring-white border-white/30 shadow-xl scale-[1.02]'
                    : 'border-white/10 hover:border-white/20 hover:scale-[1.01] opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: theme.swatch.card }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-black/30 shadow-xs"
                        style={{ backgroundColor: theme.swatch.accent }}
                      />
                      <span className="text-xs font-bold text-white tracking-tight">
                        {theme.name}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 mb-4">
                    {theme.tagline}
                  </p>
                </div>

                {/* Color Swatch Preview Strip */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                  <div
                    className="flex-1 h-5 rounded border border-white/10"
                    style={{ backgroundColor: theme.swatch.bg }}
                    title="Canvas Background"
                  />
                  <div
                    className="flex-1 h-5 rounded border border-white/10"
                    style={{ backgroundColor: theme.swatch.card }}
                    title="Card Surface"
                  />
                  <div
                    className="flex-1 h-5 rounded border border-white/10"
                    style={{ backgroundColor: theme.swatch.accent }}
                    title="Primary Accent"
                  />
                  <div
                    className="flex-1 h-5 rounded border border-white/10"
                    style={{ backgroundColor: theme.swatch.border }}
                    title="Divider Border"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Save Bar for Mobile and PC */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={saving}
          className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xl shadow-violet-600/50 active:scale-95 transition-all"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Logo, Branding & Themes</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
