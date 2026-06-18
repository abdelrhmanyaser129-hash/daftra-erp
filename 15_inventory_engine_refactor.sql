-- =============================================
-- 15_inventory_engine_refactor.sql
-- Phase 2 inventory engine persistence
-- Scope: opening stock, stock-from-movements calculation
-- =============================================

-- 1. Opening stock support for warehouse_stock
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS opening_stock DECIMAL(10,2) DEFAULT 0;

-- 2. Function to calculate current stock from opening_stock + movement history
CREATE OR REPLACE FUNCTION calculate_stock_from_movements(p_product_id UUID, p_warehouse_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_opening DECIMAL(10,2);
  v_movement_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(opening_stock, 0) INTO v_opening
  FROM warehouse_stock
  WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;

  SELECT COALESCE(SUM(qty_change), 0) INTO v_movement_total
  FROM inventory_movements
  WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;

  RETURN v_opening + v_movement_total;
END;
$$;

-- 3. Function to recalculate and update all warehouse_stock rows from movement history
CREATE OR REPLACE FUNCTION refresh_all_stock_from_movements()
RETURNS TABLE(product_id UUID, warehouse_id UUID, old_quantity DECIMAL, new_quantity DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  FOR product_id, warehouse_id, old_quantity IN
    SELECT ws.product_id, ws.warehouse_id, ws.quantity
    FROM warehouse_stock ws
  LOOP
    new_quantity := calculate_stock_from_movements(product_id, warehouse_id);
    IF old_quantity IS DISTINCT FROM new_quantity THEN
      UPDATE warehouse_stock
      SET quantity = new_quantity
      WHERE warehouse_stock.product_id = product_id
        AND warehouse_stock.warehouse_id = warehouse_id;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- 4. Add treasury reference to vendor payments (Phase 3)
ALTER TABLE purchase_vendor_payments ADD COLUMN IF NOT EXISTS treasury_id UUID REFERENCES safes_banks(id);

-- 5. RLS for inventory_movements (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_movements') THEN
    ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "inventory_movements_all" ON inventory_movements;
    CREATE POLICY "inventory_movements_all" ON inventory_movements FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END
$$;
