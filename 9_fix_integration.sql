-- =============================================
-- 9_fix_integration.sql
-- Inventory movements, treasury transactions, 
-- product dropdown fields, customer statement
-- =============================================

-- 1. Inventory movement history table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  movement_type TEXT NOT NULL, -- 'sale', 'purchase', 'sale_return', 'purchase_return', 'adjustment', 'transfer'
  reference_type TEXT NOT NULL, -- 'invoice', 'purchase_invoice', 'purchase_return', 'returned_invoice', 'inventory_voucher'
  reference_id TEXT NOT NULL,
  reference_number TEXT DEFAULT '',
  qty_before DECIMAL(10,2) NOT NULL,
  qty_change DECIMAL(10,2) NOT NULL,
  qty_after DECIMAL(10,2) NOT NULL,
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_mov_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_created ON inventory_movements(created_at);

-- 2. Treasury / bank transaction history table
CREATE TABLE IF NOT EXISTS treasury_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasury_id UUID REFERENCES safes_banks(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'sale_payment', 'purchase_payment', 'receipt_voucher', 'payment_voucher', 'expense', 'deposit', 'withdrawal', 'transfer'
  reference_type TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  reference_number TEXT DEFAULT '',
  description TEXT DEFAULT '',
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treasury_tx_treasury ON treasury_transactions(treasury_id);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_created ON treasury_transactions(created_at);

-- 3. Add treasury_id and payment fields to invoices (sales invoices)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS treasury_id UUID REFERENCES safes_banks(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_reference TEXT DEFAULT '';

-- 4. Add treasury_id and payment_method to purchase_returns
ALTER TABLE purchase_returns ADD COLUMN IF NOT EXISTS treasury_id UUID REFERENCES safes_banks(id);
ALTER TABLE purchase_returns ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT '';

-- 5. Add warehouse_id to invoices and purchase_returns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);
ALTER TABLE purchase_returns ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

-- 6. Add returned_invoices table if not exists (sales returns)
CREATE TABLE IF NOT EXISTS returned_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  client_id UUID REFERENCES clients(id),
  client_name TEXT DEFAULT '',
  date TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  total DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT DEFAULT '',
  warehouse_id UUID REFERENCES warehouses(id),
  treasury_id UUID REFERENCES safes_banks(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Add missing columns to existing tables for integration
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS treasury_id UUID REFERENCES safes_banks(id);
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;

-- 8. Add client balance tracking
ALTER TABLE clients ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;
