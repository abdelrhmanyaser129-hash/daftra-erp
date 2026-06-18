-- ============================================================
-- Phase 4: Branches & Warehouses
-- Creates branches table, adds branch_id + code to warehouses,
-- and seeds default branches matching old hardcoded values.
-- ============================================================

-- 1. Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'نشط',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Seed default branches (matches old hardcoded names)
INSERT INTO branches (name, code, location, status) VALUES
  ('الفرع الرئيسي', 'HQ', 'القاهرة، مصر', 'نشط'),
  ('فرع الرياض والمنطقة الوسطى', 'RIY', 'الرياض، المملكة العربية السعودية', 'نشط'),
  ('فرع جدة والمنطقة الغربية', 'JED', 'جدة، المملكة العربية السعودية', 'نشط')
ON CONFLICT DO NOTHING;

-- 3. Add branch_id and code columns to warehouses
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS code TEXT;

-- 4. Helper function: get branches list
CREATE OR REPLACE FUNCTION get_branches()
RETURNS SETOF branches
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM branches ORDER BY name;
$$;
