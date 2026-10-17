import type { VercelRequest, VercelResponse } from '../../../../src/server/supabaseRest';
import { supabaseAdminReady, supabaseAdminRest } from '../../../../src/server/supabaseRest';
import { requireAdmin, writeAudit } from '../../../../src/server/adminApi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: { message: 'Method not allowed.' } }); }
  if (!requireAdmin(req, res)) return;
  if (!supabaseAdminReady()) return res.status(503).json({ error: { message: 'Admin database access is not configured.' } });
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  const r = await supabaseAdminRest(`products?id=eq.${encodeURIComponent(id)}&deleted_at=is.null`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: 'hidden', updated_at: new Date().toISOString() }) });
  if (!r.ok) return res.status(502).json({ error: { message: 'Could not hide product.' } });
  const rows = await r.json();
  if (!rows?.[0]) return res.status(404).json({ error: { message: 'Product not found.' } });
  await writeAudit('product_hidden', `Hid product: ${rows[0].name}`, id);
  return res.status(200).json({ product: rows[0] });
}
