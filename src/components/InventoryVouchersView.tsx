/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { recordInventoryMovement } from '../lib/inventoryCore';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  Trash2, 
  AlertCircle,
  Table,
  ArrowLeft,
  X,
  Check,
  ChevronDown,
  HelpCircle,
  Settings,
  Calendar,
  Filter,
  User,
  Inbox,
  FileText,
  FileSpreadsheet,
  Search
} from 'lucide-react';

// Stock Voucher interface
interface StockVoucher {
  id: string;
  voucherNumber: string;
  source: string;
  branch: string;
  identifier: string;
  warehouse: string;
  clientName: string;
  supplierName: string;
  status: 'مكتمل' | 'مسودة' | 'ملغي';
  addedBy: string;
  productName: string; // Product referenced
  date: string;
  createdAt: string;
  type: 'إذن إضافة' | 'إذن صرف';
  itemsCount: number;
  notes?: string;
}

interface InventoryVouchersViewProps {
  setView: (view: string) => void;
}

export default function InventoryVouchersView({ setView }: InventoryVouchersViewProps) {
  // --- States ---
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [vouchers, setVouchers] = useState<StockVoucher[]>([]);
  const [isAddingVoucher, setIsAddingVoucher] = useState<boolean>(false);

  // --- Real datasets loaded from localStorage ---
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [warehousesList, setWarehousesList] = useState<any[]>([]);

  // --- Filter states (matches the mockup design fields) ---
  const [filterBranch, setFilterBranch] = useState<string>('الكل');
  const [filterVoucherNumber, setFilterVoucherNumber] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('الكل');
  const [filterIdentifier, setFilterIdentifier] = useState<string>('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('الكل');
  const [filterClient, setFilterClient] = useState<string>('أي عميل');
  const [filterSupplier, setFilterSupplier] = useState<string>('كل الموردين');

  // Advanced search parameters (visible after clicking advanced search)
  const [filterStatus, setFilterStatus] = useState<string>('الكل');
  const [filterAddedBy, setFilterAddedBy] = useState<string>('أي موظف');
  const [filterProduct, setFilterProduct] = useState<string>('من فضلك اختر');
  const [filterDateRange, setFilterDateRange] = useState<string>('تخصيص');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // --- New Voucher Form States ---
  const [newVoucherNo, setNewVoucherNo] = useState<string>('');
  const [newType, setNewType] = useState<'إذن إضافة' | 'إذن صرف'>('إذن إضافة');
  const [newSource, setNewSource] = useState<string>('يدوي');
  const [branchesList, setBranchesList] = useState<{ id: string; name: string }[]>([]);
  const [newBranch, setNewBranch] = useState<string>('');
  const [newIdentifier, setNewIdentifier] = useState<string>('');
  const [newWarehouse, setNewWarehouse] = useState<string>('المستودع الرئيسي');
  const [newClientName, setNewClientName] = useState<string>('أي عميل');
  const [newSupplierName, setNewSupplierName] = useState<string>('كل الموردين');
  const [newStatus, setNewStatus] = useState<'مكتمل' | 'مسودة' | 'ملغي'>('مكتمل');
  const [newAddedBy, setNewAddedBy] = useState<string>('Abdo Yaser');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState<string>('');
  
  // Dynamic Product items in adding screen
  const [voucherItems, setVoucherItems] = useState<{ productId: string, quantity: number }[]>([
    { productId: '', quantity: 1 }
  ]);

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState<Record<number, boolean>>({});

  const mapVoucherRow = (row: any): StockVoucher => ({
    id: row.id,
    voucherNumber: row.voucher_number || '',
    source: row.source || '',
    branch: row.branch || '',
    identifier: row.identifier || '',
    warehouse: row.warehouse || '',
    clientName: row.client_name || '',
    supplierName: row.supplier_name || '',
    status: row.status || 'مكتمل',
    addedBy: row.added_by || '',
    productName: row.product_name || '',
    date: row.date || '',
    createdAt: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    type: row.type || 'إذن إضافة',
    itemsCount: row.items_count || 0,
    notes: row.notes || '',
  });

  // Load clients, products, warehouses and existing vouchers from Supabase
  useEffect(() => {
    supabase.from('clients').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setClientsList(data);
      else setClientsList([]);
    });

    supabase.from('products').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setProductsList(data);
      else setProductsList([]);
    });

    supabase.from('warehouses').select('id, name').then(({ data }) => {
      if (data) setWarehousesList(data);
      else setWarehousesList([]);
    });

    supabase.from('branches').select('id, name').order('name').then(({ data }) => {
      if (data) {
        setBranchesList(data);
        if (data.length > 0) {
          setNewBranch(data[0].name);
        }
      }
    });

    supabase.from('inventory_vouchers').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setVouchers(data.map(mapVoucherRow));
      else setVouchers([]);
    });
  }, []);

  // --- Filtering Logic ---
  const filteredVouchers = vouchers.filter(v => {
    // 1. Branch
    if (filterBranch !== 'الكل' && v.branch !== filterBranch) return false;
    
    // 2. Voucher Number
    if (filterVoucherNumber && !v.voucherNumber.includes(filterVoucherNumber)) return false;

    // 3. Source
    if (filterSource !== 'الكل' && v.source !== filterSource) return false;

    // 4. Identifier
    if (filterIdentifier && !v.identifier.includes(filterIdentifier)) return false;

    // 5. Warehouse
    if (filterWarehouse !== 'الكل' && v.warehouse !== filterWarehouse) return false;

    // 6. Client
    if (filterClient !== 'أي عميل' && v.clientName !== filterClient) return false;

    // 7. Supplier
    if (filterSupplier !== 'كل الموردين' && v.supplierName !== filterSupplier) return false;

    // Advanced attributes
    if (isAdvancedSearch) {
      // Status
      if (filterStatus !== 'الكل' && v.status !== filterStatus) return false;

      // Added by
      if (filterAddedBy !== 'أي موظف' && v.addedBy !== filterAddedBy) return false;

      // Product (loads by productName)
      if (filterProduct !== 'من فضلك اختر' && !v.productName.includes(filterProduct)) return false;

      // Date Range from
      if (filterDateFrom && v.date < filterDateFrom) return false;

      // Date Range to
      if (filterDateTo && v.date > filterDateTo) return false;
    }

    return true;
  });

  const handleClearFilters = () => {
    setFilterBranch('الكل');
    setFilterVoucherNumber('');
    setFilterSource('الكل');
    setFilterIdentifier('');
    setFilterWarehouse('الكل');
    setFilterClient('أي عميل');
    setFilterSupplier('كل الموردين');
    setFilterStatus('الكل');
    setFilterAddedBy('أي موظف');
    setFilterProduct('من فضلك اختر');
    setFilterDateRange('تخصيص');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Open the add voucher popup or subpage
  const handleOpenAddForm = () => {
    const nextNo = vouchers.length + 1;
    setNewVoucherNo(`INV-STK-${String(nextNo).padStart(5, '0')}`);
    setNewType('إذن إضافة');
    setNewSource('يدوي');
    setNewBranch(branchesList.length > 0 ? branchesList[0].name : '');
    setNewIdentifier('');
    setNewWarehouse('المستودع الرئيسي');
    setNewClientName('أي عميل');
    setNewSupplierName('كل الموردين');
    setNewStatus('مكتمل');
    setNewAddedBy('Abdo Yaser');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewNotes('');
    setVoucherItems([{ productId: '', quantity: 1 }]);
    setIsAddingVoucher(true);
  };

  const handleAddFieldRow = () => {
    setVoucherItems([...voucherItems, { productId: '', quantity: 1 }]);
  };

  const handleRemoveFieldRow = (idx: number) => {
    if (voucherItems.length > 1) {
      setVoucherItems(voucherItems.filter((_, i) => i !== idx));
    }
  };

  const handleItemSelectChange = (val: string, idx: number) => {
    const copy = [...voucherItems];
    copy[idx].productId = val;
    setVoucherItems(copy);
  };

  const handleItemQtyChange = (val: number, idx: number) => {
    const copy = [...voucherItems];
    copy[idx].quantity = val;
    setVoucherItems(copy);
  };

  // Submit and Append new Stock Voucher
  const handleAddNewVoucher = async (e: React.FormEvent) => {
    e.preventDefault();

    // Map referenced products
    let detectedProductName = 'إذن مخزني عام';
    let totalItems = 0;
    
    // Choose the first selected product name for simplicity of display search
    if (voucherItems.length > 0 && voucherItems[0].productId) {
      const pFound = productsList.find(p => p.id === voucherItems[0].productId);
      if (pFound) {
        detectedProductName = pFound.name;
      }
    }

    voucherItems.forEach(vi => {
      totalItems += Number(vi.quantity) || 0;
    });

    const row = {
      voucher_number: newVoucherNo.trim() || `STK-${Math.floor(Math.random() * 90000) + 10000}`,
      source: newSource,
      branch: newBranch,
      identifier: newIdentifier.trim() || `REF-${Math.floor(Math.random() * 90000) + 10000}`,
      warehouse: newWarehouse,
      client_name: newClientName,
      supplier_name: newSupplierName,
      status: newStatus,
      added_by: newAddedBy,
      product_name: detectedProductName,
      date: newDate,
      type: newType,
      items_count: totalItems || 1,
      notes: newNotes || null,
    };

    const { data: inserted, error } = await supabase.from('inventory_vouchers').insert(row).select().single();
    if (!error && inserted) {
      const { data } = await supabase.from('inventory_vouchers').select('*').order('created_at', { ascending: false });
      if (data) setVouchers(data.map(mapVoucherRow));
      setIsAddingVoucher(false);

      // Record inventory movements
      const matchedWarehouse = warehousesList.find(w => w.name === newWarehouse);
      if (matchedWarehouse && newStatus === 'مكتمل') {
        for (const vi of voucherItems) {
          if (!vi.productId) continue;
          const qtyChange = newType === 'إذن إضافة' ? vi.quantity : -vi.quantity;
          await recordInventoryMovement({ productId: vi.productId, warehouseId: matchedWarehouse.id, movementType: 'adjustment', referenceType: 'inventory_voucher', referenceId: inserted.id, referenceNumber: inserted.voucher_number, qtyChange, createdBy: newAddedBy });
        }
      }
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإذن المخزني؟')) return;
    const { error } = await supabase.from('inventory_vouchers').delete().eq('id', id);
    if (!error) {
      setVouchers(vouchers.filter(v => v.id !== id));
    }
  };

  // Pagination totals
  const totalPages = Math.ceil(filteredVouchers.length / 10) || 0;
  const currentPage = totalPages > 0 ? 1 : 0;

  // --- Subpage: Add New Stock Voucher ---
  if (isAddingVoucher) {
    return (
      <div id="daftra-add-voucher-fullscreen" className="w-full mx-auto space-y-4 text-right font-sans select-none pb-12">
        
        {/* Navigation Breadcrumbs and Action Buttons */}
        <div className="flex justify-between items-center bg-white p-3 rounded-md border border-[#d4e1ed] shadow-3xs flex-row-reverse">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 flex-row-reverse text-sm font-sans tracking-tight text-[#1a252f]">
            <span className="text-[#0074b1] font-bold cursor-pointer hover:underline" onClick={() => setIsAddingVoucher(false)}>الأذون المخزنية</span>
            <span className="text-slate-400 font-bold">&gt;</span>
            <span className="text-slate-800 font-bold">إضافة إذن مخزني</span>
          </div>

          {/* Top Save & Cancel button */}
          <div className="flex items-center gap-2 flex-row-reverse">
            {/* Split Green Save Button */}
            <div className="flex items-center rounded overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={handleAddNewVoucher}
                className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-5 h-8 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border-l border-[#008d4c]"
              >
                <span>حفظ</span>
              </button>
              <button
                type="button"
                onClick={() => alert('حفظ سريع والرجوع للقائمة الرئيسية')}
                className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-2.5 h-8 flex items-center justify-center cursor-pointer transition-all"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cancel */}
            <button
              type="button"
              onClick={() => setIsAddingVoucher(false)}
              className="bg-white border border-[#ccc] text-slate-700 hover:bg-slate-50 font-bold h-8 px-4 text-xs rounded transition-all flex items-center gap-1.5 flex-row-reverse cursor-pointer shadow-3xs"
            >
              <X className="w-3.5 h-3.5 text-slate-500 font-bold" />
              <span>إلغاء</span>
            </button>
          </div>
        </div>

        {/* Entry fields block */}
        <form onSubmit={handleAddNewVoucher} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs text-right select-text font-sans">
          
          {/* Right Area: General Settings Card - spans 7 units */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* General Info */}
            <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden shadow-3xs">
              <div className="bg-[#fcfdfe] px-4 py-2.5 border-b border-[#e9eff4]">
                <span className="text-slate-800 font-bold block">تفاصيل الإذن</span>
              </div>
              
              <div className="p-4 space-y-4">
                
                {/* Row 1: Type & Voucher Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">نوع الإذن <span className="text-rose-500 font-black">*</span></label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as 'إذن إضافة' | 'إذن صرف')}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-650 bg-white text-right focus:outline-none focus:border-[#0074b1] font-bold"
                    >
                      <option value="إذن إضافة">إذن إضافة (استلام بضائع)</option>
                      <option value="إذن صرف">إذن صرف (تبديد / صرف بضائع)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">رقم الإذن المخزني</label>
                    <input
                      type="text"
                      value={newVoucherNo}
                      onChange={(e) => setNewVoucherNo(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-[#0074b1] text-left"
                    />
                  </div>
                </div>

                {/* Row 2: Warehouse & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-bold">المستودع</label>
                      <select
                        value={newWarehouse}
                        onChange={(e) => setNewWarehouse(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right focus:outline-none focus:border-[#0074b1]"
                      >
                        <option value="">(اختر المستودع)</option>
                        {warehousesList.map((w: any) => (
                          <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">الفرع</label>
                    <select
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right focus:outline-none focus:border-[#0074b1]"
                    >
                      {branchesList.length === 0 && <option value="">(لا توجد فروع)</option>}
                      {branchesList.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Client & Supplier & Source */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-505 font-bold">العميل المرتبط</label>
                    <select
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right focus:outline-none"
                    >
                      <option value="أي عميل">أي عميل</option>
                      {clientsList.map(c => (
                        <option key={c.id} value={c.full_name || c.fullName || ''}>{c.full_name || c.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">المورد المرتبط</label>
                    <select
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right focus:outline-none"
                    >
                      <option value="كل الموردين">كل الموردين</option>
                      <option value="شركة التقنية المتقدمة">شركة التقنية المتقدمة</option>
                      <option value="تجهيزات المخازن السعودية">تجهيزات المخازن السعودية</option>
                      <option value="مورد عام">مورد عام</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">مصدر الإذن</label>
                    <select
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right focus:outline-none"
                    >
                      <option value="يدوي">يدوي (تسجيل مباشر)</option>
                      <option value="مبيعات">مبيعات (تلقائي)</option>
                      <option value="مشتريات">مشتريات (تلقائي)</option>
                      <option value="مرتجع مبيعات">مرتجع مبيعات</option>
                      <option value="جرد مخزني">من عملية جرد</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Identifier & Date & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">الرقم المعرّف (المرجع)</label>
                    <input
                      type="text"
                      placeholder="مثال: REF-93821"
                      value={newIdentifier}
                      onChange={(e) => setNewIdentifier(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">التاريخ</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-705 text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-550 font-bold">حالة الإذن</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as 'مكتمل' | 'مسودة' | 'ملغي')}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right focus:outline-none"
                    >
                      <option value="مكتمل">مكتمل</option>
                      <option value="مسودة">مسودة (غير مفعل)</option>
                    </select>
                  </div>
                </div>

                {/* Internal notes */}
                <div className="space-y-1 text-right">
                  <label className="block text-slate-500 font-bold">ملاحظات / أسباب الإذن المخزني</label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="اكتب أي ملاحظات إدارية، مثل: تم رصد فروقات مستودعية أو تحويل خاص..."
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 text-right focus:outline-none"
                  />
                </div>

              </div>
            </div>

          </div>

          {/* Left Column Area: Items Grid Selector - spans 5 units */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden shadow-3xs">
              <div className="bg-[#fcfdfe] px-4 py-2.5 border-b border-[#e9eff4] flex justify-between items-center flex-row-reverse">
                <span className="text-slate-800 font-bold">البنود والمنتجات المشمولة</span>
                <button
                  type="button"
                  onClick={handleAddFieldRow}
                  className="text-xs bg-[#0074b1] text-white hover:bg-[#005a8a] font-bold px-2.5 py-1 rounded"
                >
                  إضافة بند +
                </button>
              </div>

              <div className="p-4 space-y-3">
                {voucherItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center border-b border-dashed border-slate-100 pb-3 flex-row-reverse">
                    
                    {/* Item Select */}
                    <div className="flex-1 space-y-1 text-right relative">
                      <label className="block text-[10px] text-slate-400 font-bold">المنتج / البند</label>
                      <input
                        type="text"
                        placeholder="ابحث عن منتج..."
                        value={item.productId ? productsList.find((p: any) => p.id === item.productId)?.name || '' : productSearchQuery}
                        onChange={(e) => {
                          setProductSearchQuery(e.target.value);
                          setShowProductDropdown(prev => ({ ...prev, [index]: true }));
                          if (!e.target.value) {
                            handleItemSelectChange('', index);
                          }
                        }}
                        onFocus={() => setShowProductDropdown(prev => ({ ...prev, [index]: true }))}
                        onBlur={() => setTimeout(() => setShowProductDropdown(prev => ({ ...prev, [index]: false })), 200)}
                        className="w-full border border-slate-300 rounded p-1 text-xs bg-white text-right pr-7"
                      />
                      <Search className="w-3 h-3 text-slate-400 absolute left-2 top-[26px] pointer-events-none" />
                      {showProductDropdown[index] && (
                        <div className="absolute z-50 top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-40 overflow-y-auto">
                          {(productSearchQuery.trim()
                            ? productsList.filter((p: any) =>
                                p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                                (p.code && p.code.toLowerCase().includes(productSearchQuery.toLowerCase()))
                              )
                            : productsList
                          ).map((p: any) => (
                            <div
                              key={p.id}
                              onMouseDown={() => {
                                handleItemSelectChange(p.id, index);
                                setShowProductDropdown(prev => ({ ...prev, [index]: false }));
                                setProductSearchQuery('');
                              }}
                              className="px-3 py-1.5 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex justify-between"
                            >
                              <span className="font-bold text-slate-700">{p.name}</span>
                              <span className="text-slate-400">{p.code}</span>
                            </div>
                          ))}
                          {productsList.filter((p: any) =>
                            productSearchQuery.trim()
                              ? p.name.toLowerCase().includes(productSearchQuery.toLowerCase())
                              : true
                          ).length === 0 && (
                            <div className="px-3 py-2 text-xs text-slate-400 text-center">لا توجد نتائج</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-20 space-y-1 text-right text-xs">
                      <label className="block text-[10px] text-slate-400 font-bold">الكمية</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemQtyChange(Number(e.target.value), index)}
                        className="w-full border border-slate-300 rounded p-1 text-center font-mono text-xs"
                      />
                    </div>

                    {/* Remove Action Button */}
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveFieldRow(index)}
                        disabled={voucherItems.length === 1}
                        className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-40 cursor-pointer"
                        title="حذف هذا البند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}

                {/* Form submit confirmation info */}
                <div className="bg-[#f0f4f8] p-3 rounded-md text-[10px] text-slate-600 font-bold mt-2">
                  <span>سيتم تعديل مستويات كميات المخزون للبنود المضافة فور تفعيل حالة الإذن المخزني إلى مكتمل بناءً على إعدادات التتبع.</span>
                </div>

              </div>
            </div>

          </div>

          {/* Bottom controls */}
          <div className="lg:col-span-12 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddingVoucher(false)}
              className="px-5 py-2 border border-[#ccc] text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              إلغاء الحفظ
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              حفظ الإذن المخزني
            </button>
          </div>

        </form>

      </div>
    );
  }

  // --- Main List and Filter View ---
  return (
    <div id="daftra-inventory-vouchers-panel" className="w-full mx-auto space-y-4 text-right font-sans select-none pb-12">
      
      {/* 1. Header Navigation & Breadcrumbs Bar mimicking top app layer */}
      <div className="flex justify-between items-center bg-[#eceff1]/60 px-4 py-2 text-xs text-slate-500 rounded-md border border-slate-200/50">
        <div className="flex items-center gap-1.5 flex-row-reverse">
          <span className="text-slate-405">المخزون</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 font-bold">الأذون المخزنية</span>
        </div>
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-1 text-[#0074b1] hover:underline font-bold"
        >
          <span>العودة للوحة التحكم</span>
          <ArrowLeft className="w-3 h-3 text-[#0074b1]" />
        </button>
      </div>

      {/* 2. Top Action Control Toolbar - Matching Screenshot style */}
      <div className="bg-white p-2.5 rounded-md border border-[#d4e1ed] flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Green "+ إضافة" Add Button */}
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="flex items-center rounded overflow-hidden shadow-2xs">
            <button
              onClick={handleOpenAddForm}
              className="bg-[#2ecc71] hover:bg-[#27ae60] text-white px-5 py-1.5 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="bg-[#2ecc71] hover:bg-[#27ae60] text-white px-1.5 py-1.5 flex items-center justify-center cursor-pointer border-r border-[#27ae60]"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Exact Pagination layout from screenshot */}
        <div className="flex items-center gap-2 flex-row-reverse text-slate-600 font-sans">
          {/* Table display action */}
          <button className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-500">
            <Table className="w-4 h-4 text-[#0074b1]" />
          </button>

          {/* Counts Dropdown */}
          <div className="px-2 py-1.5 border border-slate-200 rounded bg-white text-[11px] h-8 flex items-center font-bold">
            {filteredVouchers.length > 0 ? `1 - ${filteredVouchers.length} من ${filteredVouchers.length}` : '0 - 0 من 0'}
          </div>

          {/* Page Display with custom look */}
          <div className="flex items-center border border-slate-200 rounded bg-white h-8 overflow-hidden">
            <button 
              className="px-2 hover:bg-slate-50 h-full border-l border-slate-150 flex items-center justify-center text-slate-400"
              disabled={currentPage <= 1}
              onClick={() => alert('الصفحة الأولى')}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            
            <span className="px-3 text-slate-500 text-[11px] h-full flex items-center select-none bg-slate-50/50">
              صفحة {currentPage} من {totalPages}
            </span>

            <button 
              className="px-2 hover:bg-slate-50 h-full border-r border-slate-150 flex items-center justify-center text-slate-400"
              disabled={currentPage >= totalPages}
              onClick={() => alert('الصفحة الأخيرة')}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 3. The Interactive Search Panel matching both states of Image 1 & Image 2 */}
      <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden">
        
        {/* Search Header tab */}
        <div className="bg-[#fcfdfe] px-4 py-2 border-b border-[#e9eff4]">
          <h3 className="text-[13px] font-bold text-[#0074b1]">بحث</h3>
        </div>

        {/* Input fields body exactly formatted matching screenshots */}
        <div className="p-4 space-y-4">
          
          {/* Default visible search row (First 2 rows in image 1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4 text-right">
            
            {/* فرع (Branch) */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold font-sans">
                الفرع
              </label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right shadow-2xs"
              >
                <option value="الكل">الكل</option>
                {branchesList.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* رقم الإذن المخزني (Voucher Number) */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold font-sans">
                رقم الإذن المخزني
              </label>
              <input
                type="text"
                placeholder=""
                value={filterVoucherNumber}
                onChange={(e) => setFilterVoucherNumber(e.target.value)}
                className="w-full border border-slate-202 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white placeholder-slate-300 focus:outline-none focus:border-[#0074b1] transition-all text-left font-mono shadow-2xs"
              />
            </div>

            {/* مصدر الإذن (Voucher Source) */}
            <div className="space-y-1.5">
              <label className="block text-slate-505 text-xs font-bold font-sans">
                مصدر الإذن
              </label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right shadow-2xs"
              >
                <option value="الكل">الكل</option>
                <option value="يدوي">يدوي (تسجيل مباشر)</option>
                <option value="مبيعات">مبيعات</option>
                <option value="مشتريات">مشتريات</option>
                <option value="مرتجع مبيعات">مرتجع مبيعات</option>
                <option value="جرد مخزني">من عملية جرد</option>
              </select>
            </div>

            {/* الرقم المعرّف */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold font-sans">
                الرقم المعرّف
              </label>
              <input
                type="text"
                placeholder=""
                value={filterIdentifier}
                onChange={(e) => setFilterIdentifier(e.target.value)}
                className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white placeholder-slate-300 focus:outline-none focus:border-[#0074b1] transition-all text-right shadow-2xs"
              />
            </div>

              {/* المستودع */}
              <div className="space-y-1.5">
                <label className="block text-slate-500 text-xs font-bold font-sans">
                  المستودع
                </label>
                <select
                  value={filterWarehouse}
                  onChange={(e) => setFilterWarehouse(e.target.value)}
                  className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right shadow-2xs"
                >
                  <option value="الكل">الكل</option>
                  {warehousesList.map((w: any) => (
                    <option key={w.id} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>

            {/* العميل */}
            <div className="space-y-1.5 text-right">
              <label className="block text-slate-500 text-xs font-bold font-sans">
                العميل
              </label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-605 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right shadow-2xs"
              >
                <option value="أي عميل">أي عميل</option>
                {clientsList.map(c => (
                  <option key={c.id} value={c.full_name || c.fullName || ''}>{c.full_name || c.fullName}</option>
                ))}
              </select>
            </div>

            {/* المورد */}
            <div className="space-y-1.5 text-right">
              <label className="block text-slate-505 text-xs font-bold font-sans">
                المورد
              </label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right shadow-2xs text-ellipsis overflow-hidden"
              >
                <option value="كل الموردين">كل الموردين</option>
                <option value="شركة التقنية المتقدمة">شركة التقنية المتقدمة</option>
                <option value="تجهيزات المخازن السعودية">تجهيزات المخازن السعودية</option>
              </select>
            </div>

          </div>

          {/* 4. Advanced Fields Expansion Drawer (Expands precisely via Framer Motion to match image 2) */}
          <AnimatePresence>
            {isAdvancedSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-t border-dashed border-[#e4edf5] pt-4 grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4 shadow-3xs text-right"
              >
                
                {/* الحالة */}
                <div className="space-y-1.5 border-none">
                  <label className="block text-slate-500 text-xs font-bold font-sans">
                    الحالة
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-slate-202 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] text-right"
                  >
                    <option value="الكل">الكل</option>
                    <option value="مكتمل">مكتمل</option>
                    <option value="مسودة">مسودة</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>

                {/* أضيفت بواسطة */}
                <div className="space-y-1.5">
                  <label className="block text-slate-502 text-xs font-bold font-sans">
                    أُضيفت بواسطة
                  </label>
                  <select
                    value={filterAddedBy}
                    onChange={(e) => setFilterAddedBy(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] text-right"
                  >
                    <option value="أي موظف">أي موظف</option>
                    <option value="Abdo Yaser">Abdo Yaser</option>
                    <option value="العضو العام">الموظف العام</option>
                  </select>
                </div>

                {/* المنتجات */}
                <div className="space-y-1.5">
                  <label className="block text-slate-501 text-xs font-bold font-sans">
                    المنتجات
                  </label>
                  <select
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] text-right"
                  >
                    <option value="من فضلك اختر">من فضلك اختر</option>
                    {productsList.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* التاريخ */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-slate-500 text-xs font-bold font-sans">
                    التاريخ
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={filterDateRange}
                      onChange={(e) => setFilterDateRange(e.target.value)}
                      className="border border-slate-200 rounded px-1.5 py-1.5 text-xs text-slate-605 bg-white focus:outline-none text-right w-1/4 shrink-0 font-bold"
                    >
                      <option value="تخصيص">تخصيص</option>
                      <option value="اليوم">اليوم</option>
                      <option value="أمس">أمس</option>
                      <option value="هذا الشهر">هذا الشهر</option>
                    </select>
                    
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">من</span>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="border border-slate-200 rounded p-1 text-[11px] text-slate-700 bg-white focus:outline-none text-center flex-1"
                      placeholder="تاريخ البداية"
                    />

                    <span className="text-[10px] text-slate-400 font-bold shrink-0">إلى</span>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="border border-slate-200 rounded p-1 text-[11px] text-slate-700 bg-white focus:outline-none text-center flex-1"
                      placeholder="تاريخ النهاية"
                    />
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons Area: Bottom of the search block */}
          <div className="flex justify-between items-center pt-2 select-none border-t border-[#f4f7fa] flex-row-reverse">
            
            {/* Right: Actions: Advanced Search Toggle */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
                className={`p-2 rounded border focus:outline-none cursor-pointer transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
                  isAdvancedSearch
                    ? 'border-[#0074b1] bg-[#eef7fc] text-[#0074b1]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-inherit" />
                <span>بحث متقدم</span>
              </button>
            </div>

            {/* Left: Search Trigger and Clear Filters */}
            <div className="flex items-center gap-3.5 flex-row-reverse">
              {/* Click triggers filter applying */}
              <button
                type="button"
                onClick={() => alert(`تم تصفية النتائج: تم العثور على ${filteredVouchers.length} إذن مخزني.`)}
                className="bg-[#3c8dbc] hover:bg-[#357ebd] text-white px-5 py-1.5 rounded font-bold text-xs transition-colors shadow-2xs cursor-pointer border border-[#357ebd]"
              >
                بحث
              </button>
              
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[#0074b1] hover:underline text-xs font-bold bg-transparent border-none cursor-pointer"
              >
                إلغاء الفلتر
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* 5. Results Layer exactly layout to image */}
      <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden">
        
        {/* Results title block with sorting option */}
        <div className="bg-[#fcfdfe] px-4 py-2 border-b border-[#e9eff4] flex justify-between items-center flex-row-reverse">
          <span className="text-[13px] font-bold text-slate-750">النتائج</span>
          
          <div className="flex items-center gap-1.5 flex-row-reverse">
            <span className="text-[11px] text-slate-400 font-bold">الترتيب حسب:</span>
            <select
              className="border-none bg-transparent hover:bg-slate-50 text-[11px] text-slate-800 font-bold focus:outline-none cursor-pointer"
              onChange={(e) => {
                const sortBy = e.target.value;
                const copy = [...vouchers];
                if (sortBy === 'newest') {
                  copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                } else if (sortBy === 'voucher_no') {
                  copy.sort((a, b) => a.voucherNumber.localeCompare(b.voucherNumber));
                }
                setVouchers(copy);
              }}
            >
              <option value="newest">الأحدث إنشائاً</option>
              <option value="voucher_no">رقم الإذن</option>
            </select>
          </div>
        </div>

        {/* Real Dynamic Vouchers Table / Empty state depending on counts */}
        {filteredVouchers.length === 0 ? (
          /* Empty alert exactly match: لم يتم العثور على الأذون المخزنية. اضغط هنا لإضافة */
          <div className="p-4 bg-[#fcf8e3] border-t border-b border-[#faebcc] text-[#8a6d3b] text-center font-bold text-xs select-text flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#8a6d3b]" />
            <span>
              لم يتم العثور على الأذون المخزنية.{' '}
              <span
                onClick={handleOpenAddForm}
                className="text-[#0074b1] hover:underline cursor-pointer font-black"
              >
                اضغط هنا لإضافة
              </span>
            </span>
          </div>
        ) : (
          /* The Interactive Table for Stock Vouchers */
          <div className="overflow-x-auto select-text">
            <table className="w-full text-right text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 text-center">رقم الإذن</th>
                  <th className="p-3">نوع الإذن</th>
                  <th className="p-3 text-center">التاريخ</th>
                  <th className="p-3">مصدر الإذن (المرجع)</th>
                  <th className="p-3">العميل / المورد</th>
                  <th className="p-3">المستودع / الفرع</th>
                  <th className="p-3 text-center">إجمالي البنود</th>
                  <th className="p-3 text-center">المسؤول</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-slate-50/70 transition-colors text-slate-700">
                    
                    {/* رقم الإذن */}
                    <td className="p-3 text-center font-mono font-bold text-[#0074b1]">
                      {voucher.voucherNumber}
                    </td>

                    {/* نوع الإذن */}
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        voucher.type === 'إذن إضافة' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {voucher.type}
                      </span>
                    </td>

                    {/* التاريخ */}
                    <td className="p-3 text-center font-mono select-none">
                      {voucher.date}
                    </td>

                    {/* مصدر الإذن */}
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{voucher.source}</span>
                        {voucher.identifier && (
                          <span className="text-[10px] text-slate-400 font-mono">({voucher.identifier})</span>
                        )}
                      </div>
                    </td>

                    {/* العميل أو المورد المرفق */}
                    <td className="p-3 font-semibold">
                      {voucher.clientName !== 'أي عميل' ? (
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{voucher.clientName}</span>
                        </div>
                      ) : voucher.supplierName !== 'كل الموردين' ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500 font-normal">مورد</span>
                          <span>{voucher.supplierName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* المستودع والفرع */}
                    <td className="p-3">
                      <div className="flex flex-col text-[11px]">
                        <span className="font-semibold text-slate-800">{voucher.warehouse}</span>
                        <span className="text-[10px] text-slate-400">{voucher.branch}</span>
                      </div>
                    </td>

                    {/* إجمالي البنود */}
                    <td className="p-3 text-center font-mono font-bold">
                      {voucher.itemsCount}
                    </td>

                    {/* الموظف المسؤول */}
                    <td className="p-3 text-center text-slate-500">
                      {voucher.addedBy}
                    </td>

                    {/* الحالة */}
                    <td className="p-3 text-center select-none">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        voucher.status === 'مكتمل'
                          ? 'bg-[#00a65a]/10 text-[#00a65a]'
                          : voucher.status === 'مسودة'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {voucher.status}
                      </span>
                    </td>

                    {/* إجراءات */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => alert(`تفاصيل الإذن المخزني ${voucher.voucherNumber}:\n\nالمستودع: ${voucher.warehouse}\nالملاحظات: ${voucher.notes || 'لا توجد'}`)}
                          className="text-[#0074b1] hover:underline font-bold"
                          title="عرض التفاصيل"
                        >
                          معاينة
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleDeleteVoucher(voucher.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold"
                          title="حذف الإذن"
                        >
                          حذف
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
