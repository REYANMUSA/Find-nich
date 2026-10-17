import type { VercelRequest, VercelResponse } from '../../src/server/supabaseRest';
import { clearAdminCookie } from '../../src/server/adminAuth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed.' } });
  }

  res.setHeader('Set-Cookie', clearAdminCookie());
  return res.status(200).json({ success: true });
}
