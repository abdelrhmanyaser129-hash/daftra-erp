import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, ArrowLeft, X, ChevronDown, Package, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { recordInventoryMovement } from '../lib/inventoryCore';

interface Product {
  id: string;
  name: string;
  sellingPrice?: string;
}

interface CompositeItem {
  id: string;
  product_id: string;
  quantity: number;
  product_name?: string;
}

interface CompositeProduct {
  id: string;
  name: string;
  selling_price: number;
  status: string;
  created_at: string;
  items: CompositeItem[];
}

interface StockCheck {
  product_id: string;
  product_name: string;
  required: number;
  available: number;
  sufficient: boolean;
}

interface CompositeProductsViewProps {
  setView: (view: string) => void;
}

export default function CompositeProductsView({ setView }: CompositeProductsViewProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'composite'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [composites, setComposites] = useState<CompositeProduct[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStatus, setFormStatus] = useState('نشط');
  const [formItems, setFormItems] = useState<Omit<CompositeItem, 'id'>[]>([]);

  const [stockModal, setStockModal] = useState<{ compositeName: string; checks: StockCheck[] } | null>(null);
  const [warehouseId, setWarehouseId] = useState<string>('');

  useEffect(() => {
    supabase.from('products').select('id, name, selling_price').then(({ data }) => {
      if (data) setProducts(data.map((r: any) => ({ id: r.id, name: r.name, sellingPrice: r.selling_price?.toString() })));
    });
    supabase.from('warehouses').select('id').limit(1).maybeSingle().then(({ data }) => {
      if (data) setWarehouseId(data.id);
    });
    loadComposites();
  }, []);

  const loadComposites = async () => {
    const { data: comps } = await supabase.from('composite_products').select('*').order('created_at', { ascending: false });
    if (!comps) { setComposites([]); return; }
    const result: CompositeProduct[] = [];
    for (const c of comps) {
      const { data: items } = await supabase.from('composite_product_items').select('id, product_id, quantity').eq('composite_id', c.id);
      const itemRows: CompositeItem[] = (items || []).map((i: any) => ({
        id: i.id,
        product_id: i.product_id,
        quantity: Number(i.quantity),
        product_name: products.find(p => p.id === i.product_id)?.name || '',
      }));
      result.push({
        id: c.id,
        name: c.name,
        selling_price: Number(c.selling_price) || 0,
        status: c.status || 'نشط',
        created_at: c.created_at,
        items: itemRows,
      });
    }
    setComposites(result);
  };

  const handleOpenAdd = () => {
    setFormName('');
    setFormPrice('');
    setFormStatus('نشط');
    setFormItems([{ product_id: '', quantity: 1 }]);
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEditComposite = async (comp: CompositeProduct) => {
    setFormName(comp.name);
    setFormPrice(comp.selling_price.toString());
    setFormStatus(comp.status);
    setFormItems(comp.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })));
    setEditingId(comp.id);
    setIsAdding(true);
  };

  const handleAddItem = () => {
    setFormItems([...formItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const updated = [...formItems];
    updated[index].product_id = productId;
    setFormItems(updated);
  };

  const handleItemQtyChange = (index: number, qty: string) => {
    const updated = [...formItems];
    updated[index].quantity = parseFloat(qty) || 0;
    setFormItems(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { alert('الرجاء إدخال اسم المنتج المركب'); return; }
    if (formItems.length === 0 || formItems.some(i => !i.product_id)) { alert('الرجاء إضافة المكونات وتحديد المنتجات'); return; }

    const compositePayload = { name: formName, selling_price: parseFloat(formPrice) || 0, status: formStatus };

    try {
      if (editingId) {
        const { error: updateErr } = await supabase.from('composite_products').update(compositePayload).eq('id', editingId);
        if (updateErr) { alert('فشل تحديث المنتج المركب: ' + updateErr.message); return; }
        const { error: delErr } = await supabase.from('composite_product_items').delete().eq('composite_id', editingId);
        if (delErr) { alert('فشل حذف المكونات القديمة: ' + delErr.message); return; }
        const itemsPayload = formItems.map(i => ({ composite_id: editingId, product_id: i.product_id, quantity: i.quantity }));
        const { error: insErr } = await supabase.from('composite_product_items').insert(itemsPayload);
        if (insErr) { alert('فشل إضافة المكونات: ' + insErr.message); return; }
      } else {
        const { data, error: createErr } = await supabase.from('composite_products').insert(compositePayload).select().single();
        if (createErr) { alert('فشل إنشاء المنتج المركب: ' + createErr.message); return; }
        if (data) {
          const itemsPayload = formItems.map(i => ({ composite_id: data.id, product_id: i.product_id, quantity: i.quantity }));
          const { error: insErr } = await supabase.from('composite_product_items').insert(itemsPayload);
          if (insErr) { alert('فشل إضافة المكونات: ' + insErr.message); return; }
        }
      }
    } catch (err: any) {
      alert('حدث خطأ غير متوقع: ' + (err?.message || 'غير معروف'));
      return;
    }
    setIsAdding(false);
    setEditingId(null);
    loadComposites();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج المركب؟')) return;
    await supabase.from('composite_product_items').delete().eq('composite_id', id);
    await supabase.from('composite_products').delete().eq('id', id);
    loadComposites();
  };

  const handleCheckStock = async (comp: CompositeProduct) => {
    if (!warehouseId) { alert('لم يتم العثور على مستودع'); return; }
    const { data: stockData } = await supabase
      .from('warehouse_stock')
      .select('product_id, quantity')
      .eq('warehouse_id', warehouseId);
    const stockMap: Record<string, number> = {};
    if (stockData) {
      for (const s of stockData) stockMap[s.product_id as string] = Number(s.quantity);
    }
    const checks: StockCheck[] = comp.items.map(item => {
      const available = stockMap[item.product_id] ?? 0;
      return {
        product_id: item.product_id,
        product_name: products.find(p => p.id === item.product_id)?.name || 'غير معروف',
        required: item.quantity,
        available,
        sufficient: available >= item.quantity,
      };
    });
    setStockModal({ compositeName: comp.name, checks });
  };

  const handleDeductStock = async (comp: CompositeProduct) => {
    if (!warehouseId) { alert('لم يتم العثور على مستودع'); return; }
    if (!window.confirm(`هل أنت متأكد من خصم مكونات "${comp.name}" من المخزون؟`)) return;
    for (const item of comp.items) {
      await recordInventoryMovement({ productId: item.product_id, warehouseId, movementType: 'adjustment', referenceType: 'composite_deduction', referenceId: comp.id, referenceNumber: comp.name, qtyChange: -item.quantity });
    }
    alert('تم خصم المخزون بنجاح');
    loadComposites();
  };

  const availableProducts = products.filter(p => p.id);

  if (isAdding) {
    return (
      <div className="w-full mx-auto space-y-4 text-right font-sans select-none pb-12">
        <div className="flex justify-between items-center bg-white p-3 rounded-md border border-[#d4e1ed] flex-row-reverse">
          <div className="flex items-center gap-1.5 flex-row-reverse text-sm text-[#1a252f]">
            <span className="text-[#0074b1] font-bold cursor-pointer hover:underline" onClick={() => setIsAdding(false)}>المنتجات المركبة</span>
            <span className="text-slate-400 font-bold">&gt;</span>
            <span className="text-slate-800 font-bold">{editingId ? 'تعديل' : 'إضافة'}</span>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-5 h-8 font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{editingId ? 'تحديث' : 'حفظ'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="bg-white border border-[#ccc] text-slate-700 hover:bg-slate-50 font-bold h-8 px-4 text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden">
          <div className="bg-[#fcfdfe] px-4 py-2.5 border-b border-[#e9eff4]">
            <span className="text-slate-800 font-bold">تفاصيل المنتج المركب</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">الاسم <span className="text-rose-500">*</span></label>
                <input
                  type="text" required value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#0074b1] text-right"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">سعر البيع</label>
                <input
                  type="text" value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#0074b1] text-left font-mono"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-slate-600 font-bold">الحالة</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-600 bg-white text-right focus:outline-none focus:border-[#0074b1]"
              >
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
            </div>

            <div className="border-t border-[#e9eff4] pt-4">
              <div className="flex items-center justify-between flex-row-reverse mb-3">
                <span className="text-slate-800 font-bold">المكونات</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-[#0074b1] hover:bg-[#005a8c] text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> إضافة مكون
                </button>
              </div>
              <div className="space-y-2">
                {formItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border border-slate-200 rounded p-2 bg-slate-50/50">
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-slate-500 text-[10px] font-bold">المنتج</label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemProductChange(idx, e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-600 bg-white text-right focus:outline-none focus:border-[#0074b1]"
                      >
                        <option value="">اختر منتج</option>
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-slate-500 text-[10px] font-bold">الكمية</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 text-left font-mono focus:outline-none focus:border-[#0074b1]"
                      />
                    </div>
                    <div className="sm:col-span-3 flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                        title="حذف المكون"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {formItems.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">لم تضف أي مكونات بعد</p>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[#e9eff4] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-5 py-2 border border-[#ccc] text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold rounded cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-bold rounded cursor-pointer"
            >
              {editingId ? 'تحديث المنتج المركب' : 'حفظ المنتج المركب'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-4 text-right font-sans select-none pb-12">
      <div className="flex justify-between items-center bg-[#eceff1]/60 px-4 py-2 text-xs text-slate-500 rounded-md border border-slate-200/50">
        <div className="flex items-center gap-1.5 flex-row-reverse">
          <span className="text-slate-400">المخزون</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 font-bold">المنتجات المركبة</span>
        </div>
        <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-[#0074b1] hover:underline font-bold cursor-pointer">
          <ArrowLeft className="w-3 h-3" />
          <span>العودة للوحة التحكم</span>
        </button>
      </div>

      <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden">
        <div className="flex border-b border-[#e9eff4]">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-colors ${
              activeTab === 'products' ? 'bg-[#fcfdfe] text-[#0074b1] border-b-2 border-[#0074b1]' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            المنتجات والخدمات
          </button>
          <button
            onClick={() => setActiveTab('composite')}
            className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-colors ${
              activeTab === 'composite' ? 'bg-[#fcfdfe] text-[#0074b1] border-b-2 border-[#0074b1]' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            المنتجات المركبة
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'products' ? (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 text-center text-slate-400 text-xs">
              <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>اذهب إلى <button onClick={() => setView('products-services')} className="text-[#0074b1] hover:underline font-bold cursor-pointer">المنتجات والخدمات</button> لإدارة المنتجات العادية</p>
            </motion.div>
          ) : (
            <motion.div key="composite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white p-2.5 rounded-md border-b border-[#d4e1ed] flex items-center justify-between">
                <button
                  onClick={handleOpenAdd}
                  className="bg-[#2ecc71] hover:bg-[#27ae60] text-white px-4 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج مركب</span>
                </button>
                <span className="text-[10px] text-slate-400 font-bold">إجمالي: {composites.length}</span>
              </div>

              {composites.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold space-y-2">
                  <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                  <p className="text-slate-600">لا توجد منتجات مركبة بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#eff3f6] text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3">الاسم</th>
                        <th className="p-3">سعر البيع</th>
                        <th className="p-3">عدد المكونات</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3">المخزون</th>
                        <th className="p-3 text-center">تعديل</th>
                        <th className="p-3 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {composites.map(comp => (
                        <tr key={comp.id} className="hover:bg-slate-50/75 transition-colors">
                          <td className="p-3 text-[#0d5fc2] font-extrabold">{comp.name}</td>
                          <td className="p-3 font-mono text-slate-700 font-bold">{comp.selling_price} ج.م</td>
                          <td className="p-3 text-slate-600">{comp.items.length}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              comp.status === 'نشط' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                            }`}>{comp.status}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCheckStock(comp)}
                                className="text-[#0074b1] hover:bg-blue-50 px-2 py-1 rounded text-[10px] font-bold cursor-pointer border border-transparent hover:border-[#0074b1] transition-all"
                                title="التحقق من المخزون"
                              >
                                التحقق من المخزون
                              </button>
                              <button
                                onClick={() => handleDeductStock(comp)}
                                className="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded text-[10px] font-bold cursor-pointer border border-transparent hover:border-amber-300 transition-all"
                                title="خصم من المخزون"
                              >
                                خصم من المخزون
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleEditComposite(comp)}
                              className="text-[#0074b1] hover:text-[#005a8c] hover:bg-blue-50 p-1.5 rounded cursor-pointer inline-block transition-all"
                              title="تعديل"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDelete(comp.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded cursor-pointer inline-block transition-all"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {stockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setStockModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between flex-row-reverse">
                <h3 className="font-bold text-slate-800">حالة المخزون: {stockModal.compositeName}</h3>
                <button onClick={() => setStockModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2">
                {stockModal.checks.map((check, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border text-xs">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      {check.sufficient ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="font-bold text-slate-700">{check.product_name}</span>
                    </div>
                    <span className={`font-mono ${check.sufficient ? 'text-emerald-600' : 'text-red-600'}`}>
                      {check.available} / {check.required}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                {stockModal.checks.every(c => c.sufficient) ? (
                  <span className="text-emerald-600 font-bold">جميع المكونات متوفرة في المخزون</span>
                ) : (
                  <span className="text-red-600 font-bold">بعض المكونات غير كافية في المخزون</span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
