import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, Globe, RefreshCw, Palette, Save, Type, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSiteSettings, updateCachedSettings } from '../../lib/settingsStore';
import { THEME_LIST, getTheme } from '../../lib/themes';
import { ThemeId } from '../../types/index.ts';
import { adminUpdateSiteSettings } from '../../lib/api';

export const AdminBrandingPage: React.FC = () => {
  const { settings, setLogoName, setTagline, setAdminTheme, setPublicTheme, setApplyToPublic } = useSiteSettings();
  const hasEditedRef = useRef(false);

  const [logoNameInput, setLogoNameInput] = useState(settings.logo_name || 'Find Niche');
  const [taglineInput, setTaglineInput] = useState(settings.tagline ?? '');
  const [heroHeadlineInput, setHeroHeadlineInput] = useState(settings.hero_headline ?? '');
  const [heroSubheadlineInput, setHeroSubheadlineInput] = useState(settings.hero_subheadline ?? '');
  const [announcementInput, setAnnouncementInput] = useState(settings.announcement || '');
  const [ownerNameInput, setOwnerNameInput] = useState(settings.owner_name || 'Rayan Musa');
  const [tiktokInput, setTiktokInput] = useState(settings.social_tiktok || '');
  const [youtubeInput, setYoutubeInput] = useState(settings.social_youtube || '');
  const [instagramInput, setInstagramInput] = useState(settings.social_instagram || '');
  const [xInput, setXInput] = useState(settings.social_x || '');
  const [snapchatInput, setSnapchatInput] = useState(settings.social_snapchat || '');
  const [facebookInput, setFacebookInput] = useState(settings.social_facebook || '');

  const initialAdminTheme: ThemeId =
    settings.admin_theme && settings.admin_theme !== 'manasa' ? settings.admin_theme : 'helios';
  const [selectedAdminTheme, setSelectedAdminTheme] = useState<ThemeId>(initialAdminTheme);
  const [selectedPublicTheme, setSelectedPublicTheme] = useState<ThemeId>(settings.public_theme || 'helios');
  const [applyToPublicStore, setApplyToPublicStore] = useState(
    settings.public_theme === 'manasa' ? false : settings.apply_to_public !== undefined ? settings.apply_to_public : true
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (hasEditedRef.current) return;
    setLogoNameInput(settings.logo_name || 'Find Niche');
    setTaglineInput(settings.tagline ?? '');
    setHeroHeadlineInput(settings.hero_headline ?? '');
    setHeroSubheadlineInput(settings.hero_subheadline ?? '');
    setAnnouncementInput(settings.announcement || '');
    setOwnerNameInput(settings.owner_name || 'Rayan Musa');
    setTiktokInput(settings.social_tiktok || '');
    setYoutubeInput(settings.social_youtube || '');
    setInstagramInput(settings.social_instagram || '');
    setXInput(settings.social_x || '');
    setSnapchatInput(settings.social_snapchat || '');
    setFacebookInput(settings.social_facebook || '');
    setSelectedAdminTheme(settings.admin_theme && settings.admin_theme !== 'manasa' ? settings.admin_theme : 'helios');
    setSelectedPublicTheme(settings.public_theme || 'helios');
    setApplyToPublicStore(settings.public_theme === 'manasa' ? false : settings.apply_to_public !== false);
  }, [settings]);

  const currentTheme = getTheme(selectedAdminTheme);

  // Helper to normalize usernames and partial URLs into full valid URLs
  const normalizeSocialUrl = (platform: 'instagram' | 'tiktok' | 'youtube' | 'x' | 'snapchat' | 'facebook', val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const clean = trimmed.replace(/^@+/, '').trim();
    switch (platform) {
      case 'instagram':
        return `https://www.instagram.com/${clean.replace(/^(www\.)?instagram\.com\//i, '')}`;
      case 'tiktok':
        return `https://www.tiktok.com/@${clean.replace(/^(www\.)?tiktok\.com\/@?/i, '')}`;
      case 'youtube': {
        const ytClean = clean.replace(/^(www\.)?youtube\.com\//i, '');
        return `https://www.youtube.com/${ytClean.startsWith('@') ? ytClean : '@' + ytClean}`;
      }
      case 'x':
        return `https://x.com/${clean.replace(/^(www\.)?(twitter|x)\.com\//i, '')}`;
      case 'snapchat':
        return `https://www.snapchat.com/add/${clean.replace(/^(www\.)?snapchat\.com\/add\//i, '')}`;
      case 'facebook':
        return `https://www.facebook.com/${clean.replace(/^(www\.)?facebook\.com\//i, '')}`;
      default:
        return trimmed;
    }
  };

  const handleSelectThemeOneTouch = (themeId: ThemeId) => {
    if (themeId === 'manasa') {
      // Manasa applies cleanly to the public storefront while preserving Admin dashboard appearance
      setSelectedPublicTheme('manasa');
      setPublicTheme('manasa');
      setApplyToPublicStore(false);
      setApplyToPublic(false);

      adminUpdateSiteSettings({
        public_theme: 'manasa',
        apply_to_public: false,
      })
        .then(() => {
          setMessage({
            type: 'success',
            text: 'Manasa Editorial is now live on the public website! Your Admin dashboard remains unchanged.',
          });
        })
        .catch(() => {});
      return;
    }

    setSelectedAdminTheme(themeId);
    setSelectedPublicTheme(themeId);
    setAdminTheme(themeId);
    setPublicTheme(themeId);
    setApplyToPublicStore(true);
    setApplyToPublic(true);

    // Save to server immediately so the public website changes for everyone
    adminUpdateSiteSettings({
      admin_theme: themeId,
      public_theme: themeId,
      apply_to_public: true,
    }).catch(() => {});
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Normalize all social inputs before saving
    const normalizedInstagram = normalizeSocialUrl('instagram', instagramInput);
    const normalizedTiktok = normalizeSocialUrl('tiktok', tiktokInput);
    const normalizedYoutube = normalizeSocialUrl('youtube', youtubeInput);
    const normalizedX = normalizeSocialUrl('x', xInput);
    const normalizedSnapchat = normalizeSocialUrl('snapchat', snapchatInput);
    const normalizedFacebook = normalizeSocialUrl('facebook', facebookInput);

    setInstagramInput(normalizedInstagram);
    setTiktokInput(normalizedTiktok);
    setYoutubeInput(normalizedYoutube);
    setXInput(normalizedX);
    setSnapchatInput(normalizedSnapchat);
    setFacebookInput(normalizedFacebook);

    try {
      const effectivePublicTheme = applyToPublicStore ? selectedAdminTheme : selectedPublicTheme;
      const payload = {
        logo_name: logoNameInput.trim() || 'Find Niche',
        tagline: taglineInput.trim(),
        hero_headline: heroHeadlineInput.trim(),
        hero_subheadline: heroSubheadlineInput.trim(),
        announcement: announcementInput.trim(),
        owner_name: ownerNameInput.trim() || 'Rayan Musa',
        social_tiktok: normalizedTiktok,
        social_youtube: normalizedYoutube,
        social_instagram: normalizedInstagram,
        social_x: normalizedX,
        social_snapchat: normalizedSnapchat,
        social_facebook: normalizedFacebook,
        admin_theme: selectedAdminTheme,
        public_theme: effectivePublicTheme,
        apply_to_public: applyToPublicStore,
      };

      const updated = await adminUpdateSiteSettings(payload);

      // Synchronize client store immediately with all updated fields
      updateCachedSettings(updated);
      hasEditedRef.current = false;

      setLogoName(updated.logo_name);
      setTagline(updated.tagline);
      setAdminTheme(updated.admin_theme);
      setPublicTheme(updated.public_theme);
      setApplyToPublic(updated.apply_to_public);

      setMessage({
        type: 'success',
        text: 'Branding, owner identity, social accounts, and themes saved permanently! Changes apply immediately.',
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
          className={`min-h-[44px] px-5 py-2.5 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all self-start sm:self-auto`}
          style={{ boxShadow: `0 8px 24px ${currentTheme.swatch.accent}40` }}
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
              {taglineInput.trim() && (
                <span className="text-xs text-zinc-400 block">
                  {taglineInput.trim()}
                </span>
              )}
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
              onChange={(e) => {
                hasEditedRef.current = true;
                setLogoNameInput(e.target.value);
              }}
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
              Brand Tagline <span className="text-[11px] font-normal text-zinc-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={taglineInput}
              onChange={(e) => {
                hasEditedRef.current = true;
                setTaglineInput(e.target.value);
              }}
              placeholder="Leave empty to hide tagline"
              className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
            <p className="text-[11px] text-zinc-400">
              Displayed under the logo when filled. Clear to hide it completely.
            </p>
          </div>

          {/* Hero Headline */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                Catalog Hero Headline <span className="text-[11px] font-normal text-zinc-500">(Optional)</span>
              </label>
              {heroHeadlineInput && (
                <button
                  type="button"
                  onClick={() => {
                    hasEditedRef.current = true;
                    setHeroHeadlineInput('');
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  Clear text
                </button>
              )}
            </div>
            <input
              type="text"
              value={heroHeadlineInput}
              onChange={(e) => {
                hasEditedRef.current = true;
                setHeroHeadlineInput(e.target.value);
              }}
              placeholder="Optional — leave empty to hide heading and bring products up"
              className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>

          {/* Hero Subheadline */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                Catalog Subheadline Prose <span className="text-[11px] font-normal text-zinc-500">(Optional)</span>
              </label>
              {heroSubheadlineInput && (
                <button
                  type="button"
                  onClick={() => {
                    hasEditedRef.current = true;
                    setHeroSubheadlineInput('');
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  Clear text
                </button>
              )}
            </div>
            <textarea
              value={heroSubheadlineInput}
              onChange={(e) => {
                hasEditedRef.current = true;
                setHeroSubheadlineInput(e.target.value);
              }}
              rows={2}
              placeholder="Optional — leave empty to remove this section cleanly so products appear at the top..."
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
              onChange={(e) => {
                hasEditedRef.current = true;
                setAnnouncementInput(e.target.value);
              }}
              placeholder="e.g. New 2026 ergonomic desk gear collection just published!"
              className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Owner Identity & Personalization (Rayan Musa / nusis man) */}
      <div className="bg-[#131722]/90 border border-white/10 rounded-2xl p-5 sm:p-8 backdrop-blur-md shadow-xl space-y-6 text-left">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs">RM</span>
            <span>Owner Account Name & Greetings</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Your personal owner display name. Shown in the top bar, dashboard greetings, and control panel.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-300">
            Account Owner Name
          </label>
          <input
            type="text"
            value={ownerNameInput}
            onChange={(e) => {
              hasEditedRef.current = true;
              setOwnerNameInput(e.target.value);
            }}
            placeholder="e.g. Rayan Musa or nusis man"
            className="w-full h-11 px-4 text-sm bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-zinc-400">Quick suggestions:</span>
            {['Rayan Musa', 'Rayan', 'nusis man'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  hasEditedRef.current = true;
                  setOwnerNameInput(name);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  ownerNameInput === name
                    ? 'bg-violet-600 text-white border-violet-500'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Social Media Header Accounts (TikTok, YouTube, Instagram, X, Snapchat, Facebook) */}
      <div className="bg-[#131722]/90 border border-white/10 rounded-2xl p-5 sm:p-8 backdrop-blur-md shadow-xl space-y-6 text-left">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>Social Media Header Accounts</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            When you enter a URL here, its logo appears in the top navigation header for all visitors. If you want to remove an account icon, simply delete its URL and save.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* TikTok */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <span className="text-[#ff0050] font-bold">TikTok</span>
              <span className="text-[11px] text-zinc-500">(Username or URL)</span>
            </label>
            <input
              type="text"
              value={tiktokInput}
              onChange={(e) => {
                hasEditedRef.current = true;
                setTiktokInput(e.target.value);
              }}
              onBlur={() => setTiktokInput((prev) => normalizeSocialUrl('tiktok', prev))}
              placeholder="e.g. @youraccount or tiktok.com/@youraccount"
              className="w-full h-11 px-4 text-xs font-mono bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* YouTube */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <span className="text-[#ff0000] font-bold">YouTube</span>
              <span className="text-[11px] text-zinc-500">(Handle or URL)</span>
            </label>
            <input
              type="text"
              value={youtubeInput}
              onChange={(e) => {
                hasEditedRef.current = true;
                setYoutubeInput(e.target.value);
              }}
              onBlur={() => setYoutubeInput((prev) => normalizeSocialUrl('youtube', prev))}
              placeholder="e.g. @yourchannel or youtube.com/@yourchannel"
              className="w-full h-11 px-4 text-xs font-mono bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <span className="text-[#e4405f] font-bold">Instagram</span>
              <span className="text-[11px] text-zinc-500">(Username or URL)</span>
            </label>
            <input
              type="text"
              value={instagramInput}
              onChange={(e) => {
                hasEditedRef.current = true;
                setInstagramInput(e.target.value);
              }}
              onBlur={() => setInstagramInput((prev) => normalizeSocialUrl('instagram', prev))}
              placeholder="e.g. uiux.subash or @uiux.subash or instagram.com/uiux.subash"
              className="w-full h-11 px-4 text-xs font-mono bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* X / Twitter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <span className="text-white font-bold">X (Twitter)</span>
              <span className="text-[11px] text-zinc-500">(Handle or URL)</span>
            </label>
            <input
              type="text"
              value={xInput}
              onChange={(e) => {
                hasEditedRef.current = true;
                setXInput(e.target.value);
              }}
              onBlur={() => setXInput((prev) => normalizeSocialUrl('x', prev))}
              placeholder="e.g. @yourhandle or x.com/yourhandle"
              className="w-full h-11 px-4 text-xs font-mono bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Snapchat */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <span className="text-[#fffc00] font-bold">Snapchat</span>
              <span className="text-[11px] text-zinc-500">(Username or URL)</span>
            </label>
            <input
              type="text"
              value={snapchatInput}
              onChange={(e) => {
                hasEditedRef.current = true;
                setSnapchatInput(e.target.value);
              }}
              onBlur={() => setSnapchatInput((prev) => normalizeSocialUrl('snapchat', prev))}
              placeholder="e.g. username or snapchat.com/add/username"
              className="w-full h-11 px-4 text-xs font-mono bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Facebook */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <span className="text-[#1877f2] font-bold">Facebook</span>
              <span className="text-[11px] text-zinc-500">(Page or URL)</span>
            </label>
            <input
              type="text"
              value={facebookInput}
              onChange={(e) => {
                hasEditedRef.current = true;
                setFacebookInput(e.target.value);
              }}
              onBlur={() => setFacebookInput((prev) => normalizeSocialUrl('facebook', prev))}
              placeholder="e.g. page.name or facebook.com/pagename"
              className="w-full h-11 px-4 text-xs font-mono bg-[#0E101A] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
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

        {/* Active Public Theme Status & Independent Storefront Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="text-zinc-400">Active Public Website Theme:</span>
            <span className="font-bold text-white">
              {getTheme(applyToPublicStore ? selectedAdminTheme : selectedPublicTheme).name}
            </span>
            {selectedPublicTheme === 'manasa' && !applyToPublicStore && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                Storefront Editorial Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="public-theme-select" className="text-zinc-400">
              Web Theme:
            </label>
            <select
              id="public-theme-select"
              value={applyToPublicStore ? selectedAdminTheme : selectedPublicTheme}
              onChange={(e) => {
                const val = e.target.value as ThemeId;
                setSelectedPublicTheme(val);
                setPublicTheme(val);
                setApplyToPublicStore(false);
                setApplyToPublic(false);
                adminUpdateSiteSettings({ public_theme: val, apply_to_public: false }).catch(() => {});
              }}
              className="bg-[#0E101A] border border-white/15 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              {THEME_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEME_LIST.map((theme) => {
            const isManasaCard = theme.id === 'manasa';
            const isSelected = isManasaCard
              ? selectedPublicTheme === 'manasa'
              : selectedAdminTheme === theme.id;
            const textHeadClass = theme.isDark ? 'text-white' : 'text-zinc-950';
            const textSubClass = theme.isDark ? 'text-zinc-400' : 'text-zinc-600';
            const borderInnerClass = theme.isDark ? 'border-white/10' : 'border-zinc-200';
            return (
              <div
                key={theme.id}
                onClick={() => handleSelectThemeOneTouch(theme.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 relative flex flex-col justify-between text-left ${
                  isSelected
                    ? 'ring-2 ring-violet-400 border-white/40 shadow-xl scale-[1.02]'
                    : 'border-white/10 hover:border-white/30 hover:scale-[1.01] opacity-90 hover:opacity-100'
                }`}
                style={{ backgroundColor: theme.swatch.card }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full border border-black/30 shadow-xs shrink-0"
                        style={{ backgroundColor: theme.swatch.accent }}
                      />
                      <span className={`text-xs font-bold ${textHeadClass} tracking-tight truncate`}>
                        {theme.name}
                      </span>
                    </div>

                    {isSelected && (
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          theme.isDark ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-white'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {isManasaCard && (
                    <span className="inline-block mb-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-900 text-white">
                      Public Storefront Editorial Theme
                    </span>
                  )}

                  <p className={`text-[11px] ${textSubClass} line-clamp-2 mb-4`}>
                    {theme.tagline}
                  </p>
                </div>

                {/* Color Swatch Preview Strip */}
                <div className={`flex items-center gap-1.5 pt-2 border-t ${borderInnerClass}`}>
                  <div
                    className={`flex-1 h-5 rounded border ${borderInnerClass}`}
                    style={{ backgroundColor: theme.swatch.bg }}
                    title="Canvas Background"
                  />
                  <div
                    className={`flex-1 h-5 rounded border ${borderInnerClass}`}
                    style={{ backgroundColor: theme.swatch.card }}
                    title="Card Surface"
                  />
                  <div
                    className={`flex-1 h-5 rounded border ${borderInnerClass}`}
                    style={{ backgroundColor: theme.swatch.accent }}
                    title="Primary Accent"
                  />
                  <div
                    className={`flex-1 h-5 rounded border ${borderInnerClass}`}
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
          className={`w-full sm:w-auto min-h-[48px] px-8 py-3 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all`}
          style={{ boxShadow: `0 10px 30px ${currentTheme.swatch.accent}50` }}
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
