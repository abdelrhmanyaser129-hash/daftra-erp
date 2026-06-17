-- =============================================
-- 11_fix_expenses_rls.sql
-- أضف treasury_id للمصروفات + RLS للجداول الجديدة
-- آمن للتشغيل المتكرر (IF NOT EXISTS + DO blocks)
-- =============================================

-- 1. Add treasury_id to expenses (was missing — caused 400 error)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS treasury_id UUID REFERENCES safes_banks(id);

-- 2. Verify expenses has all needed columns
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS code TEXT DEFAULT '';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor_id TEXT DEFAULT '';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor_name TEXT DEFAULT '';

-- 3. Add all missing columns to invoices (sales invoice)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issue_date TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sales_agent TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EGP';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS already_paid BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_reference TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_template TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS adjustment DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS treasury_id UUID REFERENCES safes_banks(id);

-- 4. Enable RLS + policies for tables (safely, using DO blocks to avoid errors if tables don't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_movements') THEN
    ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "inventory_movements_all" ON inventory_movements;
    CREATE POLICY "inventory_movements_all" ON inventory_movements FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treasury_transactions') THEN
    ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "treasury_transactions_all" ON treasury_transactions;
    CREATE POLICY "treasury_transactions_all" ON treasury_transactions FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'composite_products') THEN
    ALTER TABLE composite_products ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "composite_products_all" ON composite_products;
    CREATE POLICY "composite_products_all" ON composite_products FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'composite_product_items') THEN
    ALTER TABLE composite_product_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "composite_product_items_all" ON composite_product_items;
    CREATE POLICY "composite_product_items_all" ON composite_product_items FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'returned_invoices') THEN
    ALTER TABLE returned_invoices ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "returned_invoices_all" ON returned_invoices;
    CREATE POLICY "returned_invoices_all" ON returned_invoices FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 5. Add first_name/last_name to purchase_vendors
ALTER TABLE purchase_vendors ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '';
ALTER TABLE purchase_vendors ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';

-- 6. Add last_weight/follow_up_count to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_weight DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;

-- 7. Add balance column to clients (running balance)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;

-- 8. Add code and notes columns to warehouses
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS code TEXT DEFAULT '';
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
