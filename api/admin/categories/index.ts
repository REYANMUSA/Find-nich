import type { VercelRequest, VercelResponse } from '../../../src/server/supabaseRest';
import { supabaseAdminReady, supabaseAdminRest } from '../../../src/server/supabaseRest';
import { isObject, methodNotAllowed, requireAdmin, slugify, writeAudit } from '../../../src/server/adminApi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return;
  if (!supabaseAdminReady()) return res.status(503).json({ error: { message: 'Admin database access is not configured.' } });

  if (req.method === 'GET') {
    const [catRes, prodRes] = await Promise.all([
      supabaseAdminRest('categories?select=*&order=display_order.asc,name.asc'),
      supabaseAdminRest('products?select=category_id&deleted_at=is.null'),
    ]);
    if (!catRes.ok || !prodRes.ok) return res.status(502).json({ error: { message: 'Could not load categories.' } });
    const [categories, products] = await Promise.all([catRes.json(), prodRes.json()]);
    return res.status(200).json({ categories: categories.map((c: any) => ({ ...c, product_count: products.filter((p: any) => p.category_id === c.id).length })) });
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);
  if (!isObject(req.body) || typeof req.body.name !== 'string' || !req.body.name.trim()) return res.status(400).json({ error: { message: 'Category name is required.' } });
  const name = req.body.name.trim();
  const payload = { id: crypto.randomUUID(), name, slug: slugify(name), display_order: Number.isFinite(Number(req.body.display_order)) ? Number(req.body.display_order) : 0, is_active: true };
  const r = await supabaseAdminRest('categories', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(payload) });
  if (!r.ok) return res.status(409).json({ error: { message: 'Could not create category. The name may already exist.' } });
  const rows = await r.json();
  await writeAudit('category_created', `Created category: ${name}`, payload.id);
  return res.status(201).json({ category: rows[0] });
}
