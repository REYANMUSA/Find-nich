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
  Bell,
  Settings,
  Search,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { adminLogout, adminUpdateSiteSettings } from '../../lib/api';
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
  const { settings, setAdminTheme, setPublicTheme, setApplyToPublic } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const currentTheme = getTheme(settings.admin_theme || 'helios');

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Catalog Products', icon: Package },
    { id: 'categories', label: 'Niches & Categories', icon: FolderTree },
    { id: 'branding', label: 'Logo & Themes', icon: Palette, badge: 'Styles' },
    { id: 'analytics', label: 'Click Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: History },
  ];

  const handleLogoutClick = async () => {
    await adminLogout();
    onLogout();
  };

  const handleQuickThemeTouch = (themeId: ThemeId) => {
    setAdminTheme(themeId);
    setPublicTheme(themeId);
    setApplyToPublic(true);
    adminUpdateSiteSettings({
      admin_theme: themeId,
      public_theme: themeId,
      apply_to_public: true,
    }).catch(() => {});
  };

  return (
    <div className={`min-h-screen ${currentTheme.classes.bgApp} text-zinc-100 flex flex-col lg:flex-row transition-colors duration-300 relative selection:bg-violet-500 selection:text-white`}>
      
      {/* ============================================================== */}
      {/* DESKTOP & TV LEFT SIDEBAR (Inspired directly by the Screenshot) */}
      {/* ============================================================== */}
      <aside
        className={`hidden lg:flex flex-col w-64 xl:w-72 2xl:w-80 shrink-0 border-r ${currentTheme.classes.borderCard} ${currentTheme.classes.bgCard} backdrop-blur-2xl p-5 justify-between sticky top-0 h-screen z-40 transition-colors duration-300 shadow-2xl`}
      >
        <div className="space-y-6">
          {/* Top Brand Block */}
          <div className="flex items-center gap-3 px-1">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
              style={{
                backgroundColor: currentTheme.swatch.accent,
                boxShadow: `0 0 20px ${currentTheme.swatch.accent}55`,
              }}
            >
              <Shield className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-base font-extrabold text-white tracking-tight block truncate">
                {settings.logo_name || 'Find Niche'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-medium text-zinc-400 truncate">
                  Admin Control Center
                </span>
              </div>
            </div>
          </div>

          {/* Quick Add Product CTA Button in Sidebar */}
          <button
            onClick={onAddNewProduct}
            className={`w-full min-h-[44px] px-4 py-2.5 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95`}
            style={{
              boxShadow: `0 6px 20px ${currentTheme.swatch.accent}40`,
            }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Product</span>
          </button>

          {/* Navigation Links */}
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 px-3 block mb-2">
              Main Menu
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all group ${
                    isActive
                      ? 'text-white shadow-lg relative'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: currentTheme.swatch.accent + '25',
                          borderColor: currentTheme.swatch.accent,
                          borderWidth: '1px',
                          boxShadow: `0 0 20px ${currentTheme.swatch.accent}35`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                      style={
                        isActive
                          ? {
                              backgroundColor: currentTheme.swatch.accent,
                              color: '#ffffff',
                            }
                          : {
                              backgroundColor: 'rgba(255,255,255,0.04)',
                              color: '#a1a1aa',
                            }
                      }
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  {item.badge && !isActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentTheme.swatch.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Theme Switcher Strip in Sidebar */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                Quick Themes ({THEME_LIST.length})
              </span>
              <button
                onClick={() => onSelectTab('branding')}
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-0.5"
              >
                <span>Edit</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {THEME_LIST.map((th) => {
                const isSel = (settings.admin_theme || 'helios') === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => handleQuickThemeTouch(th.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                      isSel ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: th.swatch.card }}
                    title={`Switch to ${th.name}`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: th.swatch.accent }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer Section (Settings, Public Store, Sign Out) */}
        <div className="pt-4 border-t border-white/10 space-y-1 text-left">
          <button
            onClick={() => onSelectTab('branding')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Store Settings</span>
          </button>

          <button
            onClick={() => onNavigatePublic('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-zinc-400" />
            <span>Live Public Store</span>
          </button>

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-red-400/90 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE HEADER FOR PHONES (< lg) */}
      {/* ============================================================== */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0B0D14]/95 border-b border-white/10 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: currentTheme.swatch.accent }}
          >
            <Shield className="w-4 h-4 stroke-[2.4]" />
          </div>

          <div className="text-left">
            <span className="text-xs font-bold text-white block truncate max-w-[120px]">
              {settings.logo_name || 'Find Niche'}
            </span>
            <span className="text-[10px] text-zinc-400">Admin Panel</span>
          </div>
        </div>

        {/* Mobile Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Add */}
          <button
            onClick={onAddNewProduct}
            className={`min-h-[36px] px-3 py-1.5 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          {/* Quick View Public Store */}
          <button
            onClick={() => onNavigatePublic('/')}
            className="w-9 h-9 rounded-xl bg-white/5 text-zinc-300 flex items-center justify-center"
            title="Public Store"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Sign Out */}
          <button
            onClick={handleLogoutClick}
            className="w-9 h-9 rounded-xl bg-white/5 text-red-400 flex items-center justify-center"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: currentTheme.swatch.accent }}
              >
                <Shield className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-sm font-bold text-white">
                {settings.logo_name || 'Find Niche'} Admin
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[48px] px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: currentTheme.swatch.accent + '35',
                          borderColor: currentTheme.swatch.accent,
                          borderWidth: '1px',
                        }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick theme touch in mobile drawer */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block text-left">
              Select Theme (Instant)
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {THEME_LIST.map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    handleQuickThemeTouch(th.id);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                  style={{ backgroundColor: th.swatch.card }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: th.swatch.accent }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN VIEWPORT FOR PHONE, PC, LAPTOP, AND TV */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Bar inside Content Area (Matching Helios in screenshot) */}
        <div className="border-b border-white/[0.08] bg-[#0E101A]/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          
          {/* Welcome & quick pill filters */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-300 hidden sm:inline">
              Active Store:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-white text-zinc-950 shadow-md font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onSelectTab('products')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  currentTab === 'products'
                    ? 'bg-white text-zinc-950 shadow-md font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => onSelectTab('categories')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  currentTab === 'categories'
                    ? 'bg-white text-zinc-950 shadow-md font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Niches
              </button>
              <button
                onClick={() => onSelectTab('branding')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  currentTab === 'branding'
                    ? 'bg-white text-zinc-950 shadow-md font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Themes
              </button>
            </div>
          </div>

          {/* Right Header Controls (Search, Bell, Settings, User Avatar) */}
          <div className="flex items-center gap-2.5">
            {/* Quick search input matching "Ask helios.ai anything" pill in screenshot */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search catalog or item #..."
                onFocus={() => onSelectTab('products')}
                className="w-48 xl:w-60 h-8 pl-8 pr-3 text-xs bg-white/[0.04] border border-white/10 rounded-full text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => onSelectTab('audit')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 relative transition-colors"
              title="Recent Activity & Logs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-2 right-2 animate-ping" />
            </button>

            {/* Settings Cog */}
            <button
              onClick={() => onSelectTab('branding')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors"
              title="Branding & Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Admin Avatar Badge matching screenshot */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0"
                style={{ backgroundColor: currentTheme.swatch.accent }}
              >
                AD
              </div>
              <div className="text-left hidden xl:block">
                <span className="text-xs font-bold text-white block leading-none">
                  Store Owner
                </span>
                <span className="text-[10px] text-zinc-400 leading-none">
                  admin@findniche.io
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Container (Scales up gracefully for TV and ultra-wide screens) */}
        <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 2xl:p-10 pb-28 lg:pb-12 text-left">
          {children}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM FLOATING TAB BAR FOR PHONE (< lg) */}
      {/* ============================================================== */}
      <nav className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-[#0B0D14]/95 border border-white/15 backdrop-blur-2xl px-2 py-1.5 rounded-full shadow-[0_16px_36px_rgba(0,0,0,0.8)] flex items-center gap-1">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-xs font-bold ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
              style={
                isActive
                  ? { backgroundColor: currentTheme.swatch.accent }
                  : undefined
              }
            >
              <Icon className="w-4 h-4" />
              {isActive && <span>{item.label.split(' ')[0]}</span>}
            </button>
          );
        })}
      </nav>

    </div>
  );
};
