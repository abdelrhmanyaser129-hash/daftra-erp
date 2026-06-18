-- =============================================
-- 14_financial_core_refactor.sql
-- Phase 1 financial core persistence
-- Scope: treasury, customers, sales invoices, customer payments, sales returns, statements
-- =============================================

-- 1. Customer opening balances and treasury opening balances
ALTER TABLE clients ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS opening_balance_date TEXT DEFAULT '';

ALTER TABLE safes_banks ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE safes_banks ADD COLUMN IF NOT EXISTS opening_balance_date TEXT DEFAULT '';

UPDATE safes_banks
SET opening_balance = COALESCE(opening_balance, balance, 0)
WHERE COALESCE(opening_balance, 0) = 0
  AND COALESCE(balance, 0) <> 0;

-- 2. Durable customer payment table
CREATE TABLE IF NOT EXISTS customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT UNIQUE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  invoice_number TEXT DEFAULT '',
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT DEFAULT '',
  treasury_id UUID REFERENCES safes_banks(id),
  payment_method TEXT DEFAULT '',
  amount DECIMAL(10,2) DEFAULT 0,
  payment_date TEXT DEFAULT '',
  status TEXT DEFAULT 'completed',
  notes TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_payments_invoice ON customer_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_client ON customer_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_treasury ON customer_payments(treasury_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_created ON customer_payments(created_at);

ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_payments_all" ON customer_payments;
CREATE POLICY "customer_payments_all" ON customer_payments FOR ALL USING (auth.role() = 'authenticated');

-- 3. Sales return payment metadata and invoice financial fields
ALTER TABLE returned_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0;

-- 4. Backfill durable customer payments from invoices that already carried paid/deposit amounts.
INSERT INTO customer_payments (
  payment_number, invoice_id, invoice_number, client_id, client_name, treasury_id,
  payment_method, amount, payment_date, status, notes, created_by, created_at
)
SELECT
  'PAY-' || LPAD(ROW_NUMBER() OVER (ORDER BY i.created_at, i.id)::TEXT, 6, '0') AS payment_number,
  i.id,
  i.invoice_number,
  i.client_id,
  i.client_name,
  i.treasury_id,
  COALESCE(NULLIF(i.payment_method, ''), 'opening invoice payment'),
  COALESCE(NULLIF(i.deposit_amount, 0), NULLIF(i.paid, 0), i.total, 0),
  COALESCE(NULLIF(i.date, ''), i.created_at::DATE::TEXT),
  'completed',
  'Backfilled from existing sales invoice payment data',
  COALESCE(NULLIF(i.sales_agent, ''), 'migration'),
  i.created_at
FROM invoices i
WHERE COALESCE(NULLIF(i.deposit_amount, 0), NULLIF(i.paid, 0), CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM customer_payments cp
    WHERE cp.invoice_id = i.id
  );

-- 5. Opening-balance treasury transaction rows, one per safe/bank.
INSERT INTO treasury_transactions (
  treasury_id, transaction_type, reference_type, reference_id, reference_number,
  description, amount, balance_before, balance_after, created_by, created_at
)
SELECT
  sb.id,
  'opening_balance',
  'safes_banks',
  sb.id::TEXT,
  'OPENING',
  'Opening balance',
  COALESCE(sb.opening_balance, 0),
  0,
  COALESCE(sb.opening_balance, 0),
  'migration',
  sb.created_at
FROM safes_banks sb
WHERE COALESCE(sb.opening_balance, 0) <> 0
  AND NOT EXISTS (
    SELECT 1 FROM treasury_transactions tt
    WHERE tt.treasury_id = sb.id
      AND tt.transaction_type = 'opening_balance'
      AND tt.reference_type = 'safes_banks'
  );

-- 6. Recalculate invoice paid/remaining/status from persisted payments and returns.
WITH invoice_totals AS (
  SELECT
    i.id,
    COALESCE(i.total, 0) AS total,
    COALESCE(p.paid_amount, 0) AS paid_amount,
    COALESCE(r.returned_amount, 0) AS returned_amount
  FROM invoices i
  LEFT JOIN (
    SELECT invoice_id, SUM(amount) AS paid_amount
    FROM customer_payments
    WHERE status = 'completed'
    GROUP BY invoice_id
  ) p ON p.invoice_id = i.id
  LEFT JOIN (
    SELECT invoice_id, SUM(total) AS returned_amount
    FROM returned_invoices
    GROUP BY invoice_id
  ) r ON r.invoice_id = i.id
)
UPDATE invoices i
SET
  paid = invoice_totals.paid_amount,
  deposit_amount = invoice_totals.paid_amount,
  remaining_amount = GREATEST(0, invoice_totals.total - invoice_totals.paid_amount - invoice_totals.returned_amount),
  status = CASE
    WHEN i.status = 'draft' THEN 'draft'
    WHEN invoice_totals.returned_amount >= invoice_totals.total AND invoice_totals.total > 0 THEN 'returned'
    WHEN invoice_totals.returned_amount > 0 THEN 'partially_returned'
    WHEN invoice_totals.paid_amount >= invoice_totals.total THEN 'paid'
    WHEN invoice_totals.paid_amount > 0 THEN 'partial'
    ELSE 'unpaid'
  END,
  already_paid = invoice_totals.paid_amount >= invoice_totals.total AND invoice_totals.total > 0
FROM invoice_totals
WHERE i.id = invoice_totals.id;

-- 7. Recalculate customer balances from persisted transactions.
WITH customer_totals AS (
  SELECT
    c.id,
    COALESCE(c.opening_balance, 0)
      + COALESCE(inv.total_sales, 0)
      - COALESCE(pay.total_payments, 0)
      - COALESCE(ret.total_returns, 0) AS balance
  FROM clients c
  LEFT JOIN (
    SELECT client_id, SUM(total) AS total_sales
    FROM invoices
    WHERE status <> 'draft'
    GROUP BY client_id
  ) inv ON inv.client_id = c.id
  LEFT JOIN (
    SELECT client_id, SUM(amount) AS total_payments
    FROM customer_payments
    WHERE status = 'completed'
    GROUP BY client_id
  ) pay ON pay.client_id = c.id
  LEFT JOIN (
    SELECT client_id, SUM(total) AS total_returns
    FROM returned_invoices
    GROUP BY client_id
  ) ret ON ret.client_id = c.id
)
UPDATE clients c
SET balance = customer_totals.balance
FROM customer_totals
WHERE c.id = customer_totals.id;
