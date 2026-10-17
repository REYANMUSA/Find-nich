import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseReady, supabaseRest } from '../../src/server/supabaseRest';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!slug) return res.status(400).json({ error: { message: 'Product slug is required.' } });
  if (!supabaseReady()) {
    return res.status(503).json({ error: { message: 'Catalog database is not configured.' } });
  }

  try {
    const response = await supabaseRest(
      `products?select=*&slug=eq.${encodeURIComponent(slug)}&status=eq.published&deleted_at=is.null&limit=1`,
    );
    if (!response.ok) {
      return res.status(502).json({ error: { message: 'Could not load this product.' } });
    }
    const products = await response.json();
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    }
    return res.status(200).json({ product: products[0] });
  } catch {
    return res.status(503).json({ error: { message: 'Catalog database is temporarily unavailable.' } });
  }
}
