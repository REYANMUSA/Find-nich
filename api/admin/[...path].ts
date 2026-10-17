import type { VercelRequest, VercelResponse } from '../../src/server/supabaseRest.js';
import { adminConfigured, adminCookie, clearAdminCookie, createAdminToken, getAdminToken, verifyAdminToken, verifyPasscode } from '../../src/server/adminAuth.js';
import { isObject, methodNotAllowed, requireAdmin, slugify, writeAudit } from '../../src/server/adminApi.js';
import { supabaseAdminReady, supabaseAdminRest } from '../../src/server/supabaseRest.js';

let loginAttempts = 0;
let loginWindowStartedAt = Date.now();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const editableProductFields = ['name','short_description','description','key_points','useful_for','considerations','category_id','image_path','affiliate_url','marketplace_code','status'] as const;

function fail(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: { message } });
}
function pathParts(req: VercelRequest): string[] {
  const value = req.query?.path;
  const queryParts = (Array.isArray(value) ? value : typeof value === 'string' ? value.split('/') : [])
    .map(String)
    .filter(Boolean);

  // Some deployment/request adapters may omit the catch-all query parameter.
  // Recover the route from the URL so /api/admin/login cannot fall through
  // into requireAdmin and return a misleading "Please sign in again" error.
  if (queryParts.length) return queryParts;

  const requestUrl = typeof req.url === 'string' ? req.url : '';
  let pathname = requestUrl.split('?')[0];
  // Vercel adapters may expose req.url as either a path or an absolute URL.
  // Normalize both forms before recovering the catch-all route.
  try {
    pathname = new URL(requestUrl, 'http://localhost').pathname;
  } catch {
    // Keep the best-effort path parsed above.
  }
  const adminPrefix = '/api/admin/';
  if (pathname.startsWith(adminPrefix)) {
    return pathname.slice(adminPrefix.length).split('/').filter(Boolean);
  }

  return [];
}
function needDatabase(res: VercelResponse): boolean {
  if (supabaseAdminReady()) return true;
  fail(res, 503, 'Admin database access is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the Vercel project environment.');
  return false;
}
async function rowsOrError(res: VercelResponse, r: Response, message: string) {
  if (!r.ok) return fail(res, 502, message);
  return r.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parts = pathParts(req);
  const route = parts.join('/');
  const method = req.method || 'GET';

  if (route === 'login') {
    if (method !== 'POST') return methodNotAllowed(res, ['POST']);
    if (!adminConfigured()) return fail(res, 503, 'Admin access is not configured on this deployment.');
    const now = Date.now();
    if (now - loginWindowStartedAt >= WINDOW_MS) { loginAttempts = 0; loginWindowStartedAt = now; }
    if (loginAttempts >= MAX_ATTEMPTS) return fail(res, 429, 'Too many attempts. Please wait 15 minutes before trying again.');
    loginAttempts += 1;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!verifyPasscode(body.passcode)) return fail(res, 401, 'Incorrect administrator passcode.');
    const token = createAdminToken();
    res.setHeader('Set-Cookie', adminCookie(token));
    return res.status(200).json({ success: true, token, role: 'owner' });
  }
  if (route === 'session') {
    if (method !== 'GET') return methodNotAllowed(res, ['GET']);
    if (!adminConfigured()) return res.status(503).json({ authenticated: false, error: { message: 'Admin access is not configured.' } });
    return res.status(200).json({ authenticated: verifyAdminToken(getAdminToken(req)) });
  }
  if (route === 'logout') {
    if (method !== 'POST') return methodNotAllowed(res, ['POST']);
    res.setHeader('Set-Cookie', clearAdminCookie());
    return res.status(200).json({ success: true });
  }

  if (!requireAdmin(req, res)) return;
  if (!needDatabase(res)) return;

  if (route === 'products' && method === 'GET') {
    try {
      const r = await supabaseAdminRest('products?select=*&deleted_at=is.null&order=created_at.desc&limit=1000');
      if (!r.ok) return fail(res, 502, 'Could not load admin products.');
      return res.status(200).json({ products: await r.json() });
    } catch { return fail(res, 503, 'Admin database is unavailable.'); }
  }
  if (route === 'products' && method === 'POST') {
    if (!isObject(req.body)) return fail(res, 400, 'Invalid product data.');
    const body = req.body;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const categoryId = typeof body.category_id === 'string' ? body.category_id : '';
    if (!name || !categoryId) return fail(res, 400, 'Product name and category are required.');
    if (body.affiliate_url && !/^https:\/\/(www\.)?amazon\.[a-z.]+\//i.test(String(body.affiliate_url))) return fail(res, 400, 'Use a valid HTTPS Amazon product/affiliate URL.');
    try {
      const [seqRes, productsRes] = await Promise.all([
        supabaseAdminRest('sequences?select=current_val&name=eq.product_number&limit=1'),
        supabaseAdminRest('products?select=product_number&order=product_number.desc&limit=1'),
      ]);
      if (!seqRes.ok || !productsRes.ok) return fail(res, 502, 'Could not allocate a product number.');
      const seqRows = await seqRes.json();
      const productRows = await productsRes.json();
      const nextNumber = Math.max(Number(seqRows?.[0]?.current_val || 0), Number(productRows?.[0]?.product_number || 0)) + 1;
      if (seqRows?.[0]) {
        const bump = await supabaseAdminRest('sequences?name=eq.product_number', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ current_val: nextNumber }) });
        if (!bump.ok) return fail(res, 502, 'Could not allocate a product number.');
      }
      const id = crypto.randomUUID();
      const payload = {
        id, product_number: nextNumber, slug: slugify(name), name,
        short_description: String(body.short_description || ''), description: String(body.description || ''),
        key_points: Array.isArray(body.key_points) ? body.key_points : [],
        useful_for: Array.isArray(body.useful_for) ? body.useful_for : [],
        considerations: String(body.considerations || ''), category_id: categoryId,
        image_path: String(body.image_path || ''), affiliate_url: String(body.affiliate_url || ''),
        marketplace_code: String(body.marketplace_code || 'US'),
        status: ['draft', 'published', 'hidden', 'archived'].includes(body.status) ? body.status : 'draft',
        published_at: body.status === 'published' ? new Date().toISOString() : null,
      };
      const r = await supabaseAdminRest('products', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(payload) });
      if (!r.ok) return fail(res, 502, 'Could not save the product. Check the category and product fields.');
      const resultRows = await r.json();
      await writeAudit('product_created', `Created product #${nextNumber}: ${name}`, id);
      return res.status(201).json({ product: resultRows?.[0] });
    } catch { return fail(res, 503, 'Admin database is unavailable.'); }
  }

  if (parts[0] === 'products' && parts[1] === 'by-slug' && parts[2] && method === 'GET') {
    const r = await supabaseAdminRest(`products?select=*&slug=eq.${encodeURIComponent(parts[2])}&deleted_at=is.null&limit=1`);
    if (!r.ok) return fail(res, 502, 'Could not load product preview.');
    const rows = await r.json();
    if (!rows?.[0]) return fail(res, 404, 'Product preview not found.');
    return res.status(200).json({ product: rows[0] });
  }

  if (parts[0] === 'products' && parts[1] && parts[1] !== 'by-slug') {
    const id = parts[1];
    const action = parts[2] || '';
    if (action === 'publish' || action === 'hide') {
      if (method !== 'POST') return methodNotAllowed(res, ['POST']);
      const status = action === 'publish' ? 'published' : 'hidden';
      const patch: Record<string, string> = { status, updated_at: new Date().toISOString() };
      if (status === 'published') patch.published_at = new Date().toISOString();
      const r = await supabaseAdminRest(`products?id=eq.${encodeURIComponent(id)}&deleted_at=is.null`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) });
      if (!r.ok) return fail(res, 502, `Could not ${action} product.`);
      const rows = await r.json();
      if (!rows?.[0]) return fail(res, 404, 'Product not found.');
      await writeAudit(action === 'publish' ? 'product_published' : 'product_hidden', `${action === 'publish' ? 'Published' : 'Hid'} product: ${rows[0].name}`, id);
      return res.status(200).json({ product: rows[0] });
    }
    if (action) return fail(res, 404, 'Admin endpoint not found.');
    if (method === 'GET') {
      const r = await supabaseAdminRest(`products?select=*&id=eq.${encodeURIComponent(id)}&deleted_at=is.null&limit=1`);
      if (!r.ok) return fail(res, 502, 'Could not load product.');
      const rows = await r.json();
      if (!rows?.[0]) return fail(res, 404, 'Product not found.');
      return res.status(200).json({ product: rows[0] });
    }
    if (method === 'PATCH') {
      if (!isObject(req.body)) return fail(res, 400, 'Invalid product data.');
      const patch: Record<string, any> = {};
      for (const key of editableProductFields) if (req.body[key] !== undefined) patch[key] = req.body[key];
      if (typeof patch.name === 'string') {
        patch.name = patch.name.trim();
        if (!patch.name) return fail(res, 400, 'Product name cannot be empty.');
        patch.slug = slugify(patch.name);
      }
      if (patch.status === 'published') patch.published_at = new Date().toISOString();
      if (!Object.keys(patch).length) return fail(res, 400, 'No editable fields provided.');
      patch.updated_at = new Date().toISOString();
      const r = await supabaseAdminRest(`products?id=eq.${encodeURIComponent(id)}&deleted_at=is.null`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) });
      if (!r.ok) return fail(res, 502, 'Could not update product. The name or slug may already be in use.');
      const rows = await r.json();
      if (!rows?.[0]) return fail(res, 404, 'Product not found.');
      await writeAudit('product_updated', `Updated product: ${rows[0].name}`, id);
      return res.status(200).json({ product: rows[0] });
    }
    if (method === 'DELETE') {
      const now = new Date().toISOString();
      const r = await supabaseAdminRest(`products?id=eq.${encodeURIComponent(id)}&deleted_at=is.null`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ deleted_at: now, status: 'archived', updated_at: now }) });
      if (!r.ok) return fail(res, 502, 'Could not archive product.');
      const rows = await r.json();
      if (!rows?.[0]) return fail(res, 404, 'Product not found.');
      await writeAudit('product_archived', `Archived product: ${rows[0].name}`, id);
      return res.status(200).json({ success: true });
    }
    return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
  }

  if (route === 'categories' && method === 'GET') {
    const [catRes, prodRes] = await Promise.all([
      supabaseAdminRest('categories?select=*&order=display_order.asc,name.asc'),
      supabaseAdminRest('products?select=category_id&deleted_at=is.null'),
    ]);
    if (!catRes.ok || !prodRes.ok) return fail(res, 502, 'Could not load categories.');
    const [categories, products] = await Promise.all([catRes.json(), prodRes.json()]);
    return res.status(200).json({ categories: categories.map((c: any) => ({ ...c, product_count: products.filter((p: any) => p.category_id === c.id).length })) });
  }
  if (route === 'categories' && method === 'POST') {
    if (!isObject(req.body) || typeof req.body.name !== 'string' || !req.body.name.trim()) return fail(res, 400, 'Category name is required.');
    const name = req.body.name.trim();
    const payload = { id: crypto.randomUUID(), name, slug: slugify(name), display_order: Number.isFinite(Number(req.body.display_order)) ? Number(req.body.display_order) : 0, is_active: true };
    const r = await supabaseAdminRest('categories', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(payload) });
    if (!r.ok) return fail(res, 409, 'Could not create category. The name may already exist.');
    const rows = await r.json();
    await writeAudit('category_created', `Created category: ${name}`, payload.id);
    return res.status(201).json({ category: rows[0] });
  }
  if (parts[0] === 'categories' && parts[1]) {
    if (method !== 'PATCH') return methodNotAllowed(res, ['PATCH']);
    const id = parts[1];
    if (!isObject(req.body)) return fail(res, 400, 'Invalid category data.');
    const patch: Record<string, any> = {};
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) return fail(res, 400, 'Category name cannot be empty.');
      patch.name = req.body.name.trim();
      patch.slug = slugify(patch.name);
    }
    if (req.body.display_order !== undefined && Number.isFinite(Number(req.body.display_order))) patch.display_order = Number(req.body.display_order);
    if (typeof req.body.is_active === 'boolean') patch.is_active = req.body.is_active;
    if (!Object.keys(patch).length) return fail(res, 400, 'No editable fields provided.');
    patch.updated_at = new Date().toISOString();
    const r = await supabaseAdminRest(`categories?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) });
    if (!r.ok) return fail(res, 409, 'Could not update category. The name may already exist.');
    const rows = await r.json();
    if (!rows?.[0]) return fail(res, 404, 'Category not found.');
    await writeAudit('category_updated', `Updated category: ${rows[0].name}`, id);
    return res.status(200).json({ category: rows[0] });
  }

  if (route === 'analytics' && method === 'GET') {
    const [productsRes, clicksRes, categoriesRes] = await Promise.all([
      supabaseAdminRest('products?select=id,status,view_count,click_count,created_at&deleted_at=is.null'),
      supabaseAdminRest('product_clicks?select=id,product_id,source,clicked_at&order=clicked_at.desc&limit=1000'),
      supabaseAdminRest('categories?select=id,is_active'),
    ]);
    if (!productsRes.ok || !clicksRes.ok || !categoriesRes.ok) return fail(res, 502, 'Could not load analytics.');
    const [products, clicks, categories] = await Promise.all([productsRes.json(), clicksRes.json(), categoriesRes.json()]);
    return res.status(200).json({
      total_products: products.length,
      published_products: products.filter((p: any) => p.status === 'published').length,
      draft_products: products.filter((p: any) => p.status === 'draft').length,
      hidden_products: products.filter((p: any) => p.status === 'hidden').length,
      total_clicks: clicks.length,
      total_views: products.reduce((sum: number, p: any) => sum + Number(p.view_count || 0), 0),
      active_categories: categories.filter((c: any) => c.is_active).length,
      top_products: products.sort((a: any, b: any) => Number(b.click_count || 0) - Number(a.click_count || 0)).slice(0, 10),
      recent_clicks: clicks.slice(0, 20),
    });
  }
  if (route === 'audit-logs' && method === 'GET') {
    const r = await supabaseAdminRest('audit_logs?select=*&order=timestamp.desc&limit=100');
    if (!r.ok) return fail(res, 502, 'Could not load audit logs.');
    return res.status(200).json({ logs: await r.json() });
  }
  return fail(res, 404, 'Admin endpoint not found.');
}
