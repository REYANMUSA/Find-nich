import React from 'react';
import { LayoutDashboard, Package, FolderTree, BarChart3, History, LogOut, ExternalLink, Plus } from 'lucide-react';
import { adminLogout } from '../../lib/api';

interface AdminLayoutProps {
  currentTab: 'dashboard' | 'products' | 'categories' | 'analytics' | 'audit';
  onSelectTab: (tab: 'dashboard' | 'products' | 'categories' | 'analytics' | 'audit') => void;
  onNavigatePublic: (path?: string) => void;
  onAddNewProduct: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onNavigatePublic,
  onAddNewProduct,
  onLogout,
  children,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'analytics', label: 'Clicks & Interest', icon: BarChart3 },
    { id: 'audit', label: 'Audit Log', icon: History },
  ] as const;

  const handleLogoutClick = async () => {
    await adminLogout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16">
      
      {/* Admin Top Banner */}
      <div className="bg-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold tracking-wide">Owner Control Panel</span>
            <span className="text-zinc-500 hidden sm:inline">·</span>
            <span className="text-zinc-400 hidden sm:inline">Find Niche</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigatePublic('/')}
              className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors min-h-[32px] px-2 py-1"
            >
              <span>Public Store</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={handleLogoutClick}
              className="text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors min-h-[32px] px-2 py-1"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tab Navigation Bar */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Scrollable Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Action: Add Product */}
          <div className="shrink-0 py-2">
            <button
              onClick={onAddNewProduct}
              className="min-h-[40px] px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

        </div>
      </div>

      {/* Content Canvas */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

    </div>
  );
};
