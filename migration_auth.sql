-- ============================================
-- 1. تشغيل RLS على كل الجداول
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE safes_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. إزالة عمود password من profiles (صار بـ auth.users)
-- ============================================
ALTER TABLE profiles DROP COLUMN IF EXISTS password;

-- ============================================
-- 3. Policies لكل الجداول
-- ============================================

-- 3a. Profiles: authenticated users بس
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.role() = 'authenticated');

-- 3b. Business tables: authenticated users
CREATE POLICY "clients_all" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "invoices_all" ON invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "products_all" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "weight_records_all" ON weight_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "client_notes_all" ON client_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "warehouses_all" ON warehouses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "warehouse_stock_all" ON warehouse_stock FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "inventory_vouchers_all" ON inventory_vouchers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "purchase_vendors_all" ON purchase_vendors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "purchase_invoices_all" ON purchase_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "purchase_returns_all" ON purchase_returns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "purchase_vendor_payments_all" ON purchase_vendor_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "expenses_all" ON expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "receipt_vouchers_all" ON receipt_vouchers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "safes_banks_all" ON safes_banks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "chart_of_accounts_all" ON chart_of_accounts FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 4. RPC لجلب البريد الإلكتروني للمستخدم (لتسجيل الدخول)
-- ============================================
CREATE OR REPLACE FUNCTION get_profile_for_login(p_username TEXT)
RETURNS TABLE (id UUID, email TEXT, username TEXT, name TEXT, role TEXT, active BOOLEAN, permissions JSONB)
SECURITY DEFINER
AS $$
  SELECT id, email, username, name, role, active, permissions
  FROM profiles
  WHERE LOWER(username) = LOWER(p_username) AND active = true;
$$ LANGUAGE sql;
