import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  ChevronDown,
  AlertCircle,
  ArrowUpDown,
  Plus,
  X,
  CheckCircle2,
  Banknote,
  CreditCard,
  Building2,
  FileText,
  Search
} from 'lucide-react';


interface CustomerPaymentsViewProps {
  setView: (view: string) => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

interface CustomerPayment {
  id: string;
  paymentNumber: string;
  invoiceNumber: string;
  clientName: string;
  method: string;
  date: string;
  amount: number;
  status: string;
}

export default function CustomerPaymentsView({ setView, showToast }: CustomerPaymentsViewProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [clientFilter, setClientFilter] = useState('any');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('any');
  const [identifier, setIdentifier] = useState('');
  const [transferId, setTransferId] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [statusVal, setStatusVal] = useState('any');
  const [sessionVal, setSessionVal] = useState('');
  const [invoiceCreator, setInvoiceCreator] = useState('any');
  const [collectedBy, setCollectedBy] = useState('any');
  const [dateType, setDateType] = useState('تخصيص');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [createDateType, setCreateDateType] = useState('تخصيص');
  const [createDateFrom, setCreateDateFrom] = useState('');
  const [createDateTo, setCreateDateTo] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [safesBanks, setSafesBanks] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: inv } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (inv) setInvoices(inv);
    const { data: cl } = await supabase.from('clients').select('*');
    if (cl) setClients(cl);
    const { data: safes } = await supabase.from('safes_banks').select('*');
    if (safes) setSafesBanks(safes);
  };

  // Add payment modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethodNew, setPaymentMethodNew] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const [selectedPaymentTreasuryId, setSelectedPaymentTreasuryId] = useState('');

  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue' || inv.status === 'partial');

  const handleClearFilters = () => {
    setClientFilter('any');
    setClientSearchQuery('');
    setPaymentNumber('');
    setInvoiceNumber('');
    setPaymentMethod('any');
    setIdentifier('');
    setTransferId('');
    setAmountMin('');
    setAmountMax('');
    setStatusVal('any');
    setSessionVal('');
    setInvoiceCreator('any');
    setCollectedBy('any');
    setDateFrom('');
    setDateTo('');
    setCreateDateFrom('');
    setCreateDateTo('');
    setIsSearched(false);
  };

  const handleSearch = () => {
    setIsSearched(true);
  };

  const getNextPaymentNumber = () => {
    if (payments.length === 0) return 'PAY-000001';
    const lastNum = payments.reduce((max, p) => {
      const num = parseInt(p.paymentNumber.replace('PAY-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `PAY-${String(lastNum + 1).padStart(6, '0')}`;
  };

  const handleAddPayment = async () => {
    if (!selectedInvoiceId) {
      showToast?.('الرجاء اختيار فاتورة للدفع.', 'error');
      return;
    }
    if (paymentAmount <= 0) {
      showToast?.('الرجاء إدخال مبلغ صحيح للدفعة.', 'error');
      return;
    }
    if (!selectedPaymentTreasuryId) {
      showToast?.('الرجاء اختيار الخزنة أو الحساب البنكي.', 'error');
      return;
    }

    const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
    if (!invoice) return;

    const paidSoFar = (invoice.deposit_amount || 0);
    const newPaid = paidSoFar + paymentAmount;
    const newStatus = newPaid >= invoice.total ? 'paid' : 'partial';

    const payment: CustomerPayment = {
      id: `pay-${Date.now()}`,
      paymentNumber: getNextPaymentNumber(),
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      method: paymentMethodNew === 'cash' ? 'نقداً' : paymentMethodNew === 'bank' ? 'تحويل بنكي' : 'بطاقة ائتمان',
      date: paymentDate,
      amount: paymentAmount,
      status: 'completed'
    };

    // Update invoice status and deposit/remaining
    await supabase.from('invoices').update({
      status: newStatus,
      deposit_amount: newPaid,
      remaining_amount: Math.max(0, invoice.total - newPaid)
    }).eq('id', selectedInvoiceId);

    // Treasury update
    const { data: treasury } = await supabase.from('safes_banks').select('balance').eq('id', selectedPaymentTreasuryId).single();
    if (treasury) {
      const currentBalance = parseFloat(treasury.balance) || 0;
      const newBalance = currentBalance + paymentAmount;
      await supabase.from('safes_banks').update({ balance: newBalance }).eq('id', selectedPaymentTreasuryId);
      await supabase.from('treasury_transactions').insert({
        treasury_id: selectedPaymentTreasuryId,
        transaction_type: 'sale_payment',
        reference_type: 'invoice',
        reference_id: selectedInvoiceId,
        reference_number: invoice.invoiceNumber,
        description: `تحصيل دفعة ${paymentAmount} ج.م من ${invoice.clientName} - فاتورة ${invoice.invoiceNumber}`,
        amount: paymentAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        created_by: 'system'
      });
    }

    // Client balance update
    const { data: client } = await supabase.from('clients').select('balance, id').eq('name', invoice.clientName).single();
    if (client) {
      const oldBal = parseFloat(client.balance) || 0;
      await supabase.from('clients').update({ balance: oldBal - paymentAmount }).eq('id', client.id);
    }

    setPayments(prev => [payment, ...prev]);
    setShowAddModal(false);
    setSelectedInvoiceId('');
    setSelectedPaymentTreasuryId('');
    setPaymentAmount(0);
    setPaymentMethodNew('cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNote('');
    loadData();
    showToast?.(`تم تسجيل دفعة بقيمة ${paymentAmount} ج.م للفاتورة #${invoice.invoiceNumber} بنجاح.`);
  };

  const getSelectedInvoice = () => invoices.find(inv => inv.id === selectedInvoiceId);
  const getClientName = (clientName: string) => clients.find(c => c.fullName === clientName)?.fullName || clientName;

  const filteredPayments = payments.filter(p => {
    if (clientFilter !== 'any' && p.clientName !== clientFilter) return false;
    if (paymentNumber && !p.paymentNumber.includes(paymentNumber)) return false;
    if (invoiceNumber && !p.invoiceNumber.includes(invoiceNumber)) return false;
    return true;
  });

  return (
    <div id="daftra-customer-payments-view" className="space-y-6 text-right select-none font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-transparent gap-4 pt-1 select-none w-full">
        <h2 className="text-xl font-bold text-slate-800">مدفوعات العملاء</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#1abc9c] hover:bg-[#16a085] text-white px-4 py-2 rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دفعة</span>
        </button>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded border border-[#dae4f0] shadow-3xs overflow-hidden select-none">
        <div className="bg-[#fcfdfe] px-5 py-3 border-b border-[#e9eff6] flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#204060]">بحث</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4 space-y-1.5 text-right flex flex-col">
              <label className="text-xs font-bold text-slate-600 block">العميل</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="أي عميل"
                  value={clientFilter === 'any' ? clientSearchQuery : clientFilter}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setShowClientDropdown(true);
                    setClientFilter('any');
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-1.5 text-xs text-slate-700 outline-none transition-colors text-right"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                {showClientDropdown && (
                  <div className="absolute z-50 top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto">
                    <div
                      className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 text-slate-400"
                      onMouseDown={() => {
                        setClientFilter('any');
                        setClientSearchQuery('');
                        setShowClientDropdown(false);
                      }}
                    >
                      الكل
                    </div>
                    {(clientSearchQuery.trim()
                      ? clients.filter(c =>
                          c.fullName.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                          (c.mobile || '').includes(clientSearchQuery) ||
                          (c.phone || '').includes(clientSearchQuery)
                        )
                      : clients
                    ).map(c => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setClientFilter(c.fullName);
                          setClientSearchQuery(c.fullName);
                          setShowClientDropdown(false);
                        }}
                        className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex justify-between items-center"
                      >
                        <span className="font-bold text-slate-700">{c.fullName}</span>
                        <span className="text-slate-400 text-[10px]">{c.mobile || c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-4 space-y-1.5 text-right">
              <label className="text-xs font-bold text-slate-600 block">رقم عملية الدفع</label>
              <input
                type="text"
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                placeholder="رقم عملية الدفع"
                className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-1.5 text-xs text-slate-700 outline-none transition-colors text-right"
              />
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
                      <label className="text-xs font-bold text-slate-500 block">الرقم التعريفي</label>
                      <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">الحالة</label>
                      <div className="relative">
                        <select value={statusVal} onChange={(e) => setStatusVal(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any">أي حالة</option>
                          <option value="completed">مكتملة</option>
                          <option value="pending">معلقة</option>
                          <option value="failed">فشلت</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">منشئ الفاتورة</label>
                      <div className="relative">
                        <select value={invoiceCreator} onChange={(e) => setInvoiceCreator(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any">منشئ الفاتورة</option>
                          <option value="abdo">Abdo Yaser</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
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
                    <div className="grid grid-cols-2 gap-2 text-right">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">المبلغ أقل من</label>
                        <input type="number" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">المبلغ أكبر من</label>
                        <input type="number" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">جلسه</label>
                      <input type="text" value={sessionVal} onChange={(e) => setSessionVal(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">وسيلة دفع</label>
                      <div className="relative">
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any">أي طرق دفع</option>
                          <option value="cash">نقداً</option>
                          <option value="bank">تحويل بنكي</option>
                          <option value="visa">بطاقة ائتمان</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">رقم معرّف للتحويل</label>
                      <input type="text" value={transferId} onChange={(e) => setTransferId(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none hover:border-slate-400 transition-colors text-right" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">تاريخ الإنشاء</label>
                      <div className="grid grid-cols-12 gap-1.5 items-center">
                        <div className="col-span-4">
                          <select value={createDateType} onChange={(e) => setCreateDateType(e.target.value)} className="w-full bg-[#faeffc] border border-[#d6bcd9] text-[#71317d] rounded px-1.5 py-1.5 text-[11px] font-bold outline-none appearance-none text-center" style={{ direction: 'rtl' }}>
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
                      <label className="text-xs font-bold text-slate-500 block">تم التحصيل بواسطة</label>
                      <div className="relative">
                        <select value={collectedBy} onChange={(e) => setCollectedBy(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
                          <option value="any">تم التحصيل بواسطة</option>
                          <option value="abdo-yaser">Abdo Yaser</option>
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
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded text-xs font-bold transition-all shadow-3xs cursor-pointer select-none ${showAdvanced ? 'bg-[#e2f0fd] text-[#2e7d32] border-[#81c784] ring-1 ring-[#81c784]/20' : 'border-[#e1e8ed] hover:border-slate-300 text-slate-600 bg-white'}`}>
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>{showAdvanced ? 'إخفاء البحث المتقدم' : 'بحث متقدم'}</span>
            </button>
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
          {filteredPayments.length === 0 ? (
            <div className="border border-[#ffebcc] bg-[#fffbf2] text-amber-800 rounded p-4 text-center flex items-center justify-center gap-2 select-none shadow-3xs">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-xs font-bold">لا توجد مدفوعات مسجلة</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="py-2.5">رقم العملية</th>
                    <th className="py-2.5">رقم الفاتورة</th>
                    <th className="py-2.5">العميل</th>
                    <th className="py-2.5">وسيلة الدفع</th>
                    <th className="py-2.5">التاريخ</th>
                    <th className="py-2.5">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-700">{p.paymentNumber}</td>
                      <td className="py-3 font-semibold text-slate-700">#{p.invoiceNumber}</td>
                      <td className="py-3 font-semibold text-[#0f5fc2]">{p.clientName}</td>
                      <td className="py-3 text-slate-500">{p.method}</td>
                      <td className="py-3 text-slate-500">{p.date}</td>
                      <td className="py-3 font-bold text-slate-900">{p.amount.toLocaleString('ar-EG')} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
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
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  <span>تسجيل دفعة جديدة</span>
                </div>
                <button type="button" className="p-1 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer" onClick={() => setShowAddModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-right">
                {unpaidInvoices.length === 0 ? (
                  <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded p-4 text-center text-xs font-bold">
                    لا توجد فواتير غير مدفوعة متاحة للتحصيل.
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
                            if (inv) setPaymentAmount(inv.total);
                          }}
                          className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none appearance-none cursor-pointer text-right pl-8"
                          style={{ direction: 'rtl' }}
                        >
                          <option value="">-- اختر فاتورة --</option>
                          {unpaidInvoices.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              #{inv.invoiceNumber} - {inv.clientName} - {inv.total.toLocaleString('ar-EG')} ج.م
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {selectedInvoiceId && (
                      <div className="bg-sky-50 border border-sky-100 rounded p-2.5 text-[11px] text-sky-800 font-semibold flex justify-between">
                        <span>قيمة الفاتورة:</span>
                        <span className="font-mono">{getSelectedInvoice()?.total.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">المبلغ المدفوع</label>
                      <input
                        type="number"
                        min="0"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none text-right font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">وسيلة الدفع</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'cash', label: 'نقداً', icon: Banknote },
                          { value: 'bank', label: 'تحويل بنكي', icon: Building2 },
                          { value: 'visa', label: 'بطاقة ائتمان', icon: CreditCard },
                        ].map(opt => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setPaymentMethodNew(opt.value)}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                                paymentMethodNew === opt.value
                                  ? 'bg-[#e2f0fd] text-daftra-blue border-daftra-blue'
                                  : 'bg-white text-slate-600 border-[#cbd5e1] hover:border-slate-400'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">التاريخ</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">الخزنة / الحساب البنكي <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <select
                          value={selectedPaymentTreasuryId}
                          onChange={(e) => setSelectedPaymentTreasuryId(e.target.value)}
                          className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none appearance-none cursor-pointer text-right pl-8"
                          style={{ direction: 'rtl' }}
                        >
                          <option value="">-- اختر الخزنة --</option>
                          {safesBanks.map(sb => (
                            <option key={sb.id} value={sb.id}>{sb.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">ملاحظات</label>
                      <textarea
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="ملاحظات إضافية عن الدفعة..."
                        className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleAddPayment}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تسجيل الدفعة</span>
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
