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
  FileSpreadsheet
} from 'lucide-react';

// Interfaces for our Purchase Invoices
interface PurchaseInvoiceItem {
  id: string;
  itemName: string;
  description: string;
  unitPrice: number;
  quantity: number;
  discount: number; // Discount value
  taxValue: number; // VAT e.g. 14 or 0 (Egyptian)
  total: number;
  product_id?: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  selling_price: number;
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  issueDate: string;
  vendorName: string;
  vendorId: string;
  salesAgent: string;
  paymentTerms: string; // in days
  items: PurchaseInvoiceItem[];
  status: 'draft' | 'paid' | 'unpaid';
  discountType: 'percentage' | 'amount';
  discountValue: number;
  adjustment: number;
  subtotal: number;
  total: number;
  notes: string;
  alreadyPaid: boolean;
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

interface PurchaseInvoicesViewProps {
  setView: (view: string) => void;
}

export default function PurchaseInvoicesView({ setView }: PurchaseInvoicesViewProps) {
  // Mode selection: 'list' | 'add'
  const [currentMode, setCurrentMode] = useState<'list' | 'add'>('list');
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // Quick Search state
  const [searchText, setSearchText] = useState('');
  
  // Active Invoice form states
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [newVendorName, setNewVendorName] = useState<string>('');
  const [showAddVendorModal, setShowAddVendorModal] = useState<boolean>(false);
  const [vendorPhone, setVendorPhone] = useState<string>('');
  const [vendorEmail, setVendorEmail] = useState<string>('');
  const [vendorCompany, setVendorCompany] = useState<string>('');
  
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('2026-06-14');
  const [issueDate, setIssueDate] = useState<string>('2026-06-14');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [billingTemplate, setBillingTemplate] = useState<string>('قالب فاتورة الإفتراضي');
  const [currency, setCurrency] = useState<string>('EGP');
  
  // Row Items
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([
    {
      id: 'p-item-1',
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
    'شكراً جزيلاً لتعاملكم معنا كشريك توريد أساسي. تم مراجعة الأصناف ومطابقتها للشروط.'
  );
  const [alreadyPaid, setAlreadyPaid] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('نقدي');
  const [paymentReference, setPaymentReference] = useState<string>('');
  
  // Calculation variables
  const [subtotal, setSubtotal] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [previewInvoice, setPreviewInvoice] = useState<PurchaseInvoice | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState<Record<string, boolean>>({});
  const [productSearchText, setProductSearchText] = useState<Record<string, string>>({});

  // Load from Supabase
  useEffect(() => {
    const loadData = async () => {
      const { data: invoicesData } = await supabase
        .from('purchase_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (invoicesData) {
        setPurchaseInvoices(
          invoicesData.map((row: any) => ({
            id: row.id,
            invoiceNumber: row.invoice_number,
            date: row.date,
            issueDate: row.issue_date,
            vendorName: row.vendor_name,
            vendorId: row.vendor_id,
            salesAgent: row.sales_agent,
            paymentTerms: row.payment_terms,
            items: row.items,
            status: row.status,
            discountType: row.discount_type,
            discountValue: row.discount_value,
            adjustment: row.adjustment,
            subtotal: row.subtotal,
            total: row.total,
            notes: row.notes,
            alreadyPaid: row.already_paid,
            paymentMethod: row.payment_method,
            paymentReference: row.payment_reference,
            currency: row.currency,
            billingTemplate: row.billing_template,
          }))
        );
      } else {
        setPurchaseInvoices([]);
      }

      const { data: vendorsData } = await supabase
        .from('purchase_vendors')
        .select('*');
      if (vendorsData) {
        setVendors(
          vendorsData.map((row: any) => ({
            id: row.id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            company: row.company,
            currency: row.currency,
          }))
        );
      } else {
        setVendors([]);
      }

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, code, selling_price');
      if (productsData) {
        setProducts(productsData);
      } else {
        setProducts([]);
      }
    };
    loadData();
  }, [currentMode]);

  // Recalculate row totals and grand totals whenever items, discounts, adjustments change
  useEffect(() => {
    let currentSubtotal = 0;
    const computedItems = items.map(item => {
      const rawTotal = item.unitPrice * item.quantity;
      currentSubtotal += rawTotal;
      return { ...item, total: rawTotal };
    });

    setSubtotal(currentSubtotal);

    // Calculate Global Discount
    let globalDiscount = 0;
    if (globalDiscountType === 'percentage') {
      globalDiscount = currentSubtotal * (globalDiscountValue / 100);
    } else {
      globalDiscount = globalDiscountValue;
    }

    // Aggregate tax from row items
    let aggregateTax = 0;
    items.forEach(item => {
      aggregateTax += item.unitPrice * item.quantity * (item.taxValue / 100);
    });

    const finalTotal = currentSubtotal - globalDiscount + aggregateTax + Number(adjustmentValue);
    setGrandTotal(Math.max(0, finalTotal));
  }, [items, globalDiscountType, globalDiscountValue, adjustmentValue]);

  // Generate next automatic sequential purchase invoice number
  const generateNextInvoiceNumber = () => {
    if (purchaseInvoices.length === 0) return '000001';
    const lastNum = purchaseInvoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return String(lastNum + 1).padStart(6, '0');
  };

  // Switch to ADD Mode and initialize the fields
  const handleOpenAddNewInvoice = () => {
    setEditingInvoiceId(null);
    setInvoiceNumber(generateNextInvoiceNumber());
    setSelectedVendorId('');
    setInvoiceDate('2026-06-14');
    setIssueDate('2026-06-14');
    setPaymentTerms('');
    setGlobalDiscountValue(0);
    setAdjustmentValue(0);
    setAlreadyPaid(false);
    setPaymentReference('');
    setShowProductDropdown({});
    setProductSearchText({});
    setItems([
      {
        id: 'p-item-1',
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
    setPreviewInvoice(null);
  };

  // Add Item Row
  const handleAddItemRow = () => {
    const newId = `p-item-${Date.now()}`;
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
  const handleEditItemCell = (id: string, field: keyof PurchaseInvoiceItem, value: any) => {
    const updated = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updated);
  };

  // Quick Vendor Addition inside form
  const handleAddQuickVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    const { data, error } = await supabase
      .from('purchase_vendors')
      .insert({
        name: newVendorName,
        phone: vendorPhone || 'غير محدد',
        email: vendorEmail || 'nill@supplier.com',
        company: vendorCompany || newVendorName,
        currency: 'EGP',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add vendor', error);
      return;
    }

    const newVendor: Vendor = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      company: data.company,
      currency: data.currency,
    };

    setVendors([...vendors, newVendor]);
    setSelectedVendorId(newVendor.id);
    setNewVendorName('');
    setVendorPhone('');
    setVendorEmail('');
    setVendorCompany('');
    setShowAddVendorModal(false);
  };

  // Save the Purchase Invoice to Supabase
  const handleSaveInvoice = async (status: 'paid' | 'draft' | 'unpaid') => {
    // Validate vendor
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!vendor) {
      alert('الرجاء اختيار المورد أولاً قبل حفظ الفاتورة.');
      return;
    }

    // Prepare Invoice Item Data
    let calculatedSubtotal = 0;
    const finalItems = items.map(item => {
      const rowTotal = item.unitPrice * item.quantity;
      calculatedSubtotal += rowTotal;
      return {
        ...item,
        itemName: item.itemName ? item.itemName : 'بند توريد جديد',
        total: rowTotal
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
      aggregateTax += item.unitPrice * item.quantity * (item.taxValue / 100);
    });

    const calculatedGrandTotal = calculatedSubtotal - globalDiscount + aggregateTax + Number(adjustmentValue);

    const { data, error } = await supabase
      .from('purchase_invoices')
      .insert({
        invoice_number: invoiceNumber || generateNextInvoiceNumber(),
        date: invoiceDate,
        issue_date: issueDate,
        vendor_name: vendor.name,
        vendor_id: vendor.id,
        sales_agent: 'أبو ياسر #000001 (أنت)',
        payment_terms: paymentTerms || 'فوري',
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
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save invoice', error);
      alert('حدث خطأ أثناء حفظ الفاتورة.');
      return;
    }

    const newPurchaseInvoice: PurchaseInvoice = {
      id: data.id,
      invoiceNumber: data.invoice_number,
      date: data.date,
      issueDate: data.issue_date,
      vendorName: data.vendor_name,
      vendorId: data.vendor_id,
      salesAgent: data.sales_agent,
      paymentTerms: data.payment_terms,
      items: data.items,
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
      billingTemplate: data.billing_template,
    };

    setPurchaseInvoices([newPurchaseInvoice, ...purchaseInvoices]);

    // Update vendor balance
    const { data: vendorBalData } = await supabase
      .from('purchase_vendors')
      .select('opening_balance')
      .eq('id', vendor.id)
      .single();
    const currentBal = Number(vendorBalData?.opening_balance || 0);
    await supabase
      .from('purchase_vendors')
      .update({ opening_balance: currentBal + calculatedGrandTotal })
      .eq('id', vendor.id);

    // Reset and return
    setCurrentMode('list');
  };

  // Load existing invoice into form for editing
  const handleEditInvoice = (invoice: PurchaseInvoice) => {
    setEditingInvoiceId(invoice.id);
    setInvoiceNumber(invoice.invoiceNumber);
    setInvoiceDate(invoice.date);
    setIssueDate(invoice.issueDate);
    setSelectedVendorId(invoice.vendorId);
    setPaymentTerms(invoice.paymentTerms);
    setBillingTemplate(invoice.billingTemplate);
    setCurrency(invoice.currency);
    setItems(invoice.items.map(item => ({
      ...item,
      product_id: (item as any).product_id || undefined,
    })));
    setGlobalDiscountType(invoice.discountType);
    setGlobalDiscountValue(invoice.discountValue);
    setAdjustmentValue(invoice.adjustment);
    setNotes(invoice.notes);
    setAlreadyPaid(invoice.alreadyPaid);
    setPaymentMethod(invoice.paymentMethod);
    setPaymentReference(invoice.paymentReference);
    setShowProductDropdown({});
    setProductSearchText({});
    setCurrentMode('add');
    setPreviewInvoice(null);
  };

  // Update existing invoice
  const handleUpdateInvoice = async (status: 'paid' | 'draft' | 'unpaid') => {
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!vendor) {
      alert('الرجاء اختيار المورد أولاً قبل تحديث الفاتورة.');
      return;
    }

    let calculatedSubtotal = 0;
    const finalItems = items.map(item => {
      const rowTotal = item.unitPrice * item.quantity;
      calculatedSubtotal += rowTotal;
      return {
        ...item,
        itemName: item.itemName ? item.itemName : 'بند توريد جديد',
        total: rowTotal
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
      aggregateTax += item.unitPrice * item.quantity * (item.taxValue / 100);
    });

    const calculatedGrandTotal = calculatedSubtotal - globalDiscount + aggregateTax + Number(adjustmentValue);

    const { data, error } = await supabase
      .from('purchase_invoices')
      .update({
        invoice_number: invoiceNumber,
        date: invoiceDate,
        issue_date: issueDate,
        vendor_name: vendor.name,
        vendor_id: vendor.id,
        sales_agent: 'أبو ياسر #000001 (أنت)',
        payment_terms: paymentTerms || 'فوري',
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
      })
      .eq('id', editingInvoiceId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update invoice', error);
      alert('حدث خطأ أثناء تحديث الفاتورة.');
      return;
    }

    // Update vendor balance
    const { data: vendorBalData } = await supabase
      .from('purchase_vendors')
      .select('opening_balance')
      .eq('id', vendor.id)
      .single();
    const currentBal = Number(vendorBalData?.opening_balance || 0);
    await supabase
      .from('purchase_vendors')
      .update({ opening_balance: currentBal + calculatedGrandTotal })
      .eq('id', vendor.id);

    // Reload full invoice list
    setEditingInvoiceId(null);
    setCurrentMode('list');
  };

  // Delete invoice
  const handleDeleteInvoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من رغبتك في حذف فاتورة الشراء هذه نهائياً؟')) {
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Failed to delete invoice', error);
        alert('حدث خطأ أثناء حذف الفاتورة.');
        return;
      }
      const filtered = purchaseInvoices.filter(inv => inv.id !== id);
      setPurchaseInvoices(filtered);
    }
  };

  // Filter invoices according to SearchText
  const filteredInvoices = purchaseInvoices.filter(inv => {
    if (!searchText.trim()) return true;
    const query = searchText.trim().toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.vendorName.toLowerCase().includes(query) ||
      inv.status.toLowerCase().includes(query) ||
      inv.total.toString().includes(query)
    );
  });

  return (
    <div id="purchase-invoices-module" className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 antialiased">
      
      {/* ----------------- MODE: LIST VIEW ----------------- */}
      {currentMode === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>المشتريات</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-extrabold">إدارة فواتير الشراء</span>
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
                onClick={handleOpenAddNewInvoice}
                className="flex items-center gap-2 bg-[#0074b1] hover:bg-[#005f90] text-white px-4 py-2 rounded-lg transition-all font-bold cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة فاتورة شراء</span>
              </button>
            </div>
          </div>

          {/* Under construction alert context or statistics bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 flex-row-reverse text-right">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-800">📄 فواتير الشراء من الموردين</h2>
              <p className="text-xs text-slate-405 font-semibold">إصدار ومتابعة فواتير التوريد، المدفوعات المسددة للشركات وحساب ضريبة القيمة المضافة الإجمالية</p>
            </div>
            
            {/* Quick search input */}
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="البحث برقم الفاتورة أو المورد..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full text-xs text-right pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#0074b1] focus:border-[#0074b1] rounded-lg transition-all font-semibold outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Actual List State or Empty State */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white p-12 sm:p-20 rounded-xl border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 border border-slate-150 text-[#0074b1]/80 rounded-full flex items-center justify-center">
                <Receipt className="w-12 h-12" />
              </div>
              
              <div className="space-y-2 max-w-lg">
                <h3 className="text-lg font-bold text-slate-700">لا يوجد فواتير شراء مضافة بعد</h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  كن أول من يسجل عمليات التوريد والمشتريات! بمجرد توريد السلع أو شراء السيرفرات والأجهزة من الشركات، يمكنك الضغط على هذا الزر لتسجيل كافة البيانات، المورد والتكلفة لضبط تقارير الربحية بدقة.
                </p>
              </div>

              <button
                onClick={handleOpenAddNewInvoice}
                className="px-6 py-2.5 bg-[#0074b1] hover:bg-[#005f90] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-2 flex-row-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول فاتورة شراء الآن</span>
              </button>
            </div>
          ) : (
            /* Styled Invoices Table list */
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-4 text-right">رقم الفاتورة</th>
                      <th className="p-4">تاريخ الفاتورة</th>
                      <th className="p-4">اسم المورد</th>
                      <th className="p-4">وسيلة الدفع كلياً</th>
                      <th className="p-4 text-center">حالة الفاتورة</th>
                      <th className="p-4 text-left">إجمالي الفاتورة</th>
                      <th className="p-4 text-center">خيارات والعمليات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {filteredInvoices.map((inv) => (
                      <tr 
                        key={inv.id} 
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setPreviewInvoice(inv)}
                      >
                        <td className="p-4 font-bold text-[#0074b1] font-mono">#{inv.invoiceNumber}</td>
                        <td className="p-4 font-mono text-slate-500">{inv.date}</td>
                        <td className="p-4 text-slate-800 font-black">{inv.vendorName}</td>
                        <td className="p-4 text-slate-500 text-[11px]">
                          {inv.alreadyPaid ? (
                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                              {inv.paymentMethod} {inv.paymentReference ? `(${inv.paymentReference})` : ''}
                            </span>
                          ) : (
                            <span className="text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100">غير مدفوعة</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {inv.status === 'paid' && (
                            <span className="bg-emerald-100 text-emerald-850 px-2.5 py-1 rounded-full text-[10px] font-black">
                              ● مدفوعة كلياً
                            </span>
                          )}
                          {inv.status === 'unpaid' && (
                            <span className="bg-rose-100 text-rose-850 px-2.5 py-1 rounded-full text-[10px] font-black">
                              ● غير مدفوعة
                            </span>
                          )}
                          {inv.status === 'draft' && (
                            <span className="bg-slate-100 text-slate-650 px-2.5 py-1 rounded-full text-[10px] font-black">
                              ● مسودة معلقة
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-left font-mono font-black text-slate-800">
                          {inv.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {inv.currency}
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setPreviewInvoice(inv)}
                              className="p-1 px-2 hover:bg-slate-100 text-[#0074b1] border border-slate-150 rounded transition-all font-bold cursor-pointer text-[10px]"
                            >
                              عرض
                            </button>
                            <button
                              onClick={() => handleEditInvoice(inv)}
                              className="p-1 px-2 hover:bg-amber-50 text-amber-700 border border-slate-150 rounded transition-all font-bold cursor-pointer text-[10px]"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={(e) => handleDeleteInvoice(inv.id, e)}
                              className="p-1 px-1.5 hover:bg-rose-50 text-rose-600 rounded transition-all cursor-pointer border border-transparent hover:border-rose-150"
                              title="حذف الفاتورة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-100 max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Header Dialog */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center flex-row-reverse">
              <div className="flex items-center gap-2">
                <span className="text-[#0074b1] text-base font-black">تفاصيل ومراجعة فاتورة الشراء #{previewInvoice.invoiceNumber}</span>
              </div>
              <button 
                onClick={() => setPreviewInvoice(null)}
                className="p-1 hover:bg-slate-200 text-slate-400 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Details Content */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* Header Info Block */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">مُورِّد الأصناف / الخدمات:</span>
                  <span className="text-sm font-black text-slate-800 block">{previewInvoice.vendorName}</span>
                </div>
                <div className="space-y-1 text-left">
                  <span className="text-slate-400 font-bold block">رقم الفاتورة:</span>
                  <span className="text-sm font-black text-slate-800 block font-mono">Invoice #{previewInvoice.invoiceNumber}</span>
                </div>
              </div>

              {/* Basic Meta Grid */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150 text-[11px] font-semibold text-slate-600">
                <div>
                  <span className="text-slate-400 block pb-1">تاريخ تحرير الفاتورة</span>
                  <span className="font-mono text-slate-800">{previewInvoice.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block pb-1">شروط الدفع المتفق عليها</span>
                  <span className="text-slate-800">{previewInvoice.paymentTerms} أيام</span>
                </div>
                <div>
                  <span className="text-slate-400 block pb-1">النموذج وموظف الاستلام</span>
                  <span className="text-slate-800">{previewInvoice.salesAgent}</span>
                </div>
              </div>

              {/* Items Table within invoice */}
              <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="p-3">اسم البند والبيان</th>
                      <th className="p-3">الوصف</th>
                      <th className="p-3 text-center">سعر الوحدة</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-center">الضريبة</th>
                      <th className="p-3 text-left">الإجمالي الفرعي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {previewInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30">
                        <td className="p-3 text-slate-850 font-black">{item.itemName}</td>
                        <td className="p-3 text-slate-450 font-normal">{item.description || 'لا يوجد وصف'}</td>
                        <td className="p-3 text-center font-mono">{item.unitPrice.toLocaleString()} ج.م</td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-center font-mono text-rose-500">{item.taxValue}% VAT</td>
                        <td className="p-3 text-left font-mono text-slate-800">{item.total.toLocaleString()} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary Column */}
              <div className="space-y-2 border-t border-slate-100 pt-3 flex flex-col items-end text-xs font-semibold text-slate-700">
                <div className="w-56 flex justify-between">
                  <span className="text-slate-400">الإجمالي غير شامل الضريبة:</span>
                  <span className="font-mono text-slate-800">{previewInvoice.subtotal.toLocaleString()} ج.م</span>
                </div>
                {previewInvoice.discountValue > 0 && (
                  <div className="w-56 flex justify-between text-rose-600">
                    <span>خصم الفترة المباشر:</span>
                    <span className="font-mono">-{previewInvoice.discountValue.toLocaleString()} ج.م</span>
                  </div>
                )}
                {Number(previewInvoice.adjustment) !== 0 && (
                  <div className="w-56 flex justify-between text-blue-600">
                    <span>التسويات والتغييرات:</span>
                    <span className="font-mono">{previewInvoice.adjustment} ج.م</span>
                  </div>
                )}
                <div className="w-56 flex justify-between text-base font-black border-t border-slate-150 pt-2 text-slate-900 leading-none">
                  <span>المبلغ الإجمالي الكلي:</span>
                  <span className="font-mono text-[#0074b1]">{previewInvoice.total.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Notes block */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-lg text-xs space-y-1">
                <span className="text-slate-500 font-bold block">ملاحظات وشروط التوريد المسجلة بالفاتورة:</span>
                <p className="text-slate-650 font-semibold leading-relaxed block">{previewInvoice.notes}</p>
              </div>

              {/* Payment Receipt block */}
              {previewInvoice.alreadyPaid && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex justify-between items-center flex-row-reverse text-emerald-900 font-bold">
                  <div>
                    <span>📌 تم دفع هذه الفاتورة بالكامل في مستودع المورد</span>
                  </div>
                  <div className="font-mono flex gap-2">
                    <span>وسيلة السداد: {previewInvoice.paymentMethod}</span>
                    {previewInvoice.paymentReference && <span>/ مرجع المعاملة: {previewInvoice.paymentReference}</span>}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between">
              <button
                onClick={() => setPreviewInvoice(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded cursor-pointer transition-colors"
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
                  <span>طباعة الفاتورة</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ----------------- MODE: ADD NEW PURCHASE INVOICE FORM ----------------- */}
      {currentMode === 'add' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Custom Breadcrumb Header matching exactly the screenshot style */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-205 shadow-xs flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-extrabold text-[13px]">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setCurrentMode('list')}>فواتير الشراء</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-black">{editingInvoiceId ? 'تعديل' : 'إضافة'}</span>
            </div>

            {/* Top Bar Action Buttons exactly style: معاينة, حفظ كمسودة, حفظ */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  alert('معاينة الفاتورة قبل الحفظ: لابد من اختيار مورد أولاً وتعبئة خانات السعر.');
                }}
                className="px-4 py-2 bg-white text-slate-750 hover:bg-slate-50 rounded-md border border-slate-250 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-row-reverse"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة</span>
              </button>

              {editingInvoiceId ? (
                <button
                  onClick={() => handleUpdateInvoice('draft')}
                  className="px-4 py-2 bg-blue-50/70 text-[#0074b1] hover:bg-blue-100 rounded-md border border-blue-200/55 text-xs font-bold transition-all cursor-pointer"
                >
                  تحديث كمسودة
                </button>
              ) : (
                <button
                  onClick={() => handleSaveInvoice('draft')}
                  className="px-4 py-2 bg-blue-50/70 text-[#0074b1] hover:bg-blue-100 rounded-md border border-blue-200/55 text-xs font-bold transition-all cursor-pointer"
                >
                  حفظ كمسودة
                </button>
              )}

              {editingInvoiceId ? (
                <button
                  onClick={() => handleUpdateInvoice('paid')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 flex-row-reverse"
                >
                  <Save className="w-4 h-4" />
                  <span>تحديث</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSaveInvoice('paid')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 flex-row-reverse"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
              )}
            </div>
          </div>

          {/* Form container representing the page design */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
            
            {/* Form Main Title Panel */}
            <div className="border-b border-slate-100 pb-4 text-right">
              <h1 className="text-xl font-black text-[#1a2e40] flex items-center gap-2 flex-row-reverse">
                <Receipt className="w-6 h-6 text-[#0074b1]" />
                <span>فاتورة شراء جديدة</span>
              </h1>
            </div>

            {/* Grid of basic inputs exactly like the screenshot layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-right text-xs">
              
              {/* Left Side fields: Template selection & Numeric info (8 columns) */}
              <div className="md:col-span-6 space-y-4">
                
                {/* Template picker row */}
                <div className="grid grid-cols-12 items-center gap-2 flex-row-reverse">
                  <label className="col-span-4 font-bold text-slate-600 text-right pr-2">قالب فواتير الشراء</label>
                  <div className="col-span-8">
                    <select
                      value={billingTemplate}
                      onChange={(e) => setBillingTemplate(e.target.value)}
                      className="w-full text-right p-2.5 bg-slate-5-0 border border-slate-200 rounded-lg text-xs font-bold outline-none ring-1 ring-slate-100 focus:bg-white focus:ring-2 focus:ring-[#0074b1]"
                    >
                      <option value="قالب فاتورة الإفتراضي">قالب فاتورة الإفتراضي</option>
                      <option value="قالب تخطيط مبسط">قالب تخطيط مبسط للتوريد</option>
                      <option value="قالب المعاملات الضريبية الشاملة">قالب المعاملات الضريبية الشاملة</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/85 border border-slate-200/60 rounded-xl space-y-3">
                  
                  {/* Bill number input */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-bold text-slate-500 text-right pr-2">رقم فاتورة الشراء</label>
                    <div className="col-span-8">
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-[#0074b1] font-mono"
                      />
                    </div>
                  </div>

                  {/* Date fields picker */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-bold text-slate-500 text-right pr-2">التاريخ</label>
                    <div className="col-span-8">
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-[#0074b1] font-mono"
                      />
                    </div>
                  </div>

                  {/* Payment terms days field */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-bold text-slate-500 text-right pr-2">شروط الدفع</label>
                    <div className="col-span-8 relative">
                      <input
                        type="number"
                        placeholder="0"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full text-right pr-2 pl-12 py-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-[#0074b1] font-mono"
                      />
                      <span className="absolute left-3 top-2 font-bold text-slate-400">أيام</span>
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
                    <span>يجب أن يتطابق المورد مع العقود الضريبية والمستودع المستلم.</span>
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
                      <th className="p-3">الخصم المباشر (ج.م)</th>
                      <th className="p-3">الضريبة المضافة</th>
                      <th className="p-3 text-left">المجموع</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        
                        {/* Item Name with Product Autocomplete */}
                        <td className="p-2 text-right relative">
                          <input
                            type="text"
                            placeholder="اسم البند أو كود السلعة الموردة"
                            value={item.itemName}
                            onChange={(e) => {
                              handleEditItemCell(item.id, 'itemName', e.target.value);
                              setProductSearchText(prev => ({ ...prev, [item.id]: e.target.value }));
                              setShowProductDropdown(prev => ({ ...prev, [item.id]: true }));
                            }}
                            onFocus={() => setShowProductDropdown(prev => ({ ...prev, [item.id]: true }))}
                            onBlur={() => setTimeout(() => setShowProductDropdown(prev => ({ ...prev, [item.id]: false })), 200)}
                            className="w-full text-right p-2 border border-slate-200 rounded font-bold outline-none focus:border-[#0074b1]"
                          />
                          {showProductDropdown[item.id] && (
                            <div className="absolute z-20 top-full right-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                              {products.filter(p => {
                                const q = (productSearchText[item.id] || '').toLowerCase();
                                return !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
                              }).length === 0 ? (
                                <div className="p-2 text-slate-400 text-xs text-center">لا توجد نتائج</div>
                              ) : (
                                products.filter(p => {
                                  const q = (productSearchText[item.id] || '').toLowerCase();
                                  return !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
                                }).map(product => (
                                  <div
                                    key={product.id}
                                    onMouseDown={() => {
                                      handleEditItemCell(item.id, 'itemName', product.name);
                                      handleEditItemCell(item.id, 'unitPrice', product.selling_price);
                                      handleEditItemCell(item.id, 'product_id', product.id);
                                      setShowProductDropdown(prev => ({ ...prev, [item.id]: false }));
                                      setProductSearchText(prev => ({ ...prev, [item.id]: '' }));
                                    }}
                                    className="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex justify-between items-center"
                                  >
                                    <div>
                                      <div className="font-bold text-xs">{product.name}</div>
                                      {product.code && <div className="text-[10px] text-slate-400">كود: {product.code}</div>}
                                    </div>
                                    <div className="text-xs font-mono font-bold text-[#0074b1]">{product.selling_price} ج.م</div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </td>

                        {/* Description */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="وصف إضافي للبند المستورد"
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
                            <option value={0}>بدون ضريبة (0%)</option>
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
                  <span>إضافة بند توريد</span>
                </button>

                {/* Math values matrix columns */}
                <div className="w-full md:w-96 text-xs font-semibold text-slate-700 space-y-2 border border-slate-200 bg-white p-4 rounded-xl">
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450 font-bold col-span-6">الإجمالي قبل الخصم:</span>
                    <span className="font-mono text-slate-800 font-extrabold translate-y-0.5">{subtotal.toLocaleString()} {currency}</span>
                  </div>

                  {globalDiscountValue > 0 && (
                    <div className="flex justify-between items-center text-rose-500 font-bold">
                      <span>خصم الفاتورة الكلي:</span>
                      <span className="font-mono">
                        -{globalDiscountType === 'percentage' 
                          ? `${(subtotal * (globalDiscountValue/100)).toLocaleString()} ${currency} (${globalDiscountValue}%)`
                          : `${globalDiscountValue.toLocaleString()} ${currency}`
                        }
                      </span>
                    </div>
                  )}

                  {Number(adjustmentValue) !== 0 && (
                    <div className="flex justify-between items-center text-blue-600 font-bold">
                      <span>التسويات والتغييرات:</span>
                      <span className="font-mono">{Number(adjustmentValue).toLocaleString()} {currency}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-150 pt-2 flex justify-between items-center text-slate-900 text-sm font-black">
                    <span>الإجمالي المستحق كلياً:</span>
                    <span className="font-mono text-[#0074b1] text-base">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {currency}</span>
                  </div>

                </div>

              </div>

            </div>

            {/* Bottom Section tabs for parameters: Discount, shipping, attachments etc. */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              
              {/* Tab Toggles */}
              <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-black items-center px-2 py-1 gap-1 flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setActiveTab('discount')}
                  className={`px-4 py-2 rounded-t-md transition-all cursor-pointer ${activeTab === 'discount' ? 'bg-white border text-[#0074b1] font-bold border-b-transparent' : 'text-slate-500 dark:hover:text-slate-800'}`}
                >
                  الخصم والتسوية
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('deposit')}
                  className={`px-4 py-2 rounded-t-md transition-all cursor-pointer ${activeTab === 'deposit' ? 'bg-white border text-[#0074b1] font-bold border-b-transparent' : 'text-slate-500 dark:hover:text-slate-800'}`}
                >
                  إيداع / مدفوعات
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shipping')}
                  className={`px-4 py-2 rounded-t-md transition-all cursor-pointer ${activeTab === 'shipping' ? 'bg-white border text-[#0074b1] font-bold border-b-transparent' : 'text-slate-500 dark:hover:text-slate-800'}`}
                >
                  الشحن اللوجستي
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('attachments')}
                  className={`px-4 py-2 rounded-t-md transition-all cursor-pointer ${activeTab === 'attachments' ? 'bg-white border text-[#0074b1] font-bold border-b-transparent' : 'text-slate-500 dark:hover:text-slate-800'}`}
                >
                  إرفاق المستندات
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-4 text-xs font-semibold text-right">
                
                {activeTab === 'discount' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-row-reverse text-right animate-fadeIn">
                    <div className="space-y-1.5">
                      <span className="text-slate-500 font-bold block">قيمة الخصم الكلي للفاتورة</span>
                      <div className="flex gap-2">
                        <select
                          value={globalDiscountType}
                          onChange={(e) => setGlobalDiscountType(e.target.value as 'percentage' | 'amount')}
                          className="p-1.5 border border-slate-200 rounded font-bold"
                        >
                          <option value="percentage">نسبة مئوية (%)</option>
                          <option value="amount">قيمة ثابتة (ج.م)</option>
                        </select>
                        <input
                          type="number"
                          value={globalDiscountValue || ''}
                          placeholder="0"
                          onChange={(e) => setGlobalDiscountValue(Number(e.target.value))}
                          className="w-full text-right p-1.5 border border-slate-200 rounded font-bold font-mono outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-slate-500 font-bold block">تسوية الحساب الإضافي (+ / -)</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={adjustmentValue || ''}
                        onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                        className="w-full text-right p-1.5 border border-slate-200 rounded font-bold font-mono outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'deposit' && (
                  <div className="text-slate-500 font-bold animate-fadeIn space-y-1">
                    <p>💰 يتم تفعيل إيداع المدفوعات المسددة سلفاً لحساب المورد هنا.</p>
                    <span className="text-[10px] text-slate-400">ستتحول تلقائياً لقيود موازنة كمسحوبات على حساب المورد الضريبي عند تفعيل الدفع بالأسفل.</span>
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div className="text-slate-550 space-y-2 animate-fadeIn text-[11px]">
                    <p>🚚 خيارات التوصيل وتكاليف الشحن الخارجي الدولي والمحلي.</p>
                    <input type="text" placeholder="عنوان التسليم بالتفصيل..." className="p-2 border border-slate-200 rounded leading-normal w-full" />
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="p-3 border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold rounded-lg animate-fadeIn text-xs cursor-pointer hover:bg-slate-50 transition-colors">
                    📂 اسحب وأسقط مستند الفاتورة الموردة أو اضغط لتحميل صورة (PDF, PNG...)
                  </div>
                )}

              </div>

            </div>

            {/* Simulated rich text editor matching screenshot with styling options */}
            <div className="space-y-2 text-right text-xs font-semibold">
              <label className="text-slate-650 font-bold block">الملاحظات/الشروط</label>
              
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Visual toolbar */}
                <div className="bg-slate-50 border-b border-indigo-50/50 p-2 flex gap-1 items-center flex-row-reverse text-slate-400 select-none">
                  <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-700"><Bold className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-700"><Italic className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-700"><Underline className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-700"><Strikethrough className="w-3.5 h-3.5" /></button>
                  <span className="text-slate-300">|</span>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-700"><List className="w-3.5 h-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-700"><Link2 className="w-3.5 h-3.5" /></button>
                  <span className="text-slate-300">|</span>
                  <select className="text-[10px] text-slate-700 font-bold bg-white border border-slate-200 rounded p-0.5">
                    <option>H1</option>
                    <option>Normal text</option>
                    <option>Code block</option>
                  </select>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full text-right p-3 font-semibold text-slate-700 outline-none leading-relaxed"
                ></textarea>
              </div>
            </div>

            {/* Checkbox already paid to supplier visually styled */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 text-xs font-semibold space-y-4">
              
              <label className="flex items-center gap-2 flex-row-reverse justify-end cursor-pointer">
                <input
                  type="checkbox"
                  checked={alreadyPaid}
                  onChange={(e) => setAlreadyPaid(e.target.checked)}
                  className="w-4 h-4 text-[#0074b1] accent-[#0074b1] cursor-pointer"
                />
                <span className="text-[#1a2e40] font-black">تم الدفع بالفعل إلى المورد</span>
              </label>

              {alreadyPaid && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-150 text-right animate-fadeIn">
                  
                  {/* Payment method selector */}
                  <div className="space-y-1.5">
                    <span className="text-slate-500 font-bold block">وسيلة دفع</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full text-right p-2 bg-white border border-slate-200 rounded font-semibold"
                    >
                      <option value="نقدي">نقدي (Cash)</option>
                      <option value="تحويل بنكي">تحويل بنكي الكتروني</option>
                      <option value="فودافون كاش">محفظة فودافون كاش / اتصالات</option>
                      <option value="شيك">شيك بنكي مؤجل</option>
                    </select>
                  </div>

                  {/* Transaction Reference ID */}
                  <div className="space-y-1.5">
                    <span className="text-slate-500 font-bold block">رقم المعرف / مرجع المعاملة</span>
                    <input
                      type="text"
                      placeholder="رقم الحوالة أو شيك التوريد..."
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full text-right p-2 bg-white border border-slate-200 rounded font-semibold outline-none focus:border-[#0074b1]"
                    />
                  </div>

                </div>
              )}

            </div>

            {/* Bottom Form Actions matches screenshot exactly */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center flex-row-reverse">
              
              <div className="flex gap-2">
                {editingInvoiceId ? (
                  <button
                    type="button"
                    onClick={() => handleUpdateInvoice('paid')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5 flex-row-reverse"
                  >
                    <Save className="w-4 h-4" />
                    <span>تحديث الفاتورة</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveInvoice('paid')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5 flex-row-reverse"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ وتحرير القيود المالية</span>
                  </button>
                )}
                
                {editingInvoiceId ? (
                  <button
                    type="button"
                    onClick={() => handleUpdateInvoice('draft')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    تحديث الفاتورة كمسودة
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveInvoice('draft')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    حفظ الفاتورة كمسودة
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentMode('list')}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء والتراجع
              </button>

            </div>

          </div>

        </div>
      )}


      {/* ----------------- MODAL DIALOG: ADD QUICK SUPPLIER/VENDOR  ----------------- */}
      {showAddVendorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-51 text-right font-sans animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-100 p-6 space-y-4">
            
            <div className="flex justify-between items-center flex-row-reverse border-b border-slate-100 pb-3">
              <span className="text-[#0074b1] font-black text-sm">إضافة مورد جديد لقائمة المشتريات 🏢</span>
              <button
                type="button"
                onClick={() => setShowAddVendorModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuickVendor} className="space-y-3.5 text-xs font-bold text-slate-600">
              
              <div className="space-y-1">
                <label className="block text-slate-500">اسم المورد (الفردي / المؤسسة)*</label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="مثال: شركة العاصمة للمعدات"
                  className="w-full text-right p-2 bg-slate-50 border border-slate-200 focus:bg-white rounded outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">الشركة أو الجهة التابعة</label>
                <input
                  type="text"
                  value={vendorCompany}
                  onChange={(e) => setVendorCompany(e.target.value)}
                  placeholder="مثال: العاصمة للتجارة"
                  className="w-full text-right p-2 bg-slate-50 border border-slate-200 focus:bg-white rounded outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-slate-500">التليفون / المحمول</label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full text-right p-2 bg-slate-50 border border-slate-200 focus:bg-white rounded outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="info@capital.com"
                    className="w-full text-right p-2 bg-slate-50 border border-slate-200 focus:bg-white rounded outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-500 rounded font-bold cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0074b1] text-white hover:bg-blue-800 rounded font-black cursor-pointer shadow-xs"
                >
                  إضافة وحفظ كشريك
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
