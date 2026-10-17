import type { VercelRequest, VercelResponse } from '../src/server/supabaseRest';
import { randomUUID } from 'node:crypto';
import { supabaseReady, supabaseRest } from '../src/server/supabaseRest';

const ALLOWED_SOURCES = new Set(['catalog_card', 'product_detail', 'related_products', 'direct']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed.' } });
  }

  if (!supabaseReady()) {
    return res.status(503).json({ error: { message: 'Catalog database is not configured.' } });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const productId = typeof body.product_id === 'string' ? body.product_id : '';
  if (!productId || productId.length > 100) {
    return res.status(400).json({ error: { message: 'Valid product ID required.' } });
  }

  const source = ALLOWED_SOURCES.has(body.source) ? body.source : 'catalog_card';

  try {
    // The anon role can only see published products through the RLS policy.
    const check = await supabaseRest(`products?select=id&id=eq.${encodeURIComponent(productId)}&status=eq.published&deleted_at=is.null&limit=1`);
    if (!check.ok) return res.status(502).json({ error: { message: 'Could not verify product.' } });
    const found = await check.json();
    if (!Array.isArray(found) || found.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product is not available for click tracking.' } });
    }

    const response = await supabaseRest('product_clicks', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        id: `click-${randomUUID()}`,
        product_id: productId,
        source,
        clicked_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      return res.status(502).json({ error: { message: 'Could not record click.' } });
    }
    return res.status(200).json({ success: true });
  } catch {
    return res.status(503).json({ error: { message: 'Catalog database is temporarily unavailable.' } });
  }
}
