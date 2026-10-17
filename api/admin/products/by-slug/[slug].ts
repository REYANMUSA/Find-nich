import type { VercelRequest, VercelResponse } from '../../../../src/server/supabaseRest';
import { supabaseAdminReady, supabaseAdminRest } from '../../../../src/server/supabaseRest';
import { requireAdmin } from '../../../../src/server/adminApi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: { message: 'Method not allowed.' } }); }
  if (!requireAdmin(req, res)) return;
  if (!supabaseAdminReady()) return res.status(503).json({ error: { message: 'Admin database access is not configured.' } });
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  const r = await supabaseAdminRest(`products?select=*&slug=eq.${encodeURIComponent(slug)}&deleted_at=is.null&limit=1`);
  if (!r.ok) return res.status(502).json({ error: { message: 'Could not load product preview.' } });
  const rows = await r.json();
  if (!rows?.[0]) return res.status(404).json({ error: { message: 'Product preview not found.' } });
  return res.status(200).json({ product: rows[0] });
}
