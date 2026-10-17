import type { VercelRequest, VercelResponse } from '../../../src/server/supabaseRest';
import { supabaseAdminReady, supabaseAdminRest } from '../../../src/server/supabaseRest';
import { isObject, methodNotAllowed, requireAdmin, slugify, writeAudit } from '../../../src/server/adminApi';

const editable = ['name','short_description','description','key_points','useful_for','considerations','category_id','image_path','affiliate_url','marketplace_code','status'] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return;
  if (!supabaseAdminReady()) return res.status(503).json({ error: { message: 'Admin database access is not configured. Add SUPABASE_SERVICE_ROLE_KEY to Vercel.' } });
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: { message: 'Product ID is required.' } });

  if (req.method === 'GET') {
    const r = await supabaseAdminRest(`products?select=*&id=eq.${encodeURIComponent(id)}&deleted_at=is.null&limit=1`);
    if (!r.ok) return res.status(502).json({ error: { message: 'Could not load product.' } });
    const rows = await r.json();
    if (!rows?.[0]) return res.status(404).json({ error: { message: 'Product not found.' } });
    return res.status(200).json({ product: rows[0] });
  }

  if (req.method === 'PATCH') {
    if (!isObject(req.body)) return res.status(400).json({ error: { message: 'Invalid product data.' } });
    const patch: Record<string, any> = {};
    for (const key of editable) if (req.body[key] !== undefined) patch[key] = req.body[key];
    if (typeof patch.name === 'string') {
      patch.name = patch.name.trim();
      if (!patch.name) return res.status(400).json({ error: { message: 'Product name cannot be empty.' } });
      patch.slug = slugify(patch.name);
    }
    if (patch.status === 'published') patch.published_at = new Date().toISOString();
    if (!Object.keys(patch).length) return res.status(400).json({ error: { message: 'No editable fields provided.' } });
    patch.updated_at = new Date().toISOString();
    const r = await supabaseAdminRest(`products?id=eq.${encodeURIComponent(id)}&deleted_at=is.null`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) });
    if (!r.ok) return res.status(502).json({ error: { message: 'Could not update product. The name or slug may already be in use.' } });
    const rows = await r.json();
    if (!rows?.[0]) return res.status(404).json({ error: { message: 'Product not found.' } });
    await writeAudit('product_updated', `Updated product: ${rows[0].name}`, id);
    return res.status(200).json({ product: rows[0] });
  }

  if (req.method === 'DELETE') {
    const r = await supabaseAdminRest(`products?id=eq.${encodeURIComponent(id)}&deleted_at=is.null`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ deleted_at: new Date().toISOString(), status: 'archived', updated_at: new Date().toISOString() }) });
    if (!r.ok) return res.status(502).json({ error: { message: 'Could not archive product.' } });
    const rows = await r.json();
    if (!rows?.[0]) return res.status(404).json({ error: { message: 'Product not found.' } });
    await writeAudit('product_archived', `Archived product: ${rows[0].name}`, id);
    return res.status(200).json({ success: true });
  }
  return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
}
