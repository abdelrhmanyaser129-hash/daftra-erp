import { supabase } from './supabase';

export const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

type MovementType = 'sale' | 'purchase' | 'sale_return' | 'purchase_return' | 'adjustment' | 'transfer' | 'restore' | 'opening_balance';
type ReferenceType = 'invoice' | 'purchase_invoice' | 'purchase_return' | 'purchase_return_deleted' | 'returned_invoice' | 'inventory_voucher' | 'invoice_deleted' | 'warehouse' | 'composite_deduction';

export const recordInventoryMovement = async ({
  productId,
  warehouseId,
  movementType,
  referenceType,
  referenceId,
  referenceNumber,
  qtyChange,
  createdBy = 'system',
}: {
  productId: string;
  warehouseId: string;
  movementType: MovementType;
  referenceType: ReferenceType;
  referenceId: string;
  referenceNumber: string;
  qtyChange: number;
  createdBy?: string;
}) => {
  const { data: stock } = await supabase
    .from('warehouse_stock')
    .select('quantity')
    .eq('product_id', productId)
    .eq('warehouse_id', warehouseId)
    .maybeSingle();

  const qtyBefore = stock ? toNumber(stock.quantity) : 0;
  const qtyAfter = qtyBefore + qtyChange;

  const { error: upsertError } = await supabase
    .from('warehouse_stock')
    .upsert({
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: qtyAfter,
    }, { onConflict: 'product_id,warehouse_id' });

  if (upsertError) throw upsertError;

  const { error: insertError } = await supabase
    .from('inventory_movements')
    .insert({
      product_id: productId,
      warehouse_id: warehouseId,
      movement_type: movementType,
      reference_type: referenceType,
      reference_id: referenceId,
      reference_number: referenceNumber,
      qty_before: qtyBefore,
      qty_change: qtyChange,
      qty_after: qtyAfter,
      created_by: createdBy,
    });

  if (insertError) throw insertError;

  return { qtyBefore, qtyAfter };
};

export const calculateProductStock = async (productId: string, warehouseId: string): Promise<number> => {
  const { data, error } = await supabase
    .rpc('calculate_stock_from_movements', {
      p_product_id: productId,
      p_warehouse_id: warehouseId,
    });

  if (error) throw error;
  return toNumber(data);
};

export const refreshProductStock = async (productId: string, warehouseId: string): Promise<number> => {
  const calculated = await calculateProductStock(productId, warehouseId);

  await supabase
    .from('warehouse_stock')
    .upsert({
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: calculated,
    }, { onConflict: 'product_id,warehouse_id' });

  return calculated;
};

export const addOpeningStock = async ({
  productId,
  warehouseId,
  quantity,
  createdBy = 'system',
}: {
  productId: string;
  warehouseId: string;
  quantity: number;
  createdBy?: string;
}) => {
  const { data: existing } = await supabase
    .from('warehouse_stock')
    .select('id, opening_stock, quantity')
    .eq('product_id', productId)
    .eq('warehouse_id', warehouseId)
    .maybeSingle();

  if (existing && toNumber(existing.opening_stock) > 0) {
    throw new Error('Opening stock already exists for this product in this warehouse');
  }

  await supabase
    .from('warehouse_stock')
    .upsert({
      product_id: productId,
      warehouse_id: warehouseId,
      opening_stock: quantity,
      quantity: quantity,
    }, { onConflict: 'product_id,warehouse_id' });

  await recordInventoryMovement({
    productId,
    warehouseId,
    movementType: 'opening_balance',
    referenceType: 'invoice',
    referenceId: productId,
    referenceNumber: 'OPENING',
    qtyChange: quantity,
    createdBy,
  });
};
