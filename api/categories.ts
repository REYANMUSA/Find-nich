import type { VercelRequest, VercelResponse } from '../src/server/supabaseRest';
import { supabaseReady, supabaseRest } from '../src/server/supabaseRest';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!supabaseReady()) {
    return res.status(503).json({ error: { message: 'Catalog database is not configured.' } });
  }

  try {
    const response = await supabaseRest('categories?select=*&is_active=eq.true&order=display_order.asc,name.asc');
    if (!response.ok) {
      return res.status(502).json({ error: { message: 'Could not load categories.' } });
    }
    const categories = await response.json();
    return res.status(200).json({ categories });
  } catch {
    return res.status(503).json({ error: { message: 'Catalog database is temporarily unavailable.' } });
  }
}
