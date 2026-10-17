import type { VercelRequest, VercelResponse } from '../../src/server/supabaseRest';
import { supabaseAdminReady, supabaseAdminRest } from '../../src/server/supabaseRest';
import { requireAdmin } from '../../src/server/adminApi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: { message: 'Method not allowed.' } }); }
  if (!requireAdmin(req, res)) return;
  if (!supabaseAdminReady()) return res.status(503).json({ error: { message: 'Admin database access is not configured.' } });
  const [productsRes, clicksRes, categoriesRes] = await Promise.all([
    supabaseAdminRest('products?select=id,status,view_count,click_count,created_at&deleted_at=is.null'),
    supabaseAdminRest('product_clicks?select=id,product_id,source,clicked_at&order=clicked_at.desc&limit=1000'),
    supabaseAdminRest('categories?select=id,is_active'),
  ]);
  if (!productsRes.ok || !clicksRes.ok || !categoriesRes.ok) return res.status(502).json({ error: { message: 'Could not load analytics.' } });
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
