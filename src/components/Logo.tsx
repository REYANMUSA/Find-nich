import React, { useState, useRef } from 'react';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface LogoProps {
  onSecretAdminTrigger?: () => void;
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  onSecretAdminTrigger,
  showTagline = true,
  className = '',
}) => {
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || settings.admin_theme || 'helios');
  const isManasa = theme.id === 'manasa';

  const [justTapped, setJustTapped] = useState(false);
  const tapTimesRef = useRef<number[]>([]);

  const handleLogoTap = (e: React.MouseEvent) => {
    e.preventDefault();

    setJustTapped(true);
    setTimeout(() => setJustTapped(false), 150);

    const now = Date.now();
    tapTimesRef.current = tapTimesRef.current.filter((t) => now - t <= 3000);
    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length >= 5) {
      tapTimesRef.current = [];
      if (onSecretAdminTrigger) {
        onSecretAdminTrigger();
      }
    }
  };

  const displayName = settings.logo_name || 'Find Niche';
  const displayTagline = (settings.tagline ?? '').trim();

  return (
    <div
      onClick={handleLogoTap}
      className={`cursor-pointer select-none flex items-center gap-2.5 min-w-0 transition-transform active:scale-95 ${className}`}
      title={`${displayName} (Tap 5 times for Admin access)`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleLogoTap(e as any);
      }}
    >
      {/* Emblem */}
      <div
        className={`flex items-center justify-center shrink-0 transition-transform duration-200 ${
          isManasa
            ? 'w-7 h-7 rounded-md bg-zinc-900 text-white'
            : 'w-8 h-8 rounded-full text-white shadow-xs'
        } ${justTapped ? 'scale-105' : ''}`}
        style={isManasa ? undefined : { backgroundColor: theme.swatch.accent }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-white"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon
            points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            fill="white"
            stroke="none"
          />
        </svg>
      </div>

      <div className="flex flex-col text-left min-w-0">
        <span
          className={`font-bold leading-tight tracking-tight truncate whitespace-nowrap ${
            isManasa ? 'text-base sm:text-lg text-zinc-950' : `text-base ${theme.classes.textPrimary}`
          }`}
        >
          {displayName}
        </span>
        {showTagline && !isManasa && displayTagline.length > 0 && (
          <span className={`text-[10px] ${theme.classes.textMuted} font-medium tracking-tight truncate`}>
            {displayTagline}
          </span>
        )}
      </div>
    </div>
  );
};
