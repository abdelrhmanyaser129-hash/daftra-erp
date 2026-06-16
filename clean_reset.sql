-- ============================================================
-- DAFTRA ERP — FULL RESET
-- آمن للتشغيل المتكرر (idempotent)
-- ============================================================

-- 1. حذف كل الجداول
DROP TABLE IF EXISTS chart_of_accounts CASCADE;
DROP TABLE IF EXISTS receipt_vouchers CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS purchase_vendor_payments CASCADE;
DROP TABLE IF EXISTS purchase_returns CASCADE;
DROP TABLE IF EXISTS purchase_invoices CASCADE;
DROP TABLE IF EXISTS purchase_vendors CASCADE;
DROP TABLE IF EXISTS inventory_vouchers CASCADE;
DROP TABLE IF EXISTS warehouse_stock CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS client_notes CASCADE;
DROP TABLE IF EXISTS weight_records CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. إنشاء الجداول
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin','accountant','sales','inventory','custom')),
  active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT, phone2 TEXT, address TEXT, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  client_name TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  total DECIMAL(10,2) DEFAULT 0,
  paid DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  due_date DATE
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT DEFAULT '', barcode TEXT DEFAULT '', category TEXT DEFAULT '',
  brand TEXT DEFAULT '', status TEXT DEFAULT 'نشط', item_type TEXT DEFAULT '',
  supplier_id TEXT DEFAULT '', description TEXT DEFAULT '',
  is_online BOOLEAN DEFAULT false, is_featured BOOLEAN DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0, cost DECIMAL(10,2) DEFAULT 0,
  purchase_price DECIMAL(10,2) DEFAULT 0, selling_price DECIMAL(10,2) DEFAULT 0,
  quantity DECIMAL(10,2) DEFAULT 0,
  tax1 DECIMAL(10,2) DEFAULT 0, tax2 DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0, discount_type TEXT DEFAULT '',
  min_selling_price DECIMAL(10,2) DEFAULT 0, profit_margin DECIMAL(10,2) DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true, alert_quantity DECIMAL(10,2) DEFAULT 0,
  internal_notes TEXT DEFAULT '', tags TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  weight DECIMAL(10,2) NOT NULL,
  fat_percentage DECIMAL(5,2), muscle_percentage DECIMAL(5,2),
  water_percentage DECIMAL(5,2), notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, manager TEXT DEFAULT '', phone TEXT DEFAULT '',
  location TEXT DEFAULT '', status TEXT DEFAULT 'نشط', is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL, warehouse_id UUID NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

CREATE TABLE inventory_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number TEXT NOT NULL, source TEXT DEFAULT '', branch TEXT DEFAULT '',
  identifier TEXT DEFAULT '', warehouse TEXT DEFAULT '', client_name TEXT DEFAULT '',
  supplier_name TEXT DEFAULT '', status TEXT DEFAULT 'مسودة',
  added_by TEXT DEFAULT '', product_name TEXT DEFAULT '',
  date TEXT DEFAULT '', type TEXT DEFAULT '', items_count INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, vendor_number TEXT DEFAULT '', company TEXT DEFAULT '',
  phone TEXT DEFAULT '', mobile TEXT DEFAULT '', email TEXT DEFAULT '',
  currency TEXT DEFAULT 'EGP',
  address1 TEXT DEFAULT '', address2 TEXT DEFAULT '', city TEXT DEFAULT '',
  region TEXT DEFAULT '', zip_code TEXT DEFAULT '', country TEXT DEFAULT '',
  commercial_registry TEXT DEFAULT '', tax_card TEXT DEFAULT '',
  opening_balance DECIMAL(10,2) DEFAULT 0, opening_balance_date TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  contacts JSONB DEFAULT '[]', secondary_address JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL, date TEXT DEFAULT '', issue_date TEXT DEFAULT '',
  vendor_name TEXT DEFAULT '', vendor_id UUID REFERENCES purchase_vendors(id),
  sales_agent TEXT DEFAULT '', payment_terms TEXT DEFAULT '',
  items JSONB DEFAULT '[]', status TEXT DEFAULT 'draft',
  discount_type TEXT DEFAULT 'amount', discount_value DECIMAL(10,2) DEFAULT 0,
  adjustment DECIMAL(10,2) DEFAULT 0, subtotal DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0, notes TEXT DEFAULT '',
  already_paid BOOLEAN DEFAULT false, payment_method TEXT DEFAULT '',
  payment_reference TEXT DEFAULT '', currency TEXT DEFAULT 'EGP',
  billing_template TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL, date TEXT DEFAULT '', issue_date TEXT DEFAULT '',
  vendor_name TEXT DEFAULT '', vendor_id UUID REFERENCES purchase_vendors(id),
  sales_agent TEXT DEFAULT '', payment_terms TEXT DEFAULT '',
  items JSONB DEFAULT '[]', status TEXT DEFAULT 'draft',
  discount_type TEXT DEFAULT 'amount', discount_value DECIMAL(10,2) DEFAULT 0,
  adjustment DECIMAL(10,2) DEFAULT 0, subtotal DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0, notes TEXT DEFAULT '',
  already_paid BOOLEAN DEFAULT false, payment_method TEXT DEFAULT '',
  payment_reference TEXT DEFAULT '', currency TEXT DEFAULT 'EGP',
  billing_template TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL, invoice_number TEXT DEFAULT '',
  vendor_id UUID REFERENCES purchase_vendors(id), vendor_name TEXT DEFAULT '',
  payment_method TEXT DEFAULT '', amount DECIMAL(10,2) DEFAULT 0,
  payment_date TEXT DEFAULT '', created_date TEXT DEFAULT '',
  status TEXT DEFAULT 'Draft', identifier TEXT DEFAULT '',
  creator_name TEXT DEFAULT '', notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT DEFAULT '', amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EGP', description TEXT DEFAULT '',
  date TEXT DEFAULT '', unit TEXT DEFAULT '', seller TEXT DEFAULT '',
  category TEXT DEFAULT '', sub_account TEXT DEFAULT '',
  vendor_id TEXT DEFAULT '', vendor_name TEXT DEFAULT '', taxes TEXT DEFAULT '',
  is_recurring BOOLEAN DEFAULT false, status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE receipt_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT DEFAULT '', amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EGP', description TEXT DEFAULT '',
  date TEXT DEFAULT '', seller TEXT DEFAULT '', category TEXT DEFAULT '',
  sub_account TEXT DEFAULT '', taxes TEXT DEFAULT '',
  is_recurring BOOLEAN DEFAULT false, status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE safes_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('safe','bank')),
  bank_name TEXT DEFAULT '', account_number TEXT DEFAULT '',
  currency TEXT DEFAULT 'EGP', status TEXT DEFAULT 'active',
  is_main BOOLEAN DEFAULT false, description TEXT DEFAULT '',
  balance DECIMAL(10,2) DEFAULT 0,
  deposit_permission TEXT DEFAULT '', withdraw_permission TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL, name TEXT NOT NULL,
  parent_id UUID REFERENCES chart_of_accounts(id),
  type TEXT NOT NULL CHECK (type IN ('debit','credit')),
  account_type TEXT NOT NULL CHECK (account_type IN ('main','sub')),
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
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

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.role() = 'authenticated');
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

-- RPC function for login
CREATE OR REPLACE FUNCTION get_profile_for_login(p_username TEXT)
RETURNS TABLE (id UUID, email TEXT, username TEXT, name TEXT, role TEXT, active BOOLEAN, permissions JSONB)
SECURITY DEFINER
AS $$
  SELECT id, email, username, name, role, active, permissions
  FROM profiles
  WHERE LOWER(username) = LOWER(p_username) AND active = true;
$$ LANGUAGE sql;
