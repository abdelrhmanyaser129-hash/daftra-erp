-- إضافة أعمدة متابعة العميل
ALTER TABLE clients ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_weight DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_follow_up TEXT DEFAULT '';

-- إصلاح جدول متابعة الوزن - إضافة عمود التاريخ
ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '';
ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT now();
