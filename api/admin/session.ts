import type { VercelRequest, VercelResponse } from '../../src/server/supabaseRest';
import { adminConfigured, getAdminToken, verifyAdminToken } from '../../src/server/adminAuth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { message: 'Method not allowed.' } });
  }

  if (!adminConfigured()) {
    return res.status(503).json({ authenticated: false, error: { message: 'Admin access is not configured.' } });
  }

  return res.status(200).json({ authenticated: verifyAdminToken(getAdminToken(req)) });
}
