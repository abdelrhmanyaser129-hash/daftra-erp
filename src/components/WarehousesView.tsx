import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { recordInventoryMovement } from '../lib/inventoryCore';
import { 
  ArrowLeft, Info, Search, CheckCircle, Boxes, AlertOctagon, AlertTriangle,
  Minus, Plus, Trash2, X, Edit3, PlusCircle, Building2, Hash, MapPin, FileText
} from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  manager: string;
  phone: string;
  location: string;
  notes: string;
  status: string;
  is_default?: boolean;
  branch_id?: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  barcode: string;
  category: string;
  brand: string;
  status: string;
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
  const [activeTab, setActiveTab] = useState<'warehouses' | 'stock'>('warehouses');

  // Warehouse CRUD state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [whFormName, setWhFormName] = useState('');
  const [whFormCode, setWhFormCode] = useState('');
  const [whFormLocation, setWhFormLocation] = useState('');
  const [whFormManager, setWhFormManager] = useState('');
  const [whFormPhone, setWhFormPhone] = useState('');
  const [whFormNotes, setWhFormNotes] = useState('');
  const [whFormStatus, setWhFormStatus] = useState('نشط');
  const [whFormBranchId, setWhFormBranchId] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);

  // Stock management state
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<WarehouseStock>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('الكل');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [defaultWarehouseId, setDefaultWarehouseId] = useState('');
  const [selectedWhForStock, setSelectedWhForStock] = useState<string>('');

  useEffect(() => {
    loadWarehouses();
    loadProducts();
    loadStock();
    loadBranches();
  }, []);

  const loadWarehouses = async () => {
    const { data } = await supabase.from('warehouses').select('*').order('name');
    if (data) setWarehouses(data as Warehouse[]);
  };

  const loadProducts = async () => {
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, code, barcode, category, brand, status, purchase_price, selling_price, alert_quantity, track_inventory');
    if (productsData) {
      setProducts(productsData.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        code: p.code as string,
        barcode: p.barcode as string,
        category: p.category as string,
        brand: p.brand as string,
        status: p.status as string,
        purchasePrice: p.purchase_price as string,
        sellingPrice: p.selling_price as string,
        alertQuantity: p.alert_quantity as string,
        trackInventory: p.track_inventory as boolean,
      })));
    }
  };

  const loadStock = async () => {
    const { data: stockData } = await supabase.from('warehouse_stock').select('product_id, warehouse_id, quantity');
    const stockLevels: WarehouseStock = {};
    if (stockData) {
      for (const s of stockData) {
        const pid = s.product_id as string;
        const wid = s.warehouse_id as string;
        if (!stockLevels[pid]) stockLevels[pid] = {};
        stockLevels[pid][wid] = Number(s.quantity);
      }
    }
    setStock(stockLevels);
  };

  const loadBranches = async () => {
    const { data } = await supabase.from('branches').select('id, name, code').order('name');
    if (data) setBranches(data as Branch[]);
  };

  const handleOpenAddWarehouse = () => {
    setEditingWarehouseId(null);
    setWhFormName('');
    setWhFormCode('');
    setWhFormLocation('');
    setWhFormManager('');
    setWhFormPhone('');
    setWhFormNotes('');
    setWhFormStatus('نشط');
    setWhFormBranchId('');
    setShowWarehouseForm(true);
  };

  const handleEditWarehouse = (wh: Warehouse) => {
    setEditingWarehouseId(wh.id);
    setWhFormName(wh.name);
    setWhFormCode(wh.code || '');
    setWhFormLocation(wh.location || '');
    setWhFormManager(wh.manager || '');
    setWhFormPhone(wh.phone || '');
    setWhFormNotes(wh.notes || '');
    setWhFormStatus(wh.status || 'نشط');
    setWhFormBranchId(wh.branch_id || '');
    setShowWarehouseForm(true);
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whFormName.trim()) { alert('الرجاء إدخال اسم المستودع'); return; }

    const payload: Record<string, unknown> = {
      name: whFormName.trim(),
      code: whFormCode.trim(),
      location: whFormLocation.trim(),
      manager: whFormManager.trim(),
      phone: whFormPhone.trim(),
      notes: whFormNotes.trim(),
      status: whFormStatus,
    };
    if (whFormBranchId) payload.branch_id = whFormBranchId;

    if (editingWarehouseId) {
      const { error } = await supabase.from('warehouses').update(payload).eq('id', editingWarehouseId);
      if (error) { alert('فشل تحديث المستودع: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('warehouses').insert(payload);
      if (error) { alert('فشل إنشاء المستودع: ' + error.message); return; }
    }

    setShowWarehouseForm(false);
    setEditingWarehouseId(null);
    loadWarehouses();
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستودع؟')) return;
    const { error } = await supabase.from('warehouses').delete().eq('id', id);
    if (error) { alert('فشل حذف المستودع: ' + error.message); return; }
    loadWarehouses();
  };

  const saveStockData = async (updatedStock: WarehouseStock) => {
    setStock(updatedStock);
    const whId = selectedWhForStock || defaultWarehouseId;
    if (!whId) return;
    const records = Object.entries(updatedStock).flatMap(([productId, warehouses]) =>
      Object.entries(warehouses).map(([wid, quantity]) => ({ product_id: productId, warehouse_id: wid, quantity }))
    );
    const whRecords = records.filter(r => r.warehouse_id === whId);
    if (whRecords.length > 0) {
      const { error } = await supabase.from('warehouse_stock').upsert(whRecords, { onConflict: 'product_id, warehouse_id' });
      if (error) { console.error('Stock save failed:', error); alert('فشل حفظ المخزون'); return; }
    }
    loadStock();
  };

  const getProductQuantity = (productId: string, currentStock = stock): number => {
    const whId = selectedWhForStock || defaultWarehouseId;
    if (!whId) return 0;
    return currentStock[productId]?.[whId] ?? 0;
  };

  const getProductClass = (product: Product, currentStock = stock) => {
    const qty = getProductQuantity(product.id, currentStock);
    const threshold = Number(product.alertQuantity) || 0;
    if (qty === 0) return { label: 'نفد بالكامل', color: 'bg-rose-50 text-rose-700 border-rose-200', code: 'out' };
    if (qty <= threshold) return { label: 'على وشك النفاد', color: 'bg-amber-50 text-amber-700 border-amber-200', code: 'low' };
    return { label: 'رصيد آمن', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', code: 'safe' };
  };

  const handleQuickIncrement = async (productId: string) => {
    const updatedStock = { ...stock };
    if (!updatedStock[productId]) updatedStock[productId] = {};
    const whId = selectedWhForStock || defaultWarehouseId;
    if (whId) {
      updatedStock[productId][whId] = (updatedStock[productId][whId] ?? 0) + 1;
      await recordInventoryMovement({ productId, warehouseId: whId, movementType: 'adjustment', referenceType: 'warehouse', referenceId: whId, referenceNumber: '', qtyChange: 1 });
      await saveStockData(updatedStock);
    }
  };

  const handleQuickDecrement = async (productId: string) => {
    const updatedStock = { ...stock };
    if (!updatedStock[productId]) updatedStock[productId] = {};
    const whId = selectedWhForStock || defaultWarehouseId;
    if (whId) {
      const current = updatedStock[productId][whId] ?? 0;
      updatedStock[productId][whId] = Math.max(0, current - 1);
      await recordInventoryMovement({ productId, warehouseId: whId, movementType: 'adjustment', referenceType: 'warehouse', referenceId: whId, referenceNumber: '', qtyChange: -1 });
      await saveStockData(updatedStock);
    }
  };

  const handleSaveManualQuantity = async (productId: string, valStr: string) => {
    const numeric = Math.max(0, parseInt(valStr) || 0);
    const updatedStock = { ...stock };
    if (!updatedStock[productId]) updatedStock[productId] = {};
    const whId = selectedWhForStock || defaultWarehouseId;
    if (whId) {
      const oldQty = updatedStock[productId][whId] ?? 0;
      const diff = numeric - oldQty;
      if (diff !== 0) {
        await recordInventoryMovement({ productId, warehouseId: whId, movementType: 'adjustment', referenceType: 'warehouse', referenceId: whId, referenceNumber: '', qtyChange: diff });
      }
      updatedStock[productId][whId] = numeric;
      await saveStockData(updatedStock);
    }
    setEditingProductId(null);
  };

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

  const totalItems = products.length;
  const runningLowCount = products.filter(p => getProductClass(p).code === 'low').length;
  const outOfStockCount = products.filter(p => getProductClass(p).code === 'out').length;
  const safeCount = products.filter(p => getProductClass(p).code === 'safe').length;

  return (
    <div className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 text-slate-800 antialiased animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-row-reverse text-xs gap-3">
        <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
          <span className="text-[#0074b1]">المخزون</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-extrabold">المستودعات</span>
        </div>
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-[#0074b1] hover:bg-sky-50 px-4 py-2 rounded-lg border border-sky-100 transition-all font-bold cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>الرجوع للوحة التحكم</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-colors ${activeTab === 'warehouses' ? 'bg-white text-[#0074b1] border-b-2 border-[#0074b1]' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            إدارة المستودعات
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-colors ${activeTab === 'stock' ? 'bg-white text-[#0074b1] border-b-2 border-[#0074b1]' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            جرد المخزون
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'warehouses' ? (
            <motion.div key="warehouses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">إجمالي المستودعات: {warehouses.length}</span>
                <button
                  onClick={handleOpenAddWarehouse}
                  className="bg-[#2ecc71] hover:bg-[#27ae60] text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة مستودع</span>
                </button>
              </div>

              {showWarehouseForm && (
                <form onSubmit={handleSaveWarehouse} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">{editingWarehouseId ? 'تعديل المستودع' : 'إضافة مستودع جديد'}</span>
                    <button type="button" onClick={() => { setShowWarehouseForm(false); setEditingWarehouseId(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">اسم المستودع <span className="text-rose-500">*</span></label>
                      <input type="text" required value={whFormName} onChange={(e) => setWhFormName(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">الكود</label>
                      <input type="text" value={whFormCode} onChange={(e) => setWhFormCode(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs text-right font-mono focus:outline-none focus:border-[#0074b1]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">العنوان</label>
                      <input type="text" value={whFormLocation} onChange={(e) => setWhFormLocation(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">المسؤول</label>
                      <input type="text" value={whFormManager} onChange={(e) => setWhFormManager(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">رقم الهاتف</label>
                      <input type="text" value={whFormPhone} onChange={(e) => setWhFormPhone(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs text-right font-mono focus:outline-none focus:border-[#0074b1]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">الحالة</label>
                      <select value={whFormStatus} onChange={(e) => setWhFormStatus(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right focus:outline-none focus:border-[#0074b1]">
                        <option value="نشط">نشط</option>
                        <option value="غير نشط">غير نشط</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">الفرع التابع له</label>
                      <select value={whFormBranchId} onChange={(e) => setWhFormBranchId(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right focus:outline-none focus:border-[#0074b1]">
                        <option value="">(بدون فرع)</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">ملاحظات</label>
                      <textarea rows={2} value={whFormNotes} onChange={(e) => setWhFormNotes(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => { setShowWarehouseForm(false); setEditingWarehouseId(null); }} className="px-3 py-1.5 border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 text-xs font-bold rounded cursor-pointer">إلغاء</button>
                    <button type="submit" className="px-4 py-1.5 bg-[#0074b1] hover:bg-[#005f90] text-white text-xs font-bold rounded cursor-pointer">{editingWarehouseId ? 'تحديث' : 'حفظ'}</button>
                  </div>
                </form>
              )}

              {warehouses.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold space-y-2">
                  <Building2 className="w-10 h-10 mx-auto text-slate-300" />
                  <p>لا توجد مستودعات مضافة بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-3">الاسم</th>
                        <th className="p-3">الكود</th>
                        <th className="p-3">الفرع</th>
                        <th className="p-3">العنوان</th>
                        <th className="p-3">المسؤول</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {warehouses.map(wh => (
                        <tr key={wh.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-800">{wh.name}</td>
                          <td className="p-3 font-mono text-slate-500">{wh.code || '—'}</td>
                          <td className="p-3 text-slate-500">{branches.find(b => b.id === wh.branch_id)?.name || '—'}</td>
                          <td className="p-3 text-slate-500">{wh.location || '—'}</td>
                          <td className="p-3 text-slate-500">{wh.manager || '—'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${wh.status === 'نشط' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{wh.status}</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEditWarehouse(wh)} className="text-[#0074b1] hover:bg-blue-50 p-1.5 rounded cursor-pointer" title="تعديل"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteWarehouse(wh.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded cursor-pointer" title="حذف"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="stock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-between gap-3 flex-row-reverse">
                  <div className="p-3 bg-blue-50 text-[#0074b1] rounded-xl"><Boxes className="w-5 h-5" /></div>
                  <div><span className="text-[11px] text-slate-400 font-bold block">إجمالي المنتجات</span><span className="text-lg font-bold text-slate-800 block mt-0.5 font-mono">{totalItems}</span></div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-between gap-3 flex-row-reverse">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-5 h-5" /></div>
                  <div><span className="text-[11px] text-slate-400 font-bold block">رصيد آمن</span><span className="text-lg font-bold text-emerald-600 block mt-0.5 font-mono">{safeCount}</span></div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-between gap-3 flex-row-reverse">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
                  <div><span className="text-[11px] text-slate-400 font-bold block">على وشك النفاد</span><span className="text-lg font-bold text-amber-500 block mt-0.5 font-mono">{runningLowCount}</span></div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-between gap-3 flex-row-reverse">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertOctagon className="w-5 h-5" /></div>
                  <div><span className="text-[11px] text-slate-400 font-bold block">نفد بالكامل</span><span className="text-lg font-bold text-rose-600 block mt-0.5 font-mono">{outOfStockCount}</span></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1">
                  <label className="block text-slate-500 font-bold text-[11px] mb-1">المستودع</label>
                  <select
                    value={selectedWhForStock || defaultWarehouseId}
                    onChange={(e) => { setSelectedWhForStock(e.target.value); setDefaultWarehouseId(e.target.value); }}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-slate-700 font-bold focus:outline-none focus:border-[#0074b1]"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    {warehouses.length === 0 && <option value="">لا توجد مستودعات</option>}
                  </select>
                </div>
                <div className="md:col-span-1 relative">
                  <label className="block text-slate-500 font-bold text-[11px] mb-1">بحث</label>
                  <input type="text" placeholder="اسم المنتج، الكود، الماركة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-white pr-8 text-right font-bold focus:outline-none focus:border-[#0074b1]" />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 bottom-2.5" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold text-[11px] mb-1">فلترة</label>
                  <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-slate-700 font-bold focus:outline-none focus:border-[#0074b1]">
                    <option value="الكل">كل المنتجات</option>
                    <option value="safe">الرصيد الآمن</option>
                    <option value="low_or_out">منخفض أو نافد</option>
                    <option value="low">على وشك النفاد</option>
                    <option value="out">نافد بالكامل</option>
                  </select>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold space-y-2">
                  <AlertOctagon className="w-10 h-10 mx-auto text-amber-500" />
                  <p>لم يتم العثور على منتجات</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-100 shadow-sm">
                  {filteredProducts.map(p => {
                    const qty = getProductQuantity(p.id);
                    const status = getProductClass(p);
                    const isEditing = editingProductId === p.id;
                    return (
                      <div key={p.id} className="p-4 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 flex-row-reverse">
                        <div className="md:w-3/5 space-y-1">
                          <span className="text-[10px] text-slate-400 block font-mono font-bold">{p.code}</span>
                          <h4 className="font-extrabold text-sm text-slate-800">{p.name}</h4>
                          <div className="flex items-center gap-2 flex-row-reverse text-[10px] text-slate-400 font-bold">
                            <span>القسم: <strong className="text-slate-600">{p.category}</strong></span>
                            <span>•</span>
                            <span>الماركة: <strong className="text-slate-600">{p.brand}</strong></span>
                            {p.sellingPrice && <><span>•</span><span className="text-sky-700 font-bold">سعر البيع: {p.sellingPrice} ج.م</span></>}
                          </div>
                        </div>
                        <div className="md:w-2/5 flex flex-col sm:flex-row items-center justify-end gap-3 flex-row-reverse">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border ${status.color}`}>{status.label}</span>
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg p-1">
                            <button onClick={() => handleQuickDecrement(p.id)} className="w-7 h-7 hover:bg-white text-rose-500 rounded-md cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-100"><Minus className="w-3.5 h-3.5" /></button>
                            {isEditing ? (
                              <input type="number" autoFocus min="0" value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onBlur={() => handleSaveManualQuantity(p.id, editingValue)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveManualQuantity(p.id, editingValue); if (e.key === 'Escape') setEditingProductId(null); }} className="w-14 text-center font-mono font-bold text-xs bg-white border border-[#0074b1] rounded-md outline-none py-0.5 text-slate-800" />
                            ) : (
                              <div onClick={() => { setEditingProductId(p.id); setEditingValue(String(qty)); }} className="px-3 py-1 cursor-pointer hover:bg-white rounded-md text-center font-mono font-black text-xs text-slate-800 border border-dashed border-slate-200 hover:border-slate-350 min-w-12">{qty}</div>
                            )}
                            <button onClick={() => handleQuickIncrement(p.id)} className="w-7 h-7 hover:bg-white text-emerald-500 rounded-md cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-100"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
