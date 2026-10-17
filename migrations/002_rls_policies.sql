-- Migration 002: Row Level Security (RLS) Policies
-- Enforces strict separation between public read-only catalog access and protected owner operations

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Categories Policies
-- Public can read active categories only
CREATE POLICY "Public can view active categories"
  ON categories
  FOR SELECT
  USING (is_active = true);

-- Service role / Authenticated admin full access
CREATE POLICY "Admin full access to categories"
  ON categories
  FOR ALL
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 2. Products Policies
-- CRITICAL SECURITY RULE: Public can ONLY view published, non-deleted products
CREATE POLICY "Public can view published products only"
  ON products
  FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL);

-- Service role / Authenticated admin full access to all products (including drafts and hidden)
CREATE POLICY "Admin full access to products"
  ON products
  FOR ALL
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 3. Product Clicks Policies
-- Public can insert anonymous clicks for published products
CREATE POLICY "Public can record clicks for published products"
  ON product_clicks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_clicks.product_id
      AND products.status = 'published'
      AND products.deleted_at IS NULL
    )
  );

-- Only admin / service_role can view click analytics
CREATE POLICY "Admin view click analytics"
  ON product_clicks
  FOR SELECT
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 4. Audit Logs Policies
-- Admin / service_role read-only and insert
CREATE POLICY "Admin access audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Service role insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 5. Admin Sessions Policies
-- Strictly service role access
CREATE POLICY "Service role manage sessions"
  ON admin_sessions
  FOR ALL
  USING (auth.role() = 'service_role');
