import React from 'react';
import { Home, LayoutGrid, Search, Info } from 'lucide-react';
import { useSiteSettings } from '../lib/settingsStore';
import { getTheme } from '../lib/themes';

interface BottomTabBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentPath, onNavigate }) => {
  const { settings } = useSiteSettings();
  const theme = getTheme(settings.public_theme || 'helios');

  const tabs = [
    { id: '/', label: 'Home', icon: Home },
    { id: '/categories', label: 'Categories', icon: LayoutGrid },
    { id: '/search', label: 'Search', icon: Search },
    { id: '/about', label: 'About', icon: Info },
  ];

  return (
    <aside className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden pointer-events-none select-none">
      {/* Floating Capsule Dock Inspired by Screenshot 2 */}
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full backdrop-blur-2xl border shadow-[0_16px_40px_rgba(0,0,0,0.65)] transition-all duration-300"
        style={{
          backgroundColor: theme.isDark ? 'rgba(18, 22, 34, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.id === '/'
              ? currentPath === '/' || currentPath === ''
              : currentPath.startsWith(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex items-center gap-2 rounded-full transition-all duration-300 ${
                isActive
                  ? `${theme.classes.accentPillActive} px-4 py-2 text-xs font-bold shadow-md scale-102`
                  : `p-2.5 ${theme.classes.textMuted} hover:text-white active:scale-95`
              }`}
              title={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              {isActive && (
                <span className="leading-none tracking-tight whitespace-nowrap">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
