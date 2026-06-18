-- ============================================================
-- RLS Policies for Daftra ERP - All Tables
-- شغّل الكود ده في Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. الفروع (Branches)
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON branches;
CREATE POLICY "enable_all_for_authenticated" ON branches
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2. الماركات (Product Brands)
ALTER TABLE product_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON product_brands;
CREATE POLICY "enable_all_for_authenticated" ON product_brands
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. التصنيفات (Product Categories)
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON product_categories;
CREATE POLICY "enable_all_for_authenticated" ON product_categories
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. المنتجات (Products)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON products;
CREATE POLICY "enable_all_for_authenticated" ON products
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. العملاء (Clients)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON clients;
CREATE POLICY "enable_all_for_authenticated" ON clients
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 6. الفواتير (Invoices)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON invoices;
CREATE POLICY "enable_all_for_authenticated" ON invoices
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 7. الملفات الشخصية (Profiles)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON profiles;
CREATE POLICY "enable_all_for_authenticated" ON profiles
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 8. الخزائن والحسابات البنكية (Safes & Banks)
ALTER TABLE safes_banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON safes_banks;
CREATE POLICY "enable_all_for_authenticated" ON safes_banks
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 9. المستودعات (Warehouses)
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON warehouses;
CREATE POLICY "enable_all_for_authenticated" ON warehouses
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 10. مخزون المستودعات (Warehouse Stock)
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON warehouse_stock;
CREATE POLICY "enable_all_for_authenticated" ON warehouse_stock
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 11. الأذون المخزنية (Inventory Vouchers)
ALTER TABLE inventory_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON inventory_vouchers;
CREATE POLICY "enable_all_for_authenticated" ON inventory_vouchers
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 12. حركة المخزون (Inventory Movements)
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON inventory_movements;
CREATE POLICY "enable_all_for_authenticated" ON inventory_movements
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 13. الموردين (Purchase Vendors)
ALTER TABLE purchase_vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON purchase_vendors;
CREATE POLICY "enable_all_for_authenticated" ON purchase_vendors
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 14. فواتير الشراء (Purchase Invoices)
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON purchase_invoices;
CREATE POLICY "enable_all_for_authenticated" ON purchase_invoices
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 15. مرتجعات الشراء (Purchase Returns)
ALTER TABLE purchase_returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON purchase_returns;
CREATE POLICY "enable_all_for_authenticated" ON purchase_returns
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 16. مدفوعات الموردين (Vendor Payments)
ALTER TABLE purchase_vendor_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON purchase_vendor_payments;
CREATE POLICY "enable_all_for_authenticated" ON purchase_vendor_payments
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 17. ملاحظات العملاء (Client Notes)
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON client_notes;
CREATE POLICY "enable_all_for_authenticated" ON client_notes
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 18. سجلات الوزن (Weight Records)
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON weight_records;
CREATE POLICY "enable_all_for_authenticated" ON weight_records
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 19. الفواتير المرتجعة (Returned Invoices)
ALTER TABLE returned_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON returned_invoices;
CREATE POLICY "enable_all_for_authenticated" ON returned_invoices
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 20. مدفوعات العملاء (Customer Payments)
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON customer_payments;
CREATE POLICY "enable_all_for_authenticated" ON customer_payments
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 21. المصروفات (Expenses)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON expenses;
CREATE POLICY "enable_all_for_authenticated" ON expenses
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 22. سندات القبض (Receipt Vouchers)
ALTER TABLE receipt_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON receipt_vouchers;
CREATE POLICY "enable_all_for_authenticated" ON receipt_vouchers
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 23. حركة الخزينة (Treasury Transactions)
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON treasury_transactions;
CREATE POLICY "enable_all_for_authenticated" ON treasury_transactions
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 24. المنتجات المركبة (Composite Products)
ALTER TABLE composite_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON composite_products;
CREATE POLICY "enable_all_for_authenticated" ON composite_products
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 25. مكونات المنتجات المركبة (Composite Product Items)
ALTER TABLE composite_product_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON composite_product_items;
CREATE POLICY "enable_all_for_authenticated" ON composite_product_items
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 26. مصروفات مالية (Finance Expenses) - إن وجد
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_expenses') THEN
    ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "enable_all_for_authenticated" ON finance_expenses;
    CREATE POLICY "enable_all_for_authenticated" ON finance_expenses
      FOR ALL USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
