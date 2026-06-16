-- ============================================
-- Daftra ERP — Full Supabase Migration
-- قم بتشغيل هذا الكود كاملاً في SQL Editor
-- ============================================

-- 1. PROFILES (موجود — نضيف العمود الناقص)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. PRODUCTS (موجود — نضيف الأعمدة الناقصة)
ALTER TABLE products ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'نشط';
ALTER TABLE products ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax1 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax2 DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_selling_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS alert_quantity DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '';

-- 3. WAREHOUSES
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manager TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  location TEXT DEFAULT '',
  status TEXT DEFAULT 'نشط',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. WAREHOUSE STOCK
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

-- 5. INVENTORY VOUCHERS
CREATE TABLE IF NOT EXISTS inventory_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number TEXT NOT NULL,
  source TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  identifier TEXT DEFAULT '',
  warehouse TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  supplier_name TEXT DEFAULT '',
  status TEXT DEFAULT 'مسودة',
  added_by TEXT DEFAULT '',
  product_name TEXT DEFAULT '',
  date TEXT DEFAULT '',
  type TEXT DEFAULT '',
  items_count INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PURCHASE VENDORS
CREATE TABLE IF NOT EXISTS purchase_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vendor_number TEXT DEFAULT '',
  company TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  mobile TEXT DEFAULT '',
  email TEXT DEFAULT '',
  currency TEXT DEFAULT 'EGP',
  address1 TEXT DEFAULT '',
  address2 TEXT DEFAULT '',
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  zip_code TEXT DEFAULT '',
  country TEXT DEFAULT '',
  commercial_registry TEXT DEFAULT '',
  tax_card TEXT DEFAULT '',
  opening_balance DECIMAL(10,2) DEFAULT 0,
  opening_balance_date TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  contacts JSONB DEFAULT '[]',
  secondary_address JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PURCHASE INVOICES
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  date TEXT DEFAULT '',
  issue_date TEXT DEFAULT '',
  vendor_name TEXT DEFAULT '',
  vendor_id UUID REFERENCES purchase_vendors(id),
  sales_agent TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  discount_type TEXT DEFAULT 'amount',
  discount_value DECIMAL(10,2) DEFAULT 0,
  adjustment DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  already_paid BOOLEAN DEFAULT false,
  payment_method TEXT DEFAULT '',
  payment_reference TEXT DEFAULT '',
  currency TEXT DEFAULT 'EGP',
  billing_template TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. PURCHASE RETURNS
CREATE TABLE IF NOT EXISTS purchase_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL,
  date TEXT DEFAULT '',
  issue_date TEXT DEFAULT '',
  vendor_name TEXT DEFAULT '',
  vendor_id UUID REFERENCES purchase_vendors(id),
  sales_agent TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  discount_type TEXT DEFAULT 'amount',
  discount_value DECIMAL(10,2) DEFAULT 0,
  adjustment DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  already_paid BOOLEAN DEFAULT false,
  payment_method TEXT DEFAULT '',
  payment_reference TEXT DEFAULT '',
  currency TEXT DEFAULT 'EGP',
  billing_template TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. PURCHASE VENDOR PAYMENTS
CREATE TABLE IF NOT EXISTS purchase_vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL,
  invoice_number TEXT DEFAULT '',
  vendor_id UUID REFERENCES purchase_vendors(id),
  vendor_name TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  amount DECIMAL(10,2) DEFAULT 0,
  payment_date TEXT DEFAULT '',
  created_date TEXT DEFAULT '',
  status TEXT DEFAULT 'Draft',
  identifier TEXT DEFAULT '',
  creator_name TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT DEFAULT '',
  amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  description TEXT DEFAULT '',
  date TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  seller TEXT DEFAULT '',
  category TEXT DEFAULT '',
  sub_account TEXT DEFAULT '',
  vendor_id TEXT DEFAULT '',
  vendor_name TEXT DEFAULT '',
  taxes TEXT DEFAULT '',
  is_recurring BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. RECEIPT VOUCHERS
CREATE TABLE IF NOT EXISTS receipt_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT DEFAULT '',
  amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  description TEXT DEFAULT '',
  date TEXT DEFAULT '',
  seller TEXT DEFAULT '',
  category TEXT DEFAULT '',
  sub_account TEXT DEFAULT '',
  taxes TEXT DEFAULT '',
  is_recurring BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. SAFES & BANKS
CREATE TABLE IF NOT EXISTS safes_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('safe','bank')),
  bank_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  currency TEXT DEFAULT 'EGP',
  status TEXT DEFAULT 'active',
  is_main BOOLEAN DEFAULT false,
  description TEXT DEFAULT '',
  balance DECIMAL(10,2) DEFAULT 0,
  deposit_permission TEXT DEFAULT '',
  withdraw_permission TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. CHART OF ACCOUNTS
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES chart_of_accounts(id),
  type TEXT NOT NULL CHECK (type IN ('debit','credit')),
  account_type TEXT NOT NULL CHECK (account_type IN ('main','sub')),
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- إلغاء RLS على كل الجداول الجديدة
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_vendor_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE safes_banks DISABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts DISABLE ROW LEVEL SECURITY;
