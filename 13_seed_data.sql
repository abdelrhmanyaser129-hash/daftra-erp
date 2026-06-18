-- =============================================
-- 13_seed_data.sql
-- Seed demo data for testing
-- Run in Supabase SQL Editor once after all migrations
-- =============================================

-- 1. Clients (عملاء)
INSERT INTO clients (type, name, full_name, first_name, last_name, email, phone, mobile, address1, city, region, country, code_number, currency, notes, category, billing_method, balance, national_id)
SELECT 'individual', 'عبدالرحمن', 'عبدالرحمن', 'عبدالرحمن', '', 'abdelrahman@example.com', '0223456789', '01002345678', 'شارع النيل', 'القاهرة', 'القاهرة الكبرى', 'مصر (EG)', '000001', 'EGP', 'عميل مميز', 'عملاء مميزون', 'طباعة', 0, '29810150102345'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE code_number = '000001');

INSERT INTO clients (type, name, full_name, first_name, last_name, email, phone, mobile, address1, city, region, country, code_number, currency, notes, category, billing_method, balance, national_id)
SELECT 'individual', 'سارة أحمد', 'سارة أحمد', 'سارة', 'أحمد', 'sara.ahmed@example.com', '01556789012', '01556789012', 'شارع الجمهورية', 'أسيوط', 'صعيد مصر', 'مصر (EG)', '000002', 'EGP', 'عميل فردي', 'أفراد طباعة', 'طباعة', 0, '29302140105678'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE code_number = '000002');

-- 2. Products (منتجات)
INSERT INTO products (name, code, selling_price, tax1, quantity, status)
SELECT 'منتج أ', 'PROD-001', 500.00, 14, 100, 'نشط'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'PROD-001');

INSERT INTO products (name, code, selling_price, tax1, quantity, status)
SELECT 'منتج ب', 'PROD-002', 1200.00, 14, 50, 'نشط'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'PROD-002');

-- 3. Warehouse (مستودع)
INSERT INTO warehouses (name, status, is_default)
SELECT 'المستودع الرئيسي', 'نشط', true
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE name = 'المستودع الرئيسي');

-- 4. Safes/Banks (خزنة)
INSERT INTO safes_banks (name, type, balance, is_main, currency, status)
SELECT 'الخزنة الرئيسية', 'safe', 50000.00, true, 'EGP', 'active'
WHERE NOT EXISTS (SELECT 1 FROM safes_banks WHERE name = 'الخزنة الرئيسية');

-- 5. Invoice (فاتورة مدفوعة) with items
DO $$
DECLARE
  v_client_id UUID;
  v_product_a_id UUID;
  v_warehouse_id UUID;
  v_safe_id UUID;
  v_invoice_id UUID;
  v_items JSONB;
BEGIN
  SELECT id INTO v_client_id FROM clients WHERE code_number = '000001' LIMIT 1;
  SELECT id INTO v_product_a_id FROM products WHERE code = 'PROD-001' LIMIT 1;
  SELECT id INTO v_warehouse_id FROM warehouses WHERE name = 'المستودع الرئيسي' LIMIT 1;
  SELECT id INTO v_safe_id FROM safes_banks WHERE name = 'الخزنة الرئيسية' LIMIT 1;

  IF v_client_id IS NULL OR v_product_a_id IS NULL OR v_warehouse_id IS NULL OR v_safe_id IS NULL THEN
    RAISE NOTICE 'Skipping invoice seed: required reference data not found';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM invoices WHERE invoice_number = '000001') THEN
    RAISE NOTICE 'Invoice 000001 already exists, skipping';
    RETURN;
  END IF;

  v_items := jsonb_build_array(
    jsonb_build_object(
      'id', 'seed-item-1',
      'productId', v_product_a_id,
      'itemName', 'منتج أ',
      'description', 'منتج تجريبي',
      'unitPrice', 500.00,
      'quantity', 2,
      'discount', 0,
      'taxValue', 14,
      'total', 1140.00
    )
  );

  INSERT INTO invoices (
    invoice_number, client_id, client_name, items, total, status, notes,
    date, issue_date, sales_agent, payment_terms,
    discount_type, discount_value, adjustment, subtotal, already_paid,
    currency, warehouse_id, treasury_id, payment_method,
    deposit_amount, remaining_amount
  ) VALUES (
    '000001', v_client_id, 'عبدالرحمن', v_items, 1140.00, 'paid',
    'شكراً لتعاملكم معنا. الرجاء تسديد قيمة المستحق في موعد غايته شروط الفاتورة.',
    '2026-06-05', '2026-06-05', 'Abdo Yaser #000001', '',
    'percentage', 0, 0, 1000.00, true,
    'EGP', v_warehouse_id, v_safe_id, 'نقدا',
    1140.00, 0.00
  )
  RETURNING id INTO v_invoice_id;

  -- Inventory movement (حركة مخزنية)
  INSERT INTO inventory_movements (
    product_id, warehouse_id, movement_type,
    reference_type, reference_id, reference_number,
    qty_before, qty_change, qty_after, created_by
  ) VALUES (
    v_product_a_id, v_warehouse_id, 'sale',
    'invoice', v_invoice_id, '000001',
    100, -2, 98, 'Abdo Yaser #000001'
  );

  -- Warehouse stock update
  INSERT INTO warehouse_stock (product_id, warehouse_id, quantity)
  VALUES (v_product_a_id, v_warehouse_id, 98)
  ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = 98;

  -- Treasury transaction (معاملة مالية للخزنة)
  INSERT INTO treasury_transactions (
    treasury_id, transaction_type,
    reference_type, reference_id, reference_number,
    description, amount, balance_before, balance_after, created_by
  ) VALUES (
    v_safe_id, 'sale_payment',
    'invoice', v_invoice_id, '000001',
    'تحصيل دفعة 1140 ج.م من عبدالرحمن - فاتورة 000001',
    1140.00, 50000.00, 51140.00, 'Abdo Yaser #000001'
  );
END $$;

-- =============================================
-- Summary
-- Seeded: 2 clients (عبدالرحمن, سارة أحمد)
--         2 products (منتج أ, منتج ب)
--         1 warehouse (المستودع الرئيسي)
--         1 safe (الخزنة الرئيسية)
--         1 paid invoice with items, movement, stock, treasury transaction
-- =============================================
