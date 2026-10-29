import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dbService } from './src/server/db.ts';
import { validateProductPayload, validateAffiliateUrl } from './src/server/validation.ts';
import { uploadMiddleware, saveUploadedImage, deleteUploadedImage } from './src/server/upload.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE;
const SESSION_COOKIE_NAME = 'fn_admin_session';

// Setup Express application
const app = express();

// Trust proxy for secure cookies on hosting platforms (Cloud Run, Render, Vercel, etc.)
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Static file serving for uploads and product images
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
app.use('/uploads', express.static(path.join(PUBLIC_DIR, 'uploads'), {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));
app.use('/images', express.static(path.join(PUBLIC_DIR, 'images'), {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));
app.use(express.static(PUBLIC_DIR));

// Rate Limiting Store for Login and Clicks (in-memory sliding window)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const loginRateLimits = new Map<string, RateLimitBucket>();
const clickRateLimits = new Map<string, RateLimitBucket>();

function checkRateLimit(
  map: Map<string, RateLimitBucket>,
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = map.get(key);

  if (!bucket || now > bucket.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

// Clean up rate limits every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of loginRateLimits.entries()) {
    if (now > v.resetAt) loginRateLimits.delete(k);
  }
  for (const [k, v] of clickRateLimits.entries()) {
    if (now > v.resetAt) clickRateLimits.delete(k);
  }
}, 10 * 60 * 1000);

// Authentication Middleware: Server-side sessions
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  let sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

  // Also accept standard Bearer token header as alternate transport
  if (!sessionToken && req.headers.authorization?.startsWith('Bearer ')) {
    sessionToken = req.headers.authorization.substring(7).trim();
  }

  if (!sessionToken) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Administrator session required. Please sign in.' },
    });
  }

  const session = dbService.getSession(sessionToken);
  if (!session) {
    // Clear invalid cookie if present
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.status(401).json({
      error: { code: 'SESSION_EXPIRED', message: 'Session expired or invalid. Please sign in again.' },
    });
  }

  // Session valid
  (req as any).adminSessionId = session.id;
  next();
}

// Health Check Endpoint (safe, reveals no internal secrets)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Find Niche API',
    timestamp: new Date().toISOString(),
    admin_configured: Boolean(ADMIN_PASSCODE),
  });
});

// Admin: Session status check
app.get('/api/admin/session', (req, res) => {
  let sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionToken && req.headers.authorization?.startsWith('Bearer ')) {
    sessionToken = req.headers.authorization.substring(7).trim();
  }

  if (!sessionToken) {
    return res.json({ authenticated: false });
  }

  const session = dbService.getSession(sessionToken);
  if (!session) {
    return res.json({ authenticated: false });
  }

  return res.json({ authenticated: true, role: 'owner' });
});

// Admin: Login endpoint with rate limiting & server-side session
app.post('/api/admin/login', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

  // Rate limit: max 5 login attempts per 15 minutes per IP
  if (!checkRateLimit(loginRateLimits, clientIp, 5, 15 * 60 * 1000)) {
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
      },
    });
  }

  const { passcode } = req.body;

  // Safe startup rule: if ADMIN_PASSCODE is not configured, admin login cannot succeed
  if (!ADMIN_PASSCODE) {
    console.error('[SECURITY ALERT] Login attempted but ADMIN_PASSCODE environment variable is not configured.');
    return res.status(503).json({
      error: {
        code: 'AUTH_NOT_CONFIGURED',
        message: 'Admin access has not been configured by the owner on this instance.',
      },
    });
  }

  // Constant-time comparison to prevent timing attacks
  const inputBuffer = Buffer.from(String(passcode || ''));
  const targetBuffer = Buffer.from(String(ADMIN_PASSCODE));

  const isMatch =
    inputBuffer.length === targetBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, targetBuffer);

  if (!isMatch) {
    dbService.addAuditLog('admin.login_failed', `Failed sign-in attempt from IP: ${clientIp}`, undefined, 'guest');
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect administrator passcode.' },
    });
  }

  // Login successful: Generate cryptographically secure session ID
  const sessionId = crypto.randomBytes(32).toString('hex');
  const sessionDurationMs = 4 * 60 * 60 * 1000; // 4 hours
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').substring(0, 16);
  dbService.createSession(sessionId, expiresAt, ipHash);
  dbService.addAuditLog('admin.login_success', 'Owner signed in successfully.', undefined, 'owner');

  // Set secure HttpOnly cookie (compatible with iframe and cross-origin embedding)
  const isProd = process.env.NODE_ENV === 'production';
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isHttps || isProd,
    sameSite: isHttps || isProd ? 'none' : 'lax',
    path: '/',
    expires: expiresAt,
  });

  return res.json({
    success: true,
    token: sessionId, // Returned for client bearer fallback if cookies blocked
    role: 'owner',
    expires_at: expiresAt.toISOString(),
  });
});

// Admin: Logout endpoint
app.post('/api/admin/logout', (req, res) => {
  let sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionToken && req.headers.authorization?.startsWith('Bearer ')) {
    sessionToken = req.headers.authorization.substring(7).trim();
  }

  if (sessionToken) {
    dbService.deleteSession(sessionToken);
  }

  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ success: true, message: 'Signed out.' });
});

// Public: Get Site Settings & Branding (Logo name, theme, tagline, announcement)
app.get('/api/settings', (req, res) => {
  const settings = dbService.getSiteSettings();
  res.json({ settings });
});

// Public: Get Active Categories
app.get('/api/categories', (req, res) => {
  const activeCategories = dbService.getCategories(true);
  res.json({ categories: activeCategories });
});

// Public: Get Published Products with search, category & pagination
// STRICT SECURITY REQUIREMENT: Only returns status = 'published' AND deleted_at IS NULL
app.get('/api/products', (req, res) => {
  const { q, category, sort, page, limit } = req.query;

  const result = dbService.getPublicProducts({
    q: q ? String(q) : undefined,
    category: category ? String(category) : undefined,
    sort: sort ? String(sort) : undefined,
    page: page ? parseInt(String(page), 10) : 1,
    limit: limit ? parseInt(String(limit), 10) : 12,
  });

  res.json({
    products: result.products,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasMore: result.hasMore,
    },
  });
});

// Public: Get Single Product by Slug
// STRICT SECURITY REQUIREMENT: Only returns published products. Non-published return 404!
app.get('/api/products/:slug', (req, res) => {
  const { slug } = req.params;
  const product = dbService.getPublicProductBySlug(slug);

  if (!product) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Product not found.' },
    });
  }

  res.json({ product });
});

// Public: Track Safe Product Click
// STRICT RATE LIMITING & SECURITY REQUIREMENT: Published products only, zero PII
app.post('/api/clicks', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

  // Max 30 clicks per minute per IP to prevent artificial inflation
  if (!checkRateLimit(clickRateLimits, clientIp, 30, 60 * 1000)) {
    return res.status(429).json({ error: { code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded.' } });
  }

  const { product_id, source = 'catalog_card' } = req.body;
  if (!product_id || typeof product_id !== 'string') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Valid product ID required.' } });
  }

  const allowedSources = ['catalog_card', 'product_detail', 'related_products', 'direct'];
  const safeSource = allowedSources.includes(source) ? source : 'catalog_card';

  const success = dbService.recordClick(product_id, safeSource);
  if (!success) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product is not available for click tracking.' } });
  }

  res.json({ success: true });
});

// --- ADMIN ENDPOINTS (Protected with requireAdmin) ---

// Admin: Get all products (including drafts, hidden, archived)
app.get('/api/admin/products', requireAdmin, (req, res) => {
  const products = dbService.getAdminProducts();
  res.json({ products });
});

// Admin: Get single product by ID
app.get('/api/admin/products/:id', requireAdmin, (req, res) => {
  const product = dbService.getAdminProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }
  res.json({ product });
});

// Admin: Preview product by slug even if draft or hidden
app.get('/api/admin/products/by-slug/:slug', requireAdmin, (req, res) => {
  const product = dbService.getAdminProductBySlug(req.params.slug);
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }
  res.json({ product });
});

// Admin: Create Product
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const isPublishing = req.body.status === 'published';
  const validation = validateProductPayload(req.body, dbService, isPublishing);

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const product = dbService.createProduct({
      name: req.body.name.trim(),
      category_id: req.body.category_id,
      short_description: req.body.short_description.trim(),
      description: req.body.description ? req.body.description.trim() : '',
      key_points: Array.isArray(req.body.key_points) ? req.body.key_points : [],
      useful_for: Array.isArray(req.body.useful_for) ? req.body.useful_for : [],
      considerations: req.body.considerations ? req.body.considerations.trim() : '',
      image_path: req.body.image_path ? req.body.image_path.trim() : '',
      affiliate_url: req.body.affiliate_url ? req.body.affiliate_url.trim() : '',
      marketplace_code: req.body.marketplace_code || 'US',
      status: req.body.status || 'draft',
    });

    res.status(201).json({ product });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create product.' } });
  }
});

// Admin: Update Product
app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
  const existing = dbService.getAdminProductById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }

  const merged = { ...existing, ...req.body };
  const isPublishing = merged.status === 'published';
  const validation = validateProductPayload(merged, dbService, isPublishing);

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const updated = dbService.updateProduct(req.params.id, req.body);
    res.json({ product: updated });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update product.' } });
  }
});

// Admin: Publish Product
app.post('/api/admin/products/:id/publish', requireAdmin, (req, res) => {
  const existing = dbService.getAdminProductById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }

  // Shared validation check
  const merged = { ...existing, status: 'published' };
  const validation = validateProductPayload(merged, dbService, true);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const published = dbService.publishProduct(req.params.id);
  res.json({ product: published });
});

// Admin: Hide Product
app.post('/api/admin/products/:id/hide', requireAdmin, (req, res) => {
  const hidden = dbService.hideProduct(req.params.id);
  if (!hidden) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }
  res.json({ product: hidden });
});

// Admin: Soft Delete Product (never reuses permanent number)
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const success = dbService.softDeleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }
  res.json({ success: true, message: 'Product archived. Permanent product number reserved.' });
});

// Admin: Permanent Hard Delete Product (completely removes product and its records)
app.delete('/api/admin/products/:id/permanent', requireAdmin, (req, res) => {
  const success = dbService.hardDeleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
  }
  res.json({ success: true, message: 'Product deleted permanently.' });
});

// Admin: Image Upload Endpoint
app.post('/api/admin/uploads', requireAdmin, uploadMiddleware.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: 'No image file was received.' } });
  }

  try {
    const result = saveUploadedImage(req.file.buffer);
    dbService.addAuditLog('image.uploaded', `Uploaded product photo: ${result.filename} (${Math.round(result.size / 1024)} KB)`);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: { code: 'INVALID_IMAGE', message: err.message || 'Image processing failed.' } });
  }
});

// Admin: Delete Uploaded Image
app.delete('/api/admin/uploads/:filename', requireAdmin, (req, res) => {
  const success = deleteUploadedImage(req.params.filename);
  if (!success) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found or already removed.' } });
  }
  dbService.addAuditLog('image.deleted', `Removed image: ${req.params.filename}`);
  res.json({ success: true });
});

// Admin: Categories Management
app.get('/api/admin/categories', requireAdmin, (req, res) => {
  const categories = dbService.getCategories(false);
  res.json({ categories });
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, display_order } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Category name is required.' } });
  }

  try {
    const category = dbService.createCategory(name, display_order);
    res.status(201).json({ category });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'A category with this name already exists.' } });
    }
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create category.' } });
  }
});

app.patch('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const updated = dbService.updateCategory(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } });
  }
  res.json({ category: updated });
});

// Admin: Analytics Summary
app.get('/api/admin/analytics', requireAdmin, (req, res) => {
  const analytics = dbService.getAnalyticsSummary();
  res.json(analytics);
});

// Admin: Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  const logs = dbService.getAuditLogs(100);
  res.json({ logs });
});

// Admin: Catalog Export
app.get('/api/admin/export', requireAdmin, (req, res) => {
  const products = dbService.getAdminProducts();
  const categories = dbService.getCategories(false);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=find-niche-catalog-export.json');
  res.json({
    store: 'Find Niche',
    exported_at: new Date().toISOString(),
    catalog: {
      products,
      categories,
    },
  });
});

// Admin: Update Site Settings & Branding (Logo name, tagline, theme selection)
app.patch('/api/admin/settings', requireAdmin, (req, res) => {
  const updated = dbService.updateSiteSettings(req.body);
  res.json({ settings: updated });
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
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Find Niche] Server running on http://0.0.0.0:${PORT}`);
    if (!ADMIN_PASSCODE) {
      console.warn('[Find Niche WARN] ADMIN_PASSCODE environment variable is NOT set. Set ADMIN_PASSCODE in .env or your host dashboard to enable owner administration.');
    }
  });
}

startServer();
