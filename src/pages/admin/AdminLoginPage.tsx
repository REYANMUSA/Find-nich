import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-[#181A1B] text-white flex flex-col justify-between items-center px-4 py-8 sm:py-12">
      
      {/* Top Bar with Back Button */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <button
          onClick={onBackToSite}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to store</span>
        </button>
      </div>

      {/* Main Unlock Card matching Screen 5 in the design */}
      <div className="w-full max-w-sm space-y-6 my-auto">
        
        {/* Shield Icon in Circle */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-[#2E5B3E] mb-1">
            <Shield className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Admin Access
          </h1>
          <p className="text-xs text-zinc-400">
            Enter passcode to continue
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 rounded text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter admin password"
              required
              autoFocus
              className="w-full h-12 pl-4 pr-11 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#2E5B3E] focus:border-[#2E5B3E] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-200"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full h-12 bg-[#2E5B3E] hover:bg-[#254b33] text-white text-sm font-semibold rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 active:scale-[0.99] shadow-xs"
          >
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </div>

      {/* Brand Lockup at bottom matching design */}
      <div className="flex flex-col items-center text-center space-y-1 pt-6 text-zinc-500 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
          <div className="w-5 h-5 rounded-full bg-zinc-700 text-white flex items-center justify-center text-[10px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-white">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white" stroke="none" />
            </svg>
          </div>
          <span>Find Niche</span>
        </div>
        <p className="text-[11px] text-zinc-500">Better Products. Smarter Choices.</p>
        <p className="text-[10px] text-zinc-600 pt-1">Developed by REYANMUSA</p>
      </div>

    </div>
  );
};
