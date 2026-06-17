/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  FileText,
  User,
  Calendar,
  Percent,
  Calculator,
  ChevronDown,
  X,
  FileCheck,
  Printer,
  HelpCircle,
  Eye,
  Bold,
  Italic,
  Underline,
  List,
  Link2,
  Strikethrough,
  Save,
  CheckCircle2,
  Search,
  Sliders,
  AlertCircle,
  TrendingDown,
  ChevronLeft,
  Settings,
  Mail,
  Phone,
  Coins,
  Receipt,
  FileSpreadsheet,
  ArrowBigLeftDash,
  Warehouse
} from 'lucide-react';

// Interfaces for our Purchase Returns
interface PurchaseReturnItem {
  id: string;
  itemName: string;
  description: string;
  unitPrice: number;
  quantity: number;
  discount: number; // Discount value
  taxValue: number; // VAT e.g. 14 or 0 (Egyptian)
  total: number;
}

interface PurchaseReturn {
  id: string;
  returnNumber: string;
  date: string;
  issueDate: string;
  vendorName: string;
  vendorId: string;
  salesAgent: string;
  paymentTerms: string; // in days
  items: PurchaseReturnItem[];
  status: 'draft' | 'paid' | 'unpaid';
  discountType: 'percentage' | 'amount';
  discountValue: number;
  adjustment: number;
  subtotal: number;
  total: number;
  notes: string;
  alreadyPaid: boolean; // "تم رد المبلغ الإجمالي للبنود المرتجعة من المورد؟"
  paymentMethod: string;
  paymentReference: string;
  currency: string;
  billingTemplate: string;
}

interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  currency: string;
}

interface PurchaseReturnsViewProps {
  setView: (view: string) => void;
}

const mapReturnFromDB = (data: any): PurchaseReturn => ({
  id: data.id,
  returnNumber: data.return_number,
  date: data.date,
  issueDate: data.issue_date,
  vendorName: data.vendor_name,
  vendorId: data.vendor_id,
  salesAgent: data.sales_agent,
  paymentTerms: data.payment_terms,
  items: data.items as PurchaseReturnItem[],
  status: data.status,
  discountType: data.discount_type,
  discountValue: data.discount_value,
  adjustment: data.adjustment,
  subtotal: data.subtotal,
  total: data.total,
  notes: data.notes,
  alreadyPaid: data.already_paid,
  paymentMethod: data.payment_method,
  paymentReference: data.payment_reference,
  currency: data.currency,
  billingTemplate: data.billing_template
});

export default function PurchaseReturnsView({ setView }: PurchaseReturnsViewProps) {
  // Mode selection: 'list' | 'add'
  const [currentMode, setCurrentMode] = useState<'list' | 'add'>('list');
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // Quick Search state
  const [searchText, setSearchText] = useState('');
  
  // Active Return form states
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [newVendorName, setNewVendorName] = useState<string>('');
  const [showAddVendorModal, setShowAddVendorModal] = useState<boolean>(false);
  const [vendorPhone, setVendorPhone] = useState<string>('');
  const [vendorEmail, setVendorEmail] = useState<string>('');
  const [vendorCompany, setVendorCompany] = useState<string>('');
  
  const [returnNumber, setReturnNumber] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('2026-06-14');
  const [issueDate, setIssueDate] = useState<string>('2026-06-14');
  const [billingTemplate, setBillingTemplate] = useState<string>('قالب فاتورة الإفتراضي');
  const [currency, setCurrency] = useState<string>('EGP');
  
  // Row Items
  const [items, setItems] = useState<PurchaseReturnItem[]>([
    {
      id: 'r-item-1',
      itemName: '',
      description: '',
      unitPrice: 0,
      quantity: 1,
      discount: 0,
      taxValue: 14, // Default 14% Egyptian VAT
      total: 0
    }
  ]);
  
  // Bottom Tab for adjustments
  const [activeTab, setActiveTab] = useState<'discount' | 'deposit' | 'shipping' | 'attachments'>('discount');
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  
  const [notes, setNotes] = useState<string>(
    'شروط المرتجع لضبط المدفوعات والسلع المرتدة للموردين.'
  );
  
  // "تم رد المبلغ الإجمالي للبنود المرتجعة من المورد؟"
  const [alreadyPaid, setAlreadyPaid] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('نقدي');
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Inventory & Treasury
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [safesBanks, setSafesBanks] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState<Record<string, boolean>>({});

  // Calculation variables
  const [subtotal, setSubtotal] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [previewReturn, setPreviewReturn] = useState<PurchaseReturn | null>(null);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      const { data: returnsData, error: returnsError } = await supabase
        .from('purchase_returns')
        .select('*')
        .order('created_at', { ascending: false });

      if (returnsError) {
        console.error("Failed to load purchase returns", returnsError);
      } else if (returnsData) {
        setPurchaseReturns(returnsData.map(mapReturnFromDB));
      }

      supabase.from('products').select('id, name, code, purchase_price, price').then(({ data }) => { if (data) setProducts(data); });
      supabase.from('warehouses').select('id, name').then(({ data }) => { if (data) setWarehouses(data); });
      supabase.from('safes_banks').select('id, name, type').then(({ data }) => { if (data) setSafesBanks(data); });

      const { data: vendorsData, error: vendorsError } = await supabase
        .from('purchase_vendors')
        .select('*')
        .order('name');

      if (vendorsError) {
        console.error("Failed to load vendors", vendorsError);
      } else if (vendorsData && vendorsData.length > 0) {
        setVendors(vendorsData);
      } else {
        const initialVendors = [
          { name: 'الشركة العربية للبرمجيات والتجهيزات', phone: '01011223344', email: 'arabtech@supplier.com', company: 'أرابتك المحدودة', currency: 'EGP' },
          { name: 'شركة النور الساطعة للتوريدات المكتبية', phone: '01222333444', email: 'alnoor@supplies.com', company: 'مكتبة النور', currency: 'EGP' },
          { name: 'مؤسسة سيجما للالكترونيات والأجهزة', phone: '01155667788', email: 'sales@sigma-eg.com', company: 'سيجما كمبيوتر', currency: 'EGP' }
        ];
        const { data: inserted } = await supabase.from('purchase_vendors').insert(initialVendors).select();
        if (inserted) {
          setVendors(inserted);
        }
      }
    };
    loadData();
  }, [currentMode]);

  // Recalculate row totals and grand totals whenever items, discounts, adjustments change
  useEffect(() => {
    let currentSubtotal = 0;
    const computedItems = items.map(item => {
      const rawTotal = item.unitPrice * item.quantity;
      const discountAmount = item.discount; // assuming flat discount on line level
      const taxedBase = Math.max(0, rawTotal - discountAmount);
      const taxAmount = taxedBase * (item.taxValue / 100);
      const total = taxedBase + taxAmount;
      currentSubtotal += rawTotal;
      return { ...item, total };
    });

    setSubtotal(currentSubtotal);

    // Calculate Global Discount
    let globalDiscount = 0;
    if (globalDiscountType === 'percentage') {
      globalDiscount = currentSubtotal * (globalDiscountValue / 100);
    } else {
      globalDiscount = globalDiscountValue;
    }

    // Adjusted base
    const totalWithGlobalDiscount = Math.max(0, currentSubtotal - globalDiscount);

    // Dynamic aggregate tax from row items:
    let aggregateTax = 0;
    items.forEach(item => {
      const rawTotal = item.unitPrice * item.quantity;
      const discountAmount = item.discount;
      const taxedBase = Math.max(0, rawTotal - discountAmount);
      aggregateTax += taxedBase * (item.taxValue / 100);
    });

    const finalTotal = totalWithGlobalDiscount + aggregateTax + Number(adjustmentValue);
    setGrandTotal(finalTotal);
  }, [items, globalDiscountType, globalDiscountValue, adjustmentValue]);

  // Generate next automatic sequential return invoice number
  const generateNextReturnNumber = () => {
    if (purchaseReturns.length === 0) return '000001';
    const lastNum = purchaseReturns.reduce((max, ret) => {
      const num = parseInt(ret.returnNumber, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return String(lastNum + 1).padStart(6, '0');
  };

  // Switch to ADD Mode and initialize fields
  const handleOpenAddNewReturn = () => {
    setReturnNumber(generateNextReturnNumber());
    setSelectedVendorId('');
    setReturnDate('2026-06-14');
    setIssueDate('2026-06-14');
    setGlobalDiscountValue(0);
    setAdjustmentValue(0);
    setAlreadyPaid(false);
    setPaymentReference('');
    setSelectedWarehouseId('');
    setSelectedTreasuryId('');
    setItems([
      {
        id: 'r-item-1',
        itemName: '',
        description: '',
        unitPrice: 0,
        quantity: 1,
        discount: 0,
        taxValue: 14,
        total: 0
      }
    ]);
    setCurrentMode('add');
    setPreviewReturn(null);
  };

  // Add Item Row
  const handleAddItemRow = () => {
    const newId = `r-item-${Date.now()}`;
    setItems([
      ...items,
      {
        id: newId,
        itemName: '',
        description: '',
        unitPrice: 0,
        quantity: 1,
        discount: 0,
        taxValue: 14,
        total: 0
      }
    ]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (id: string) => {
    if (items.length === 1) return; // Must keep at least one row
    setItems(items.filter(item => item.id !== id));
  };

  // Edit Item Cell values
  const handleEditItemCell = (id: string, field: keyof PurchaseReturnItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const getFilteredProducts = (query: string) => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter((p: any) =>
      p.name.toLowerCase().includes(q) ||
      (p.code && p.code.toLowerCase().includes(q))
    );
  };

  const handleSelectProduct = (itemId: string, product: any) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          itemName: product.name,
          unitPrice: parseFloat(product.purchase_price || product.price || 0)
        };
      })
    );
    setShowProductDropdown(prev => ({ ...prev, [itemId]: false }));
    setProductSearchQuery('');
  };

  const recordInventoryMovement = async (
    productId: string,
    warehouseId: string,
    movementType: string,
    referenceType: string,
    referenceId: string,
    referenceNumber: string,
    qtyChange: number,
    createdBy: string
  ) => {
    const { data: stock } = await supabase
      .from('warehouse_stock')
      .select('quantity')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .maybeSingle();

    const qtyBefore = stock ? parseFloat(stock.quantity) : 0;
    const qtyAfter = qtyBefore + qtyChange;

    await supabase
      .from('warehouse_stock')
      .upsert({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: qtyAfter
      }, { onConflict: 'product_id,warehouse_id' });

    await supabase
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
        created_by: createdBy
      });
  };

  // Quick Vendor Addition inside form
  const handleAddQuickVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    const { data, error } = await supabase.from('purchase_vendors').insert({
      name: newVendorName,
      phone: vendorPhone || 'غير محدد',
      email: vendorEmail || 'nill@supplier.com',
      company: vendorCompany || newVendorName,
      currency: 'EGP'
    }).select().single();

    if (error) {
      console.error("Failed to add vendor", error);
      return;
    }

    if (data) {
      setVendors([...vendors, data]);
      setSelectedVendorId(data.id);
    }
    setNewVendorName('');
    setVendorPhone('');
    setVendorEmail('');
    setVendorCompany('');
    setShowAddVendorModal(false);
  };

  // Save the Purchase Return to Supabase and List view
  const handleSaveReturn = async (status: 'paid' | 'draft' | 'unpaid') => {
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!vendor) {
      alert('الرجاء اختيار المورد أولاً قبل حفظ مرتجع المشتريات.');
      return;
    }

    if ((status === 'paid' || alreadyPaid) && !selectedWarehouseId) {
      alert('الرجاء اختيار المستودع لتسجيل حركة المخزون.');
      return;
    }

    let calculatedSubtotal = 0;
    const finalItems = items.map(item => {
      const rawTotal = item.unitPrice * item.quantity;
      const discountAmount = item.discount;
      const taxedBase = Math.max(0, rawTotal - discountAmount);
      const taxAmount = taxedBase * (item.taxValue / 100);
      const total = taxedBase + taxAmount;
      calculatedSubtotal += rawTotal;
      return {
        ...item,
        itemName: item.itemName ? item.itemName : 'بند مرتجع جديد',
        total
      };
    });

    let globalDiscount = 0;
    if (globalDiscountType === 'percentage') {
      globalDiscount = calculatedSubtotal * (globalDiscountValue / 100);
    } else {
      globalDiscount = globalDiscountValue;
    }

    let aggregateTax = 0;
    finalItems.forEach(item => {
      const rawTotal = item.unitPrice * item.quantity;
      const discountAmount = item.discount;
      const taxedBase = Math.max(0, rawTotal - discountAmount);
      aggregateTax += taxedBase * (item.taxValue / 100);
    });

    const calculatedGrandTotal = calculatedSubtotal - globalDiscount + aggregateTax + Number(adjustmentValue);

    const { data, error } = await supabase.from('purchase_returns').insert({
      return_number: returnNumber || generateNextReturnNumber(),
      date: returnDate,
      issue_date: issueDate,
      vendor_name: vendor.name,
      vendor_id: vendor.id,
      sales_agent: 'أبو ياسر #000001 (أنت)',
      payment_terms: 'فوري',
      items: finalItems,
      status: alreadyPaid ? 'paid' : status,
      discount_type: globalDiscountType,
      discount_value: globalDiscountValue,
      adjustment: adjustmentValue,
      subtotal: calculatedSubtotal,
      total: calculatedGrandTotal,
      notes: notes,
      already_paid: alreadyPaid,
      payment_method: alreadyPaid ? paymentMethod : '',
      payment_reference: alreadyPaid ? paymentReference : '',
      currency: currency,
      billing_template: billingTemplate,
      warehouse_id: selectedWarehouseId || null,
      treasury_id: alreadyPaid ? selectedTreasuryId : null
    }).select().single();

    if (error) {
      console.error("Failed to save purchase return", error);
      return;
    }

    if (data) {
      setPurchaseReturns([mapReturnFromDB(data), ...purchaseReturns]);

      // Record inventory movements
      if (selectedWarehouseId) {
        for (const item of finalItems) {
          const matchedProduct = products.find((p: any) => p.name === item.itemName);
          if (matchedProduct) {
            await recordInventoryMovement(
              matchedProduct.id,
              selectedWarehouseId,
              'purchase_return',
              'purchase_return',
              data.id,
              data.return_number,
              -item.quantity,
              'أبو ياسر #000001'
            );
          }
        }
      }

      // Record treasury transaction if already paid
      if (alreadyPaid && selectedTreasuryId && calculatedGrandTotal > 0) {
        const { data: treasury } = await supabase
          .from('safes_banks')
          .select('balance')
          .eq('id', selectedTreasuryId)
          .single();

        const currentBalance = treasury ? parseFloat(treasury.balance) : 0;
        const newBalance = currentBalance - calculatedGrandTotal;

        await supabase
          .from('safes_banks')
          .update({ balance: newBalance })
          .eq('id', selectedTreasuryId);

        await supabase.from('treasury_transactions').insert({
          treasury_id: selectedTreasuryId,
          transaction_type: 'payment_voucher',
          reference_type: 'purchase_return',
          reference_id: data.id,
          reference_number: data.return_number,
          description: `رد قيمة مرتجع مشتريات ${data.return_number} للمورد ${vendor.name}`,
          amount: calculatedGrandTotal,
          balance_before: currentBalance,
          balance_after: newBalance,
          created_by: 'أبو ياسر #000001'
        });
      }
    }

    setCurrentMode('list');
  };

  // Delete return from Supabase
  const handleDeleteReturn = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من رغبتك في حذف مرتجع المشتريات هذا نهائياً؟')) {
      const { error } = await supabase.from('purchase_returns').delete().eq('id', id);
      if (error) {
        console.error("Failed to delete purchase return", error);
        return;
      }
      setPurchaseReturns(purchaseReturns.filter(ret => ret.id !== id));
    }
  };

  // Filter returns according to SearchText
  const filteredReturns = purchaseReturns.filter(ret => {
    if (!searchText.trim()) return true;
    const query = searchText.trim().toLowerCase();
    return (
      ret.returnNumber.toLowerCase().includes(query) ||
      ret.vendorName.toLowerCase().includes(query) ||
      ret.status.toLowerCase().includes(query) ||
      ret.total.toString().includes(query)
    );
  });

  return (
    <div id="purchase-returns-module" className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 antialiased">
      
      {/* ----------------- MODE: LIST VIEW ----------------- */}
      {currentMode === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>المشتريات</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-extrabold">مرتجعات المشتريات</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:bg-slate-150 px-4 py-2 rounded-lg border border-slate-200 transition-all font-bold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>لوحة التحكم</span>
              </button>
              
              <button
                onClick={handleOpenAddNewReturn}
                className="flex items-center gap-2 bg-[#0074b1] hover:bg-[#005f90] text-white px-4 py-2 rounded-lg transition-all font-bold cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مرتجع مشتريات</span>
              </button>
            </div>
          </div>

          {/* Under construction alert context or statistics bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 flex-row-reverse text-right">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-800">🔄 مرتجعات المشتريات والمخزون المرتد</h2>
              <p className="text-xs text-slate-405 font-semibold">تأكيد عملية إرجاع الأصناف والمنتجات التالفة أو الزائدة للموردين، واسترداد المستحقات والمدفوعات</p>
            </div>
            
            {/* Quick search input */}
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="البحث برقم المرتجع أو المورد..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full text-xs text-right pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#0074b1] focus:border-[#0074b1] rounded-lg transition-all font-semibold outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Actual List State or Empty State */}
          {filteredReturns.length === 0 ? (
            <div className="bg-white p-12 sm:p-20 rounded-xl border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 border border-slate-150 text-[#0074b1]/80 rounded-full flex items-center justify-center">
                <FileText className="w-12 h-12" />
              </div>
              
              <div className="space-y-2 max-w-lg">
                <h3 className="text-lg font-bold text-slate-700">لا يوجد مرتجعات مشتريات مضافة بعد</h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  يمكنك رد وتسجيل السلع الزائدة أو التالفة التي قمت بشرائها وسداد قيمتها للموردين. سيقوم النظام بخصم الكمية تلقائياً من الجرد والمستودعات المختصة وتحديث الميزان المالي.
                </p>
              </div>

              <button
                onClick={handleOpenAddNewReturn}
                className="px-6 py-2.5 bg-[#0074b1] hover:bg-[#005f90] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-2 flex-row-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مرتجع مشتريات الآن</span>
              </button>
            </div>
          ) : (
            /* Styled Returns table list */
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-550 font-bold border-b border-slate-100">
                      <th className="p-4 text-right">رقم الارتجاع</th>
                      <th className="p-4">تاريخ المرتجع</th>
                      <th className="p-4">اسم المورد</th>
                      <th className="p-4">استرداد المدفوعات</th>
                      <th className="p-4 text-center">حالة المستند</th>
                      <th className="p-4 text-left">قيمة المرتجع</th>
                      <th className="p-4 text-center">خيارات والعمليات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {filteredReturns.map((ret) => (
                      <tr 
                        key={ret.id} 
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setPreviewReturn(ret)}
                      >
                        <td className="p-4 font-bold text-[#0074b1] font-mono">#{ret.returnNumber}</td>
                        <td className="p-4 font-mono text-slate-500">{ret.date}</td>
                        <td className="p-4 text-slate-800 font-black">{ret.vendorName}</td>
                        <td className="p-4 text-slate-500 text-[11px]">
                          {ret.alreadyPaid ? (
                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                              تم الاسترداد {ret.paymentMethod} {ret.paymentReference ? `(${ret.paymentReference})` : ''}
                            </span>
                          ) : (
                            <span className="text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100">بانتظار الاسترداد المالي</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {ret.status === 'paid' && (
                            <span className="bg-emerald-100 text-emerald-850 px-2.5 py-1 rounded-full text-[10px] font-black">
                              ● مدفوع ومكتمل
                            </span>
                          )}
                          {ret.status === 'unpaid' && (
                            <span className="bg-rose-100 text-rose-850 px-2.5 py-1 rounded-full text-[10px] font-black">
                              ● معلق الصرف
                            </span>
                          )}
                          {ret.status === 'draft' && (
                            <span className="bg-slate-100 text-slate-650 px-2.5 py-1 rounded-full text-[10px] font-black">
                              ● مسودة معلقة
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-left font-mono font-black text-slate-850">
                          {ret.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {ret.currency}
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setPreviewReturn(ret)}
                            className="p-1 px-2.5 hover:bg-slate-100 text-[#0074b1] border border-slate-150 rounded transition-all font-bold cursor-pointer text-[10px]"
                          >
                            مراجعة وطباعة
                          </button>
                          <button
                            onClick={(e) => handleDeleteReturn(ret.id, e)}
                            className="p-1 px-1.5 hover:bg-rose-50 text-rose-600 rounded transition-all cursor-pointer border border-transparent hover:border-rose-150"
                            title="حذف المستند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}


      {/* ----------------- MODE: ACTIONS PREVIEW MODAL ----------------- */}
      {previewReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-100 max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Header Dialog */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center flex-row-reverse">
              <div className="flex items-center gap-2">
                <span className="text-[#0074b1] text-base font-black">مراجعة وتفاصيل مرتجع المشتريات #{previewReturn.returnNumber}</span>
              </div>
              <button 
                onClick={() => setPreviewReturn(null)}
                className="p-1 hover:bg-slate-200 text-slate-400 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Return Details Content */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* Header Info Block */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">مُورِّد الأصناف المرتجعة:</span>
                  <span className="text-sm font-black text-slate-800 block">{previewReturn.vendorName}</span>
                </div>
                <div className="space-y-1 text-left">
                  <span className="text-slate-400 font-bold block">رقم طلب المرتجع:</span>
                  <span className="text-sm font-black text-slate-850 block font-mono">Return #{previewReturn.returnNumber}</span>
                </div>
              </div>

              {/* Basic Meta Grid */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150 text-[11px] font-semibold text-slate-650">
                <div>
                  <span className="text-slate-450 block pb-1">تاريخ المرتجع</span>
                  <span className="font-mono text-slate-800">{previewReturn.date}</span>
                </div>
                <div>
                  <span className="text-slate-450 block pb-1">النموذج والمستودع</span>
                  <span className="text-slate-800">{previewReturn.billingTemplate}</span>
                </div>
                <div>
                  <span className="text-slate-450 block pb-1">الموظف المسئول</span>
                  <span className="text-slate-800">{previewReturn.salesAgent}</span>
                </div>
              </div>

              {/* Items Table within return invoice */}
              <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-center">
                      <th className="p-3 text-right">اسم البند والبيان</th>
                      <th className="p-3 text-right">الوصف والملحوظات</th>
                      <th className="p-3">سعر التوريد</th>
                      <th className="p-3">الكمية المرتجعة</th>
                      <th className="p-3">الضريبة</th>
                      <th className="p-3 text-left">الإجمالي المستحق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {previewReturn.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30">
                        <td className="p-3 text-slate-850 font-black text-right">{item.itemName}</td>
                        <td className="p-3 text-slate-400 font-normal text-right">{item.description || 'لا يوجد وصف'}</td>
                        <td className="p-3 text-center font-mono">{item.unitPrice.toLocaleString()} ج.م</td>
                        <td className="p-3 text-center font-mono text-rose-600">{item.quantity} وحدة</td>
                        <td className="p-3 text-center font-mono text-blue-500">{item.taxValue}%</td>
                        <td className="p-3 text-left font-mono text-slate-805">{item.total.toLocaleString()} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary Column */}
              <div className="space-y-2 border-t border-slate-100 pt-3 flex flex-col items-end text-xs font-semibold text-slate-700">
                <div className="w-56 flex justify-between">
                  <span className="text-slate-400">الإجمالي غير شامل الضريبة:</span>
                  <span className="font-mono text-slate-800">{previewReturn.subtotal.toLocaleString()} ج.م</span>
                </div>
                {previewReturn.discountValue > 0 && (
                  <div className="w-56 flex justify-between text-rose-600">
                    <span>خصم / تسويات مباشرة:</span>
                    <span className="font-mono">-{previewReturn.discountValue.toLocaleString()} ج.م</span>
                  </div>
                )}
                {Number(previewReturn.adjustment) !== 0 && (
                  <div className="w-56 flex justify-between text-blue-600">
                    <span>التسويات والتغييرات:</span>
                    <span className="font-mono">{previewReturn.adjustment} ج.م</span>
                  </div>
                )}
                <div className="w-56 flex justify-between text-base font-black border-t border-slate-150 pt-2 text-slate-900 leading-none">
                  <span>المبلغ المراد استرداده:</span>
                  <span className="font-mono text-[#0074b1]">{previewReturn.total.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Notes block */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-lg text-xs space-y-1">
                <span className="text-slate-500 font-bold block">شروط المرتجع والمستند التوجيهي:</span>
                <p className="text-slate-650 font-semibold leading-relaxed block">{previewReturn.notes}</p>
              </div>

              {/* Refunded confirmation block */}
              {previewReturn.alreadyPaid && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex justify-between items-center flex-row-reverse text-emerald-950 font-bold">
                  <div>
                    <span>📌 تم استرداد ورد المبلغ الإجمالي للبنود المرتجعة كلياً من المورد</span>
                  </div>
                  <div className="font-mono flex gap-2">
                    <span>وسيلة الاسترداد: {previewReturn.paymentMethod}</span>
                    {previewReturn.paymentReference && <span>/ مرجع استلام الخزينة: {previewReturn.paymentReference}</span>}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between">
              <button
                onClick={() => setPreviewReturn(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 text-xs font-bold rounded cursor-pointer transition-colors"
              >
                إغلاق النافذة
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-[#2d76a5] hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5 flex-row-reverse"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة مستند المرتجع</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ----------------- MODE: ADD NEW PURCHASE RETURN FORM ----------------- */}
      {currentMode === 'add' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Custom Breadcrumb Header matching exactly the screenshot style */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-205 shadow-xs flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-extrabold text-[13px]">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setCurrentMode('list')}>مرتجع المشتريات</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-black">إضافة</span>
            </div>

            {/* Top Bar Action Buttons exactly style: معاينة, حفظ كمسودة, حفظ */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  alert('معاينة المرتجع قبل الحفظ: لابد من اختيار المورد وتعبئة أسعار الأصناف الوازنة.');
                }}
                className="px-4 py-2 bg-white text-slate-750 hover:bg-slate-50 rounded-md border border-slate-250 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-row-reverse"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة</span>
              </button>

              <button
                onClick={() => handleSaveReturn('draft')}
                className="px-4 py-2 bg-blue-50/70 text-[#0074b1] hover:bg-blue-100 rounded-md border border-blue-200/55 text-xs font-bold transition-all cursor-pointer"
              >
                حفظ كمسودة
              </button>

              <button
                onClick={() => handleSaveReturn('paid')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 flex-row-reverse"
              >
                <Save className="w-4 h-4" />
                <span>حفظ مستند المرتجع</span>
              </button>
            </div>
          </div>

          {/* Form container representing the page design */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
            
            {/* Form Main Title Panel */}
            <div className="border-b border-slate-100 pb-4 text-right">
              <h1 className="text-xl font-black text-[#1a2e40] flex items-center gap-2 flex-row-reverse">
                <Receipt className="w-6 h-6 text-rose-500" />
                <span>مرتجع مشتريات جديد</span>
              </h1>
            </div>

            {/* Grid of basic inputs exactly like the screenshot layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-right text-xs">
              
              {/* Left Side fields: Template selection & Numeric info (8 columns) */}
              <div className="md:col-span-6 space-y-4">
                
                {/* Return template picker row */}
                <div className="grid grid-cols-12 items-center gap-2 flex-row-reverse">
                  <label className="col-span-4 font-bold text-slate-600 text-right pr-2">قالب فواتير المرتجع</label>
                  <div className="col-span-8">
                    <select
                      value={billingTemplate}
                      onChange={(e) => setBillingTemplate(e.target.value)}
                      className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none ring-1 ring-slate-100 focus:bg-white focus:ring-2 focus:ring-[#0074b1]"
                    >
                      <option value="قالب فاتورة الإفتراضي">قالب فاتورة الإفتراضي</option>
                      <option value="قالب إرجاع فوري مبسط">قالب إرجاع فوري مبسط</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/85 border border-slate-200/60 rounded-xl space-y-3">
                  
                  {/* Bill return number input */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-bold text-slate-500 text-right pr-2">رقم الارتجاع</label>
                    <div className="col-span-8">
                      <input
                        type="text"
                        value={returnNumber}
                        onChange={(e) => setReturnNumber(e.target.value)}
                        className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-[#0074b1] font-mono"
                      />
                    </div>
                  </div>

                  {/* Date fields picker */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-bold text-slate-500 text-right pr-2">تاريخ الارتجاع</label>
                    <div className="col-span-8">
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-[#0074b1] font-mono"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Side: Vendor select & Currency details (6 columns) */}
              <div className="md:col-span-6 space-y-4">
                
                {/* Vendor name picker and currency */}
                <div className="bg-slate-50/85 border border-slate-200/60 p-4 rounded-xl space-y-3.5">
                  
                  <div className="flex justify-between items-center flex-row-reverse pb-1">
                    <label className="font-bold text-[#1a2e40] text-sm flex items-center gap-1 flex-row-reverse">
                      <span>المورد</span>
                      <span className="text-red-500 font-extrabold">*</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setShowAddVendorModal(true)}
                      className="px-2.5 py-1.5 bg-sky-50 text-[#0074b1] border border-blue-200/40 rounded hover:bg-blue-100 flex items-center gap-1 font-bold text-[10px] transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>جديد</span>
                    </button>
                  </div>

                  {/* Vendor Dropdown selection */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    
                    <div className="col-span-4 text-left">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full text-center p-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none"
                      >
                        <option value="EGP">EGP</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="SAR">SAR</option>
                      </select>
                    </div>

                    <div className="col-span-8">
                      <select
                        value={selectedVendorId}
                        onChange={(e) => setSelectedVendorId(e.target.value)}
                        className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-[#0074b1]"
                      >
                        <option value="">(اختر مورد)</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name} - {vendor.company}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <div className="text-[11px] text-slate-400 font-bold bg-white p-2 rounded border border-slate-150 flex items-center gap-1 flex-row-reverse">
                    <HelpCircle className="w-3.5 h-3.5 text-[#0074b1]" />
                    <span>سيقوم مستند المرتجع بعمل تسوية وتنزيل المبالغ الجردية من مخزون المورد.</span>
                  </div>

                  {/* Warehouse Selection */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-xs block">المستودع <span className="text-rose-500">*</span></label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-[#0074b1]"
                    >
                      <option value="">(اختر المستودع)</option>
                      {warehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                </div>

              </div>

            </div>

            {/* Interactive Items Table matches exactly the visual matrix specified by the user */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs text-xs font-semibold text-right">
              
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-slate-50 text-slate-550 border-b border-slate-200 text-center font-extrabold select-none">
                      <th className="p-3 text-right">البند</th>
                      <th className="p-3">الوصف والملحوظات</th>
                      <th className="p-3">سعر الوحدة</th>
                      <th className="p-3">الكمية</th>
                      <th className="p-3">الخصم (ج.م)</th>
                      <th className="p-3">الضريبة 1</th>
                      <th className="p-3 text-left">المجموع</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        
                        {/* Item Name */}
                        <td className="p-2 text-right relative">
                          <input
                            type="text"
                            placeholder="ابحث عن منتج..."
                            value={item.itemName}
                            onChange={(e) => {
                              handleEditItemCell(item.id, 'itemName', e.target.value);
                              setProductSearchQuery(e.target.value);
                              setShowProductDropdown(prev => ({ ...prev, [item.id]: true }));
                            }}
                            onFocus={() => setShowProductDropdown(prev => ({ ...prev, [item.id]: true }))}
                            onBlur={() => setTimeout(() => setShowProductDropdown(prev => ({ ...prev, [item.id]: false })), 200)}
                            className="w-full text-right p-2 border border-slate-200 rounded font-bold outline-none focus:border-[#0074b1]"
                          />
                          {showProductDropdown[item.id] && (
                            <div className="absolute z-50 top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto">
                              {getFilteredProducts(productSearchQuery).map((p: any) => (
                                <div
                                  key={p.id}
                                  onMouseDown={() => handleSelectProduct(item.id, p)}
                                  className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex justify-between"
                                >
                                  <span className="font-bold text-slate-700">{p.name}</span>
                                  <span className="text-slate-400">{p.code} - {parseFloat(p.purchase_price || p.price || 0).toLocaleString()} ج.م</span>
                                </div>
                              ))}
                              {getFilteredProducts(productSearchQuery).length === 0 && (
                                <div className="px-3 py-2 text-xs text-slate-400 text-center">لا توجد نتائج</div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Description */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="الوصف"
                            value={item.description}
                            onChange={(e) => handleEditItemCell(item.id, 'description', e.target.value)}
                            className="w-full text-right p-2 border border-slate-200 rounded outline-none text-slate-500 font-normal focus:border-[#0074b1]"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="p-2">
                          <input
                            type="number"
                            placeholder="0"
                            value={item.unitPrice || ''}
                            onChange={(e) => handleEditItemCell(item.id, 'unitPrice', Number(e.target.value))}
                            className="w-full text-center p-2 border border-slate-200 rounded font-bold font-mono outline-none focus:border-[#0074b1]"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            placeholder="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleEditItemCell(item.id, 'quantity', Number(e.target.value))}
                            className="w-full text-center p-2 border border-slate-200 rounded font-bold font-mono outline-none focus:border-[#0074b1]"
                          />
                        </td>

                        {/* Line Discount */}
                        <td className="p-2 w-28">
                          <input
                            type="number"
                            placeholder="0"
                            value={item.discount || ''}
                            onChange={(e) => handleEditItemCell(item.id, 'discount', Number(e.target.value))}
                            className="w-full text-center p-2 border border-slate-200 rounded font-bold font-mono outline-none focus:border-[#0074b1]"
                          />
                        </td>

                        {/* Tax VAT selector */}
                        <td className="p-2 w-32">
                          <select
                            value={item.taxValue}
                            onChange={(e) => handleEditItemCell(item.id, 'taxValue', Number(e.target.value))}
                            className="w-full text-center p-2 border border-slate-200 rounded font-bold outline-none"
                          >
                            <option value={0}>بدون ضريبة</option>
                            <option value={14}>ضريبة مصرية (14%)</option>
                            <option value={5}>ضريبة توريد (5%)</option>
                          </select>
                        </td>

                        {/* Total per row */}
                        <td className="p-2 text-left font-mono font-black text-slate-800">
                          {item.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {currency}
                        </td>

                        {/* Delete Row Action */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id)}
                            disabled={items.length === 1}
                            className={`p-1.5 rounded transition-all cursor-pointer ${items.length === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add item row button and overall calculations table */}
              <div className="bg-slate-50/50 p-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-4">
                
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="px-4 py-2 bg-white text-[#0074b1] border border-blue-250 hover:bg-blue-50/60 rounded-md font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>إضافة</span>
                </button>

                {/* Math values matrix columns */}
                <div className="w-full md:w-96 text-xs font-semibold text-slate-700 space-y-2 border border-slate-200 bg-white p-4 rounded-xl">
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450 font-bold">الإجمالي:</span>
                    <span className="font-mono text-slate-800 font-extrabold">{subtotal.toLocaleString()} {currency}</span>
                  </div>

                  {globalDiscountValue > 0 && (
                    <div className="flex justify-between items-center text-rose-500">
                      <span>الخصم المقتطع:</span>
                      <span className="font-mono font-bold">-{globalDiscountValue.toLocaleString()} {currency}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-450">
                    <span>قيمة ضريبة المرتجع الإجمالية:</span>
                    <span className="font-mono">
                      {(grandTotal - subtotal + globalDiscountValue - adjustmentValue).toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-100 pt-2">
                    <span>المبلغ المراد سداده/استرداده:</span>
                    <span className="font-mono text-[#0074b1] text-base">{grandTotal.toLocaleString()} {currency}</span>
                  </div>

                </div>

              </div>

            </div>

            {/* Bottom Tabs Widget: الخصم والتسوية | إيداع | الشحن | إرفاق المستندات */}
            <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs">
              
              <div className="bg-slate-50 p-1 flex border-b border-slate-150 flex-row-reverse text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('discount')}
                  className={`px-4 py-2 rounded-md cursor-pointer transition-all ${activeTab === 'discount' ? 'bg-[#0074b1] text-white shadow-xs' : 'text-slate-550 hover:text-slate-800'}`}
                >
                  الخصم والتسوية
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('deposit')}
                  className={`px-4 py-2 rounded-md cursor-pointer transition-all ${activeTab === 'deposit' ? 'bg-[#0074b1] text-white shadow-xs' : 'text-slate-550 hover:text-slate-800'}`}
                >
                  إيداع
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shipping')}
                  className={`px-4 py-2 rounded-md cursor-pointer transition-all ${activeTab === 'shipping' ? 'bg-[#0074b1] text-white shadow-xs' : 'text-slate-550 hover:text-slate-800'}`}
                >
                  الشحن
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('attachments')}
                  className={`px-4 py-2 rounded-md cursor-pointer transition-all ${activeTab === 'attachments' ? 'bg-[#0074b1] text-white shadow-xs' : 'text-slate-550 hover:text-slate-800'}`}
                >
                  إرفاق المستندات
                </button>
              </div>

              <div className="p-4 bg-white min-h-[90px] text-xs font-semibold text-slate-700">
                {activeTab === 'discount' && (
                  <div className="space-y-4 max-w-md">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <span className="text-slate-500 font-bold block w-20">الخصم</span>
                      
                      <select
                        value={globalDiscountType}
                        onChange={(e) => setGlobalDiscountType(e.target.value as 'percentage' | 'amount')}
                        className="p-2 border border-slate-200 rounded bg-white outline-none font-bold"
                      >
                        <option value="percentage">نسبة مئوية (%)</option>
                        <option value="amount">مبلغ مسطح مباشر</option>
                      </select>

                      <input
                        type="number"
                        placeholder="0"
                        value={globalDiscountValue || ''}
                        onChange={(e) => setGlobalDiscountValue(Number(e.target.value))}
                        className="p-2 border border-slate-200 rounded w-24 text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'deposit' && (
                  <div className="text-slate-450 text-xs py-2">
                    الودائع والتسويات المرقمنة بانتظار استلام المرتجع في المخزن. لا توجد ودائع مدخلة.
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div className="space-y-3 max-w-sm">
                    <label className="text-slate-500 block">تكاليف الشحن / التوصيل السريع للمرتجع (ج.م):</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={adjustmentValue || ''}
                      onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                      className="p-2 border border-slate-200 rounded w-full font-mono text-center font-extrabold"
                    />
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center space-y-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                    <span className="text-slate-400 block pb-1">اسحب مستندات تأكيد الشحن وشهادة المورد هنا أو تصفح ملفاتك</span>
                    <button type="button" className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold">تصفح الملفات</button>
                  </div>
                )}

              </div>

            </div>

            {/* Rich text Editor mockup for notes */}
            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-slate-600 block">الملاحظات/الشروط</label>
              
              <div className="border border-slate-205 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-150 flex items-center gap-1 flex-row-reverse text-slate-550">
                  <button type="button" className="p-1 hover:bg-slate-200 rounded" title="عريض"><Bold className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded" title="مائل"><Italic className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded" title="تحته خط"><Underline className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded" title="قائمة"><List className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded" title="رابط خارجي"><Link2 className="w-3.5 h-3.5" /></button>
                  <span className="text-slate-300">|</span>
                  <span className="text-[10px] font-bold text-slate-400">تحرير الملاحظات</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 text-xs outline-none min-h-[90px] text-right font-medium text-slate-750"
                  placeholder="اكتب ملاحظات تسليم المرتجع والشروط هنا..."
                />
              </div>
            </div>

            {/* Checkbox: "تم رد المبلغ الإجمالي للبنود المرتجعة من المورد؟" */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-205 flex items-center gap-2 flex-row-reverse text-xs font-bold text-[#1a2e40] select-none">
              <input
                id="alreadyPaid-checkbox"
                type="checkbox"
                checked={alreadyPaid}
                onChange={(e) => setAlreadyPaid(e.target.checked)}
                className="w-4 h-4 text-[#0074b1] accent-[#0074b1] cursor-pointer"
              />
              <label htmlFor="alreadyPaid-checkbox" className="cursor-pointer">
                تم رد المبلغ الإجمالي للبنود المرتجعة من المورد؟
              </label>
            </div>

            {/* If has been refunded, prompt for method */}
            {alreadyPaid && (
              <div className="p-4 bg-emerald-50/40 border border-emerald-150 rounded-xl space-y-4 text-xs font-semibold animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-row-reverse text-right">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">وسيلة استرداد المبلغ:</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-bold"
                    >
                      <option value="نقدي">نقدي (Cash)</option>
                      <option value="حساب بنكي">تحويل حساب بنكي (Bank Transfer)</option>
                      <option value="شيك بنكي">شيك بنكي مؤجل (Check)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 block font-bold">رقم المعاملة / مرجع الإيداع:</label>
                    <input
                      type="text"
                      placeholder="مثال: REF-991223"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-bold font-mono text-right"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block font-bold">الخزنة / الحساب البنكي</label>
                  <select
                    value={selectedTreasuryId}
                    onChange={(e) => setSelectedTreasuryId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-bold"
                  >
                    <option value="">(اختر الخزنة)</option>
                    {safesBanks.map((sb: any) => (
                      <option key={sb.id} value={sb.id}>{sb.name} ({sb.type === 'safe' ? 'خزنة' : 'بنك'})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Cancel & Confirm actions */}
          <div className="flex justify-end gap-3 pb-8">
            <button
              onClick={() => setCurrentMode('list')}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
            >
              إلغاء وتراجع
            </button>
            <button
              onClick={() => handleSaveReturn('unpaid')}
              className="px-5 py-2 bg-[#0074b1] hover:bg-[#005f90] text-white text-xs font-black rounded-lg cursor-pointer transition-all shadow-sm"
            >
              حفظ وتعميد المرتجع 🔄
            </button>
          </div>

        </div>
      )}


      {/* ----------------- MODAL: QUICK ADD VENDOR ----------------- */}
      <AnimatePresence>
        {showAddVendorModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4"
            >
              <div className="flex justify-between items-center flex-row-reverse pb-2 border-b border-slate-100">
                <span className="text-slate-800 text-base font-black">تعريف مورد جديد بنظام المشتريات</span>
                <button 
                  onClick={() => setShowAddVendorModal(false)}
                  className="p-1 hover:bg-slate-100 text-slate-400 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddQuickVendor} className="space-y-4 text-xs font-semibold">
                
                <div className="space-y-1">
                  <label className="text-slate-500 block">اسم المورد (الفرد أو الشركة)*</label>
                  <input
                    type="text"
                    required
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-[#0074b1]"
                    placeholder="مثال: شركة النيل للصلب"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">اسم الشركة بالكامل</label>
                  <input
                    type="text"
                    value={vendorCompany}
                    onChange={(e) => setVendorCompany(e.target.value)}
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                    placeholder="مثال: مجموعة النيل الصناعية"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">الهاتف الساخن / المحمول</label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded font-mono"
                    placeholder="010xxxxxxx"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">البريد الإلكتروني للطلبات</label>
                  <input
                    type="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded font-mono"
                    placeholder="sales@supplier.com"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddVendorModal(false)}
                    className="px-4 py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 font-bold rounded cursor-pointer"
                  >
                    إلغاء المعاملة
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0074b1] hover:bg-[#005f90] text-white font-extrabold rounded cursor-pointer"
                  >
                    إضافة المورد وتعميده
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
