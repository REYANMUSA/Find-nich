-- Migration 001: Initial Schema for Find Niche
-- Supports PostgreSQL (Supabase) and compatible relational engines

-- Enable UUID extension if on PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sequence for safe, transaction-safe permanent product numbers
-- Permanent numbers must NEVER be reused even if an item is deleted
CREATE SEQUENCE IF NOT EXISTS product_number_seq START WITH 1 INCREMENT BY 1;

-- Table: categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_number INTEGER NOT NULL UNIQUE DEFAULT nextval('product_number_seq'),
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  useful_for JSONB NOT NULL DEFAULT '[]'::jsonb,
  considerations TEXT NOT NULL DEFAULT '',
  category_id UUID NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  image_path TEXT NOT NULL DEFAULT '',
  affiliate_url TEXT NOT NULL DEFAULT '',
  marketplace_code VARCHAR(10) NOT NULL DEFAULT 'US',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0
);

-- Indices for rapid querying and filtering
CREATE INDEX IF NOT EXISTS idx_products_public_listing ON products(status, deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_number ON products(product_number);

-- Table: product_clicks (Coarse, zero-PII anonymous interest metrics)
CREATE TABLE IF NOT EXISTS product_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL DEFAULT 'catalog_card',
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_product_time ON product_clicks(product_id, clicked_at DESC);

-- Table: audit_logs (Historical administrative log)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  target_id VARCHAR(100),
  actor VARCHAR(50) NOT NULL DEFAULT 'owner',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- Table: admin_sessions (Server-side session management)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR(128) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip_hash VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);
