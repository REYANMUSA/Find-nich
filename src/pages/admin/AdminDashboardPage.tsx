import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  FolderTree,
  Eye,
  Plus,
  Palette,
  ExternalLink,
  MousePointerClick,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Product } from '../../types';
import { adminFetchProducts, adminFetchAnalytics } from '../../lib/api';
import { useSiteSettings } from '../../lib/settingsStore';
import { getTheme } from '../../lib/themes';
import { AdminTab } from './AdminLayout';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: AdminTab) => void;
  onAddNewProduct: () => void;
  onEditProduct: (id: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateTab,
  onAddNewProduct,
  onEditProduct,
}) => {
  const { settings } = useSiteSettings();
  const currentTheme = getTheme(settings.admin_theme || 'helios');

  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminFetchProducts(), adminFetchAnalytics()])
      .then(([prods, stats]) => {
        setProducts(prods);
        setAnalytics(stats);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalProducts = products.length;
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const draftCount = products.filter((p) => p.status === 'draft').length;
  const totalClicks = analytics?.summary?.total_clicks || products.reduce((acc, p) => acc + (p.click_count || 0), 0);
  const topProducts = analytics?.top_products || products.slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 text-left">
      
      {/* Top Welcome Banner inspired by Helios in screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-bold text-zinc-400">
              Overview Dashboard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to {settings.logo_name || 'Find Niche'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {settings.tagline || 'Better Products. Smarter Choices.'} · Control panel & real-time discovery analytics
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('branding')}
            className="min-h-[42px] px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Palette className="w-4 h-4 text-violet-400" />
            <span>Customize Logo & Themes</span>
          </button>

          <button
            onClick={onAddNewProduct}
            className={`min-h-[42px] px-4 py-2 ${currentTheme.classes.accentBg} ${currentTheme.classes.accentHover} text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid (Inspired by Screenshot's card layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* Total Products */}
        <div className={`${currentTheme.classes.bgCard} border ${currentTheme.classes.borderCard} rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg relative overflow-hidden`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Total Catalog</span>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
            {totalProducts}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {publishedCount} live in store · {draftCount} drafts
          </span>
        </div>

        {/* Total Outbound Clicks */}
        <div className={`${currentTheme.classes.bgCard} border ${currentTheme.classes.borderCard} rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg relative overflow-hidden`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Total Interest Clicks</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
            {totalClicks}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Tracked outbound Amazon visits
          </span>
        </div>

        {/* Active Categories */}
        <div className={`${currentTheme.classes.bgCard} border ${currentTheme.classes.borderCard} rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg relative overflow-hidden`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Active Niches</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-violet-300 tabular-nums">
            {analytics?.summary?.total_categories || 4}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Home, Tech, Phone & Body
          </span>
        </div>

        {/* Active Theme Badge */}
        <div className={`${currentTheme.classes.bgCard} border ${currentTheme.classes.borderCard} rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg relative overflow-hidden`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Active Visual Style</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-300 truncate">
            {currentTheme.name}
          </div>
          <button
            onClick={() => onNavigateTab('branding')}
            className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold mt-1 flex items-center gap-1"
          >
            <span>Change theme</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Main Row: Activity Curve + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Performance Graph Card (Inspired directly by Helios chart in screenshot) */}
        <div className={`lg:col-span-2 ${currentTheme.classes.bgCard} border ${currentTheme.classes.borderCard} rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Catalog Engagement Trend
                </h3>
                <p className="text-xs text-zinc-400">
                  Visitor views and product affiliate interest over the past 30 days
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg text-[10px] font-mono text-zinc-300">
                <span className="px-2 py-0.5 rounded bg-violet-600 text-white font-bold">Live</span>
                <span className="px-2 py-0.5">30D</span>
              </div>
            </div>

            {/* Glowing SVG Wave Chart */}
            <div className="w-full h-44 sm:h-52 relative mt-2">
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={currentTheme.swatch.accent} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={currentTheme.swatch.accent} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                {/* Area fill */}
                <path
                  d="M 0,140 Q 60,110 120,120 T 240,70 T 360,50 T 440,30 L 500,20 L 500,160 L 0,160 Z"
                  fill="url(#chartGradient)"
                />
                {/* Glowing Stroke Curve */}
                <path
                  d="M 0,140 Q 60,110 120,120 T 240,70 T 360,50 T 440,30 L 500,20"
                  fill="none"
                  stroke={currentTheme.swatch.accent}
                  strokeWidth="3.5"
                  className="drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                />

                {/* Point Highlight */}
                <circle cx="440" cy="30" r="5" fill="#FFFFFF" stroke={currentTheme.swatch.accent} strokeWidth="3" />
                <text x="400" y="18" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  Peak: 52 Clicks
                </text>
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-zinc-400">
            <span>High conversion niches: Home & Tech accessories</span>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
            >
              <span>View full click analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Shortcuts & Brand Status Card */}
        <div className={`${currentTheme.classes.bgCard} border ${currentTheme.classes.borderCard} rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4`}>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">
              Store Control & Branding
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Quick access to customize your store identity
            </p>

            <div className="space-y-2">
              <button
                onClick={() => onNavigateTab('branding')}
                className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center justify-between border border-white/5 transition-all group"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-violet-400 transition-colors">
                    Rename Logo: "{settings.logo_name || 'Find Niche'}"
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Change site name & tagline anytime
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => onNavigateTab('products')}
                className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center justify-between border border-white/5 transition-all group"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-violet-400 transition-colors">
                    Manage Products ({products.length})
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Edit photos, affiliate links, and descriptions
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => onNavigateTab('categories')}
                className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center justify-between border border-white/5 transition-all group"
              >
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-violet-400 transition-colors">
                    Category Niches
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Reorder or create new product categories
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 text-[11px] text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Permanent sync: All changes auto-save to disk & db.json</span>
          </div>
        </div>

      </div>

      {/* Top Products Leaderboard */}
      <div className={`${currentTheme.classes.bgCard} border ${currentTheme.classes.borderCard} rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Top Converting Catalog Products
            </h3>
            <p className="text-xs text-zinc-400">
              Ranked by outbound affiliate click volume
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('products')}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300"
          >
            View all products →
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-mono">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3 text-right">Clicks</th>
                <th className="py-2.5 px-3 text-right">Views</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topProducts.slice(0, 5).map((prod: any, idx: number) => (
                <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-zinc-400">
                    #{prod.number || prod.product_number}
                  </td>
                  <td className="py-3 px-3 font-semibold text-white">
                    {prod.name}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                    {prod.clicks || prod.click_count || 0}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-400 tabular-nums">
                    {prod.views || prod.view_count || 0}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onEditProduct(prod.id)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white rounded-lg transition-colors font-medium text-[11px]"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
