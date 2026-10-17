import React, { useState } from 'react';
import { Menu, X, Shield, ExternalLink } from 'lucide-react';
import { isAuthenticated } from '../lib/api';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authed = isAuthenticated();

  const navLinks = [
    { label: 'Catalog', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Disclosure', path: '/affiliate-disclosure' },
    { label: 'Privacy', path: '/privacy' },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
      {/* 3-Zone Top Bar Contract */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single Brand Wordmark */}
        <button
          onClick={() => handleLinkClick('/')}
          className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity flex items-center gap-2 text-left"
        >
          <span className="w-6 h-6 rounded bg-zinc-900 text-white text-xs font-mono font-bold flex items-center justify-center">
            FN
          </span>
          <span>Find Niche</span>
        </button>

        {/* Zone 2: 4 Clean Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleLinkClick(link.path)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                  isActive
                    ? 'text-zinc-950 border-b-2 border-zinc-950 font-semibold'
                    : 'hover:text-zinc-950'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action (Admin Access) & Mobile Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleLinkClick(authed ? '/admin' : '/admin/login')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              currentPath.startsWith('/admin')
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-700 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900'
            }`}
            title="Owner Administration"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{authed ? 'Admin Dashboard' : 'Admin'}</span>
          </button>

          {/* Mobile Menu Button - 44x44px touch target */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-700 hover:text-zinc-950 p-2"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleLinkClick(link.path)}
              className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors ${
                currentPath === link.path
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-zinc-100">
            <button
              onClick={() => handleLinkClick(authed ? '/admin' : '/admin/login')}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-zinc-800 bg-zinc-100 rounded"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-zinc-600" />
                {authed ? 'Owner Dashboard' : 'Owner Admin Sign-in'}
              </span>
              <span className="text-xs text-zinc-500 font-mono">Protected</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
