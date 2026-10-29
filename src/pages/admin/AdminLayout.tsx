import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  BarChart3,
  History,
  LogOut,
  ExternalLink,
  Plus,
  Palette,
  Sparkles,
  Menu,
  X,
  Shield,
  Check,
} from 'lucide-react';
import { adminLogout } from '../../lib/api';
import { useSiteSettings } from '../../lib/settingsStore';
import { THEME_LIST, getTheme } from '../../lib/themes';
import { ThemeId } from '../../types/index.ts';

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'branding' | 'analytics' | 'audit';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onNavigatePublic: (path?: string) => void;
  onAddNewProduct: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onNavigatePublic,
  onAddNewProduct,
  onLogout,
  children,
}) => {
  const { settings, setAdminTheme, setPublicTheme } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showThemePickerModal, setShowThemePickerModal] = useState(false);

  const currentTheme = getTheme(settings.admin_theme || 'helios');

  const tabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'branding', label: 'Logo & Themes', icon: Palette },
    { id: 'analytics', label: 'Clicks & Ctr', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: History },
  ];

  const handleLogoutClick = async () => {
    await adminLogout();
    onLogout();
  };

  const handleQuickThemeTouch = (themeId: ThemeId) => {
    setAdminTheme(themeId);
    if (settings.apply_to_public) {
      setPublicTheme(themeId);
    }
  };

  return (
    <div className={`min-h-screen ${currentTheme.classes.bgApp} flex flex-col transition-colors duration-300 relative`}>
      
      {/* Top Header Bar for PC and Phone */}
      <header
        className={`sticky top-0 z-40 ${currentTheme.classes.bgCard} border-b ${currentTheme.classes.borderCard} backdrop-blur-xl transition-colors duration-300 shadow-md`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-colors"
                style={{ backgroundColor: currentTheme.swatch.accent }}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight block">
                  {settings.logo_name || 'Find Niche'}
                </span>
                <span className="text-[10px] text-zinc-400 hidden sm:block">
                  Control Center
                </span>
              </div>
            </div>
          </div>

          {/* Quick-Touch Theme Bar in Header (Directly accessible on both phone and PC) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 hidden lg:inline mr-1">
              Themes:
            </span>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              {THEME_LIST.slice(0, 6).map((theme) => {
                const isSelected = (settings.admin_theme || 'helios') === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleQuickThemeTouch(theme.id)}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center relative transition-transform active:scale-90 ${
                      isSelected ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: theme.swatch.card }}
                    title={`Switch to ${theme.name}`}
                  >
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                      style={{ backgroundColor: theme.swatch.accent }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Quick Add Product Button */}
            <button
              onClick={onAddNewProduct}
              className={`min-h-[38px] px-3 sm:px-4 py-1.5 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Public Store Link */}
            <button
              onClick={() => onNavigatePublic('/')}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="View Public Store"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Sign Out */}
            <button
              onClick={handleLogoutClick}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Desktop Tabs Horizontal Navigation */}
        <div className="hidden md:block border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-1.5 py-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? currentTheme.classes.navActive
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Slide-down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden z-30 bg-[#0B0D14]/95 border-b border-white/10 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-1">
            Navigation Menu
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onSelectTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-all text-left ${
                    isActive
                      ? currentTheme.classes.navActive
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Admin Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-24 md:pb-12">
        {children}
      </main>

      {/* Phone-friendly Bottom Fixed Tab Bar for mobile devices */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0D14]/95 border-t border-white/10 backdrop-blur-xl py-1.5 px-2 flex items-center justify-around">
        {tabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl transition-all ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center mb-0.5 ${
                  isActive ? 'bg-violet-600 text-white shadow-md' : ''
                }`}
                style={isActive ? { backgroundColor: currentTheme.swatch.accent } : {}}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold leading-none">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
};
