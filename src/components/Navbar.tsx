import React from 'react';
import { Search } from 'lucide-react';
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

  const socialLinks: { id: string; name: string; url?: string; icon: React.ReactNode; hoverColor: string }[] = [
    {
      id: 'tiktok',
      name: 'TikTok',
      url: settings.social_tiktok,
      hoverColor: 'hover:text-[#ff0050]',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.49 2.79 1.54-.04 2.89-1.08 3.23-2.58.11-.53.13-1.07.13-1.61V.02h-.03z" />
        </svg>
      ),
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: settings.social_youtube,
      hoverColor: 'hover:text-[#ff0000]',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      name: 'Instagram',
      url: settings.social_instagram,
      hoverColor: 'hover:text-[#e4405f]',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      id: 'x',
      name: 'X',
      url: settings.social_x,
      hoverColor: 'hover:text-white',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      url: settings.social_snapchat,
      hoverColor: 'hover:text-[#fffc00]',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.298 2.002c-3.649 0-5.83 2.684-5.83 5.485 0 .894.27 1.835.632 2.474.135.238.162.46.081.704-.108.324-.46.541-.839.676-.757.27-1.407.649-1.624 1.19-.19.46.082.974.623 1.245 1.056.514 1.894.19 2.597-.109.217-.081.433-.162.677-.162.324 0 .54.108.73.27.46.406.893 1.11 1.19 1.624.433.785.92 1.353 1.76 1.353.784 0 1.325-.568 1.758-1.353.298-.514.73-1.218 1.19-1.624.19-.162.406-.27.73-.27.244 0 .46.081.677.162.703.299 1.541.623 2.597.109.541-.271.813-.785.623-1.245-.217-.541-.867-.92-1.624-1.19-.379-.135-.731-.352-.839-.676-.081-.244-.054-.466.081-.704.362-.639.632-1.58.632-2.474 0-2.801-2.181-5.485-5.83-5.485z" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      url: settings.social_facebook,
      hoverColor: 'hover:text-[#1877f2]',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  const activeSocials = socialLinks.filter((s) => s.url && s.url.trim().length > 0);

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 shadow-sm ${
        theme.isDark
          ? 'bg-[#0B0D14]/90 border-white/[0.08]'
          : 'bg-white/95 border-zinc-200/80 shadow-xs'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Logo with 5-tap Secret Admin Trigger */}
        <Logo
          onSecretAdminTrigger={onSecretAdminTrigger}
          showTagline={true}
        />

        {/* Center Desktop Navigation Links */}
        <nav className={`hidden md:flex items-center gap-6 text-xs font-semibold ${theme.classes.textMuted}`}>
          <button
            onClick={() => onNavigate('/')}
            className={`transition-colors ${
              currentPath === '/' || currentPath === ''
                ? `${theme.classes.textPrimary} font-bold`
                : `${theme.classes.textMuted} hover:${theme.classes.textPrimary}`
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('/categories')}
            className={`transition-colors ${
              currentPath.startsWith('/categories')
                ? `${theme.classes.textPrimary} font-bold`
                : `${theme.classes.textMuted} hover:${theme.classes.textPrimary}`
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => onNavigate('/about')}
            className={`transition-colors ${
              currentPath === '/about'
                ? `${theme.classes.textPrimary} font-bold`
                : `${theme.classes.textMuted} hover:${theme.classes.textPrimary}`
            }`}
          >
            About
          </button>
          <button
            onClick={() => onNavigate('/affiliate-disclosure')}
            className={`transition-colors ${
              currentPath === '/affiliate-disclosure'
                ? `${theme.classes.textPrimary} font-bold`
                : `${theme.classes.textMuted} hover:${theme.classes.textPrimary}`
            }`}
          >
            Disclosure
          </button>
        </nav>

        {/* Right side actions: Dynamic Social Media Account Logos + Search */}
        <div className="flex items-center gap-2">
          {/* Social Media Account Logos */}
          {activeSocials.length > 0 && (
            <div className={`flex items-center gap-1.5 pr-2 border-r ${theme.isDark ? 'border-white/10' : 'border-zinc-200'}`}>
              {activeSocials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 active:scale-90 shadow-2xs ${
                    theme.isDark
                      ? `bg-white/[0.06] border-white/10 text-zinc-300 ${social.hoverColor} hover:bg-white/[0.12] hover:border-white/25 hover:text-white`
                      : `bg-zinc-100 border-zinc-200 text-zinc-700 ${social.hoverColor} hover:bg-zinc-200 hover:border-zinc-300`
                  }`}
                  title={`Follow on ${social.name}`}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={() => onNavigate('/search')}
            className={`min-h-[36px] h-9 px-3.5 flex items-center gap-2 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all active:scale-95 ${
              currentPath === '/search'
                ? `${theme.classes.accentSubtleBg} ${theme.classes.textPrimary} shadow-xs font-bold`
                : theme.isDark
                  ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200'
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

