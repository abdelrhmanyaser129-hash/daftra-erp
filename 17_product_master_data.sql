-- ============================================================
-- Phase 5: Product Master Data
-- Creates product_categories and product_brands tables,
-- seeds default values matching old hardcoded data.
-- ============================================================

-- 1. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'نشط',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO product_categories (name, status) VALUES
  ('عام', 'نشط'),
  ('إلكترونيات', 'نشط'),
  ('خدمات سحابية', 'نشط'),
  ('برمجيات ورخص', 'نشط'),
  ('أجهزة ومعدات', 'نشط')
ON CONFLICT (name) DO NOTHING;

-- 2. Product Brands
CREATE TABLE IF NOT EXISTS product_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'نشط',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO product_brands (name, status) VALUES
  ('بدون ماركة', 'نشط'),
  ('Apple', 'نشط'),
  ('Samsung', 'نشط'),
  ('HP', 'نشط'),
  ('Dell', 'نشط')
ON CONFLICT (name) DO NOTHING;
