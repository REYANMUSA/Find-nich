import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseReady, supabaseRest } from '../src/server/supabaseRest';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!supabaseReady()) {
    return res.status(503).json({ status: 'error', service: 'Find Niche API', database: 'not_configured' });
  }

  try {
    const response = await supabaseRest('categories?select=id&limit=1');
    if (!response.ok) {
      return res.status(503).json({ status: 'error', service: 'Find Niche API', database: 'unavailable' });
    }
    return res.status(200).json({
      status: 'ok',
      service: 'Find Niche API',
      database: 'connected',
      timestamp: new Date().toISOString(),
      admin_configured: false,
    });
  } catch {
    return res.status(503).json({ status: 'error', service: 'Find Niche API', database: 'unavailable' });
  }
}
