import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BottomTabBar } from './components/BottomTabBar';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SearchPage } from './pages/SearchPage';
import { SavedPage } from './pages/SavedPage';
import { AboutPage } from './pages/AboutPage';
import { AffiliateDisclosurePage } from './pages/AffiliateDisclosurePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout, AdminTab } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminBrandingPage } from './pages/admin/AdminBrandingPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { isAuthenticated, adminCheckSession } from './lib/api';
import { useSiteSettings } from './lib/settingsStore';
import { getTheme } from './lib/themes';

export default function App() {
  const { settings } = useSiteSettings();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Reactive authentication state for instantaneous login
  const [isAdminAuthed, setIsAdminAuthed] = useState<boolean>(() => isAuthenticated());

  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Synchronize browser history
  const navigate = (path: string, replace = false) => {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync internal state when path changes
  useEffect(() => {
    if (currentPath === '/admin/products/new') {
      setIsAddingProduct(true);
      setEditingProductId(null);
      setAdminTab('products');
    } else if (currentPath.startsWith('/admin/products/edit/')) {
      const id = currentPath.replace('/admin/products/edit/', '');
      setEditingProductId(id);
      setIsAddingProduct(false);
      setAdminTab('products');
    } else if (currentPath === '/admin/products') {
      setIsAddingProduct(false);
      setEditingProductId(null);
      setAdminTab('products');
    } else if (currentPath === '/admin/categories') {
      setAdminTab('categories');
    } else if (currentPath === '/admin/branding') {
      setAdminTab('branding');
    } else if (currentPath === '/admin/analytics') {
      setAdminTab('analytics');
    } else if (currentPath === '/admin/audit') {
      setAdminTab('audit');
    } else if (currentPath === '/admin') {
      setAdminTab('dashboard');
    }

    // Verify background session validity quietly
    if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
      adminCheckSession().then((isValid: boolean) => {
        setIsAdminAuthed(isValid);
      });
    }
  }, [currentPath]);

  // Helper for admin navigation
  const handleSelectAdminTab = (tab: AdminTab) => {
    setAdminTab(tab);
    setIsAddingProduct(false);
    setEditingProductId(null);
    if (tab === 'dashboard') navigate('/admin');
    else if (tab === 'products') navigate('/admin/products');
    else if (tab === 'categories') navigate('/admin/categories');
    else if (tab === 'branding') navigate('/admin/branding');
    else if (tab === 'analytics') navigate('/admin/analytics');
    else if (tab === 'audit') navigate('/admin/audit');
  };

  // Helper for product actions in admin
  const handleStartAddProduct = () => {
    setIsAddingProduct(true);
    setEditingProductId(null);
    navigate('/admin/products/new');
  };

  const handleStartEditProduct = (id: string) => {
    setEditingProductId(id);
    setIsAddingProduct(false);
    navigate(`/admin/products/edit/${id}`);
  };

  const handleProductSaved = () => {
    setIsAddingProduct(false);
    setEditingProductId(null);
    navigate('/admin/products');
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthed(true);
    navigate('/admin');
  };

  const handleLogout = () => {
    setIsAdminAuthed(false);
    navigate('/');
  };

  // Active theme calculation
  const publicTheme = getTheme(settings.apply_to_public ? settings.public_theme : 'titanium');

  // Render Router
  const renderContent = () => {
    // 1. Admin login route
    if (currentPath === '/admin/login') {
      if (isAdminAuthed) {
        navigate('/admin', true);
        return null;
      }
      return (
        <AdminLoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToSite={() => navigate('/')}
        />
      );
    }

    // 2. Protected admin routes
    if (currentPath.startsWith('/admin')) {
      if (!isAdminAuthed) {
        return (
          <AdminLoginPage
            onLoginSuccess={handleLoginSuccess}
            onBackToSite={() => navigate('/')}
          />
        );
      }

      // Check sub-views
      return (
        <AdminLayout
          currentTab={adminTab}
          onSelectTab={handleSelectAdminTab}
          onNavigatePublic={(p) => navigate(p || '/')}
          onAddNewProduct={handleStartAddProduct}
          onLogout={handleLogout}
        >
          {isAddingProduct || editingProductId ? (
            <AdminProductFormPage
              productId={editingProductId}
              onBack={() => {
                setIsAddingProduct(false);
                setEditingProductId(null);
                navigate('/admin/products');
              }}
              onSaved={handleProductSaved}
            />
          ) : adminTab === 'products' ? (
            <AdminProductsPage
              onAddNewProduct={handleStartAddProduct}
              onEditProduct={handleStartEditProduct}
              onPreviewProduct={(slug) => navigate(`/product/${slug}`)}
            />
          ) : adminTab === 'categories' ? (
            <AdminCategoriesPage />
          ) : adminTab === 'branding' ? (
            <AdminBrandingPage />
          ) : adminTab === 'analytics' ? (
            <AdminAnalyticsPage />
          ) : adminTab === 'audit' ? (
            <AdminAuditLogsPage />
          ) : (
            <AdminDashboardPage
              onNavigateTab={handleSelectAdminTab}
              onAddNewProduct={handleStartAddProduct}
              onEditProduct={handleStartEditProduct}
            />
          )}
        </AdminLayout>
      );
    }

    // 3. Public Routes
    if (currentPath === '/' || currentPath === '') {
      return (
        <HomePage
          initialQuery={searchFilter}
          onViewProduct={(slug) => navigate(`/product/${slug}`)}
        />
      );
    }

    if (currentPath === '/categories') {
      return (
        <CategoriesPage
          onSelectCategory={(categoryId) => {
            navigate('/');
          }}
          onViewProduct={(slug) => navigate(`/product/${slug}`)}
        />
      );
    }

    if (currentPath === '/search') {
      return (
        <SearchPage
          initialQuery={searchFilter}
          onViewProduct={(slug) => navigate(`/product/${slug}`)}
        />
      );
    }

    if (currentPath === '/saved') {
      return (
        <SavedPage
          onViewProduct={(slug) => navigate(`/product/${slug}`)}
          onNavigateHome={() => navigate('/')}
        />
      );
    }

    if (currentPath.startsWith('/product/')) {
      const slug = currentPath.replace('/product/', '').split('?')[0];
      return (
        <ProductDetailPage
          slug={slug}
          onBack={() => navigate('/')}
          onNavigateProduct={(newSlug) => navigate(`/product/${newSlug}`)}
        />
      );
    }

    if (currentPath === '/about') {
      return <AboutPage onBack={() => navigate('/')} />;
    }

    if (currentPath === '/affiliate-disclosure') {
      return <AffiliateDisclosurePage onBack={() => navigate('/')} />;
    }

    if (currentPath === '/privacy') {
      return <PrivacyPage onBack={() => navigate('/')} />;
    }

    // 4. 404 Route
    return (
      <NotFoundPage
        onBack={() => navigate('/')}
        onSearch={(q) => {
          setSearchFilter(q);
          navigate('/');
        }}
      />
    );
  };

  const isAdminView = currentPath.startsWith('/admin');

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isAdminView
          ? 'bg-[#0B0D14]'
          : settings.apply_to_public
          ? publicTheme.classes.bgApp
          : 'bg-white text-zinc-900'
      } selection:bg-violet-600 selection:text-white transition-colors duration-300`}
    >
      {/* Announcement Banner if configured */}
      {!isAdminView && settings.announcement && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold py-2 px-4 text-center">
          {settings.announcement}
        </div>
      )}

      {/* Show public navbar on non-admin views with 5-tap secret trigger */}
      {!isAdminView && (
        <Navbar
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
          onSecretAdminTrigger={() => navigate('/admin/login')}
        />
      )}

      {/* Main Page Content */}
      <main className="flex-1 pb-16 md:pb-0">
        {renderContent()}
      </main>

      {/* Show public footer on non-admin views */}
      {!isAdminView && (
        <Footer onNavigate={(path) => navigate(path)} />
      )}

      {/* Show mobile bottom navigation bar on public pages */}
      {!isAdminView && !currentPath.startsWith('/product/') && (
        <BottomTabBar
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
        />
      )}
    </div>
  );
}
