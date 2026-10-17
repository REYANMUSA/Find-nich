import React, { useState, useEffect } from 'react';
import { Package, Eye, EyeOff, FolderTree, MousePointerClick, Plus, Download, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Product, Category, AuditLog } from '../../types';
import { adminFetchProducts, adminFetchCategories, adminFetchAnalytics, adminFetchAuditLogs } from '../../lib/api';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: 'products' | 'categories' | 'analytics' | 'audit') => void;
  onAddNewProduct: () => void;
  onEditProduct: (id: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateTab,
  onAddNewProduct,
  onEditProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminFetchProducts(),
      adminFetchCategories(),
      adminFetchAnalytics().catch(() => null),
      adminFetchAuditLogs().catch(() => []),
    ]).then(([prods, cats, anl, logs]) => {
      setProducts(prods);
      setCategories(cats);
      setAnalytics(anl);
      setAuditLogs(logs || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-zinc-200 rounded-lg" />
      </div>
    );
  }

  const publishedCount = products.filter((p) => p.status === 'published').length;
  const hiddenCount = products.filter((p) => p.status === 'hidden').length;
  const draftCount = products.filter((p) => p.status === 'draft').length;
  const totalClicks = analytics?.summary?.total_clicks || products.reduce((acc, p) => acc + (p.click_count || 0), 0);

  // Link Health Audit
  const suspiciousLinks = products.filter((p) => {
    if (!p.affiliate_url) return true;
    try {
      const u = new URL(p.affiliate_url);
      return !u.hostname.includes('amazon') && !u.hostname.includes('amzn');
    } catch {
      return true;
    }
  });

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      store: 'Find Niche',
      exported_at: new Date().toISOString(),
      products,
      categories,
    }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `find-niche-catalog-${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-8">
      
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-950">Store Overview</h1>
          <p className="text-xs text-zinc-500">Live operational snapshot of your tech discovery catalog.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="min-h-[38px] px-3.5 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Export Catalog JSON</span>
          </button>
          <button
            onClick={onAddNewProduct}
            className="min-h-[38px] px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        
        <div
          onClick={() => onNavigateTab('products')}
          className="p-4 bg-white border border-zinc-200 rounded-lg space-y-1 hover:border-zinc-400 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Published Products</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums">
            {publishedCount}
          </div>
          <p className="text-[11px] text-zinc-400">
            {products.length} total indexed items
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('products')}
          className="p-4 bg-white border border-zinc-200 rounded-lg space-y-1 hover:border-zinc-400 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Drafts & Hidden</span>
            <EyeOff className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums">
            {draftCount + hiddenCount}
          </div>
          <p className="text-[11px] text-zinc-400">
            {draftCount} draft, {hiddenCount} hidden
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('categories')}
          className="p-4 bg-white border border-zinc-200 rounded-lg space-y-1 hover:border-zinc-400 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Active Categories</span>
            <FolderTree className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums">
            {categories.length}
          </div>
          <p className="text-[11px] text-zinc-400">
            Home, Tech, Phone, Body...
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('analytics')}
          className="p-4 bg-white border border-zinc-200 rounded-lg space-y-1 hover:border-zinc-400 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Amazon Clicks</span>
            <MousePointerClick className="w-4 h-4 text-zinc-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums">
            {totalClicks}
          </div>
          <p className="text-[11px] text-zinc-400">
            Tracked outbound referrals
          </p>
        </div>

      </div>

      {/* Compliance & Link Health Audit Box */}
      <div className="p-4 sm:p-5 bg-white border border-zinc-200 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-zinc-900" />
            <h2 className="text-sm font-bold text-zinc-950">
              Amazon Associates Compliance & Link Status
            </h2>
          </div>
          {suspiciousLinks.length === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Links Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3.5 h-3.5" />
              {suspiciousLinks.length} Need Review
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed">
          All affiliate links in the Find Niche catalog must point directly to authorized Amazon marketplaces (e.g. <code>amazon.com</code>, <code>amzn.to</code>) and include the owner's approved Associate tag. Never use link shorteners that obscure the Amazon destination.
        </p>

        {suspiciousLinks.length > 0 && (
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Items with non-standard or missing affiliate URLs:</p>
            <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
              {suspiciousLinks.map((p) => (
                <li key={p.id}>
                  #{p.product_number.toString().padStart(3, '0')} - {p.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2-Column Split: Recent Products & Recent Audit Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Products */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-950">Recent Catalog Items</h2>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {products.slice(0, 5).map((p) => (
              <div
                key={p.id}
                onClick={() => onEditProduct(p.id)}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-50 px-1 rounded cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-zinc-500 shrink-0">
                    #{p.product_number.toString().padStart(3, '0')}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-zinc-400 capitalize">{p.status} · {p.click_count || 0} clicks</p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize shrink-0 ${
                  p.status === 'published' ? 'bg-zinc-100 text-zinc-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log / Activity */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-950">Administrative Activity</h2>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1"
            >
              <span>Full log</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="text-xs space-y-0.5 border-l-2 border-zinc-300 pl-3 py-0.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-mono font-medium text-zinc-600">{log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-zinc-800 leading-snug">{log.details}</p>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-xs text-zinc-400 py-4 text-center">No recent changes recorded.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
