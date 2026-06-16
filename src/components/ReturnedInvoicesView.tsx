import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  ChevronDown,
  AlertCircle,
  ArrowUpDown,
  Plus,
  X,
  CheckCircle2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Client, Invoice } from '../types';
import { supabase } from '../lib/supabase';

interface ReturnedInvoicesViewProps {
  setView: (view: string) => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

interface ReturnedInvoice {
  id: string;
  invoiceNumber: string;
  returnNumber: string;
  clientName: string;
  date: string;
  total: number;
  status: 'refunded' | 'partially-refunded' | 'draft';
  currency: string;
}

export default function ReturnedInvoicesView({ setView, showToast }: ReturnedInvoicesViewProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: inv } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (inv) setInvoices(inv);
    const { data: cl } = await supabase.from('clients').select('*');
    if (cl) setClients(cl);
  };

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [clientFilter, setClientFilter] = useState('any');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [containsItem, setContainsItem] = useState('');
  const [currency, setCurrency] = useState('any');
  const [totalMin, setTotalMin] = useState('');
  const [totalMax, setTotalMax] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('any');
  const [dateType, setDateType] = useState('تخصيص');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dueDateType, setDueDateType] = useState('تخصيص');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [createDateType, setCreateDateType] = useState('تخصيص');
  const [createDateFrom, setCreateDateFrom] = useState('');
  const [createDateTo, setCreateDateTo] = useState('');
  const [customField, setCustomField] = useState('');
  const [source, setSource] = useState('الكل');
  const [invoiceType, setInvoiceType] = useState('الكل');
  const [clientType, setClientType] = useState('الكل');
  const [addedBy, setAddedBy] = useState('any-employee');
  const [salesRep, setSalesRep] = useState('any-rep');
  const [einvoiceStatus, setEinvoiceStatus] = useState('any');
  const [deliveryStatus, setDeliveryStatus] = useState('الكل');
  const [sessionVal, setSessionVal] = useState('');
  const [orderSource, setOrderSource] = useState('any');
  const [isSearched, setIsSearched] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [returnedInvoices, setReturnedInvoices] = useState<ReturnedInvoice[]>([]);

  // Add return modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [returnAmount, setReturnAmount] = useState(0);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnReason, setReturnReason] = useState('');

  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  const handleClearFilters = () => {
    setClientFilter('any');
    setInvoiceNumber('');
    setContainsItem('');
    setCurrency('any');
    setTotalMin('');
    setTotalMax('');
    setPaymentStatus('any');
    setSource('الكل');
    setInvoiceType('الكل');
    setClientType('الكل');
    setAddedBy('any-employee');
    setSalesRep('any-rep');
    setEinvoiceStatus('any');
    setDeliveryStatus('الكل');
    setSessionVal('');
    setOrderSource('any');
    setDateFrom('');
    setDateTo('');
    setDueDateFrom('');
    setDueDateTo('');
    setCreateDateFrom('');
    setCreateDateTo('');
    setIsSearched(false);
  };

  const handleSearch = () => {
    setIsSearched(true);
  };

  const getNextReturnNumber = () => {
    if (returnedInvoices.length === 0) return 'RET-000001';
    const lastNum = returnedInvoices.reduce((max, r) => {
      const num = parseInt(r.returnNumber.replace('RET-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `RET-${String(lastNum + 1).padStart(6, '0')}`;
  };

  const handleAddReturn = async () => {
    if (!selectedInvoiceId) {
      showToast?.('الرجاء اختيار الفاتورة المراد إرجاعها.', 'error');
      return;
    }
    if (returnAmount <= 0) {
      showToast?.('الرجاء إدخال مبلغ صحيح للإرجاع.', 'error');
      return;
    }

    const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
    if (!invoice) return;

    if (returnAmount > invoice.total) {
      showToast?.('قيمة الإرجاع لا يمكن أن تتجاوز قيمة الفاتورة الأصلية.', 'error');
      return;
    }

    const isFullReturn = returnAmount >= invoice.total;

    const returned: ReturnedInvoice = {
      id: `ret-${Date.now()}`,
      invoiceNumber: invoice.invoiceNumber,
      returnNumber: getNextReturnNumber(),
      clientName: invoice.clientName,
      date: returnDate,
      total: returnAmount,
      status: isFullReturn ? 'refunded' : 'partially-refunded',
      currency: 'EGP'
    };

    await supabase.from('invoices').update({ status: 'returned' }).eq('id', selectedInvoiceId);
    setInvoices(prev => prev.map(inv =>
      inv.id === selectedInvoiceId ? { ...inv, status: 'returned', alreadyPaid: false } : inv
    ));
    setReturnedInvoices(prev => [returned, ...prev]);
    setShowAddModal(false);
    setSelectedInvoiceId('');
    setReturnAmount(0);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnReason('');
    showToast?.(`تم تسجيل مرتجع بقيمة ${returnAmount} ج.م للفاتورة #${invoice.invoiceNumber} بنجاح.`);
  };

  const getSelectedInvoice = () => invoices.find(inv => inv.id === selectedInvoiceId);

  return (
    <div id="daftra-returned-invoices-view" className="space-y-6 text-right select-none font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-transparent gap-4 pt-1 select-none w-full">
        <h2 className="text-xl font-bold text-slate-800">الفواتير المرتجعة</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#1abc9c] hover:bg-[#16a085] text-white px-4 py-2 rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>مرتجع مبيعات جديد</span>
        </button>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded border border-[#dae4f0] shadow-3xs overflow-hidden select-none">
        <div className="bg-[#fcfdfe] px-5 py-3 border-b border-[#e9eff6] flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#204060]">بحث</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5 space-y-1.5 text-right flex flex-col">
              <label className="text-xs font-bold text-slate-600 block">العميل</label>
              <div className="relative">
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-1.5 text-xs text-slate-700 outline-none transition-colors appearance-none cursor-pointer text-right pl-8"
                  style={{ direction: 'rtl' }}
                >
                  <option value="any">أي عميل</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.fullName}>{c.fullName}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
            <div className="md:col-span-4 space-y-1.5 text-right">
              <label className="text-xs font-bold text-slate-600 block">رقم الفاتورة</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="رقم الفاتورة"
                className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-1.5 text-xs text-slate-700 outline-none transition-colors text-right"
              />
            </div>
            <div className="md:col-span-3 flex justify-start">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 border rounded text-xs font-bold transition-all shadow-3xs cursor-pointer select-none w-full md:w-auto ${
                  showAdvanced
                    ? 'bg-[#e2f0fd] text-[#2e7d32] border-[#81c784] ring-1 ring-[#81c784]/20'
                    : 'border-[#e1e8ed] hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>بحث متقدم</span>
              </button>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden pt-4 border-t border-dashed border-slate-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">تحتوي على البند</label>
                      <input type="text" value={containsItem} onChange={(e) => setContainsItem(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">حالة الدفع</label>
                      <div className="relative">
                        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any">أي</option>
                          <option value="refunded">مردودة كاملة</option>
                          <option value="partially-refunded">مردودة جزئياً</option>
                          <option value="draft">مسودة</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">المصدر</label>
                      <div className="relative">
                        <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="الكل">الكل</option>
                          <option value="user">المستخدم</option>
                          <option value="api">مسؤول خارجي (API)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">نوع الفاتورة</label>
                      <div className="relative">
                        <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="الكل">الكل</option>
                          <option value="normal">عادية</option>
                          <option value="pos">نقاط البيع</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">حالة التسليم</label>
                      <div className="relative">
                        <select value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="الكل">الكل</option>
                          <option value="delivered">تم التسليم</option>
                          <option value="pending">قيد الانتظار</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">جلسه</label>
                      <input type="text" value={sessionVal} onChange={(e) => setSessionVal(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">العملة</label>
                      <div className="relative">
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any">أي</option>
                          <option value="SAR">ريال سعودي (SAR)</option>
                          <option value="USD">دولار أمريكي (USD)</option>
                          <option value="EGP">جنيه مصري (EGP)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">التاريخ</label>
                      <div className="grid grid-cols-12 gap-1.5 items-center">
                        <div className="col-span-4">
                          <select value={dateType} onChange={(e) => setDateType(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-1.5 py-1.5 text-[11px] text-slate-600 outline-none appearance-none text-center" style={{ direction: 'rtl' }}>
                            <option value="تخصيص">تخصيص</option>
                          </select>
                        </div>
                        <div className="col-span-4 flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">من</span>
                          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white border border-[#cbd5e1] rounded px-1 py-1.5 text-[10px] text-slate-600 outline-none w-full text-center" />
                        </div>
                        <div className="col-span-4 flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">إلى</span>
                          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white border border-[#cbd5e1] rounded px-1 py-1.5 text-[10px] text-slate-600 outline-none w-full text-center" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">حقل مخصص</label>
                      <input type="text" value={customField} onChange={(e) => setCustomField(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">نوع العميل</label>
                      <div className="relative">
                        <select value={clientType} onChange={(e) => setClientType(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="الكل">الكل</option>
                          <option value="corporate">مؤسسة</option>
                          <option value="individual">فرد</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">أضيفت بواسطة</label>
                      <div className="relative">
                        <select value={addedBy} onChange={(e) => setAddedBy(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any-employee">أي موظف</option>
                          <option value="abdo-yaser">Abdo Yaser</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">مصدر الطلب</label>
                      <div className="relative">
                        <select value={orderSource} onChange={(e) => setOrderSource(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-[#4c5c6c] text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any">من فضلك اختر</option>
                          <option value="web">الموقع الإلكتروني</option>
                          <option value="mobile">تطبيق الموبايل</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-right">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">الإجمالي أقل من</label>
                        <input type="number" value={totalMax} onChange={(e) => setTotalMax(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">الإجمالي أكبر من</label>
                        <input type="number" value={totalMin} onChange={(e) => setTotalMin(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#c71515] block md:text-slate-500">تاريخ الاستحقاق</label>
                      <div className="grid grid-cols-12 gap-1.5 items-center">
                        <div className="col-span-4">
                          <select value={dueDateType} onChange={(e) => setDueDateType(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-1.5 py-1.5 text-[11px] text-slate-600 outline-none appearance-none text-center" style={{ direction: 'rtl' }}>
                            <option value="تخصيص">تخصيص</option>
                          </select>
                        </div>
                        <div className="col-span-4 flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">من</span>
                          <input type="date" value={dueDateFrom} onChange={(e) => setDueDateFrom(e.target.value)} className="bg-white border border-[#cbd5e1] rounded px-1 py-1.5 text-[10px] text-slate-600 outline-none w-full text-center" />
                        </div>
                        <div className="col-span-4 flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">إلى</span>
                          <input type="date" value={dueDateTo} onChange={(e) => setDueDateTo(e.target.value)} className="bg-white border border-[#cbd5e1] rounded px-1 py-1.5 text-[10px] text-slate-600 outline-none w-full text-center" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">تاريخ الإنشاء</label>
                      <div className="grid grid-cols-12 gap-1.5 items-center">
                        <div className="col-span-4">
                          <select value={createDateType} onChange={(e) => setCreateDateType(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-1.5 py-1.5 text-[11px] text-slate-600 outline-none appearance-none text-center" style={{ direction: 'rtl' }}>
                            <option value="تخصيص">تخصيص</option>
                          </select>
                        </div>
                        <div className="col-span-4 flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">من</span>
                          <input type="date" value={createDateFrom} onChange={(e) => setCreateDateFrom(e.target.value)} className="bg-white border border-[#cbd5e1] rounded px-1 py-1.5 text-[10px] text-slate-600 outline-none w-full text-center" />
                        </div>
                        <div className="col-span-4 flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">إلى</span>
                          <input type="date" value={createDateTo} onChange={(e) => setCreateDateTo(e.target.value)} className="bg-white border border-[#cbd5e1] rounded px-1 py-1.5 text-[10px] text-slate-600 outline-none w-full text-center" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">حالة الفاتورة الالكترونية</label>
                      <div className="relative">
                        <select value={einvoiceStatus} onChange={(e) => setEinvoiceStatus(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any">أي</option>
                          <option value="sent">مرسل</option>
                          <option value="approved">مقبول</option>
                          <option value="rejected">مرفوض</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">مسؤول مبيعات</label>
                      <div className="relative">
                        <select value={salesRep} onChange={(e) => setSalesRep(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any-rep">أي مسؤول مبيعات</option>
                          <option value="abdo">Abdo Yaser</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100 select-none">
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleSearch} className="bg-[#e2f0fd] text-[#0f5fc2] hover:bg-[#d0e5fc] px-5 py-1.5 rounded text-xs font-bold transition-all shadow-3xs cursor-pointer select-none border border-[#bcdbf7]">بحث</button>
              <button type="button" onClick={handleClearFilters} className="bg-white hover:bg-slate-50 text-slate-600 border border-[#e1e8ed] px-4 py-1.5 rounded text-xs font-bold transition-all shadow-3xs cursor-pointer select-none">إلغاء الفلتر</button>
            </div>
            {showAdvanced && (
              <button type="button" onClick={() => setShowAdvanced(false)} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e1e8ed] hover:border-slate-300 rounded text-xs font-bold text-slate-600 bg-white shadow-3xs cursor-pointer transition-colors">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>إخفاء البحث المتقدم</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="bg-white rounded border border-[#dae4f0] shadow-3xs overflow-hidden select-none">
        <div className="bg-[#fcfdfe] px-5 py-3 border-b border-[#e9eff6] flex items-center justify-between select-none">
          <span className="text-[13px] font-bold text-[#204060]">النتائج</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">الترتيب حسب</span>
            <button onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')} className="flex items-center gap-1 text-xs text-[#0f5fc2] hover:underline font-bold">
              <ArrowUpDown className="w-3 h-3" />
              <span>{sortOrder === 'newest' ? 'الأحدث' : 'الأقدم'}</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          {returnedInvoices.length === 0 ? (
            <div className="border border-[#ffebcc] bg-[#fffbf2] text-amber-800 rounded p-4 text-center flex items-center justify-center gap-2 select-none shadow-3xs">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-xs font-bold">لا يوجد إيصالات ارتجاع</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="py-2.5">رقم الإيصال</th>
                    <th className="py-2.5">الفاتورة</th>
                    <th className="py-2.5">العميل</th>
                    <th className="py-2.5">التاريخ</th>
                    <th className="py-2.5">القيمة</th>
                    <th className="py-2.5">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {returnedInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-700">{inv.returnNumber}</td>
                      <td className="py-3 font-semibold text-slate-700">#{inv.invoiceNumber}</td>
                      <td className="py-3 font-semibold text-slate-700">{inv.clientName}</td>
                      <td className="py-3 text-slate-500">{inv.date}</td>
                      <td className="py-3 font-bold text-slate-900">{inv.total.toLocaleString('ar-EG')} {inv.currency}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'refunded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {inv.status === 'refunded' ? 'مستردة بالكامل' : 'مستردة جزئياً'}
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

      {/* Add Return Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden"
            >
              <div className="bg-[#0d385a] px-5 py-3.5 text-white flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                  <span>تسجيل مرتجع مبيعات</span>
                </div>
                <button type="button" className="p-1 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer" onClick={() => setShowAddModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-right">
                {paidInvoices.length === 0 ? (
                  <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded p-4 text-center text-xs font-bold">
                    لا توجد فواتير مدفوعة متاحة للإرجاع.
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">اختر الفاتورة</label>
                      <div className="relative">
                        <select
                          value={selectedInvoiceId}
                          onChange={(e) => {
                            setSelectedInvoiceId(e.target.value);
                            const inv = invoices.find(i => i.id === e.target.value);
                            if (inv) setReturnAmount(inv.total);
                          }}
                          className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none appearance-none cursor-pointer text-right pl-8"
                          style={{ direction: 'rtl' }}
                        >
                          <option value="">-- اختر فاتورة --</option>
                          {paidInvoices.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              #{inv.invoiceNumber} - {inv.clientName} - {inv.total.toLocaleString('ar-EG')} ج.م
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {selectedInvoiceId && (
                      <div className="bg-amber-50 border border-amber-100 rounded p-2.5 text-[11px] text-amber-800 font-semibold flex justify-between">
                        <span>قيمة الفاتورة الأصلية:</span>
                        <span className="font-mono">{getSelectedInvoice()?.total.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">قيمة المرتجع</label>
                      <input
                        type="number"
                        min="0"
                        value={returnAmount}
                        onChange={(e) => setReturnAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none text-right font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">التاريخ</label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">سبب الإرجاع</label>
                      <textarea
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="اذكر سبب الإرجاع..."
                        className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleAddReturn}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تسجيل المرتجع</span>
                      </button>
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
