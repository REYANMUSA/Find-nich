import type { Product, Category, ProductClick, AuditLog, SiteSettings } from '../types/index.ts';

// Storage key for client-side cached categories for offline speed
const STORAGE_CATEGORIES_KEY = 'fn_cached_categories';
const STORAGE_SESSION_FLAG = 'fn_is_admin_authenticated';
const STORAGE_BEARER_FALLBACK = 'fn_admin_bearer_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(STORAGE_BEARER_FALLBACK) || sessionStorage.getItem(STORAGE_BEARER_FALLBACK);
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_BEARER_FALLBACK, token);
    localStorage.setItem(STORAGE_SESSION_FLAG, 'true');
    sessionStorage.setItem(STORAGE_BEARER_FALLBACK, token);
  } catch {
    // fallback
  }
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(STORAGE_BEARER_FALLBACK);
    localStorage.removeItem(STORAGE_SESSION_FLAG);
    sessionStorage.removeItem(STORAGE_BEARER_FALLBACK);
  } catch {
    // fallback
  }
}

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(STORAGE_SESSION_FLAG) === 'true' || Boolean(getAdminToken());
  } catch {
    return false;
  }
}

function getLocalCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

function saveLocalCategories(cats: Category[]) {
  try {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(cats));
  } catch (e) {
    console.error(e);
  }
}

// Public API
export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      saveLocalCategories(data.categories);
      return data.categories;
    }
  } catch {
    // Fallback to cached
  }
  return getLocalCategories().filter(c => c.is_active);
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export async function fetchProducts(params: {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`/api/products?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Could not load products from server.');
  }
  return await res.json();
}

// STRICT SECURITY: Non-published items will return 404 from server
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
    if (res.ok) {
      const data = await res.json();
      return data.product;
    }
  } catch {
    // Network error
  }
  return null;
}

// Track anonymous outbound click
export async function trackOutboundClick(
  productId: string,
  source: 'catalog_card' | 'product_detail' | 'related_products' | 'direct' = 'catalog_card'
): Promise<void> {
  try {
    await fetch('/api/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, source }),
    });
  } catch {
    // Non-blocking
  }
}

// Admin API
function getAuthHeaders() {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function adminCheckSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/session', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        localStorage.setItem(STORAGE_SESSION_FLAG, 'true');
        return true;
      }
    }
  } catch {
    // Error
  }
  clearAdminToken();
  return false;
}

export async function adminLogin(passcode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ passcode }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.token) {
        setAdminToken(data.token);
      } else {
        localStorage.setItem(STORAGE_SESSION_FLAG, 'true');
      }
      return { success: true };
    }
    return { success: false, error: data.error?.message || 'Authentication failed.' };
  } catch {
    return { success: false, error: 'Could not connect to authentication server.' };
  }
}

export async function adminLogout(): Promise<void> {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } finally {
    clearAdminToken();
  }
}

export async function adminFetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/admin/products', {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (res.ok) {
    const data = await res.json();
    return data.products;
  }
  if (res.status === 401) {
    clearAdminToken();
    throw new Error('Your session has expired. Please sign in again.');
  }
  throw new Error('Failed to load admin products.');
}

export async function adminFetchProductById(id: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (res.ok) {
    const data = await res.json();
    return data.product;
  }
  throw new Error('Failed to load product details.');
}

export async function adminFetchProductBySlug(slug: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/by-slug/${encodeURIComponent(slug)}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (res.ok) {
    const data = await res.json();
    return data.product;
  }
  throw new Error('Product preview not found.');
}

export async function adminCreateProduct(payload: Partial<Product>): Promise<Product> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok && data.product) {
    return data.product;
  }
  throw new Error(data.error?.message || 'Failed to create product.');
}

export async function adminUpdateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok && data.product) {
    return data.product;
  }
  throw new Error(data.error?.message || 'Failed to update product.');
}

export async function adminPublishProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const data = await res.json();
  if (res.ok && data.product) {
    return data.product;
  }
  throw new Error(data.error?.message || 'Failed to publish product.');
}

export async function adminHideProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}/hide`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const data = await res.json();
  if (res.ok && data.product) {
    return data.product;
  }
  throw new Error(data.error?.message || 'Failed to hide product.');
}

export async function adminDeleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || 'Failed to delete product.');
  }
}

// Photo Upload: Phone and Desktop Friendly
export async function adminUploadPhoto(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch('/api/admin/uploads', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: formData,
  });

  const data = await res.json();
  if (res.ok && data.url) {
    return { url: data.url, filename: data.filename };
  }
  throw new Error(data.error?.message || 'Failed to upload photo. Ensure it is a valid JPEG, PNG, or WEBP under 5MB.');
}

export async function adminFetchCategories(): Promise<(Category & { product_count?: number })[]> {
  const res = await fetch('/api/admin/categories', {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (res.ok) {
    const data = await res.json();
    return data.categories;
  }
  throw new Error('Failed to load categories.');
}

export async function adminCreateCategory(name: string, display_order?: number): Promise<Category> {
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify({ name, display_order }),
  });
  const data = await res.json();
  if (res.ok && data.category) {
    return data.category;
  }
  throw new Error(data.error?.message || 'Failed to create category.');
}

export async function adminUpdateCategory(id: string, payload: Partial<Category>): Promise<Category> {
  const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok && data.category) {
    return data.category;
  }
  throw new Error(data.error?.message || 'Failed to update category.');
}

export async function adminFetchAnalytics(): Promise<any> {
  const res = await fetch('/api/admin/analytics', {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (res.ok) {
    return await res.json();
  }
  throw new Error('Failed to load analytics.');
}

export async function adminFetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch('/api/admin/audit-logs', {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (res.ok) {
    const data = await res.json();
    return data.logs;
  }
  throw new Error('Failed to load audit logs.');
}

// Site Settings & Branding
export async function fetchSiteSettings(): Promise<SiteSettings> {
  const res = await fetch('/api/settings');
  if (res.ok) {
    const data = await res.json();
    return data.settings;
  }
  throw new Error('Failed to load site settings.');
}

export async function adminUpdateSiteSettings(payload: Partial<SiteSettings>): Promise<SiteSettings> {
  const res = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok && data.settings) {
    return data.settings;
  }
  throw new Error(data.error?.message || 'Failed to update site settings.');
}

// Permanent hard delete
export async function adminHardDeleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}/permanent`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || 'Failed to permanently delete product.');
  }
}
