-- =============================================
-- 8_fix_comprehensive.sql
-- All DB fixes: composite products, treasury, balance
-- =============================================

-- 1. Composite products table
CREATE TABLE IF NOT EXISTS composite_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  selling_price DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'نشط',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Composite product items (components)
CREATE TABLE IF NOT EXISTS composite_product_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  composite_id UUID REFERENCES composite_products(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_composite_items_composite ON composite_product_items(composite_id);

-- 3. Add treasury_id to receipt_vouchers
ALTER TABLE receipt_vouchers ADD COLUMN IF NOT EXISTS treasury_id UUID REFERENCES safes_banks(id);

-- 4. Add balance column to purchase_vendors (running balance, not opening)
ALTER TABLE purchase_vendors ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;

-- 5. Initialize vendor balance from existing invoices
UPDATE purchase_vendors pv
SET balance = COALESCE((
  SELECT SUM(COALESCE(pi.total, 0) - COALESCE(pi.already_paid::numeric, 0))
  FROM purchase_invoices pi
  WHERE pi.vendor_id = pv.id
), 0);
