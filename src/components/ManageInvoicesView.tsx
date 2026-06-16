/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sliders,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Invoice } from '../types';
import { supabase } from '../lib/supabase';

interface ManageInvoicesViewProps {
  setView: (view: string) => void;
  searchQuery?: string;
}

export default function ManageInvoicesView({ setView, searchQuery = '' }: ManageInvoicesViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    supabase.from('invoices').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) {
        setInvoices(data.map(mapInvoiceRow));
      }
    });
  }, []);

  const mapInvoiceRow = (row: any): Invoice => ({
    id: row.id,
    invoiceNumber: row.invoice_number || '',
    date: row.date || '',
    issueDate: row.issue_date || '',
    clientName: row.client_name || '',
    salesAgent: row.sales_agent || '',
    paymentTerms: row.payment_terms || '',
    items: row.items || [],
    status: row.status || 'draft',
    discountType: row.discount_type || 'percentage',
    discountValue: row.discount_value || 0,
    adjustment: row.adjustment || 0,
    subtotal: row.subtotal || 0,
    total: row.total || 0,
    notes: row.notes || '',
    alreadyPaid: row.already_paid || false,
    currency: row.currency || 'EGP',
  });

  // Advanced search parameters matching the Daftra UI screenshot
  const [clientFilter, setClientFilter] = useState('any');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState('any');
  const [containsItemFilter, setContainsItemFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('any');
  const [totalMin, setTotalMin] = useState('');
  const [totalMax, setTotalMax] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('any');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('all');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
  const [customFieldFilter, setCustomFieldFilter] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [addedByFilter, setAddedByFilter] = useState('any');
  const [salesRepFilter, setSalesRepFilter] = useState('any');
  const [einvoiceStatusFilter, setEinvoiceStatusFilter] = useState('any');
  const [sessionFilter, setSessionFilter] = useState('');
  const [shippingFilter, setShippingFilter] = useState('all');
  const [orderSourceFilter, setOrderSourceFilter] = useState('any');

  // Date picker specific configurations
  const [dateType, setDateType] = useState('custom');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [dueDateType, setDueDateType] = useState('custom');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');

  const [createDateType, setCreateDateType] = useState('custom');
  const [createDateFrom, setCreateDateFrom] = useState('');
  const [createDateTo, setCreateDateTo] = useState('');

  // Search execution cache
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [activeResultsTab, setActiveResultsTab] = useState('all'); // all, pending, due, unpaid, draft, overpaid
  const [sortBy, setSortBy] = useState('newest');

  // Sort direction & labels
  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest': return 'الأحدث أولاً';
      case 'oldest': return 'الأقدم أولاً';
      case 'total-desc': return 'القيمة (أعلى إلى أقل)';
      case 'total-asc': return 'القيمة (أقل إلى أعلى)';
      default: return 'الترتيب التلقائي';
    }
  };

  const handleClearFilters = () => {
    setClientFilter('any');
    setInvoiceNumberFilter('');
    setStatusFilter('any');
    setContainsItemFilter('');
    setCurrencyFilter('any');
    setTotalMin('');
    setTotalMax('');
    setPaymentStatusFilter('any');
    setSourceFilter('all');
    setInvoiceTypeFilter('all');
    setDeliveryStatusFilter('all');
    setCustomFieldFilter('');
    setClientTypeFilter('all');
    setAddedByFilter('any');
    setSalesRepFilter('any');
    setEinvoiceStatusFilter('any');
    setSessionFilter('');
    setShippingFilter('all');
    setOrderSourceFilter('any');
    setDateFrom('');
    setDateTo('');
    setDueDateFrom('');
    setDueDateTo('');
    setCreateDateFrom('');
    setCreateDateTo('');
    setSearchTriggered(false);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchTriggered(true);
  };

  // Filter dynamic invoices list
  const filteredInvoices = invoices.filter(inv => {
    // 1. Invoice status tag
    if (activeResultsTab === 'overdue' && inv.status !== 'overdue') return false;
    if (activeResultsTab === 'due' && inv.status !== 'unpaid') return false; // due corresponds to unpaid here
    if (activeResultsTab === 'unpaid' && inv.status !== 'unpaid') return false;
    if (activeResultsTab === 'draft' && inv.status !== 'draft') return false;

    // Optional fields
    if (invoiceNumberFilter && !inv.invoiceNumber.toLowerCase().includes(invoiceNumberFilter.toLowerCase())) return false;
    if (statusFilter !== 'any') {
      if (statusFilter === 'paid' && inv.status !== 'paid') return false;
      if (statusFilter === 'unpaid' && inv.status !== 'unpaid') return false;
      if (statusFilter === 'overdue' && inv.status !== 'overdue') return false;
      if (statusFilter === 'draft' && inv.status !== 'draft') return false;
    }
    if (clientFilter !== 'any' && !inv.clientName.toLowerCase().includes(clientFilter.toLowerCase())) return false;

    if (totalMin && inv.total < parseFloat(totalMin)) return false;
    if (totalMax && inv.total > parseFloat(totalMax)) return false;

    return true;
  });

  return (
    <div id="daftra-manage-invoices-container" className="space-y-4 text-right select-none">
      
      {/* 1. Header Action Bar - styled exactly with square grey elements and split green Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-transparent gap-4 pt-1 mb-4 select-none w-full flex-wrap">
        
        {/* Left corner controls - إضافة فاتورة جديدة */}
        <div className="flex flex-wrap items-center gap-2 order-1 select-none">
          <button
            onClick={() => setView('create-invoice')}
            className="flex items-center gap-1.5 px-4 h-[34px] bg-[#1abc9c] hover:bg-[#16a085] text-white rounded text-xs font-black cursor-pointer transition-colors shadow-xs border border-[#16a085]"
          >
            <span>+ إضافة</span>
          </button>
        </div>

        {/* Right corner controls (Pagination) */}
        <div className="flex flex-wrap items-center gap-2 order-2 select-none">
          <div className="flex items-center bg-white border border-[#cbd5e1] rounded h-[34px] overflow-hidden shadow-2xs">
            <button
              onClick={() => {}}
              className="px-2 h-full hover:bg-slate-50 border-e border-[#cbd5e1] text-slate-500 font-bold select-none cursor-not-allowed text-xs"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <span className="px-3.5 text-slate-600 text-[11px] font-bold font-mono">
              0 - 0 من 0
            </span>
            <button
              onClick={() => {}}
              className="px-2 h-full hover:bg-slate-50 border-s border-[#cbd5e1] text-slate-500 font-bold select-none cursor-not-allowed text-xs"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

      </div>

      {/* 2. Main Search panel - Labeled 'بحث' exactly like in the screenshot */}
      <form onSubmit={handleSearchSubmit} className="bg-[#fcfdfe] rounded border border-[#dae3ec] overflow-hidden shadow-3xs p-4 sm:p-5">
        <div className="text-right text-slate-500 text-xs font-bold mb-4 border-b border-dashed border-slate-100 pb-2 select-none">
          بحث
        </div>

        {/* Row 1: Primary search inputs (always visible) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 text-[12.5px] select-none text-slate-700">
          {/* 1. العميل */}
          <div>
            <label className="block font-bold text-slate-600 mb-1.5">العميل</label>
            <div className="relative">
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none text-slate-600 font-medium"
              >
                <option value="any">أي عميل</option>
                {invoices.map((i, idx) => (
                  <option key={idx} value={i.clientName}>{i.clientName}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 2. رقم الفاتورة */}
          <div>
            <label className="block font-bold text-slate-600 mb-1.5">رقم الفاتورة</label>
            <input
              type="text"
              placeholder=""
              value={invoiceNumberFilter}
              onChange={(e) => setInvoiceNumberFilter(e.target.value)}
              className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium text-left font-sans"
            />
          </div>

          {/* 3. الحالة */}
          <div>
            <label className="block font-bold text-slate-600 mb-1.5">الحالة</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600 text-right pr-3 pl-8"
              >
                <option value="any">أي حالة</option>
                <option value="paid">مدفوعة</option>
                <option value="unpaid">مسودة / مستحقة</option>
                <option value="overdue">متأخرة السداد</option>
                <option value="draft">مسودة</option>
              </select>
              <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Animated Advanced Settings Panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-[12.5px] select-none text-slate-700 border-t border-dashed border-slate-100 pt-5 mt-5">
                
                {/* COLUMN RIGHT (RTL) - Customers, item, payment status, source, type, delivery, session */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">تحتوي على البند</label>
                    <input
                      type="text"
                      placeholder=""
                      value={containsItemFilter}
                      onChange={(e) => setContainsItemFilter(e.target.value)}
                      className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">حالة الدفع</label>
                    <div className="relative">
                      <select
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600"
                      >
                        <option value="any">أي</option>
                        <option value="paid">مدفوعة</option>
                        <option value="unpaid">غير مدفوعة</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">المصدر</label>
                    <div className="relative">
                      <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600"
                      >
                        <option value="all">الكل</option>
                        <option value="pos">نظام الكاشير</option>
                        <option value="web">المتجر الإلكتروني</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">نوع الفاتورة</label>
                    <div className="relative">
                      <select
                        value={invoiceTypeFilter}
                        onChange={(e) => setInvoiceTypeFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600"
                      >
                        <option value="all">الكل</option>
                        <option value="standard">فاتورة ضريبية مبسطة</option>
                        <option value="simplified">فاتورة مبيعات عادية</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">حالة التسليم</label>
                    <div className="relative">
                      <select
                        value={deliveryStatusFilter}
                        onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600"
                      >
                        <option value="all">الكل</option>
                        <option value="delivered">تم الشحن / التسليم</option>
                        <option value="pending">قيد التحضير</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">جلسه</label>
                    <input
                      type="text"
                      placeholder=""
                      value={sessionFilter}
                      onChange={(e) => setSessionFilter(e.target.value)}
                      className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* COLUMN MIDDLE (RTL) - Currency, Date range, Custom field, Client Type, Added by, Shipping options */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">العملة</label>
                    <div className="relative">
                      <select
                        value={currencyFilter}
                        onChange={(e) => setCurrencyFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600"
                      >
                        <option value="any">أي</option>
                        <option value="EGP">ج.م (الجنيه المصري)</option>
                        <option value="USD">USD (الدولار الأمريكي)</option>
                        <option value="SAR">SAR (الريال السعودي)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">التاريخ</label>
                    <div className="flex items-center gap-1">
                      {/* To Date */}
                      <input
                        type="text"
                        placeholder="إلى"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium"
                      />
                      
                      <span className="text-slate-400 font-bold px-1 select-none">-</span>
                      
                      {/* From Date */}
                      <input
                        type="text"
                        placeholder="من"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium"
                      />

                      {/* Dropdown Customize */}
                      <div className="relative w-2/3 shrink-0 select-none text-[11px]">
                        <select
                          value={dateType}
                          onChange={(e) => setDateType(e.target.value)}
                          className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded pr-2 pl-6 text-[11px] focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none text-slate-600 font-bold"
                        >
                          <option value="custom">تخصيص</option>
                          <option value="today">اليوم</option>
                          <option value="yesterday">أمس</option>
                          <option value="month">الشهر الحالي</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute left-2 top-[13px] text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">حقل مخصص</label>
                    <input
                      type="text"
                      placeholder=""
                      value={customFieldFilter}
                      onChange={(e) => setCustomFieldFilter(e.target.value)}
                      className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">نوع العميل</label>
                    <div className="relative">
                      <select
                        value={clientTypeFilter}
                        onChange={(e) => setClientTypeFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600"
                      >
                        <option value="all">الكل</option>
                        <option value="individual">فرد</option>
                        <option value="commercial">شركة / صرح تجاري</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">أضيفت بواسطة</label>
                    <div className="relative">
                      <select
                        value={addedByFilter}
                        onChange={(e) => setAddedByFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600"
                      >
                        <option value="any">أي موظف</option>
                        <option value="admin">Abdo Yaser</option>
                        <option value="agent">سليم المبيعات</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">خيارات الشحن</label>
                    <div className="relative">
                      <select
                        value={shippingFilter}
                        onChange={(e) => setShippingFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600"
                      >
                        <option value="all">الكل</option>
                        <option value="free">شحن مجاني</option>
                        <option value="paid">شحن مدفوع عالي التكاليف</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* COLUMN LEFT (RTL) - Amount limits, DueDate, Creation Date, E-invoice status, Sales rep, Order source */}
                <div className="space-y-3.5">
                  {/* Total Limits input side-by-side */}
                  <div className="grid grid-cols-2 gap-2 select-none">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5 text-center xs:text-right">الإجمالي أقل من</label>
                      <input
                        type="text"
                        placeholder=""
                        value={totalMax}
                        onChange={(e) => setTotalMax(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium text-center font-sans"
                      />
                    </div>
                    
                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5 text-center xs:text-right">الإجمالي أكبر من</label>
                      <input
                        type="text"
                        placeholder=""
                        value={totalMin}
                        onChange={(e) => setTotalMin(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium text-center font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">تاريخ الاستحقاق</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="إلى"
                        value={dueDateTo}
                        onChange={(e) => setDueDateTo(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium"
                      />
                      
                      <span className="text-slate-400 font-bold px-1 select-none">-</span>
                      
                      <input
                        type="text"
                        placeholder="من"
                        value={dueDateFrom}
                        onChange={(e) => setDueDateFrom(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium"
                      />

                      <div className="relative w-2/3 shrink-0 select-none text-[11px]">
                        <select
                          value={dueDateType}
                          onChange={(e) => setDueDateType(e.target.value)}
                          className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded pr-2 pl-6 text-[11px] focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none text-slate-600 font-bold"
                        >
                          <option value="custom">تخصيص</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute left-2 top-[13px] text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">تاريخ الإنشاء</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="إلى"
                        value={createDateTo}
                        onChange={(e) => setCreateDateTo(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium"
                      />
                      
                      <span className="text-slate-400 font-bold px-1 select-none">-</span>
                      
                      <input
                        type="text"
                        placeholder="من"
                        value={createDateFrom}
                        onChange={(e) => setCreateDateFrom(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-2.5 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-medium"
                      />

                      <div className="relative w-2/3 shrink-0 select-none text-[11px]">
                        <select
                          value={createDateType}
                          onChange={(e) => setCreateDateType(e.target.value)}
                          className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded pr-2 pl-6 text-[11px] focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none text-slate-600 font-bold"
                        >
                          <option value="custom">تخصيص</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute left-2 top-[13px] text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">حالة الفاتورة الالكترونية</label>
                    <div className="relative">
                      <select
                        value={einvoiceStatusFilter}
                        onChange={(e) => setEinvoiceStatusFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600 text-right pr-3 pl-8"
                      >
                        <option value="any">أي</option>
                        <option value="sent">تم الإرسال بنجاح للضرائب</option>
                        <option value="failed">خطأ بالإرسال</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">مسؤول مبيعات</label>
                    <div className="relative">
                      <select
                        value={salesRepFilter}
                        onChange={(e) => setSalesRepFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600 text-right pr-3 pl-8"
                      >
                        <option value="any">أي مسؤول مبيعات</option>
                        <option value="yaser">Abdo Yaser</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">مصدر الطلب</label>
                    <div className="relative">
                      <select
                        value={orderSourceFilter}
                        onChange={(e) => setOrderSourceFilter(e.target.value)}
                        className="w-full h-[36px] bg-white border border-[#cbd5e1] rounded px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer appearance-none font-medium text-slate-600"
                      >
                        <option value="any">من فضلك اختر</option>
                        <option value="direct">شراء مباشر</option>
                        <option value="phone">مكالمات هاتفية</option>
                      </select>
                      <ChevronDown className="w-3.5 h-[14px] absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search controls row at bottom - 'بحث' & 'إلغاء الفلتر' on the left, 'بحث متقدم' on the right */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-transparent mt-5 pt-3 border-t border-slate-100 gap-3 select-none">
          {/* Right Align: Sliders Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded text-xs font-bold transition-all shadow-3xs cursor-pointer select-none ${
              showAdvanced 
                ? 'bg-[#e2f0fd] text-[#2e7d32] border-[#81c784] ring-1 ring-[#81c784]/20' 
                : 'border-[#e1e8ed] hover:border-slate-300 text-slate-600 bg-white'
            }`}
          >
            <Sliders className={`w-3.5 h-3.5 text-[#3a4d61] transition-transform duration-300 ${showAdvanced ? 'rotate-180 text-[#2e7d32]' : ''}`} />
            <span>{showAdvanced ? 'إخفاء البحث المتقدم' : 'بحث متقدم'}</span>
          </button>

          {/* Left Align: Submissions list */}
          <div className="flex items-center gap-2 select-none">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-1.5 border border-[#ced4da] hover:bg-slate-50 transition-colors text-slate-700 font-bold text-xs rounded cursor-pointer h-[34px] bg-white"
            >
              إلغاء الفلتر
            </button>
            <button
              type="submit"
              className="px-6 py-1.5 bg-[#f4f7f9] hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded border border-[#cbd1d6] shadow-3xs cursor-pointer h-[34px] transition-colors"
            >
              بحث
            </button>
          </div>
        </div>

      </form>

      {/* 4. Results Navigation Bar Strip - 'المبيعات' header with custom pills */}
      <div className="bg-white rounded border border-[#dae4f0] overflow-hidden shadow-2xs">
        
        {/* Strip title & tabs block */}
        <div className="border-b border-[#dae3ec] px-5 py-3.5 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white select-none">
          
          {/* Header text 'المبيعات' */}
          <div className="flex items-center gap-2 order-2 lg:order-1 justify-start lg:justify-end">
            <TrendingUp className="w-5 h-5 text-daftra-blue" />
            <h4 className="text-[15.5px] font-extrabold text-slate-800">المبيعات</h4>
          </div>

          {/* Tabs group for Results aligned on the same strip */}
          <div className="flex flex-wrap items-center gap-1 order-1 lg:order-2 select-none text-xs">
            {/* 'النتائج' label badge */}
            <span className="px-3 py-1.5 text-slate-400 font-extrabold text-[12px] select-none pl-2.5">
              النتائج
            </span>

            {[
              { id: 'all', name: 'الكل' },
              { id: 'overdue', name: 'متأخر' },
              { id: 'due', name: 'مستحقة الدفع' },
              { id: 'unpaid', name: 'غير مدفوعة' },
              { id: 'draft', name: 'مسودة' },
              { id: 'overpaid', name: 'مدفوع بالزيادة' }
            ].map((tab) => {
              const isActive = activeResultsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveResultsTab(tab.id);
                    setSearchTriggered(true);
                  }}
                  className={`px-3.5 py-1.5 rounded-sm font-bold text-xs transition-all border select-none cursor-pointer ${
                    isActive
                      ? 'bg-daftra-light-blue text-daftra-blue border-[#ccdbe8]'
                      : 'text-slate-600 hover:bg-slate-50 border-transparent'
                  }`}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>

        </div>

        {/* Results output content */}
        <div className="p-4 sm:p-5">
          {/* Sort bar row */}
          <div className="flex justify-between items-center text-xs mb-4 border-b border-dashed border-slate-100 pb-2 select-none">
            <span className="text-slate-400 font-medium">عدد الفواتير المعروضة: {filteredInvoices.length}</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">الترتيب حسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-daftra-blue font-bold cursor-pointer pr-1"
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
                <option value="total-desc">القيمة (أعلى إلى أقل)</option>
                <option value="total-asc">القيمة (أقل إلى أعلى)</option>
              </select>
            </div>
          </div>

          {/* Conditional rendering based on search results */}
          {filteredInvoices.length === 0 ? (
            /* EXACT empty screen notification styling as in Daftra */
            <div 
              className="bg-[#fffdf6] border border-[#fcd997] rounded-sm p-4 text-center select-none cursor-pointer hover:bg-[#fffcf0] transition-colors"
              onClick={() => setView('create-invoice')}
            >
              <div className="flex items-center justify-center gap-2 text-[#a86500] text-[13.5px] font-black">
                <AlertCircle className="w-5 h-5 text-[#f0ad4e] stroke-[2.5]" />
                <span>لم يتم العثور على الفواتير، </span>
                <span className="underline cursor-pointer hover:text-[#d38c1a]" onClick={(e) => { e.stopPropagation(); setView('create-invoice'); }}>
                  اضغط هنا لإضافة فاتورة
                </span>
              </div>
            </div>
          ) : (
            /* Responsive elegant layout table containing genuine filtered invoices */
            <div className="overflow-x-auto rounded border border-[#dae3ec]">
              <table className="w-full text-right text-xs table-auto divide-y divide-[#dae3ec]">
                <thead className="bg-[#fcfdfe] font-bold text-slate-700 select-none">
                  <tr>
                    <th className="p-3 w-1/6 text-right">رقم الفاتورة</th>
                    <th className="p-3 w-1/4 text-right">العميل المستفيد</th>
                    <th className="p-3 w-1/6 text-right">مسؤول المبيعات</th>
                    <th className="p-3 w-1/6 text-right">التاريخ</th>
                    <th className="p-3 w-1/6 text-left">قيمة الفاتورة</th>
                    <th className="p-3 text-center">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dae3ec] bg-white">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-daftra-blue">#{inv.invoiceNumber}</td>
                      <td className="p-3 font-semibold text-slate-800">{inv.clientName}</td>
                      <td className="p-3 font-medium text-slate-500">{inv.salesAgent || 'Abdo Yaser'}</td>
                      <td className="p-3 font-mono text-slate-400">{inv.date}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        <span>{inv.total.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        <span className="text-[10px] text-slate-400 mr-1">{inv.currency || 'ج.م'}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded text-[10px] font-black text-center ${
                          inv.status === 'paid' ? 'bg-[#e2f9e4] text-[#117622]' :
                          inv.status === 'overdue' ? 'bg-[#ffebee] text-[#c62828]' :
                          inv.status === 'unpaid' ? 'bg-[#fef3d6] text-[#b28400]' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {inv.status === 'paid' && '● مدفوعة بالكامل'}
                          {inv.status === 'overdue' && '▲ متأخرة السداد'}
                          {inv.status === 'unpaid' && '■ غير مدفوعة'}
                          {inv.status === 'draft' && '◇ مسودة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
