import React, { useState, useEffect } from 'react';
import { History, Shield, RefreshCw } from 'lucide-react';
import { AuditLog } from '../../types';
import { adminFetchAuditLogs } from '../../lib/api';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await adminFetchAuditLogs();
      setLogs(data);
    } catch {
      // Failed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-950">Administrative Audit Trail</h1>
          <p className="text-xs text-zinc-500">
            Immutable log of catalog mutations, publishing actions, and owner logins.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="min-h-[36px] px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No audit events found.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 sm:p-4 hover:bg-zinc-50/60 transition-colors space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded text-[11px]">
                    {log.action}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed pt-0.5">
                  {log.details}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
