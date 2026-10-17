import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, MARKETPLACES } from './src/data/initialData';
import { Product, Category, ProductClick, AuditLog, AmazonMarketplace } from './src/types/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  clicks: ProductClick[];
  audit_logs: AuditLog[];
  next_product_number: number;
}

// In-memory + persisted file DB
let db: DatabaseSchema = {
  products: [...INITIAL_PRODUCTS],
  categories: [...INITIAL_CATEGORIES],
  clicks: [],
  audit_logs: [
    {
      id: 'audit-init',
      action: 'system.init',
      details: 'Find Niche database initialized with default catalog.',
      timestamp: new Date().toISOString(),
    },
  ],
  next_product_number: 7,
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      db = {
        products: parsed.products || INITIAL_PRODUCTS,
        categories: parsed.categories || INITIAL_CATEGORIES,
        clicks: parsed.clicks || [],
        audit_logs: parsed.audit_logs || [],
        next_product_number: parsed.next_product_number || 7,
      };
      // Ensure sequence safety: next_product_number is at least max(product_number) + 1
      const maxNum = Math.max(0, ...db.products.map(p => p.product_number || 0));
      if (db.next_product_number <= maxNum) {
        db.next_product_number = maxNum + 1;
      }
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Failed to load db.json, using defaults:', err);
    saveDatabase();
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

loadDatabase();

// Security: Amazon Affiliate URL validation
const ALLOWED_AMAZON_DOMAINS = [
  'amazon.com',
  'www.amazon.com',
  'amzn.to',
  'amazon.co.uk',
  'www.amazon.co.uk',
  'amazon.ca',
  'www.amazon.ca',
  'amazon.de',
  'www.amazon.de',
  'amazon.fr',
  'www.amazon.fr',
  'amazon.es',
  'www.amazon.es',
  'amazon.it',
  'www.amazon.it',
  'amazon.co.jp',
  'www.amazon.co.jp',
  'amazon.com.au',
  'www.amazon.com.au',
];

export function validateAffiliateUrl(rawUrl: string): { valid: boolean; reason?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'Affiliate URL is required.' };
  }
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    return { valid: false, reason: 'URL must begin with http:// or https://' };
  }
  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const isAllowed = ALLOWED_AMAZON_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    if (!isAllowed) {
      return { 
        valid: false, 
        reason: `Destination domain "${hostname}" is not an authorized Amazon Associates domain. Must be Amazon or amzn.to.` 
      };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL structure.' };
  }
}

// Authentication token verification
const ADMIN_MASTER_TOKEN = process.env.ADMIN_TOKEN || 'findniche_admin_secure_token_2026';

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Administrator credentials required.' }
    });
  }
  const token = authHeader.substring(7).trim();
  if (token !== ADMIN_MASTER_TOKEN) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Invalid or expired administrative token.' }
    });
  }
  next();
}

function logAudit(action: string, details: string, target_id?: string) {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action,
    details,
    target_id,
    timestamp: new Date().toISOString(),
  };
  db.audit_logs.unshift(log);
  if (db.audit_logs.length > 200) {
    db.audit_logs = db.audit_logs.slice(0, 200);
  }
  saveDatabase();
}

// Setup Express
const app = express();
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Find Niche API',
    timestamp: new Date().toISOString(),
    product_count: db.products.filter(p => !p.deleted_at).length,
  });
});

// Admin authentication verification
app.post('/api/admin/login', (req, res) => {
  const { passcode } = req.body;
  const configuredPasscode = process.env.ADMIN_PASSCODE || 'findniche2026';
  
  if (passcode === configuredPasscode) {
    logAudit('admin.login_success', 'Administrator authenticated successfully.');
    return res.json({
      success: true,
      token: ADMIN_MASTER_TOKEN,
      role: 'owner',
    });
  }
  logAudit('admin.login_failed', 'Failed login attempt.');
  return res.status(401).json({
    error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect administrator passcode.' }
  });
});

// Public: Get Categories
app.get('/api/categories', (req, res) => {
  const activeCategories = db.categories
    .filter(c => c.is_active)
    .sort((a, b) => a.display_order - b.display_order);
  res.json({ categories: activeCategories });
});

// Public: Get Published Products with search, category & pagination
app.get('/api/products', (req, res) => {
  const {
    q,
    category,
    sort = 'latest',
    page = '1',
    limit = '12',
  } = req.query;

  let results = db.products.filter(p => p.status === 'published' && !p.deleted_at);

  // Category filter
  if (category && category !== 'all') {
    results = results.filter(p => p.category_id === category || p.category_id === `cat-${category}`);
  }

  // Search filter
  if (q && typeof q === 'string') {
    const rawQuery = q.trim();
    const queryLower = rawQuery.toLowerCase();
    
    // Check if searching by product number: e.g. "30", "#30", "#030", "030"
    const numberMatch = rawQuery.match(/^#?0*(\d+)$/);
    if (numberMatch) {
      const searchedNum = parseInt(numberMatch[1], 10);
      results = results.filter(p => 
        p.product_number === searchedNum ||
        p.name.toLowerCase().includes(queryLower) ||
        p.short_description.toLowerCase().includes(queryLower)
      );
    } else {
      results = results.filter(p =>
        p.name.toLowerCase().includes(queryLower) ||
        p.short_description.toLowerCase().includes(queryLower) ||
        p.description.toLowerCase().includes(queryLower)
      );
    }
  }

  // Sorting
  if (sort === 'num_asc') {
    results.sort((a, b) => a.product_number - b.product_number);
  } else if (sort === 'num_desc') {
    results.sort((a, b) => b.product_number - a.product_number);
  } else if (sort === 'clicks') {
    results.sort((a, b) => (b.click_count || 0) - (a.click_count || 0));
  } else {
    // Default: latest published first
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 12));
  const total = results.length;
  const paginated = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    products: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: pageNum * limitNum < total,
    },
  });
});

// Public: Get Single Product by Slug
app.get('/api/products/:slug', (req, res) => {
  const { slug } = req.params;
  const product = db.products.find(p => p.slug === slug && !p.deleted_at);

  if (!product) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Product not found.' }
    });
  }

  // Increment view count quietly
  product.view_count = (product.view_count || 0) + 1;
  saveDatabase();

  res.json({ product });
});

// Public: Track Safe Product Click
app.post('/api/clicks', (req, res) => {
  const { product_id, source = 'catalog_card' } = req.body;
  if (!product_id) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Product ID required.' } });
  }

  const product = db.products.find(p => p.id === product_id);
  if (product) {
    product.click_count = (product.click_count || 0) + 1;
    const clickRecord: ProductClick = {
      id: `click-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      product_name: product.name,
      product_number: product.product_number,
      clicked_at: new Date().toISOString(),
      source: source || 'catalog_card',
    };
    db.clicks.unshift(clickRecord);
    if (db.clicks.length > 500) {
      db.clicks = db.clicks.slice(0, 500);
    }
    saveDatabase();
  }

  res.json({ success: true });
});

// --- ADMIN ENDPOINTS (Protected) ---

// Admin: Get all products (including drafts, hidden, archived)
app.get('/api/admin/products', requireAdmin, (req, res) => {
  const allProducts = db.products
    .filter(p => !p.deleted_at)
    .sort((a, b) => b.product_number - a.product_number);
  res.json({ products: allProducts });
});

// Admin: Get single product by ID (even draft/hidden)
app.get('/api/admin/products/:id', requireAdmin, (req, res) => {
  const product = db.products.find(p => p.id === req.params.id && !p.deleted_at);
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }
  res.json({ product });
});

// Admin: Create Product
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const {
    name,
    category_id,
    short_description,
    description = '',
    key_points = [],
    useful_for = [],
    considerations = '',
    image_path = '',
    affiliate_url = '',
    marketplace_code = 'US',
    status = 'draft',
  } = req.body;

  if (!name || !category_id || !short_description) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Name, Category, and Short description are required.' }
    });
  }

  // If publishing immediately, require image & valid affiliate URL
  if (status === 'published') {
    if (!image_path) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Product photo is required before publishing.' }
      });
    }
    const urlCheck = validateAffiliateUrl(affiliate_url);
    if (!urlCheck.valid) {
      return res.status(400).json({
        error: { code: 'INVALID_AFFILIATE_URL', message: urlCheck.reason }
      });
    }
  }

  // Safe sequential permanent product number
  const assignedNumber = db.next_product_number;
  db.next_product_number += 1;

  // Base slug generator
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  if (!baseSlug) baseSlug = `product-${assignedNumber}`;

  let finalSlug = baseSlug;
  let counter = 1;
  while (db.products.some(p => p.slug === finalSlug && !p.deleted_at)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const now = new Date().toISOString();
  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    product_number: assignedNumber,
    slug: finalSlug,
    name: name.trim(),
    short_description: short_description.trim(),
    description: description.trim(),
    key_points: Array.isArray(key_points) ? key_points : [],
    useful_for: Array.isArray(useful_for) ? useful_for : [],
    considerations: considerations.trim(),
    category_id,
    image_path: image_path || '/src/assets/images/magsafe_power_bank_1791747842268.jpg',
    affiliate_url: affiliate_url.trim(),
    marketplace_code: marketplace_code as AmazonMarketplace,
    status: status as Product['status'],
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null,
    deleted_at: null,
    view_count: 0,
    click_count: 0,
  };

  db.products.push(newProduct);
  saveDatabase();
  logAudit('product.created', `Created product #${assignedNumber}: "${newProduct.name}" (${newProduct.status})`, newProduct.id);

  res.status(201).json({ product: newProduct });
});

// Admin: Update Product
app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const product = db.products.find(p => p.id === id && !p.deleted_at);

  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }

  const {
    name,
    category_id,
    short_description,
    description,
    key_points,
    useful_for,
    considerations,
    image_path,
    affiliate_url,
    marketplace_code,
    status,
  } = req.body;

  if (affiliate_url) {
    const urlCheck = validateAffiliateUrl(affiliate_url);
    if (!urlCheck.valid) {
      return res.status(400).json({
        error: { code: 'INVALID_AFFILIATE_URL', message: urlCheck.reason }
      });
    }
    product.affiliate_url = affiliate_url.trim();
  }

  if (name) product.name = name.trim();
  if (category_id) product.category_id = category_id;
  if (short_description) product.short_description = short_description.trim();
  if (description !== undefined) product.description = description.trim();
  if (key_points !== undefined) product.key_points = key_points;
  if (useful_for !== undefined) product.useful_for = useful_for;
  if (considerations !== undefined) product.considerations = considerations.trim();
  if (image_path) product.image_path = image_path;
  if (marketplace_code) product.marketplace_code = marketplace_code;
  
  if (status && status !== product.status) {
    product.status = status;
    if (status === 'published' && !product.published_at) {
      product.published_at = new Date().toISOString();
    }
  }

  product.updated_at = new Date().toISOString();
  saveDatabase();
  logAudit('product.updated', `Updated product #${product.product_number}: "${product.name}"`, product.id);

  res.json({ product });
});

// Admin: Publish Product
app.post('/api/admin/products/:id/publish', requireAdmin, (req, res) => {
  const product = db.products.find(p => p.id === req.params.id && !p.deleted_at);
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }

  if (!product.image_path) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'A product photo is required to publish.' }
    });
  }

  const urlCheck = validateAffiliateUrl(product.affiliate_url);
  if (!urlCheck.valid) {
    return res.status(400).json({
      error: { code: 'INVALID_AFFILIATE_URL', message: urlCheck.reason }
    });
  }

  product.status = 'published';
  product.published_at = new Date().toISOString();
  product.updated_at = new Date().toISOString();
  saveDatabase();
  logAudit('product.published', `Published product #${product.product_number}: "${product.name}"`, product.id);

  res.json({ product });
});

// Admin: Hide Product
app.post('/api/admin/products/:id/hide', requireAdmin, (req, res) => {
  const product = db.products.find(p => p.id === req.params.id && !p.deleted_at);
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }

  product.status = 'hidden';
  product.updated_at = new Date().toISOString();
  saveDatabase();
  logAudit('product.hidden', `Hid product #${product.product_number}: "${product.name}"`, product.id);

  res.json({ product });
});

// Admin: Soft Delete Product (never resets permanent sequence)
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const product = db.products.find(p => p.id === req.params.id && !p.deleted_at);
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }

  product.deleted_at = new Date().toISOString();
  product.status = 'archived';
  saveDatabase();
  logAudit('product.deleted', `Soft-deleted product #${product.product_number}: "${product.name}"`, product.id);

  res.json({ success: true, message: `Product #${product.product_number} deleted.` });
});

// Admin: Category Management
app.get('/api/admin/categories', requireAdmin, (req, res) => {
  const categoriesWithCounts = db.categories.map(c => {
    const productCount = db.products.filter(p => !p.deleted_at && p.category_id === c.id).length;
    return { ...c, product_count: productCount };
  });
  res.json({ categories: categoriesWithCounts });
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, display_order } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Category name is required.' } });
  }

  const trimmed = name.trim();
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (db.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'A category with this name already exists.' } });
  }

  const newCat: Category = {
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: trimmed,
    slug,
    display_order: display_order || db.categories.length + 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.categories.push(newCat);
  saveDatabase();
  logAudit('category.created', `Created category "${newCat.name}"`, newCat.id);

  res.status(201).json({ category: newCat });
});

app.patch('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } });
  }

  const { name, is_active, display_order } = req.body;
  if (name) {
    cat.name = name.trim();
    cat.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (is_active !== undefined) cat.is_active = Boolean(is_active);
  if (display_order !== undefined) cat.display_order = Number(display_order);

  cat.updated_at = new Date().toISOString();
  saveDatabase();
  logAudit('category.updated', `Updated category "${cat.name}"`, cat.id);

  res.json({ category: cat });
});

// Admin: Analytics Summary
app.get('/api/admin/analytics', requireAdmin, (req, res) => {
  const activeProducts = db.products.filter(p => !p.deleted_at);
  const publishedCount = activeProducts.filter(p => p.status === 'published').length;
  const draftCount = activeProducts.filter(p => p.status === 'draft').length;
  const hiddenCount = activeProducts.filter(p => p.status === 'hidden').length;

  const totalClicks = db.clicks.length;
  const clicksByProduct = activeProducts
    .map(p => ({
      id: p.id,
      number: p.product_number,
      name: p.name,
      clicks: p.click_count || 0,
      views: p.view_count || 0,
      affiliate_url: p.affiliate_url,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  // Click sources breakdown
  const sourcesMap: Record<string, number> = {};
  db.clicks.forEach(c => {
    sourcesMap[c.source] = (sourcesMap[c.source] || 0) + 1;
  });

  res.json({
    summary: {
      total_products: activeProducts.length,
      published_products: publishedCount,
      draft_products: draftCount,
      hidden_products: hiddenCount,
      total_categories: db.categories.length,
      total_clicks: totalClicks,
    },
    top_products: clicksByProduct,
    sources: sourcesMap,
    recent_clicks: db.clicks.slice(0, 30),
  });
});

// Admin: Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  res.json({ logs: db.audit_logs });
});

// Admin: Export Catalog Data
app.get('/api/admin/export', requireAdmin, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=find-niche-catalog-export.json');
  res.json({
    exported_at: new Date().toISOString(),
    store: 'Find Niche',
    catalog: {
      products: db.products.filter(p => !p.deleted_at),
      categories: db.categories,
      next_product_number: db.next_product_number,
    },
  });
});

// Mount Vite in dev mode or serve static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Find Niche server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
