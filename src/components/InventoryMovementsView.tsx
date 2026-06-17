import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';

interface InventoryMovementsViewProps {
  setView: (view: string) => void;
}

interface Movement {
  id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: string;
  reference_type: string;
  reference_id: string;
  reference_number: string;
  qty_before: number;
  qty_change: number;
  qty_after: number;
  created_by: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
}

interface Warehouse {
  id: string;
  name: string;
}

const movementTypeLabels: Record<string, string> = {
  sale: 'بيع',
  purchase: 'شراء',
  sale_return: 'مرتجع بيع',
  purchase_return: 'مرتجع مشتريات',
  adjustment: 'تسوية جرد',
  transfer: 'تحويل'
};

export default function InventoryMovementsView({ setView }: InventoryMovementsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    supabase.from('products').select('id, name, code').then(({ data }) => {
      if (data) setProducts(data);
    });
    supabase.from('warehouses').select('id, name').then(({ data }) => {
      if (data) setWarehouses(data);
    });
  }, []);

  const filteredProducts = productSearchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.code?.toLowerCase().includes(productSearchQuery.toLowerCase())
      )
    : products;

  const loadMovements = async () => {
    if (!selectedProductId) return;
    setLoading(true);

    let query = supabase
      .from('inventory_movements')
      .select('*')
      .eq('product_id', selectedProductId)
      .order('created_at', { ascending: false });

    if (selectedWarehouseId) {
      query = query.eq('warehouse_id', selectedWarehouseId);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59`);
    }

    const { data } = await query;
    if (data) setMovements(data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedProductId) loadMovements();
  }, [selectedProductId, selectedWarehouseId]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProductId(p.id);
    setProductSearchQuery(p.name);
    setShowProductDropdown(false);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const totalAdded = movements
    .filter(m => m.qty_change > 0)
    .reduce((sum, m) => sum + m.qty_change, 0);
  const totalDeducted = movements
    .filter(m => m.qty_change < 0)
    .reduce((sum, m) => sum + Math.abs(m.qty_change), 0);
  const currentStock = movements.length > 0 ? movements[0].qty_after : 0;

  const formatDateTime = (dt: string) => {
    const d = new Date(dt);
    return {
      date: d.toLocaleDateString('ar-EG'),
      time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="space-y-6 text-right select-none font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-transparent gap-4 pt-1">
        <h2 className="text-xl font-bold text-slate-800">حركة المخزون</h2>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded border border-[#dae4f0] shadow-sm overflow-hidden">
        <div className="bg-[#fcfdfe] px-5 py-3 border-b border-[#e9eff6] flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#204060]">بحث وفلترة</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Product Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">المنتج</label>
              <div className="relative">
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                  placeholder="ابحث عن منتج..."
                  className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none pr-8"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-50 top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <div
                        key={p.id}
                        onMouseDown={() => handleSelectProduct(p)}
                        className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex justify-between"
                      >
                        <span className="font-bold text-slate-700">{p.name}</span>
                        <span className="text-slate-400">{p.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Warehouse Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">المستودع</label>
              <div className="relative">
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer pl-8"
                  style={{ direction: 'rtl' }}
                >
                  <option value="">كل المستودعات</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-start">
            <button
              onClick={loadMovements}
              disabled={!selectedProductId}
              className="bg-[#3c8dbc] hover:bg-[#357ebd] text-white px-5 py-1.5 rounded font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              بحث
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {selectedProduct && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded border border-[#dae4f0] shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
              <Package className="w-4 h-4" />
              <span>المنتج</span>
            </div>
            <div className="text-sm font-black text-slate-800">{selectedProduct.name}</div>
            <div className="text-[10px] text-slate-400">{selectedProduct.code}</div>
          </div>
          <div className="bg-white rounded border border-emerald-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>إجمالي الوارد</span>
            </div>
            <div className="text-sm font-black text-emerald-700">{totalAdded.toLocaleString('ar-EG')}</div>
          </div>
          <div className="bg-white rounded border border-rose-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-rose-600 text-xs font-bold mb-1">
              <TrendingDown className="w-4 h-4" />
              <span>إجمالي المنصرف</span>
            </div>
            <div className="text-sm font-black text-rose-700">{totalDeducted.toLocaleString('ar-EG')}</div>
          </div>
          <div className="bg-white rounded border border-blue-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold mb-1">
              <Package className="w-4 h-4" />
              <span>الرصيد الحالي</span>
            </div>
            <div className="text-sm font-black text-blue-700">{currentStock.toLocaleString('ar-EG')}</div>
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white rounded border border-[#dae4f0] shadow-sm overflow-hidden">
        <div className="bg-[#fcfdfe] px-5 py-3 border-b border-[#e9eff6] flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#204060]">سجل الحركات</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">عدد الحركات:</span>
            <span className="text-xs font-bold text-slate-700">{movements.length}</span>
          </div>
        </div>
        <div className="p-4">
          {!selectedProductId ? (
            <div className="border border-[#ffebcc] bg-[#fffbf2] text-amber-800 rounded p-4 text-center flex items-center justify-center gap-2">
              <Package className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-xs font-bold">الرجاء اختيار منتج لعرض الحركات</span>
            </div>
          ) : loading ? (
            <div className="text-center py-8 text-slate-400 text-xs font-bold">جاري التحميل...</div>
          ) : movements.length === 0 ? (
            <div className="border border-slate-100 bg-slate-50 text-slate-500 rounded p-4 text-center flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold">لا توجد حركات مخزنية لهذا المنتج</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="py-2.5 pr-2">التاريخ</th>
                    <th className="py-2.5">الوقت</th>
                    <th className="py-2.5">نوع الحركة</th>
                    <th className="py-2.5">رقم المرجع</th>
                    <th className="py-2.5">الكمية قبل</th>
                    <th className="py-2.5">التغير</th>
                    <th className="py-2.5">الكمية بعد</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const { date, time } = formatDateTime(m.created_at);
                    return (
                      <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 pr-2 font-mono text-slate-600">{date}</td>
                        <td className="py-3 font-mono text-slate-500">{time}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.movement_type === 'sale' || m.movement_type === 'purchase_return'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {movementTypeLabels[m.movement_type] || m.movement_type}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-500">{m.reference_number || '—'}</td>
                        <td className="py-3 font-mono text-slate-600">{m.qty_before}</td>
                        <td className={`py-3 font-mono font-bold ${m.qty_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.qty_change >= 0 ? '+' : ''}{m.qty_change}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-800">{m.qty_after}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
