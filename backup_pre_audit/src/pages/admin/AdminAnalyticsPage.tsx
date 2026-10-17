import React, { useState, useEffect } from 'react';
import { BarChart3, MousePointerClick, ShieldCheck, Eye, ExternalLink } from 'lucide-react';
import { adminFetchAnalytics } from '../../lib/api';

export const AdminAnalyticsPage: React.FC = () => {
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
      <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
        Loading click analytics...
      </div>
    );
  }

  const topProducts = data?.top_products || [];
  const sources = data?.sources || {};
  const recentClicks = data?.recent_clicks || [];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-950">Outbound Click Analytics</h1>
        <p className="text-xs text-zinc-500">
          Measures reader interest without collecting personal data. Amazon Associates reports remain your official source of truth for purchases.
        </p>
      </div>

      {/* Compliance Note */}
      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-zinc-900 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-zinc-900">
            Privacy-First Click Measurement (Zero PII)
          </p>
          <p className="text-zinc-600 leading-relaxed">
            Clicks recorded here represent user taps on “Check price on Amazon” buttons. Find Niche does not collect IP addresses, track cross-site cookies, or inspect shopping baskets. For qualifying purchase commissions, check your official Amazon Associates portal.
          </p>
        </div>
      </div>

      {/* Product Interest Ranking */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-zinc-700" />
          <span>Product Interest & Click Breakdown</span>
        </h2>

        {topProducts.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">No clicks recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p: any) => {
              const maxClicks = Math.max(1, topProducts[0]?.clicks || 1);
              const percentage = Math.min(100, Math.round((p.clicks / maxClicks) * 100));
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-md">
                      <span className="font-mono font-bold text-zinc-500">
                        #{p.number?.toString().padStart(3, '0')}
                      </span>
                      <span className="font-semibold text-zinc-900 truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-zinc-600 tabular-nums">
                      <span>{p.views || 0} views</span>
                      <span className="font-bold text-zinc-900">{p.clicks} clicks</span>
                    </div>
                  </div>
                  {/* Subtle bar */}
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sources & Recent Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Click Origins */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-zinc-700" />
            <span>Click Placement Origins</span>
          </h2>

          <div className="divide-y divide-zinc-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-600">Product Card Button (Catalog)</span>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">
                {sources['catalog_card'] || 0}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-600">Product Detail Page (Full Review)</span>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">
                {sources['product_detail'] || 0}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-600">Related Products Section</span>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">
                {sources['related_products'] || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Clicks Stream */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-zinc-950">
            Recent Click Stream
          </h2>

          <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar text-xs">
            {recentClicks.slice(0, 15).map((c: any) => (
              <div key={c.id} className="p-2 bg-zinc-50 rounded flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="font-mono font-semibold text-zinc-600 mr-1.5">
                    #{c.product_number?.toString().padStart(3, '0')}
                  </span>
                  <span className="text-zinc-900 font-medium truncate">{c.product_name}</span>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                  {new Date(c.clicked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {recentClicks.length === 0 && (
              <p className="text-xs text-zinc-400 py-6 text-center">No outbound clicks recorded yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
