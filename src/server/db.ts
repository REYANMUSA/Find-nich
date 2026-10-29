import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import type { Product, Category, ProductClick, AuditLog, AmazonMarketplace, SiteSettings, ThemeId } from '../types/index.ts';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SQLITE_FILE = path.join(DATA_DIR, 'findniche.sqlite');
const LEGACY_JSON_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class DatabaseService {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(SQLITE_FILE);
    this.initPragmas();
    this.initTables();
    this.migrateFromLegacyIfNeeded();
  }

  private initPragmas() {
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA synchronous = NORMAL;');
  }

  private initTables() {
    // 1. Sequences table for atomic, gap-free permanent product numbering
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sequences (
        name TEXT PRIMARY KEY,
        current_val INTEGER NOT NULL
      );
    `);

    // 2. Categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 3. Products table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        product_number INTEGER NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        short_description TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        key_points TEXT NOT NULL DEFAULT '[]',
        useful_for TEXT NOT NULL DEFAULT '[]',
        considerations TEXT NOT NULL DEFAULT '',
        category_id TEXT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        image_path TEXT NOT NULL DEFAULT '',
        affiliate_url TEXT NOT NULL DEFAULT '',
        marketplace_code TEXT NOT NULL DEFAULT 'US',
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden', 'archived')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        published_at TEXT,
        deleted_at TEXT,
        view_count INTEGER NOT NULL DEFAULT 0,
        click_count INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 4. Product clicks (coarse, zero-PII anonymous interest events)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS product_clicks (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        source TEXT NOT NULL DEFAULT 'catalog_card',
        clicked_at TEXT NOT NULL
      );
    `);

    // 5. Audit logs (historical administrative activity log)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        target_id TEXT,
        actor TEXT NOT NULL DEFAULT 'owner',
        timestamp TEXT NOT NULL
      );
    `);

    // 6. Admin sessions (server-side authenticated sessions)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        ip_hash TEXT
      );
    `);

    // 7. Site Settings & Branding (custom logo name, tagline, active themes)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY,
        logo_name TEXT NOT NULL DEFAULT 'Find Niche',
        tagline TEXT NOT NULL DEFAULT 'Better Products. Smarter Choices.',
        hero_headline TEXT NOT NULL DEFAULT 'Curated Tech Essentials. Tested Without Bias.',
        hero_subheadline TEXT NOT NULL DEFAULT 'Handpicked EDC, minimalist desk setups, and everyday tech gear with genuine editorial notes and direct Amazon access.',
        announcement TEXT NOT NULL DEFAULT '',
        admin_theme TEXT NOT NULL DEFAULT 'helios',
        public_theme TEXT NOT NULL DEFAULT 'helios',
        apply_to_public INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);

    // Ensure default settings row exists
    const settingsRow = this.db.prepare("SELECT id FROM site_settings WHERE id = 'default'").get() as any;
    if (!settingsRow) {
      this.db.prepare(`
        INSERT INTO site_settings (
          id, logo_name, tagline, hero_headline, hero_subheadline,
          announcement, admin_theme, public_theme, apply_to_public, updated_at
        ) VALUES (
          'default', 'Find Niche', 'Better Products. Smarter Choices.',
          'Curated Tech Essentials. Tested Without Bias.',
          'Handpicked EDC, minimalist desk setups, and everyday tech gear with genuine editorial notes and direct Amazon access.',
          '', 'helios', 'helios', 0, ?
        )
      `).run(new Date().toISOString());
    }

    // Initialize sequence if not present
    const seqRow = this.db.prepare("SELECT current_val FROM sequences WHERE name = 'product_number'").get() as any;
    if (!seqRow) {
      this.db.prepare("INSERT INTO sequences (name, current_val) VALUES ('product_number', 0)").run();
    }
  }

  private migrateFromLegacyIfNeeded() {
    const countRow = this.db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
    if (countRow && countRow.count > 0) {
      return; // Already initialized with data
    }

    console.log('[DB] Migrating catalog into relational SQLite database...');

    let initialCats = INITIAL_CATEGORIES;
    let initialProds = INITIAL_PRODUCTS;

    // Check if legacy data/db.json exists and parse it safely
    let savedSettings: Partial<SiteSettings> | null = null;
    if (fs.existsSync(LEGACY_JSON_FILE)) {
      try {
        const raw = fs.readFileSync(LEGACY_JSON_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.settings && typeof parsed.settings === 'object') {
          savedSettings = parsed.settings;
        }
        if (parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          initialCats = parsed.categories;
        }
        if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
          initialProds = parsed.products;
        }
      } catch (e) {
        console.error('[DB] Error parsing legacy db.json, falling back to clean initial data', e);
      }
    }

    if (savedSettings) {
      this.updateSiteSettings(savedSettings);
    }

    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      // Insert categories
      const insertCat = this.db.prepare(`
        INSERT OR IGNORE INTO categories (id, name, slug, display_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const cat of initialCats) {
        insertCat.run(
          cat.id,
          cat.name,
          cat.slug,
          cat.display_order,
          cat.is_active ? 1 : 0,
          cat.created_at || new Date().toISOString(),
          cat.updated_at || new Date().toISOString()
        );
      }

      // Insert products
      const insertProd = this.db.prepare(`
        INSERT OR IGNORE INTO products (
          id, product_number, slug, name, short_description, description,
          key_points, useful_for, considerations, category_id, image_path,
          affiliate_url, marketplace_code, status, created_at, updated_at,
          published_at, deleted_at, view_count, click_count
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);

      let maxProductNumber = 0;
      for (const p of initialProds) {
        // Ensure image paths point to public assets
        let img = p.image_path;
        if (img && img.startsWith('/src/assets/images/')) {
          img = img.replace('/src/assets/images/', '/images/');
        }

        const num = Number(p.product_number) || 1;
        if (num > maxProductNumber) maxProductNumber = num;

        // Honor actual saved status and deleted timestamp permanently
        const status = p.status || 'published';
        const deletedAt = p.deleted_at || (status === 'archived' ? (p.updated_at || new Date().toISOString()) : null);

        insertProd.run(
          p.id || `prod-${crypto.randomUUID()}`,
          num,
          p.slug,
          p.name,
          p.short_description,
          p.description || '',
          JSON.stringify(p.key_points || []),
          JSON.stringify(p.useful_for || []),
          p.considerations || '',
          p.category_id,
          img || '',
          p.affiliate_url || '',
          p.marketplace_code || 'US',
          status,
          p.created_at || new Date().toISOString(),
          p.updated_at || new Date().toISOString(),
          p.published_at || new Date().toISOString(),
          deletedAt,
          p.view_count || 0,
          p.click_count || 0
        );
      }

      // Update sequence to maxProductNumber
      const nextSeq = Math.max(maxProductNumber, 6);
      this.db.prepare("UPDATE sequences SET current_val = ? WHERE name = 'product_number'").run(nextSeq);

      // Log initial migration audit event
      const auditId = `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      this.db.prepare(`
        INSERT INTO audit_logs (id, action, details, target_id, actor, timestamp)
        VALUES (?, 'system.database_migration', 'Migrated catalog into relational SQLite database.', NULL, 'system', ?)
      `).run(auditId, new Date().toISOString());

      this.db.exec('COMMIT;');
      console.log(`[DB] Successfully migrated ${initialProds.length} products and ${initialCats.length} categories.`);
    } catch (err) {
      this.db.exec('ROLLBACK;');
      console.error('[DB] Migration failed:', err);
      throw err;
    }
  }

  // --- Safe Sequence Allocation ---
  public getNextProductNumber(): number {
    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const res = this.db.prepare(`
        UPDATE sequences 
        SET current_val = current_val + 1 
        WHERE name = 'product_number' 
        RETURNING current_val
      `).get() as { current_val: number };

      // Extra safeguard: Ensure it exceeds any existing product_number in products
      const maxRow = this.db.prepare('SELECT MAX(product_number) as max_num FROM products').get() as { max_num: number | null };
      const currentMax = maxRow.max_num || 0;
      let finalNum = res.current_val;

      if (finalNum <= currentMax) {
        finalNum = currentMax + 1;
        this.db.prepare("UPDATE sequences SET current_val = ? WHERE name = 'product_number'").run(finalNum);
      }

      this.db.exec('COMMIT;');
      return finalNum;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  // --- Category Operations ---
  public getCategories(onlyActive = true): (Category & { product_count?: number })[] {
    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as product_count
      FROM categories c
    `;
    if (onlyActive) {
      sql += ' WHERE c.is_active = 1 ';
    }
    sql += ' ORDER BY c.display_order ASC, c.name ASC';

    const rows = this.db.prepare(sql).all() as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      display_order: r.display_order,
      is_active: Boolean(r.is_active),
      created_at: r.created_at,
      updated_at: r.updated_at,
      product_count: r.product_count,
    }));
  }

  public getCategoryById(id: string): Category | null {
    const row = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      display_order: row.display_order,
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  public createCategory(name: string, displayOrder?: number): Category {
    const trimmed = name.trim();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const id = `cat-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const maxOrderRow = this.db.prepare('SELECT MAX(display_order) as max_ord FROM categories').get() as any;
    const order = displayOrder !== undefined ? displayOrder : ((maxOrderRow?.max_ord || 0) + 1);

    this.db.prepare(`
      INSERT INTO categories (id, name, slug, display_order, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).run(id, trimmed, slug, order, now, now);

    this.addAuditLog('category.created', `Created category "${trimmed}"`, id);
    this.syncToFile();

    return {
      id,
      name: trimmed,
      slug,
      display_order: order,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
  }

  public updateCategory(id: string, updates: { name?: string; is_active?: boolean; display_order?: number }): Category | null {
    const existing = this.getCategoryById(id);
    if (!existing) return null;

    const name = updates.name !== undefined ? updates.name.trim() : existing.name;
    const slug = updates.name !== undefined 
      ? updates.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : existing.slug;
    const isActive = updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : (existing.is_active ? 1 : 0);
    const order = updates.display_order !== undefined ? updates.display_order : existing.display_order;
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE categories 
      SET name = ?, slug = ?, is_active = ?, display_order = ?, updated_at = ?
      WHERE id = ?
    `).run(name, slug, isActive, order, now, id);

    this.addAuditLog('category.updated', `Updated category "${name}" (active: ${isActive === 1})`, id);
    this.syncToFile();

    return {
      id,
      name,
      slug,
      display_order: order,
      is_active: isActive === 1,
      created_at: existing.created_at,
      updated_at: now,
    };
  }

  // --- Public Product Queries ---
  // STRICT SECURITY REQUIREMENT: Only returns status = 'published' AND deleted_at IS NULL
  public getPublicProducts(params: {
    category?: string;
    q?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): { products: Product[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean } {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(50, params.limit || 12));
    const offset = (page - 1) * limit;

    let whereClause = " WHERE p.status = 'published' AND p.deleted_at IS NULL ";
    const queryParams: any[] = [];

    // Filter by category
    if (params.category && params.category !== 'all') {
      whereClause += ' AND (p.category_id = ? OR c.slug = ?) ';
      queryParams.push(params.category, params.category);
    }

    // Filter by search query (name, short_description, or product_number)
    if (params.q && params.q.trim()) {
      const qTrimmed = params.q.trim();
      const numMatch = qTrimmed.match(/^#?0*(\d+)$/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        whereClause += ' AND (p.product_number = ? OR LOWER(p.name) LIKE ? OR LOWER(p.short_description) LIKE ?) ';
        queryParams.push(num, `%${qTrimmed.toLowerCase()}%`, `%${qTrimmed.toLowerCase()}%`);
      } else {
        whereClause += ' AND (LOWER(p.name) LIKE ? OR LOWER(p.short_description) LIKE ? OR LOWER(p.description) LIKE ?) ';
        queryParams.push(`%${qTrimmed.toLowerCase()}%`, `%${qTrimmed.toLowerCase()}%`, `%${qTrimmed.toLowerCase()}%`);
      }
    }

    // Sort order
    let orderBy = ' ORDER BY p.created_at DESC ';
    if (params.sort === 'num_asc') {
      orderBy = ' ORDER BY p.product_number ASC ';
    } else if (params.sort === 'num_desc') {
      orderBy = ' ORDER BY p.product_number DESC ';
    } else if (params.sort === 'clicks') {
      orderBy = ' ORDER BY p.click_count DESC, p.created_at DESC ';
    }

    // Count total matches
    const countSql = `
      SELECT COUNT(*) as total 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const countRow = this.db.prepare(countSql).get(...queryParams) as { total: number };
    const total = countRow.total;

    // Fetch paginated products
    const selectSql = `
      SELECT p.* 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const rows = this.db.prepare(selectSql).all(...queryParams, limit, offset) as any[];

    const products: Product[] = rows.map(r => this.mapProductRow(r));

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + products.length < total,
    };
  }

  // STRICT SECURITY REQUIREMENT:
  // Public product detail MUST return ONLY published, non-deleted items!
  public getPublicProductBySlug(slug: string): Product | null {
    const row = this.db.prepare(`
      SELECT * FROM products 
      WHERE slug = ? AND status = 'published' AND deleted_at IS NULL
    `).get(slug) as any;

    if (!row) return null;

    // Increment view count quietly
    this.db.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').run(row.id);

    return this.mapProductRow(row);
  }

  // --- Admin Product Queries (Authorized) ---
  public getAdminProducts(): Product[] {
    const rows = this.db.prepare(`
      SELECT * FROM products 
      WHERE deleted_at IS NULL 
      ORDER BY product_number DESC
    `).all() as any[];

    return rows.map(r => this.mapProductRow(r));
  }

  public getAdminProductById(id: string): Product | null {
    const row = this.db.prepare('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL').get(id) as any;
    if (!row) return null;
    return this.mapProductRow(row);
  }

  public getAdminProductBySlug(slug: string): Product | null {
    const row = this.db.prepare('SELECT * FROM products WHERE slug = ? AND deleted_at IS NULL').get(slug) as any;
    if (!row) return null;
    return this.mapProductRow(row);
  }

  public createProduct(data: {
    name: string;
    category_id: string;
    short_description: string;
    description: string;
    key_points: string[];
    useful_for: string[];
    considerations: string;
    image_path: string;
    affiliate_url: string;
    marketplace_code: AmazonMarketplace;
    status: Product['status'];
  }): Product {
    const id = `prod-${crypto.randomUUID()}`;
    const productNumber = this.getNextProductNumber();
    const now = new Date().toISOString();

    // Generate unique slug
    let baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = `product-${productNumber}`;

    let slug = baseSlug;
    let counter = 1;
    while (this.db.prepare('SELECT 1 FROM products WHERE slug = ?').get(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const publishedAt = data.status === 'published' ? now : null;

    this.db.prepare(`
      INSERT INTO products (
        id, product_number, slug, name, short_description, description,
        key_points, useful_for, considerations, category_id, image_path,
        affiliate_url, marketplace_code, status, created_at, updated_at,
        published_at, deleted_at, view_count, click_count
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, NULL, 0, 0
      )
    `).run(
      id,
      productNumber,
      slug,
      data.name,
      data.short_description,
      data.description || '',
      JSON.stringify(data.key_points || []),
      JSON.stringify(data.useful_for || []),
      data.considerations || '',
      data.category_id,
      data.image_path || '',
      data.affiliate_url || '',
      data.marketplace_code || 'US',
      data.status || 'draft',
      now,
      now,
      publishedAt
    );

    this.addAuditLog('product.created', `Created product #${productNumber}: "${data.name}" (${data.status})`, id);
    this.syncToFile();

    return this.getAdminProductById(id)!;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const existing = this.getAdminProductById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const name = updates.name !== undefined ? updates.name.trim() : existing.name;
    const shortDesc = updates.short_description !== undefined ? updates.short_description.trim() : existing.short_description;
    const desc = updates.description !== undefined ? updates.description.trim() : existing.description;
    const catId = updates.category_id !== undefined ? updates.category_id : existing.category_id;
    const img = updates.image_path !== undefined ? updates.image_path : existing.image_path;
    const affUrl = updates.affiliate_url !== undefined ? updates.affiliate_url.trim() : existing.affiliate_url;
    const market = updates.marketplace_code !== undefined ? updates.marketplace_code : existing.marketplace_code;
    const cons = updates.considerations !== undefined ? updates.considerations.trim() : existing.considerations;
    const kp = updates.key_points !== undefined ? JSON.stringify(updates.key_points) : JSON.stringify(existing.key_points);
    const uf = updates.useful_for !== undefined ? JSON.stringify(updates.useful_for) : JSON.stringify(existing.useful_for);
    
    let status = existing.status;
    let publishedAt = existing.published_at;
    if (updates.status && updates.status !== existing.status) {
      status = updates.status;
      if (status === 'published' && !publishedAt) {
        publishedAt = now;
      }
    }

    this.db.prepare(`
      UPDATE products SET
        name = ?,
        short_description = ?,
        description = ?,
        category_id = ?,
        image_path = ?,
        affiliate_url = ?,
        marketplace_code = ?,
        considerations = ?,
        key_points = ?,
        useful_for = ?,
        status = ?,
        published_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(name, shortDesc, desc, catId, img, affUrl, market, cons, kp, uf, status, publishedAt, now, id);

    this.addAuditLog('product.updated', `Updated product #${existing.product_number}: "${name}"`, id);
    this.syncToFile();

    return this.getAdminProductById(id);
  }

  public publishProduct(id: string): Product | null {
    const existing = this.getAdminProductById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE products 
      SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = ?
      WHERE id = ?
    `).run(now, now, id);

    this.addAuditLog('product.published', `Published product #${existing.product_number}: "${existing.name}"`, id);
    this.syncToFile();
    return this.getAdminProductById(id);
  }

  public hideProduct(id: string): Product | null {
    const existing = this.getAdminProductById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE products 
      SET status = 'hidden', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    this.addAuditLog('product.hidden', `Hid product #${existing.product_number}: "${existing.name}"`, id);
    this.syncToFile();
    return this.getAdminProductById(id);
  }

  // Soft delete preserves sequence and does NOT reuse permanent number!
  public softDeleteProduct(id: string): boolean {
    const existing = this.getAdminProductById(id);
    if (!existing) return false;

    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE products 
      SET deleted_at = ?, status = 'archived', updated_at = ?
      WHERE id = ?
    `).run(now, now, id);

    this.addAuditLog('product.deleted', `Soft-deleted product #${existing.product_number}: "${existing.name}". Permanent number reserved.`, id);
    this.syncToFile();
    return true;
  }

  // Hard delete: Permanently deletes the product from database and removes all click history
  public hardDeleteProduct(id: string): boolean {
    const existing = this.getAdminProductById(id) || (this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any);
    if (!existing) return false;

    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      this.db.prepare('DELETE FROM product_clicks WHERE product_id = ?').run(id);
      this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
      this.db.exec('COMMIT;');

      this.addAuditLog('product.hard_deleted', `Permanently deleted product #${existing.product_number}: "${existing.name}".`, id);
      this.syncToFile();
      return true;
    } catch (e) {
      this.db.exec('ROLLBACK;');
      console.error('[DB] Failed to hard delete product:', e);
      return false;
    }
  }

  // --- Click Analytics (Strict Rate Limiting & Published Only) ---
  public recordClick(productId: string, source = 'catalog_card'): boolean {
    // SECURITY: Validate that the product is published and not deleted
    const prod = this.db.prepare(`
      SELECT id, product_number, name FROM products 
      WHERE id = ? AND status = 'published' AND deleted_at IS NULL
    `).get(productId) as any;

    if (!prod) return false;

    const clickId = `clk-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      this.db.prepare(`
        INSERT INTO product_clicks (id, product_id, source, clicked_at)
        VALUES (?, ?, ?, ?)
      `).run(clickId, productId, source, now);

      this.db.prepare('UPDATE products SET click_count = click_count + 1 WHERE id = ?').run(productId);
      this.db.exec('COMMIT;');
      return true;
    } catch {
      this.db.exec('ROLLBACK;');
      return false;
    }
  }

  public getAnalyticsSummary() {
    const summaryRow = this.db.prepare(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_products,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_products,
        SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) as hidden_products
      FROM products 
      WHERE deleted_at IS NULL
    `).get() as any;

    const catCountRow = this.db.prepare('SELECT COUNT(*) as total_categories FROM categories WHERE is_active = 1').get() as any;
    const clicksCountRow = this.db.prepare('SELECT COUNT(*) as total_clicks FROM product_clicks').get() as any;

    const topProducts = this.db.prepare(`
      SELECT id, product_number as number, name, click_count as clicks, view_count as views, affiliate_url
      FROM products
      WHERE deleted_at IS NULL
      ORDER BY click_count DESC, view_count DESC
      LIMIT 20
    `).all() as any[];

    const sourceRows = this.db.prepare(`
      SELECT source, COUNT(*) as count 
      FROM product_clicks 
      GROUP BY source
    `).all() as any[];

    const sources: Record<string, number> = {};
    for (const r of sourceRows) {
      sources[r.source] = r.count;
    }

    const recentClicks = this.db.prepare(`
      SELECT pc.id, pc.clicked_at, pc.source, p.name as product_name, p.product_number
      FROM product_clicks pc
      JOIN products p ON pc.product_id = p.id
      ORDER BY pc.clicked_at DESC
      LIMIT 30
    `).all() as any[];

    return {
      summary: {
        total_products: summaryRow?.total_products || 0,
        published_products: summaryRow?.published_products || 0,
        draft_products: summaryRow?.draft_products || 0,
        hidden_products: summaryRow?.hidden_products || 0,
        total_categories: catCountRow?.total_categories || 0,
        total_clicks: clicksCountRow?.total_clicks || 0,
      },
      top_products: topProducts,
      sources,
      recent_clicks: recentClicks,
    };
  }

  // --- Audit Logs ---
  public addAuditLog(action: string, details: string, targetId?: string, actor = 'owner') {
    const id = `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const timestamp = new Date().toISOString();

    try {
      this.db.prepare(`
        INSERT INTO audit_logs (id, action, details, target_id, actor, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, action, details, targetId || null, actor, timestamp);
    } catch (e) {
      console.error('[DB] Failed to insert audit log:', e);
    }
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    const rows = this.db.prepare(`
      SELECT * FROM audit_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit) as any[];

    return rows.map(r => ({
      id: r.id,
      action: r.action,
      details: r.details,
      target_id: r.target_id,
      timestamp: r.timestamp,
    }));
  }

  // --- Server-side Sessions ---
  public createSession(sessionId: string, expiresAt: Date, ipHash?: string) {
    this.cleanExpiredSessions();
    this.db.prepare(`
      INSERT INTO admin_sessions (id, created_at, expires_at, ip_hash)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, new Date().toISOString(), expiresAt.toISOString(), ipHash || null);
  }

  public getSession(sessionId: string): { id: string; expires_at: string } | null {
    const now = new Date().toISOString();
    const row = this.db.prepare(`
      SELECT * FROM admin_sessions 
      WHERE id = ? AND expires_at > ?
    `).get(sessionId, now) as any;

    if (!row) return null;
    return { id: row.id, expires_at: row.expires_at };
  }

  public deleteSession(sessionId: string) {
    this.db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(sessionId);
  }

  public cleanExpiredSessions() {
    const now = new Date().toISOString();
    this.db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(now);
  }

  // --- Site Settings & Branding ---
  public getSiteSettings(): SiteSettings {
    const row = this.db.prepare("SELECT * FROM site_settings WHERE id = 'default'").get() as any;
    if (!row) {
      return {
        logo_name: 'Find Niche',
        tagline: 'Better Products. Smarter Choices.',
        hero_headline: 'Curated Tech Essentials. Tested Without Bias.',
        hero_subheadline: 'Handpicked EDC, minimalist desk setups, and everyday tech gear with genuine editorial notes and direct Amazon access.',
        announcement: '',
        admin_theme: 'helios',
        public_theme: 'helios',
        apply_to_public: false,
      };
    }
    return {
      logo_name: row.logo_name || 'Find Niche',
      tagline: row.tagline || 'Better Products. Smarter Choices.',
      hero_headline: row.hero_headline || 'Curated Tech Essentials. Tested Without Bias.',
      hero_subheadline: row.hero_subheadline || 'Handpicked EDC, minimalist desk setups, and everyday tech gear with genuine editorial notes and direct Amazon access.',
      announcement: row.announcement || '',
      admin_theme: (row.admin_theme as ThemeId) || 'helios',
      public_theme: (row.public_theme as ThemeId) || 'helios',
      apply_to_public: Boolean(row.apply_to_public),
      updated_at: row.updated_at,
    };
  }

  public updateSiteSettings(updates: Partial<SiteSettings>): SiteSettings {
    const current = this.getSiteSettings();
    const logoName = updates.logo_name !== undefined ? updates.logo_name.trim() : current.logo_name;
    const tagline = updates.tagline !== undefined ? updates.tagline.trim() : current.tagline;
    const heroHeadline = updates.hero_headline !== undefined ? updates.hero_headline.trim() : current.hero_headline;
    const heroSubheadline = updates.hero_subheadline !== undefined ? updates.hero_subheadline.trim() : current.hero_subheadline;
    const announcement = updates.announcement !== undefined ? updates.announcement.trim() : current.announcement;
    const adminTheme = updates.admin_theme !== undefined ? updates.admin_theme : current.admin_theme;
    const publicTheme = updates.public_theme !== undefined ? updates.public_theme : current.public_theme;
    const applyToPublic = updates.apply_to_public !== undefined ? (updates.apply_to_public ? 1 : 0) : (current.apply_to_public ? 1 : 0);
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO site_settings (
        id, logo_name, tagline, hero_headline, hero_subheadline,
        announcement, admin_theme, public_theme, apply_to_public, updated_at
      ) VALUES (
        'default', ?, ?, ?, ?, ?, ?, ?, ?, ?
      ) ON CONFLICT(id) DO UPDATE SET
        logo_name = excluded.logo_name,
        tagline = excluded.tagline,
        hero_headline = excluded.hero_headline,
        hero_subheadline = excluded.hero_subheadline,
        announcement = excluded.announcement,
        admin_theme = excluded.admin_theme,
        public_theme = excluded.public_theme,
        apply_to_public = excluded.apply_to_public,
        updated_at = excluded.updated_at
    `);
    (stmt as any).run(logoName, tagline, heroHeadline, heroSubheadline, announcement, adminTheme, publicTheme, applyToPublic, now);

    this.addAuditLog('settings.updated', `Updated site settings: logo="${logoName}", admin_theme="${adminTheme}", apply_public=${applyToPublic === 1}`);
    this.syncToFile();

    return this.getSiteSettings();
  }

  // --- Atomic File Persistence (Wiped Container Recovery) ---
  public syncToFile(): void {
    try {
      const rows = this.db.prepare('SELECT * FROM products ORDER BY product_number ASC').all() as any[];
      const prods = rows.map((r) => this.mapProductRow(r));
      const cats = this.getCategories(false);
      const settings = this.getSiteSettings();

      const payload = {
        settings,
        categories: cats,
        products: prods,
      };

      fs.writeFileSync(LEGACY_JSON_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error writing to data/db.json:', err);
    }
  }

  // Helper mapper
  private mapProductRow(r: any): Product {
    let keyPoints: string[] = [];
    let usefulFor: string[] = [];

    try {
      keyPoints = JSON.parse(r.key_points || '[]');
    } catch {
      keyPoints = [];
    }

    try {
      usefulFor = JSON.parse(r.useful_for || '[]');
    } catch {
      usefulFor = [];
    }

    return {
      id: r.id,
      product_number: r.product_number,
      slug: r.slug,
      name: r.name,
      short_description: r.short_description,
      description: r.description,
      key_points: keyPoints,
      useful_for: usefulFor,
      considerations: r.considerations,
      category_id: r.category_id,
      image_path: r.image_path,
      affiliate_url: r.affiliate_url,
      marketplace_code: r.marketplace_code as AmazonMarketplace,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      published_at: r.published_at,
      deleted_at: r.deleted_at,
      view_count: r.view_count,
      click_count: r.click_count,
    };
  }
}

export const dbService = new DatabaseService();
