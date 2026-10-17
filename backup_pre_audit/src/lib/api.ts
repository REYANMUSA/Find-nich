import { Product, Category, ProductClick, AuditLog, AmazonMarketplace } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/initialData';

// Local storage keys for resilient client-side caching & fallback
const STORAGE_PRODUCTS_KEY = 'fn_cached_products';
const STORAGE_CATEGORIES_KEY = 'fn_cached_categories';
const STORAGE_CLICKS_KEY = 'fn_cached_clicks';
const STORAGE_TOKEN_KEY = 'fn_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAdminToken();
}

// Fallback local storage helpers
function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_PRODUCTS;
}

function saveLocalProducts(products: Product[]) {
  try {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error(e);
  }
}

function getLocalCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_CATEGORIES;
}

// Public API
export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      return data.categories;
    }
  } catch {
    // Fallback
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

  try {
    const res = await fetch(`/api/products?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      // Cache latest products in local storage
      if (params.page === 1 && !params.q && (!params.category || params.category === 'all')) {
        saveLocalProducts(data.products);
      }
      return data;
    }
  } catch {
    // Fallback to local
  }

  // Client-side fallback computation
  let list = getLocalProducts().filter(p => p.status === 'published' && !p.deleted_at);

  if (params.category && params.category !== 'all') {
    list = list.filter(p => p.category_id === params.category || p.category_id === `cat-${params.category}`);
  }

  if (params.q) {
    const rawQ = params.q.trim().toLowerCase();
    const numMatch = rawQ.match(/^#?0*(\d+)$/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      list = list.filter(p => p.product_number === n || p.name.toLowerCase().includes(rawQ));
    } else {
      list = list.filter(p =>
        p.name.toLowerCase().includes(rawQ) ||
        p.short_description.toLowerCase().includes(rawQ)
      );
    }
  }

  const page = params.page || 1;
  const limit = params.limit || 12;
  const total = list.length;
  const paginated = list.slice((page - 1) * limit, page * limit);

  return {
    products: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${slug}`);
    if (res.ok) {
      const data = await res.json();
      return data.product;
    }
  } catch {
    // Fallback
  }
  const match = getLocalProducts().find(p => p.slug === slug && !p.deleted_at);
  return match || null;
}

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
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function adminLogin(passcode: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setAdminToken(data.token);
      return { success: true, token: data.token };
    }
    return { success: false, error: data.error?.message || 'Login failed.' };
  } catch {
    // Fallback support for local testing if network unreachable
    if (passcode === 'findniche2026') {
      const token = 'findniche_admin_secure_token_2026';
      setAdminToken(token);
      return { success: true, token };
    }
    return { success: false, error: 'Could not connect to server.' };
  }
}

export async function adminFetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/admin/products', { headers: getAuthHeaders() });
  if (res.ok) {
    const data = await res.json();
    return data.products;
  }
  throw new Error('Failed to load admin products');
}

export async function adminFetchProductById(id: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/${id}`, { headers: getAuthHeaders() });
  if (res.ok) {
    const data = await res.json();
    return data.product;
  }
  throw new Error('Failed to load product');
}

export async function adminCreateProduct(payload: Partial<Product>): Promise<Product> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok && data.product) {
    return data.product;
  }
  throw new Error(data.error?.message || 'Failed to create product');
}

export async function adminUpdateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok && data.product) {
    return data.product;
  }
  throw new Error(data.error?.message || 'Failed to update product');
}

export async function adminPublishProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/${id}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (res.ok && data.product) {
    return data.product;
  }
  throw new Error(data.error?.message || 'Failed to publish product');
}

export async function adminHideProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/${id}/hide`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (res.ok && data.product) {
    return data.product;
  }
  throw new Error(data.error?.message || 'Failed to hide product');
}

export async function adminDeleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || 'Failed to delete product');
  }
}

export async function adminFetchCategories(): Promise<(Category & { product_count?: number })[]> {
  const res = await fetch('/api/admin/categories', { headers: getAuthHeaders() });
  if (res.ok) {
    const data = await res.json();
    return data.categories;
  }
  throw new Error('Failed to load categories');
}

export async function adminCreateCategory(name: string, display_order?: number): Promise<Category> {
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, display_order }),
  });
  const data = await res.json();
  if (res.ok && data.category) {
    return data.category;
  }
  throw new Error(data.error?.message || 'Failed to create category');
}

export async function adminUpdateCategory(id: string, payload: Partial<Category>): Promise<Category> {
  const res = await fetch(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok && data.category) {
    return data.category;
  }
  throw new Error(data.error?.message || 'Failed to update category');
}

export async function adminFetchAnalytics(): Promise<any> {
  const res = await fetch('/api/admin/analytics', { headers: getAuthHeaders() });
  if (res.ok) {
    return await res.json();
  }
  throw new Error('Failed to load analytics');
}

export async function adminFetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch('/api/admin/audit-logs', { headers: getAuthHeaders() });
  if (res.ok) {
    const data = await res.json();
    return data.logs;
  }
  throw new Error('Failed to load audit logs');
}
