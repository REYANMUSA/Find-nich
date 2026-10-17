import type { VercelRequest, VercelResponse } from '../../src/server/supabaseRest';
import { supabaseAdminReady, supabaseAdminRest } from '../../src/server/supabaseRest';
import { requireAdmin } from '../../src/server/adminApi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: { message: 'Method not allowed.' } }); }
  if (!requireAdmin(req, res)) return;
  if (!supabaseAdminReady()) return res.status(503).json({ error: { message: 'Admin database access is not configured.' } });
  const r = await supabaseAdminRest('audit_logs?select=*&order=timestamp.desc&limit=100');
  if (!r.ok) return res.status(502).json({ error: { message: 'Could not load audit logs.' } });
  return res.status(200).json({ logs: await r.json() });
}
