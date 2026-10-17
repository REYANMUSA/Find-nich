import React, { useState, useRef } from 'react';

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
  const [justTapped, setJustTapped] = useState(false);
  const tapTimesRef = useRef<number[]>([]);

  const handleLogoTap = (e: React.MouseEvent) => {
    e.preventDefault();

    // Subtle micro-feedback on tap
    setJustTapped(true);
    setTimeout(() => setJustTapped(false), 150);

    const now = Date.now();
    // Keep timestamps within the last 3000ms window
    tapTimesRef.current = tapTimesRef.current.filter((t) => now - t <= 3000);
    tapTimesRef.current.push(now);

    // If 5 taps within 3 seconds, trigger secret unlock
    if (tapTimesRef.current.length >= 5) {
      tapTimesRef.current = [];
      if (onSecretAdminTrigger) {
        onSecretAdminTrigger();
      }
    }
  };

  return (
    <div
      onClick={handleLogoTap}
      className={`cursor-pointer select-none flex items-center gap-2.5 transition-transform active:scale-95 ${className}`}
      title="Find Niche"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleLogoTap(e as any);
      }}
    >
      {/* Sleek Compass Logo in Brand Forest Green (#2E5B3E) */}
      <div
        className={`w-8 h-8 rounded-full bg-[#2E5B3E] text-white flex items-center justify-center shrink-0 shadow-xs transition-transform ${
          justTapped ? 'scale-110' : ''
        }`}
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

      <div className="flex flex-col text-left">
        <span className="font-bold text-base leading-tight text-zinc-950 tracking-tight">
          Find Niche
        </span>
        {showTagline && (
          <span className="text-[10px] text-zinc-500 font-medium tracking-tight">
            Better Products. Smarter Choices.
          </span>
        )}
      </div>
    </div>
  );
};
