import React from 'react';
import { Search, Bookmark } from 'lucide-react';
import { Logo } from './Logo';
import { useSavedProducts } from '../lib/savedStore';

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
  const { savedIds } = useSavedProducts();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo with 5-tap Secret Admin Trigger */}
        <Logo
          onSecretAdminTrigger={onSecretAdminTrigger}
          showTagline={true}
        />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-600">
          <button
            onClick={() => onNavigate('/')}
            className={`transition-colors hover:text-[#2E5B3E] ${
              currentPath === '/' ? 'text-[#2E5B3E] font-bold' : ''
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => onNavigate('/categories')}
            className={`transition-colors hover:text-[#2E5B3E] ${
              currentPath.startsWith('/categories') ? 'text-[#2E5B3E] font-bold' : ''
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => onNavigate('/about')}
            className={`transition-colors hover:text-[#2E5B3E] ${
              currentPath === '/about' ? 'text-[#2E5B3E] font-bold' : ''
            }`}
          >
            About
          </button>
          <button
            onClick={() => onNavigate('/affiliate-disclosure')}
            className={`transition-colors hover:text-[#2E5B3E] ${
              currentPath === '/affiliate-disclosure' ? 'text-[#2E5B3E] font-bold' : ''
            }`}
          >
            Disclosure
          </button>
        </nav>

        {/* Right side actions: Search & Saved items */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('/search')}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              currentPath === '/search'
                ? 'bg-[#2E5B3E]/10 text-[#2E5B3E]'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
            title="Search Products"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('/saved')}
            className={`w-10 h-10 relative flex items-center justify-center rounded-full transition-colors ${
              currentPath === '/saved'
                ? 'bg-[#2E5B3E]/10 text-[#2E5B3E]'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
            title="Saved Products"
            aria-label="Saved Products"
          >
            <Bookmark className="w-4 h-4" />
            {savedIds.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#2E5B3E] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {savedIds.length > 9 ? '9+' : savedIds.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
