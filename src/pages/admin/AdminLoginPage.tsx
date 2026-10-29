import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, ArrowLeft, Sparkles, Check, ChevronRight } from 'lucide-react';
import { adminLogin } from '../../lib/api';
import { useSiteSettings } from '../../lib/settingsStore';
import { THEMES, THEME_LIST, getTheme } from '../../lib/themes';
import { ThemeId } from '../../types/index.ts';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToSite: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToSite,
}) => {
  const { settings, setAdminTheme } = useSiteSettings();
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(settings.admin_theme || 'helios');

  const currentTheme = getTheme(activeThemeId);

  const handleSelectTheme = (id: ThemeId) => {
    setActiveThemeId(id);
    setAdminTheme(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim() || loading) return;

    setLoading(true);
    setError(null);

    const result = await adminLogin(passcode.trim());
    
    if (result.success) {
      // Instant seamless transition into admin dashboard
      onLoginSuccess();
    } else {
      setLoading(false);
      setError(result.error || 'Incorrect administrator passcode. Please try again.');
    }
  };

  return (
    <div
      className={`min-h-screen ${currentTheme.classes.bgApp} flex flex-col justify-between items-center px-4 py-6 sm:py-10 transition-colors duration-300 relative overflow-hidden selection:bg-violet-600 selection:text-white`}
    >
      {/* Ambient background glow accents inspired by Helios dashboard */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full blur-[130px] opacity-25 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: currentTheme.swatch.accent }}
      />
      <div
        className="absolute -bottom-32 right-10 w-[400px] h-[400px] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: currentTheme.swatch.card }}
      />

      {/* Top Header Bar */}
      <header className="w-full max-w-md flex items-center justify-between z-10">
        <button
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </button>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Secure Portal</span>
        </div>
      </header>

      {/* Central Login Card */}
      <main className="w-full max-w-md my-auto z-10 py-4">
        <div
          className={`${currentTheme.classes.bgCard} border ${currentTheme.classes.borderCard} rounded-2xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-xl transition-all duration-300`}
        >
          {/* Card Top Pill Badge */}
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-colors duration-300"
                style={{ backgroundColor: currentTheme.swatch.accent }}
              >
                <Shield className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 block">
                  Admin Gateway
                </span>
                <span className="text-sm font-bold text-white tracking-tight">
                  {settings.logo_name || 'Find Niche'}
                </span>
              </div>
            </div>          </div>

          <div className="space-y-1 mb-6 text-left">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Unlock Owner Dashboard
            </h1>
            <p className="text-xs text-zinc-400">
              Enter your secret passcode to edit products, change the site logo, and customize themes.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-950/70 border border-red-700/80 text-red-200 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-red-300">Access Denied</p>
                <p className="text-[11px] text-red-200/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-zinc-300">
                Administrator Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter your administrator passcode"
                  required
                  autoFocus
                  autoComplete="current-password"
                  className={`w-full h-12 pl-4 pr-12 text-sm ${currentTheme.classes.inputBg} border ${currentTheme.classes.inputBorder} rounded-xl text-white placeholder:text-zinc-500 focus:outline-none transition-colors shadow-inner`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passcode}
              className={`w-full h-12 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 active:scale-[0.98] ${currentTheme.classes.accentGlow}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Unlocking Dashboard...</span>
                </>
              ) : (
                <>
                  <span>Open Admin Page</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Theme Selector directly accessible on Login Screen */}
          <div className="mt-8 pt-5 border-t border-white/10 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Select Dashboard Theme:</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {currentTheme.name}
              </span>
            </div>

            {/* Quick-touch theme swatches */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {THEME_LIST.map((theme) => {
                const isSelected = activeThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`h-11 rounded-xl p-1 flex flex-col items-center justify-center relative transition-all duration-150 ${
                      isSelected
                        ? 'ring-2 ring-white scale-105 shadow-md'
                        : 'opacity-70 hover:opacity-100 hover:scale-100'
                    }`}
                    style={{ backgroundColor: theme.swatch.card }}
                    title={`${theme.name} — ${theme.tagline}`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-black/30 shadow-xs flex items-center justify-center"
                      style={{ backgroundColor: theme.swatch.accent }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-[9px] text-zinc-300 font-medium truncate w-full text-center mt-1">
                      {theme.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-md text-center z-10 pt-4">
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
          <span>{settings.logo_name || 'Find Niche'}</span>
          <span>·</span>
          <span>{settings.tagline || 'Better Products. Smarter Choices.'}</span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1">
          Secure owner access · Cloud-saved products and branding
        </p>
      </footer>
    </div>
  );
};
