import React from 'react';
import { Home, LayoutGrid, Search, Bookmark, Info } from 'lucide-react';
import { useSavedProducts } from '../lib/savedStore';

interface BottomTabBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentPath, onNavigate }) => {
  const { savedIds } = useSavedProducts();

  const tabs = [
    { id: '/', label: 'Home', icon: Home },
    { id: '/categories', label: 'Categories', icon: LayoutGrid },
    { id: '/search', label: 'Search', icon: Search },
    { id: '/saved', label: 'Saved', icon: Bookmark, badge: savedIds.length },
    { id: '/about', label: 'About', icon: Info },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 shadow-sm md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
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
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
                isActive ? 'text-[#2E5B3E] font-semibold' : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-[#2E5B3E] stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#2E5B3E] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight leading-none ${isActive ? 'text-[#2E5B3E] font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
