import React, { useState, useEffect } from 'react';
import { History, Shield, RefreshCw } from 'lucide-react';
import { AuditLog } from '../../types';
import { adminFetchAuditLogs } from '../../lib/api';
import { useSiteSettings } from '../../lib/settingsStore';
import { getTheme } from '../../lib/themes';

export const AdminAuditLogsPage: React.FC = () => {
  const { settings } = useSiteSettings();
  const currentTheme = getTheme(settings.admin_theme || 'helios');

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetchAuditLogs()
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <History className="w-6 h-6 text-violet-400" />
          <span>Security & Activity Audit Log</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Historical record of administrative actions, catalog modifications, and authentication events.
        </p>
      </div>

      <div className="bg-[#131722]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-400" />
            <span>Loading audit log entries...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            No audit events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-mono bg-black/20">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          log.action.includes('failed')
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : log.action.includes('success')
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-white/5 text-violet-300 border border-white/10'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-200 font-sans text-xs">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
