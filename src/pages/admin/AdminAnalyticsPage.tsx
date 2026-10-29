import React, { useState, useEffect } from 'react';
import { BarChart3, MousePointerClick, ShieldCheck, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { adminFetchAnalytics } from '../../lib/api';
import { useSiteSettings } from '../../lib/settingsStore';
import { getTheme } from '../../lib/themes';

export const AdminAnalyticsPage: React.FC = () => {
  const { settings } = useSiteSettings();
  const currentTheme = getTheme(settings.admin_theme || 'helios');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetchAnalytics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-400" />
        <span>Loading click analytics...</span>
      </div>
    );
  }

  const topProducts = data?.top_products || [];
  const sources = data?.sources || {};
  const recentClicks = data?.recent_clicks || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-400" />
          <span>Outbound Click Analytics</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Measures reader interest without collecting personal data. Amazon Associates reports remain your official source of truth for purchases.
        </p>
      </div>

      {/* Compliance Note */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3 backdrop-blur-md">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">
            Privacy-First Click Measurement (Zero PII)
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Every click increments an anonymous counter when a reader clicks an Amazon Associates link. No IP addresses, device identifiers, or tracking cookies are recorded.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Top Items & Referral Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Top Clicked Items */}
        <div className="lg:col-span-2 bg-[#131722]/90 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl">
          <h2 className="text-sm font-bold text-white mb-3">
            Top Performing Products by Amazon Outbound Clicks
          </h2>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-mono">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Clicks</th>
                  <th className="py-2.5 px-3 text-right">Views</th>
                  <th className="py-2.5 px-3 text-right">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topProducts.map((p: any) => {
                  const ctr = p.views > 0 ? ((p.clicks / p.views) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-zinc-400">
                        #{p.number?.toString().padStart(3, '0')}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">
                        {p.name}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {p.clicks}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400 tabular-nums">
                        {p.views}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-violet-300 tabular-nums">
                        {ctr}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Source breakdown */}
        <div className="bg-[#131722]/90 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white">Click Locations</h2>
          <div className="space-y-3">
            {Object.entries(sources).map(([src, count]: [string, any]) => (
              <div key={src} className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                <span className="font-mono text-zinc-300 capitalize">{src.replace(/_/g, ' ')}</span>
                <span className="font-mono font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Clicks Stream */}
      <div className="bg-[#131722]/90 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl">
        <h2 className="text-sm font-bold text-white mb-3">Recent Anonymous Click Stream</h2>
        <div className="divide-y divide-white/5 text-xs">
          {recentClicks.slice(0, 15).map((c: any) => (
            <div key={c.id} className="py-2.5 flex items-center justify-between text-zinc-300 hover:bg-white/5 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-500 text-[11px]">
                  #{c.product_number?.toString().padStart(3, '0')}
                </span>
                <span className="font-semibold text-white">{c.product_name}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-mono">
                <span className="bg-white/5 px-2 py-0.5 rounded">{c.source}</span>
                <span>{new Date(c.clicked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
