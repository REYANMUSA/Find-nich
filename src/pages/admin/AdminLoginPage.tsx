import React, { useState } from 'react';
import { Lock, ArrowLeft, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { adminLogin } from '../../lib/api';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToSite: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToSite,
}) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError(null);

    const result = await adminLogin(passcode.trim());
    setLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Incorrect administrator passcode.');
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Back Link */}
        <div>
          <button
            onClick={onBackToSite}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to public catalog</span>
          </button>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
          
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-zinc-950">
              Owner Administration
            </h1>
            <p className="text-xs text-zinc-500">
              Private access to manage catalog, categories, and affiliate tags.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-800">
                Administrator Passcode
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  required
                  autoFocus
                  className="w-full h-11 pl-9 pr-3 text-sm bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passcode}
              className="w-full min-h-[44px] bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Development Default Hint for Owner convenience */}
          <div className="pt-4 border-t border-zinc-100 bg-zinc-50/50 p-3 rounded text-[11px] text-zinc-500 space-y-1">
            <div className="flex items-center gap-1 text-zinc-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Default Master Key</span>
            </div>
            <p className="font-mono text-zinc-800 select-all">findniche2026</p>
            <p className="text-[10px] text-zinc-400">Can also be configured via ADMIN_PASSCODE environment variable.</p>
          </div>

        </div>

      </div>
    </div>
  );
};
