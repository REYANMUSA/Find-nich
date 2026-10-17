import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseReady, supabaseRest } from '../../src/server/supabaseRest';

type Row = Record<string, any>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabaseReady()) {
    return res.status(503).json({ error: { message: 'Catalog database is not configured.' } });
  }

  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      supabaseRest('products?select=*&status=eq.published&deleted_at=is.null&order=created_at.desc&limit=1000'),
      supabaseRest('categories?select=id,slug,name,is_active&is_active=eq.true&order=display_order.asc'),
    ]);

    if (!productsResponse.ok || !categoriesResponse.ok) {
      return res.status(502).json({ error: { message: 'Could not load the product catalog.' } });
    }

    const products: Row[] = await productsResponse.json();
    const categories: Row[] = await categoriesResponse.json();
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'latest';
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.max(1, Math.min(50, Number.parseInt(String(req.query.limit || '12'), 10) || 12));

    let filtered = products;
    if (category && category !== 'all') {
      const matchedCategory = categories.find((item) => item.id === category || item.slug === category);
      filtered = matchedCategory ? filtered.filter((item) => item.category_id === matchedCategory.id) : [];
    }

    if (q) {
      const numberMatch = q.match(/^#?0*(\d+)$/);
      filtered = filtered.filter((item) => {
        const searchable = [item.name, item.short_description, item.description]
          .filter(Boolean).join(' ').toLowerCase();
        return (numberMatch && Number(item.product_number) === Number(numberMatch[1])) || searchable.includes(q);
      });
    }

    if (sort === 'num_asc') filtered.sort((a, b) => a.product_number - b.product_number);
    else if (sort === 'num_desc') filtered.sort((a, b) => b.product_number - a.product_number);
    else if (sort === 'clicks') filtered.sort((a, b) => b.click_count - a.click_count || String(b.created_at).localeCompare(String(a.created_at)));
    else filtered.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    const total = filtered.length;
    const start = (page - 1) * limit;
    const pageProducts = filtered.slice(start, start + limit);

    return res.status(200).json({
      products: pageProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: start + pageProducts.length < total,
      },
    });
  } catch {
    return res.status(503).json({ error: { message: 'Catalog database is temporarily unavailable.' } });
  }
}
