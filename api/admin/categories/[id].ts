import type { VercelRequest, VercelResponse } from '../../../src/server/supabaseRest';
import { supabaseAdminReady, supabaseAdminRest } from '../../../src/server/supabaseRest';
import { isObject, methodNotAllowed, requireAdmin, slugify, writeAudit } from '../../../src/server/adminApi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return methodNotAllowed(res, ['PATCH']);
  if (!requireAdmin(req, res)) return;
  if (!supabaseAdminReady()) return res.status(503).json({ error: { message: 'Admin database access is not configured.' } });
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id || !isObject(req.body)) return res.status(400).json({ error: { message: 'Invalid category data.' } });
  const patch: Record<string, any> = {};
  if (req.body.name !== undefined) {
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) return res.status(400).json({ error: { message: 'Category name cannot be empty.' } });
    patch.name = req.body.name.trim();
    patch.slug = slugify(patch.name);
  }
  if (req.body.display_order !== undefined && Number.isFinite(Number(req.body.display_order))) patch.display_order = Number(req.body.display_order);
  if (typeof req.body.is_active === 'boolean') patch.is_active = req.body.is_active;
  if (!Object.keys(patch).length) return res.status(400).json({ error: { message: 'No editable fields provided.' } });
  patch.updated_at = new Date().toISOString();
  const r = await supabaseAdminRest(`categories?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) });
  if (!r.ok) return res.status(409).json({ error: { message: 'Could not update category. The name may already exist.' } });
  const rows = await r.json();
  if (!rows?.[0]) return res.status(404).json({ error: { message: 'Category not found.' } });
  await writeAudit('category_updated', `Updated category: ${rows[0].name}`, id);
  return res.status(200).json({ category: rows[0] });
}
