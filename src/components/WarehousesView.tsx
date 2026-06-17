/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft,
  Info,
  Search,
  CheckCircle,
  Boxes,
  AlertOctagon,
  AlertTriangle,
  Minus,
  Plus
} from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  manager: string;
  phone: string;
  location: string;
  status: 'نشط' | 'غير نشط';
  isDefault?: boolean;
}

interface Product {
  id: string;
  name: string;
  code: string;
  barcode: string;
  category: string;
  brand: string;
  status: 'نشط' | 'غير نشط';
  purchasePrice?: string;
  sellingPrice?: string;
  alertQuantity?: string;
  trackInventory?: boolean;
}

interface WarehouseStock {
  [productId: string]: {
    [warehouseId: string]: number;
  };
}

interface WarehousesViewProps {
  setView: (view: string) => void;
}



export default function WarehousesView({ setView }: WarehousesViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<WarehouseStock>({});
  
  // Filtering & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('الكل');

  // Interactive manual edits
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string>('');

  // Loaded at mount
  useEffect(() => {
    const loadData = async () => {
      // Fetch default warehouse id
      const { data: warehouseData } = await supabase
        .from('warehouses')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (warehouseData) setDefaultWarehouseId(warehouseData.id);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, code, barcode, category, brand, status, purchase_price, selling_price, alert_quantity, track_inventory');
      let prodList: Product[] = [];
      if (productsData && productsData.length > 0) {
        prodList = productsData.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          code: p.code as string,
          barcode: p.barcode as string,
          category: p.category as string,
          brand: p.brand as string,
          status: p.status as 'نشط' | 'غير نشط',
          purchasePrice: p.purchase_price as string | undefined,
          sellingPrice: p.selling_price as string | undefined,
          alertQuantity: p.alert_quantity as string | undefined,
          trackInventory: p.track_inventory as boolean | undefined,
        }));
      }
      setProducts(prodList);

      // Fetch warehouse stock and build the WarehouseStock map
      const { data: stockData } = await supabase
        .from('warehouse_stock')
        .select('product_id, warehouse_id, quantity');
      const stockLevels: WarehouseStock = {};
      if (stockData && stockData.length > 0) {
        for (const s of stockData) {
          const pid = s.product_id as string;
          const wid = s.warehouse_id as string;
          if (!stockLevels[pid]) stockLevels[pid] = {};
          stockLevels[pid][wid] = Number(s.quantity);
        }
      }
      setStock(stockLevels);
    };
    loadData();
  }, []);

  // Save changes
  const reloadStock = async () => {
    const { data: stockData } = await supabase
      .from('warehouse_stock')
      .select('product_id, warehouse_id, quantity');
    const stockLevels: WarehouseStock = {};
    if (stockData && stockData.length > 0) {
      for (const s of stockData) {
        const pid = s.product_id as string;
        const wid = s.warehouse_id as string;
        if (!stockLevels[pid]) stockLevels[pid] = {};
        stockLevels[pid][wid] = Number(s.quantity);
      }
    }
    setStock(stockLevels);
  };

  const saveStockData = async (updatedStock: WarehouseStock) => {
    setStock(updatedStock);
    const warehouseId = defaultWarehouseId;
    if (!warehouseId) return;
    const records = Object.entries(updatedStock).flatMap(([productId, warehouses]) =>
      Object.entries(warehouses).map(([wid, quantity]) => ({
        product_id: productId,
        warehouse_id: wid,
        quantity,
      }))
    );
    const w1Records = records.filter(r => r.warehouse_id === warehouseId);
    if (w1Records.length > 0) {
      const { error } = await supabase
        .from('warehouse_stock')
        .upsert(w1Records, { onConflict: 'product_id, warehouse_id' });
      if (error) {
        console.error('Stock save failed:', error);
        alert('فشل حفظ المخزون');
      }
    }
    await reloadStock();
  };

  // Helper to extract stock level for w1
  const getProductQuantity = (productId: string, currentStock = stock): number => {
    if (!defaultWarehouseId) return 0;
    return currentStock[productId]?.[defaultWarehouseId] ?? 0;
  };

  // Helper to get warning level details
  const getProductClass = (product: Product, currentStock = stock) => {
    const qty = getProductQuantity(product.id, currentStock);
    const threshold = Number(product.alertQuantity) || 0;

    if (qty === 0) {
      return {
        label: 'نفد بالكامل 🛑',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        barColor: 'bg-rose-500',
        textWarning: 'انتهى المخزون تماماً من المستودع!',
        code: 'out'
      };
    }
    if (qty <= threshold) {
      return {
        label: 'على وشك النفاد ⚠️',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        barColor: 'bg-amber-500',
        textWarning: `باقي ${qty} وحدة فقط! (الحد الأدنى: ${threshold})`,
        code: 'low'
      };
    }
    return {
      label: 'رصيد آمن ✅',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-500',
      textWarning: `متوفر ${qty} قطعة (الرصيد مستقر)`,
      code: 'safe'
    };
  };

  // Quick action: +1
  const handleQuickIncrement = async (productId: string) => {
    const updatedStock = { ...stock };
    if (!updatedStock[productId]) {
      updatedStock[productId] = {};
    }
    const current = defaultWarehouseId ? (updatedStock[productId][defaultWarehouseId] ?? 0) : 0;
    if (defaultWarehouseId) updatedStock[productId][defaultWarehouseId] = current + 1;
    await saveStockData(updatedStock);
  };

  // Quick action: -1
  const handleQuickDecrement = async (productId: string) => {
    const updatedStock = { ...stock };
    if (!updatedStock[productId]) {
      updatedStock[productId] = {};
    }
    const current = defaultWarehouseId ? (updatedStock[productId][defaultWarehouseId] ?? 0) : 0;
    if (defaultWarehouseId) updatedStock[productId][defaultWarehouseId] = Math.max(0, current - 1);
    await saveStockData(updatedStock);
  };

  // Manual input set stock
  const handleSaveManualQuantity = async (productId: string, valStr: string) => {
    const numeric = Math.max(0, parseInt(valStr) || 0);
    const updatedStock = { ...stock };
    if (!updatedStock[productId]) {
      updatedStock[productId] = {};
    }
    if (defaultWarehouseId) updatedStock[productId][defaultWarehouseId] = numeric;
    await saveStockData(updatedStock);
    setEditingProductId(null);
  };

  // Filter products list
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    const statusDetail = getProductClass(prod);
    if (selectedStatus === 'low' && statusDetail.code !== 'low') return false;
    if (selectedStatus === 'out' && statusDetail.code !== 'out') return false;
    if (selectedStatus === 'safe' && statusDetail.code !== 'safe') return false;
    if (selectedStatus === 'low_or_out' && statusDetail.code === 'safe') return false;

    return true;
  });

  // Simple and polished visual stats
  const totalItems = products.length;
  const runningLowCount = products.filter(p => getProductClass(p).code === 'low').length;
  const outOfStockCount = products.filter(p => getProductClass(p).code === 'out').length;
  const safeCount = products.filter(p => getProductClass(p).code === 'safe').length;

  return (
    <div id="daftra-warehouses-view" className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 text-slate-800 antialiased animate-fadeIn leading-relaxed">
      
      {/* Title Bar & Back button */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-row-reverse text-xs gap-3">
        <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
          <span className="text-[#0074b1]">المستودع الرئيسي</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500">متابعة الأرصدة البسيطة والمتبقي</span>
        </div>

        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-[#0074b1] hover:bg-sky-50 px-4 py-2 rounded-lg border border-sky-100 transition-all font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>الرجوع للـوحة التحكم الرئيسية</span>
        </button>
      </div>

      {/* Simple Stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-row-reverse">
        
        {/* Total Products Monitored */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-between gap-3 text-right flex-row-reverse">
          <div className="p-3 bg-blue-50 text-[#0074b1] rounded-xl shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">إجمالي المنتجات</span>
            <span className="text-lg font-bold text-slate-800 block mt-0.5 font-mono">
              {totalItems} <span className="text-xs font-semibold text-slate-500">صنف مفعّل</span>
            </span>
          </div>
        </div>

        {/* Stable Stock */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-between gap-3 text-right flex-row-reverse">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">رصيد آمن ومستقر</span>
            <span className="text-lg font-bold text-emerald-600 block mt-0.5 font-mono">
              {safeCount} <span className="text-xs font-semibold text-slate-500">منتج متوفر</span>
            </span>
          </div>
        </div>

        {/* Low Stock count */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-between gap-3 text-right flex-row-reverse">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">على وشك النفاد</span>
            <span className="text-lg font-bold text-amber-500 block mt-0.5 font-mono">
              {runningLowCount} <span className="text-xs font-semibold text-slate-500">تستدعي الطلب</span>
            </span>
          </div>
        </div>

        {/* Depleted Completely */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-between gap-3 text-right flex-row-reverse">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">المنتهية من المخزن</span>
            <span className="text-lg font-bold text-rose-600 block mt-0.5 font-mono">
              {outOfStockCount} <span className="text-xs font-semibold text-slate-500">منتجات نفدت</span>
            </span>
          </div>
        </div>

      </div>

      {/* Info Tip - Quiet and Humble */}
      <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-2.5 flex-row-reverse leading-normal">
        <div className="p-1 text-[#0074b1] rounded-lg shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <span className="font-extrabold text-slate-800 block mb-0.5">متابعة وجرد كميات المخازن</span>
          <p>
            هذه الصفحة تتيح لك مراقبة المخزون الفعلي الحالي في المستودع الرئيسي للشركة بالجنيه المصري (ج.م). يمكنك تحديث الكميات المتبقية لكل بند مباشرة باستخدام زر الإضافة أو الحسم السريع، أو اضغط على الرقم لتعديله يدوياً.
          </p>
        </div>
      </div>

      {/* Modern Filter panel & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center flex-row-reverse text-right font-semibold">
        
        <div className="md:col-span-2 relative">
          <label className="block text-slate-500 font-bold text-[11px] mb-1">البحث عن منتج</label>
          <div className="relative">
            <input
              type="text"
              placeholder="اكتب اسم المنتج، الباركود أو الماركة للبحث الفوري..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 bg-white pr-8 text-right font-bold focus:outline-none focus:border-[#0074b1]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-slate-500 font-bold text-[11px] mb-1">فلترة حسب كفاية الأرصدة</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-slate-700 font-bold focus:outline-none focus:border-[#0074b1]"
          >
            <option value="الكل">كل الكميات والأصناف</option>
            <option value="safe">الرصيد الكافي والآمن فقط</option>
            <option value="low_or_out">الأصناف التي توشك على النفاد أو انتهت</option>
            <option value="low">على وشك النفاد</option>
            <option value="out">المنتهية تماماً</option>
          </select>
        </div>

      </div>

      {/* Core Inventory Stock Display */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        
        <div className="bg-[#fcfdfe] px-4 py-3 border-b border-slate-100 flex justify-between items-center flex-row-reverse text-right">
          <span className="text-xs font-black text-slate-850">جرد وتحديث كميات الأصناف المتاحة في المستودع</span>
          <span className="text-[10px] text-[#0074b1] font-bold">المنتجات النشطة مبرمجة على عملة الجنيه المصري (ج.م)</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold space-y-2">
            <AlertOctagon className="w-10 h-10 mx-auto text-amber-500" />
            <p className="text-slate-600 block">لم يتم العثور على أي منتج يطابق معايير البحث.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedStatus('الكل'); }}
              className="text-[#0074b1] hover:underline text-xs font-black cursor-pointer block mx-auto"
            >
              عرض الكل وإعادة التعيين
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map(p => {
              const qty = getProductQuantity(p.id);
              const status = getProductClass(p);
              const isEditing = editingProductId === p.id;

              return (
                <div key={p.id} className="p-4 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 flex-row-reverse text-right">
                  
                  {/* Left: Product Info & Metadata */}
                  <div className="md:w-3/5 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-mono font-bold leading-none">{p.code}</span>
                    <h4 className="font-extrabold text-sm text-slate-800">{p.name}</h4>
                    <div className="flex items-center gap-2 flex-row-reverse text-[10px] text-slate-400 font-bold">
                      <span>القسم: <strong className="text-slate-600 font-semibold">{p.category}</strong></span>
                      <span>•</span>
                      <span>الماركة: <strong className="text-slate-600 font-semibold">{p.brand}</strong></span>
                      {p.sellingPrice && (
                        <>
                          <span>•</span>
                          <span className="text-sky-700 font-bold font-mono">سعر البيع الافتراضي: {p.sellingPrice} ج.م</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantity controls & Warnings */}
                  <div className="md:w-2/5 flex flex-col sm:flex-row items-center justify-end gap-3 flex-row-reverse">
                    
                    {/* Visual Warning Status Tag */}
                    <div className="text-right shrink-0">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border block ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1 font-semibold text-right">
                        {status.textWarning}
                      </span>
                    </div>

                    {/* Quantity Adjustment Buttons */}
                    <div className="flex items-center gap-1.5 flex-row-reverse bg-slate-50 border border-slate-100 rounded-lg p-1">
                      
                      {/* Decrement */}
                      <button
                        onClick={() => handleQuickDecrement(p.id)}
                        className="w-7 h-7 hover:bg-white text-rose-500 rounded-md transition-all cursor-pointer font-bold flex items-center justify-center border border-transparent hover:border-slate-100"
                        title="إنقاص قطعة واحدة (-1)"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      {/* Display / Input click */}
                      {isEditing ? (
                        <input
                          type="number"
                          autoFocus
                          min="0"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleSaveManualQuantity(p.id, editingValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveManualQuantity(p.id, editingValue);
                            if (e.key === 'Escape') setEditingProductId(null);
                          }}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-[#0074b1] rounded-md outline-none py-0.5 text-slate-800"
                        />
                      ) : (
                        <div
                          onClick={() => {
                            setEditingProductId(p.id);
                            setEditingValue(String(qty));
                          }}
                          className="px-3 py-1 cursor-pointer hover:bg-white rounded-md text-center font-mono font-black text-xs font-sans text-slate-800 border border-dashed border-slate-200 hover:border-slate-350 min-w-12"
                          title="اضغط لتغيير الرقم يدوياً"
                        >
                          {qty}
                        </div>
                      )}

                      {/* Increment */}
                      <button
                        onClick={() => handleQuickIncrement(p.id)}
                        className="w-7 h-7 hover:bg-white text-[#10b981] rounded-md transition-all cursor-pointer font-bold flex items-center justify-center border border-transparent hover:border-slate-100"
                        title="زيادة قطعة واحدة (+1)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
