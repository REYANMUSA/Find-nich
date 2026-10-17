import type { VercelRequest, VercelResponse } from '../../../src/server/supabaseRest';
import { supabaseAdminReady, supabaseAdminRest } from '../../../src/server/supabaseRest';
import { isObject, methodNotAllowed, requireAdmin, slugify, writeAudit } from '../../../src/server/adminApi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return;
  if (!supabaseAdminReady()) return res.status(503).json({ error: { message: 'Admin database access is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the Vercel project environment.' } });

  if (req.method === 'GET') {
    try {
      const r = await supabaseAdminRest('products?select=*&deleted_at=is.null&order=created_at.desc&limit=1000');
      if (!r.ok) return res.status(502).json({ error: { message: 'Could not load admin products.' } });
      return res.status(200).json({ products: await r.json() });
    } catch {
      return res.status(503).json({ error: { message: 'Admin database is unavailable.' } });
    }
  }
  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);
  if (!isObject(req.body)) return res.status(400).json({ error: { message: 'Invalid product data.' } });

  const body = req.body;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const categoryId = typeof body.category_id === 'string' ? body.category_id : '';
  if (!name || !categoryId) return res.status(400).json({ error: { message: 'Product name and category are required.' } });
  if (body.affiliate_url && !/^https:\/\/(www\.)?amazon\.[a-z.]+\//i.test(String(body.affiliate_url))) {
    return res.status(400).json({ error: { message: 'Use a valid HTTPS Amazon product/affiliate URL.' } });
  }

  try {
    const [seqRes, productsRes] = await Promise.all([
      supabaseAdminRest('sequences?select=current_val&name=eq.product_number&limit=1'),
      supabaseAdminRest('products?select=product_number&order=product_number.desc&limit=1'),
    ]);
    if (!seqRes.ok || !productsRes.ok) return res.status(502).json({ error: { message: 'Could not allocate a product number.' } });
    const seqRows = await seqRes.json();
    const productRows = await productsRes.json();
    const nextNumber = Math.max(Number(seqRows?.[0]?.current_val || 0), Number(productRows?.[0]?.product_number || 0)) + 1;
    if (seqRows?.[0]) {
      const bump = await supabaseAdminRest('sequences?name=eq.product_number', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ current_val: nextNumber }) });
      if (!bump.ok) return res.status(502).json({ error: { message: 'Could not allocate a product number.' } });
    }

    const id = crypto.randomUUID();
    const slug = slugify(name);
    const payload = {
      id, product_number: nextNumber, slug, name,
      short_description: String(body.short_description || ''),
      description: String(body.description || ''),
      key_points: Array.isArray(body.key_points) ? body.key_points : [],
      useful_for: Array.isArray(body.useful_for) ? body.useful_for : [],
      considerations: String(body.considerations || ''),
      category_id: categoryId, image_path: String(body.image_path || ''),
      affiliate_url: String(body.affiliate_url || ''), marketplace_code: String(body.marketplace_code || 'US'),
      status: ['draft', 'published', 'hidden', 'archived'].includes(body.status) ? body.status : 'draft',
      published_at: body.status === 'published' ? new Date().toISOString() : null,
    };
    const r = await supabaseAdminRest('products', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(payload) });
    if (!r.ok) return res.status(502).json({ error: { message: 'Could not save the product. Check the category and product fields.' } });
    const rows = await r.json();
    const product = rows?.[0];
    await writeAudit('product_created', `Created product #${nextNumber}: ${name}`, id);
    return res.status(201).json({ product });
  } catch {
    return res.status(503).json({ error: { message: 'Admin database is unavailable.' } });
  }
}
