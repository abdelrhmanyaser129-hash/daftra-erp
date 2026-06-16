/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Trash2,
  FileText,
  User,
  Calendar,
  X,
  Printer,
  Sliders,
  AlertTriangle,
  ChevronLeft,
  ChevronDown,
  Building,
  CheckCircle,
  Clock,
  HelpCircle,
  Eye,
  Percent,
  Coins,
  BadgeCent
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  currency: string;
  vendorNumber: string;
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  date: string;
  total: number;
  status: 'draft' | 'paid' | 'unpaid';
}

interface PurchasePayment {
  id: string;
  paymentNumber: string; // "رقم عملية الدفع"
  invoiceNumber: string; // "رقم فاتورة الشراء"
  vendorId: string;
  vendorName: string;
  paymentMethod: string; // "وسيلة دفع"
  amount: number;
  paymentDate: string; // "التاريخ"
  createdDate: string; // "تاريخ الإنشاء"
  status: 'Draft' | 'Approved' | 'Refunded'; // "الحالة"
  identifier: string; // "رقم المعرف"
  creatorName: string; // "منشئ الفاتورة"
  notes: string;
}

interface PurchaseVendorPaymentsViewProps {
  setView: (view: string) => void;
}

function mapRowToVendor(row: any): Vendor {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    phone: row.phone,
    email: row.email,
    currency: row.currency,
    vendorNumber: '',
  };
}

function mapRowToInvoice(row: any): PurchaseInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    vendorName: row.vendor_name,
    date: row.date,
    total: Number(row.total),
    status: row.status,
  };
}

function mapRowToPayment(row: any): PurchasePayment {
  return {
    id: row.id,
    paymentNumber: row.payment_number,
    invoiceNumber: row.invoice_number,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    paymentMethod: row.payment_method,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    createdDate: row.created_date,
    status: row.status,
    identifier: row.identifier,
    creatorName: row.creator_name,
    notes: row.notes,
  };
}

function mapPaymentToRow(payment: PurchasePayment) {
  return {
    payment_number: payment.paymentNumber,
    invoice_number: payment.invoiceNumber,
    vendor_id: payment.vendorId,
    vendor_name: payment.vendorName,
    payment_method: payment.paymentMethod,
    amount: payment.amount,
    payment_date: payment.paymentDate,
    created_date: payment.createdDate,
    status: payment.status,
    identifier: payment.identifier,
    creator_name: payment.creatorName,
    notes: payment.notes,
  };
}

export default function PurchaseVendorPaymentsView({ setView }: PurchaseVendorPaymentsViewProps) {
  // Mode selection: 'list' | 'add'
  const [currentMode, setCurrentMode] = useState<'list' | 'add'>('list');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSearched, setIsSearched] = useState(false);

  // Loaded database state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [payments, setPayments] = useState<PurchasePayment[]>([]);

  // --- Search Form Inputs (Basic & Advanced) ---
  const [searchPurchaseInvoice, setSearchPurchaseInvoice] = useState('');
  const [searchPaymentNumber, setSearchPaymentNumber] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');

  // Advanced fields
  const [dateType, setDateType] = useState('تخصيص');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');

  const [createDateType, setCreateDateType] = useState('تخصيص');
  const [createDateFrom, setCreateDateFrom] = useState('');
  const [createDateTo, setCreateDateTo] = useState('');

  const [searchIdentifier, setSearchIdentifier] = useState('');
  const [searchCreator, setSearchCreator] = useState('all');

  // --- Add Payment Form State ---
  const [newVendorId, setNewVendorId] = useState('');
  const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
  const [newPaymentNumber, setNewPaymentNumber] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('نقدي');
  const [newPaymentDate, setNewPaymentDate] = useState('2026-06-14');
  const [newIdentifier, setNewIdentifier] = useState('');
  const [newCreator, setNewCreator] = useState('أبو ياسر #000001 (أنت)');
  const [newNotes, setNewNotes] = useState('');

  // Selected Payment Viewer Model
  const [viewingPayment, setViewingPayment] = useState<PurchasePayment | null>(null);

  // Initialize and Synchronize
  useEffect(() => {
    const loadData = async () => {
      const [vendorsResult, invoicesResult, paymentsResult] = await Promise.all([
        supabase.from('purchase_vendors').select('*'),
        supabase.from('purchase_invoices').select('*').neq('status', 'draft'),
        supabase.from('purchase_vendor_payments').select('*').order('created_at', { ascending: false }),
      ]);

      if (vendorsResult.data) setVendors(vendorsResult.data.map(mapRowToVendor));
      if (invoicesResult.data) setInvoices(invoicesResult.data.map(mapRowToInvoice));
      if (paymentsResult.data) setPayments(paymentsResult.data.map(mapRowToPayment));
    };
    loadData();
  }, [currentMode]);

  const generateNextPaymentNumber = () => {
    if (payments.length === 0) return 'PAY-00001';
    const lastNum = payments.reduce((max, pay) => {
      const match = pay.paymentNumber.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 0;
      return Math.max(max, num);
    }, 0);
    return `PAY-${String(lastNum + 1).padStart(5, '0')}`;
  };

  const handleOpenAddPayment = () => {
    setNewPaymentNumber(generateNextPaymentNumber());
    setNewVendorId('');
    setNewInvoiceNumber('');
    setNewAmount('');
    setNewPaymentMethod('نقدي');
    setNewPaymentDate('2026-06-14');
    setNewIdentifier('');
    setNewNotes('');
    setCurrentMode('add');
    setViewingPayment(null);
  };

  const handleClearFilters = () => {
    setSearchPurchaseInvoice('');
    setSearchPaymentNumber('');
    setSelectedVendorId('all');
    setSelectedPaymentMethod('all');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
    setSearchStatus('all');
    setCreateDateFrom('');
    setCreateDateTo('');
    setSearchIdentifier('');
    setSearchCreator('all');
    setIsSearched(false);
  };

  const handleApplySearch = () => {
    setIsSearched(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      alert('الرجاء إدخال مبلغ صحيح وموجب.');
      return;
    }

    let vendorName = 'مورد عام';
    if (newVendorId) {
      const vend = vendors.find(v => v.id === newVendorId);
      if (vend) vendorName = vend.name;
    } else if (newInvoiceNumber) {
      const invObj = invoices.find(inv => inv.invoiceNumber === newInvoiceNumber);
      if (invObj) vendorName = invObj.vendorName;
    }

    const newPayment: PurchasePayment = {
      id: '',
      paymentNumber: newPaymentNumber || generateNextPaymentNumber(),
      invoiceNumber: newInvoiceNumber,
      vendorId: newVendorId,
      vendorName: vendorName,
      paymentMethod: newPaymentMethod,
      amount: Number(newAmount),
      paymentDate: newPaymentDate,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Approved',
      identifier: newIdentifier,
      creatorName: newCreator,
      notes: newNotes
    };

    const { data, error } = await supabase
      .from('purchase_vendor_payments')
      .insert([mapPaymentToRow(newPayment)])
      .select()
      .single();

    if (error) {
      console.error('Error saving payment:', error);
      alert('حدث خطأ أثناء حفظ الدفعة.');
      return;
    }

    if (data) {
      setPayments(prev => [mapRowToPayment(data), ...prev]);
    }

    if (newInvoiceNumber && invoices.length > 0) {
      await supabase
        .from('purchase_invoices')
        .update({ status: 'paid' })
        .eq('invoice_number', newInvoiceNumber);
    }

    setCurrentMode('list');
  };

  const handleDeletePayment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف عملية دفع المورد هذه نهائياً؟')) return;

    const { error } = await supabase
      .from('purchase_vendor_payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment:', error);
      alert('حدث خطأ أثناء حذف الدفعة.');
      return;
    }

    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // Perform search and filtering calculations
  const filteredPayments = payments.filter(p => {
    // Basic Filters
    if (searchPurchaseInvoice && !p.invoiceNumber.toLowerCase().includes(searchPurchaseInvoice.toLowerCase())) {
      return false;
    }
    if (searchPaymentNumber && !p.paymentNumber.toLowerCase().includes(searchPaymentNumber.toLowerCase())) {
      return false;
    }
    if (selectedVendorId !== 'all' && p.vendorId !== selectedVendorId) {
      return false;
    }
    if (selectedPaymentMethod !== 'all' && p.paymentMethod !== selectedPaymentMethod) {
      return false;
    }

    // Advanced Filters (only checked if active or parameters filled)
    if (amountMin && p.amount < Number(amountMin)) {
      return false;
    }
    if (amountMax && p.amount > Number(amountMax)) {
      return false;
    }
    if (searchStatus !== 'all') {
      const mappedStatus = p.status.toLowerCase();
      if (searchStatus === 'Approved' && mappedStatus !== 'approved') return false;
      if (searchStatus === 'Draft' && mappedStatus !== 'draft') return false;
      if (searchStatus === 'Refunded' && mappedStatus !== 'refunded') return false;
    }
    if (searchIdentifier && !p.identifier.toLowerCase().includes(searchIdentifier.toLowerCase())) {
      return false;
    }
    if (searchCreator !== 'all' && !p.creatorName.includes(searchCreator)) {
      return false;
    }

    // Date Filters
    if (dateFrom && p.paymentDate < dateFrom) return false;
    if (dateTo && p.paymentDate > dateTo) return false;

    if (createDateFrom && p.createdDate < createDateFrom) return false;
    if (createDateTo && p.createdDate > createDateTo) return false;

    return true;
  });

  return (
    <div id="daftra-purchase-payments-container" className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 antialiased">
      
      {/* ----------------- MODE: PAYMENT LIST VIEW ----------------- */}
      {currentMode === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main Top Navigation Path match */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>المشتريات</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-extrabold text-[13px]">مدفوعات الموردين</span>
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
                onClick={handleOpenAddPayment}
                className="flex items-center gap-2 bg-[#0074b1] hover:bg-[#005f90] text-white px-4 py-2 rounded-lg transition-all font-bold cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عملية دفع</span>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center flex-row-reverse">
            <h1 className="text-2xl font-black text-[#1a2e40] leading-none">المدفوعات</h1>
            <p className="text-xs text-slate-400 font-bold">تسجيل وتأكيد المبالغ المسددة للموردين لقاء فواتير الشراء والخدمات.</p>
          </div>

          {/* Screenshot Form "البحث" Component Replica */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            
            {/* Form Title bar */}
            <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-150 text-right">
              <span className="text-xs font-bold text-slate-650">بحث</span>
            </div>

            {/* Inputs Panel Grid */}
            <div className="p-6 space-y-5 text-xs text-right">
              
              {/* Row 1 Grid: Purchase invoice no. | Payment transaction no. | Vendor select */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Purchase invoice number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">رقم فاتورة الشراء</label>
                  <input
                    type="text"
                    placeholder="رقم فاتورة الشراء"
                    value={searchPurchaseInvoice}
                    onChange={(e) => setSearchPurchaseInvoice(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-semibold outline-none focus:border-[#0074b1]"
                  />
                </div>

                {/* 2. Payment transaction number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">رقم عملية الدفع</label>
                  <input
                    type="text"
                    placeholder="رقم عملية الدفع"
                    value={searchPaymentNumber}
                    onChange={(e) => setSearchPaymentNumber(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-semibold outline-none focus:border-[#0074b1] font-mono"
                  />
                </div>

                {/* 3. Vendor Dropdown selection */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">المورد</label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="all">كل الموردين</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Row 2 Grid: Payment method & Advanced toggle button */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                
                {/* 4. Payment Method dropdown */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">وسيلة دفع</label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="all">أي طرق دفع</option>
                    <option value="نقدي">نقدي</option>
                    <option value="شيك">شيك</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                  </select>
                </div>

                {/* 5. Advanced Search toggle button */}
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-bold cursor-pointer transition-all border ${showAdvanced ? 'bg-[#0074b1]/10 text-[#0074b1] border-[#0074b1]/40' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                  >
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span>بحث متقدم</span>
                  </button>
                </div>

                {/* Left side spacer to balance layout */}
                <div></div>

              </div>

              {/* ------ ADVANCED SLIDE-DOWN SEARCH FILTERS ====== */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-slate-100 pt-5 space-y-5"
                  >
                    
                    {/* Advanced Row 1: التاريخ | المبلغ أكبر من | المبلغ أقل من | الحالة */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      
                      {/* Date selection with multiple parts */}
                      <div className="md:col-span-5 space-y-1">
                        <label className="font-bold text-slate-600 block">التاريخ</label>
                        <div className="grid grid-cols-12 gap-2">
                          <select
                            value={dateType}
                            onChange={(e) => setDateType(e.target.value)}
                            className="col-span-4 p-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none text-center"
                          >
                            <option value="تخصيص">تخصيص</option>
                            <option value="الكل">الكل</option>
                          </select>
                          
                          <div className="col-span-8 flex items-center gap-1">
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded text-center text-xs outline-none focus:border-[#0074b1] font-mono"
                              placeholder="من"
                            />
                            <span className="text-slate-400 font-bold px-0.5">إلى</span>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded text-center text-xs outline-none focus:border-[#0074b1] font-mono"
                              placeholder="إلى"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Min Amount */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="font-bold text-slate-600 block">المبلغ أكبر من</label>
                        <input
                          type="number"
                          placeholder="المبلغ أكبر من"
                          value={amountMin}
                          onChange={(e) => setAmountMin(e.target.value)}
                          className="w-full text-center p-2.5 bg-white border border-slate-200 rounded text-xs font-semibold outline-none"
                        />
                      </div>

                      {/* Max Amount */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="font-bold text-slate-600 block">المبلغ أقل من</label>
                        <input
                          type="number"
                          placeholder="المبلغ أقل من"
                          value={amountMax}
                          onChange={(e) => setAmountMax(e.target.value)}
                          className="w-full text-center p-2.5 bg-white border border-slate-200 rounded text-xs font-semibold outline-none"
                        />
                      </div>

                      {/* Status select dropdown */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="font-bold text-slate-600 block">الحالة</label>
                        <select
                          value={searchStatus}
                          onChange={(e) => setSearchStatus(e.target.value)}
                          className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="all">أي حالة</option>
                          <option value="Approved">مقبولة ومؤكدة</option>
                          <option value="Draft">مسودة</option>
                          <option value="Refunded">مرجع مسترد</option>
                        </select>
                      </div>

                    </div>

                    {/* Advanced Row 2: تاريخ الإنشاء | رقم المعرف | منشئ الفاتورة */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      
                      {/* Creation Date selectors */}
                      <div className="md:col-span-5 space-y-1">
                        <label className="font-bold text-slate-600 block">تاريخ الإنشاء</label>
                        <div className="grid grid-cols-12 gap-2">
                          <select
                            value={createDateType}
                            onChange={(e) => setCreateDateType(e.target.value)}
                            className="col-span-4 p-2 bg-white border border-slate-200 rounded text-xs font-bold outline-none text-center"
                          >
                            <option value="تخصيص">تخصيص</option>
                            <option value="الكل">الكل</option>
                          </select>
                          
                          <div className="col-span-8 flex items-center gap-1">
                            <input
                              type="date"
                              value={createDateFrom}
                              onChange={(e) => setCreateDateFrom(e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded text-center text-xs outline-none focus:border-[#0074b1] font-mono"
                            />
                            <span className="text-slate-400 font-bold px-0.5">إلى</span>
                            <input
                              type="date"
                              value={createDateTo}
                              onChange={(e) => setCreateDateTo(e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded text-center text-xs outline-none focus:border-[#0074b1] font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment Reference ID (رقم المعرف) */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-bold text-slate-600 block">رقم المعرف</label>
                        <input
                          type="text"
                          placeholder="رقم المعرف أو رمز العملية البديل"
                          value={searchIdentifier}
                          onChange={(e) => setSearchIdentifier(e.target.value)}
                          className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-semibold outline-none"
                        />
                      </div>

                      {/* Invoice Creator name (منشئ الفاتورة) */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="font-bold text-slate-600 block">منشئ الفاتورة</label>
                        <select
                          value={searchCreator}
                          onChange={(e) => setSearchCreator(e.target.value)}
                          className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="all">أي موظف</option>
                          <option value="أبو ياسر">أبو ياسر (أنت)</option>
                          <option value="مدير عام">مدير الفروع</option>
                        </select>
                      </div>

                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Action buttons row to the bottom-left */}
              <div className="flex justify-start gap-2 pt-3 border-t border-slate-100 flex-row">
                <button
                  type="button"
                  onClick={handleApplySearch}
                  className="px-6 py-2 bg-[#0074b1] hover:bg-[#005f90] text-white rounded text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                >
                  بحث
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء الفلتر
                </button>
              </div>

            </div>

          </div>

          {/* Results section */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            
            <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-150 text-right">
              <span className="text-xs font-bold text-slate-650">النتائج</span>
            </div>

            {/* If searched or filter set but returns empty, show the replica yellow banner on search */}
            {filteredPayments.length === 0 ? (
              <div className="p-6">
                <div className="bg-[#fff9e6] text-[#b37400] text-center p-3.5 rounded border border-[#ffe099] flex items-center justify-center gap-1.5 font-bold text-xs select-none">
                  <AlertTriangle className="w-4 h-4 text-[#ffaa00]" />
                  <span>No result for your filter, </span>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="underline text-[#0074b1] hover:text-[#005f90] cursor-pointer inline-block"
                  >
                    اضغط هنا
                  </button>
                  <span> to clear Filters</span>
                </div>
              </div>
            ) : (
              /* Table contents if payments database is present */
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-550 font-bold border-b border-slate-100">
                      <th className="p-4">رقم عملية الدفع</th>
                      <th className="p-4">رقم فاتورة الشراء</th>
                      <th className="p-4">اسم المورد</th>
                      <th className="p-4">وسيلة دفع</th>
                      <th className="p-4">تاريخ الدفع</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-left">مبلغ السداد</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {filteredPayments.map((pay) => (
                      <tr 
                        key={pay.id} 
                        className="hover:bg-slate-50/55 transition-colors cursor-pointer"
                        onClick={() => setViewingPayment(pay)}
                      >
                        <td className="p-4 font-black text-[#0074b1] font-mono">{pay.paymentNumber}</td>
                        <td className="p-4 font-mono text-slate-500">
                          {pay.invoiceNumber ? `Invoice #${pay.invoiceNumber}` : 'سداد حساب عام'}
                        </td>
                        <td className="p-4 text-slate-900 font-bold">{pay.vendorName}</td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-[#0074b1] px-2 py-0.5 rounded text-[10px] font-bold">
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-500">{pay.paymentDate}</td>
                        <td className="p-4">
                          {pay.status === 'Approved' && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded text-[10px] font-extrabold">
                              مقبول ومسدد
                            </span>
                          )}
                          {pay.status === 'Draft' && (
                            <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                              مسودة دفعم
                            </span>
                          )}
                          {pay.status === 'Refunded' && (
                            <span className="bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded text-[10px]">
                              مسترد كلياً
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-left font-mono font-black text-slate-850">
                          {(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ج.م
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setViewingPayment(pay)}
                            className="p-1 px-2.5 hover:bg-slate-100 text-[#0074b1] border border-slate-150 rounded transition-all font-bold cursor-pointer text-[10px]"
                          >
                            عرض السند
                          </button>
                          
                          <button
                            onClick={(e) => handleDeletePayment(pay.id, e)}
                            className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer border border-transparent hover:border-rose-150"
                            title="حذف عملية الدفع"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}


      {/* ----------------- MODE: DETAILED SLIP MODAL VIEW ----------------- */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-100 max-h-[85vh] overflow-y-auto flex flex-col">
            
            {/* Header Dialog */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center flex-row-reverse">
              <span className="text-[#0074b1] text-base font-black">إيصال صرف مالي للمورد #{viewingPayment.paymentNumber}</span>
              <button 
                onClick={() => setViewingPayment(null)}
                className="p-1 hover:bg-slate-200 text-slate-400 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip content */}
            <div className="p-6 space-y-5 flex-1 text-xs">
              
              <div className="flex justify-between items-center flex-row-reverse border-b border-slate-100 pb-4">
                <div className="space-y-1 block text-right">
                  <span className="text-slate-400 font-bold block">مُستلِم الصرف (المورد):</span>
                  <span className="text-base font-black text-[#1a2e40] block">{viewingPayment.vendorName}</span>
                </div>
                <div className="space-y-1 text-left">
                  <span className="text-slate-450 font-bold block pb-1">وسيلة الصرف:</span>
                  <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 font-mono inline-block">
                    {viewingPayment.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Dynamic specs table */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="p-3 bg-slate-50 rounded border border-slate-200/60 space-y-2">
                  <span className="font-bold text-slate-450 block">تفاصيل المستند</span>
                  <p className="font-semibold text-slate-700">رقم الفاتورة المرتبطة: <span className="font-mono text-slate-850 font-bold">
                    {viewingPayment.invoiceNumber ? `#${viewingPayment.invoiceNumber}` : 'مستند صرف عام حساب'}
                  </span></p>
                  <p className="font-semibold text-slate-700">تاريخ المعاملة المالي: <span className="font-mono text-slate-800 font-bold">{viewingPayment.paymentDate}</span></p>
                  <p className="font-semibold text-slate-700">تاريخ إدخال القيد: <span className="font-mono text-slate-550">{viewingPayment.createdDate}</span></p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200/60 space-y-2">
                  <span className="font-bold text-slate-450 block">حالة الدورة والتدقيق</span>
                  <p className="font-semibold text-slate-700">الحالة المحاسبية: <span className="font-black text-emerald-850">معتمدة ومقبولة</span></p>
                  <p className="font-semibold text-slate-700">الموظف المقيد: <span className="text-slate-800 font-bold">{viewingPayment.creatorName}</span></p>
                  <p className="font-semibold text-slate-700">المعرف / المرجع: <span className="font-mono text-slate-800 font-bold">{viewingPayment.identifier || '—'}</span></p>
                </div>

              </div>

              {/* Big amount declaration display */}
              <div className="bg-slate-50 p-4 border-2 border-dashed border-[#0074b1] rounded-lg text-center space-y-1">
                <span className="text-slate-450 font-bold block text-sm">مجموع المبالغ المسددة والمقبولة للمورد</span>
                <span className="text-3xl font-black text-[#0074b1] font-mono leading-none block">
                  {viewingPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ج.م
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold">تأثير القيد: خصم القيمة من حساب المطالبات الجارية مع المورد</span>
              </div>

              {/* Notes block */}
              {viewingPayment.notes && (
                <div className="bg-slate-50 p-3 border border-slate-200 rounded space-y-1 text-slate-650">
                  <span className="font-bold text-slate-800 block">📝 ملاحظات الشرح المرفقة:</span>
                  <p className="font-semibold leading-relaxed block">{viewingPayment.notes}</p>
                </div>
              )}

            </div>

            {/* Bottom tools selection */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center">
              <button
                onClick={() => setViewingPayment(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded cursor-pointer transition-colors"
              >
                إغلاق النافذة
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#2d76a5] hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5 flex-row-reverse"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة سند الدفع الساري</span>
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ----------------- MODE: RECORD NEW SUPPLIER PAYMENT TRANSACTION ----------------- */}
      {currentMode === 'add' && (
        <form onSubmit={handleSavePayment} className="space-y-6 animate-fadeIn">
          
          {/* Breadcrumb row header */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-205 shadow-xs flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-extrabold text-[13px]">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setCurrentMode('list')}>مدفوعات الموردين</span>
              <span className="text-slate-305">/</span>
              <span className="text-slate-700 font-black">إضافة معاملة صرف</span>
            </div>

            {/* Save and cancel exact Daftra buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentMode('list')}
                className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-row-reverse"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5 flex-row-reverse"
              >
                <CheckCircle className="w-4 h-4" />
                <span>تسجيل دفعة جديدة</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-6">
            
            <div className="border-b border-slate-100 pb-3 block">
              <h3 className="text-lg font-black text-[#1a2e40]">إضافة دفعة مصروف سندات الموردين</h3>
              <p className="text-[11px] text-slate-400 font-bold">تسجيل مبالغ مسحوبة بشكل مستقل أو مرتبطة بفاتورة توريد مشتريات معينة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
              
              {/* Right panel side inputs */}
              <div className="space-y-4">
                
                {/* 1. Vendor selection */}
                <div className="space-y-1.5 text-right">
                  <label className="font-black text-slate-600 block">المورد المرتبط بالمعاملة <span className="text-rose-500">*</span></label>
                  <select
                    value={newVendorId}
                    onChange={(e) => {
                      setNewVendorId(e.target.value);
                      // Auto populate vendor bills if applicable
                    }}
                    required
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:bg-white focus:border-[#0074b1]"
                  >
                    <option value="">(اختر مورد السند)</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} - {v.company}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Bill invoice select */}
                <div className="space-y-1.5 text-right">
                  <label className="font-black text-slate-600 block">رقم فاتورة الشراء (اختياري)</label>
                  <select
                    value={newInvoiceNumber}
                    onChange={(e) => setNewInvoiceNumber(e.target.value)}
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:bg-white focus:border-[#0074b1]"
                  >
                    <option value="">دفع حساب بدون إسناد فاتورة</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.invoiceNumber}>فاتورة شراء #{inv.invoiceNumber} (إجمالي: {inv.total} ج.م)</option>
                    ))}
                  </select>
                </div>

                {/* 3. Amount */}
                <div className="space-y-1.5 text-right">
                  <label className="font-black text-slate-600 block">المبلغ المراد صرفه <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full text-center p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-sm font-bold font-mono outline-none"
                  />
                </div>

              </div>

              {/* Left panel side inputs */}
              <div className="space-y-4">
                
                {/* 4. Payment transaction number */}
                <div className="space-y-1.5 text-right">
                  <label className="font-black text-slate-500 block">رقم عملية الدفع الفريد</label>
                  <input
                    type="text"
                    value={newPaymentNumber}
                    onChange={(e) => setNewPaymentNumber(e.target.value)}
                    className="w-full text-center p-2 bg-slate-100 border border-slate-200 rounded text-xs font-bold outline-none font-mono"
                    readOnly
                  />
                </div>

                {/* 5. Date selection */}
                <div className="space-y-1.5 text-right">
                  <label className="font-black text-slate-600 block">تاريخ الدفع الفعلي</label>
                  <input
                    type="date"
                    value={newPaymentDate}
                    onChange={(e) => setNewPaymentDate(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-extrabold outline-none focus:border-[#0074b1] font-mono"
                  />
                </div>

                {/* 6. Payment method */}
                <div className="space-y-1.5 text-right">
                  <label className="font-black text-slate-600 block">وسيلة الصرف والدفع</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-bold outline-none"
                  >
                    <option value="نقدي">نقدي</option>
                    <option value="شيك">شيك</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                  </select>
                </div>

                {/* 7. Reference check ID */}
                <div className="space-y-1.5 text-right">
                  <label className="font-black text-slate-600 block">المعرف الفريد المرجعي لعملية الانتقال</label>
                  <input
                    type="text"
                    placeholder="مثل رقم الشيك أو الرقم المرجعي للتحويل"
                    value={newIdentifier}
                    onChange={(e) => setNewIdentifier(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 rounded text-xs font-bold outline-none"
                  />
                </div>

              </div>

            </div>

            {/* Notes and description row */}
            <div className="space-y-1.5 text-right">
              <label className="font-black text-slate-650 block text-xs">الوصف التفصيلي والملحوظات</label>
              <textarea
                rows={3}
                placeholder="إضافة تفاصيل المستند المحاسبي، بنود المدفوعات والشرح المكمل..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full text-right p-3 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs outline-none font-semibold"
              />
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
