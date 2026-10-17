import type { VercelRequest, VercelResponse } from '../../src/server/supabaseRest';
import { adminConfigured, adminCookie, createAdminToken, verifyPasscode } from '../../src/server/adminAuth';

let attempts = 0;
let windowStartedAt = Date.now();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed.' } });
  }

  if (!adminConfigured()) {
    return res.status(503).json({ error: { message: 'Admin access is not configured on this deployment.' } });
  }

  const now = Date.now();
  if (now - windowStartedAt >= WINDOW_MS) {
    attempts = 0;
    windowStartedAt = now;
  }
  if (attempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: { message: 'Too many attempts. Please wait 15 minutes before trying again.' } });
  }

  attempts += 1;
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (!verifyPasscode(body.passcode)) {
    return res.status(401).json({ error: { message: 'Incorrect administrator passcode.' } });
  }

  const token = createAdminToken();
  res.setHeader('Set-Cookie', adminCookie(token));
  return res.status(200).json({ success: true, token, role: 'owner' });
}
