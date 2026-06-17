-- Migration 12: Add deposit, remaining, shipping fields to invoices

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_company TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS tracking_number TEXT DEFAULT '';
