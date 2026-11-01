import React from 'react';
import { Search, Compass, Shield } from 'lucide-react';
import { Logo } from './Logo';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onSecretAdminTrigger?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onSecretAdminTrigger,
}) => {
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || 'helios');

  return (
    <header className="sticky top-0 z-40 bg-[#0B0D14]/80 backdrop-blur-xl border-b border-white/[0.08] transition-colors duration-300 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo with 5-tap Secret Admin Trigger */}
        <Logo
          onSecretAdminTrigger={onSecretAdminTrigger}
          showTagline={true}
        />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-400">
          <button
            onClick={() => onNavigate('/')}
            className={`transition-colors hover:text-white ${
              currentPath === '/' || currentPath === '' ? 'text-white font-bold' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('/categories')}
            className={`transition-colors hover:text-white ${
              currentPath.startsWith('/categories') ? 'text-white font-bold' : ''
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => onNavigate('/about')}
            className={`transition-colors hover:text-white ${
              currentPath === '/about' ? 'text-white font-bold' : ''
            }`}
          >
            About
          </button>
          <button
            onClick={() => onNavigate('/affiliate-disclosure')}
            className={`transition-colors hover:text-white ${
              currentPath === '/affiliate-disclosure' ? 'text-white font-bold' : ''
            }`}
          >
            Disclosure
          </button>
        </nav>

        {/* Right side actions: Search */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/search')}
            className={`h-9 px-3 sm:px-3.5 flex items-center gap-2 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all ${
              currentPath === '/search'
                ? 'bg-violet-600/20 border-violet-500/50 text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
            title="Search Catalog"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    </header>
  );
};
