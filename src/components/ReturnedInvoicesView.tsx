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
  RefreshCw,
  Search
} from 'lucide-react';
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
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [safesBanks, setSafesBanks] = useState<any[]>([]);
  const [returnedInvoices, setReturnedInvoices] = useState<ReturnedInvoice[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: inv } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (inv) setInvoices(inv);
    const { data: cl } = await supabase.from('clients').select('*');
    if (cl) setClients(cl);
    const { data: pr } = await supabase.from('products').select('id, name, code, selling_price');
    if (pr) setProducts(pr);
    const { data: wh } = await supabase.from('warehouses').select('id, name');
    if (wh) setWarehouses(wh);
    const { data: sb } = await supabase.from('safes_banks').select('id, name, type');
    if (sb) setSafesBanks(sb);
    const { data: ri } = await supabase.from('returned_invoices').select('*').order('created_at', { ascending: false });
    if (ri) {
      setReturnedInvoices(ri.map((r: any) => ({
        id: r.id,
        invoiceNumber: r.invoice_id || '',
        returnNumber: r.return_number,
        clientName: r.client_name,
        date: r.date,
        total: r.total,
        status: r.status === 'refunded' ? 'refunded' : r.status === 'partially-refunded' ? 'partially-refunded' : 'draft',
        currency: 'EGP'
      })));
    }
  };

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [clientFilter, setClientFilter] = useState('any');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
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

  // Add return modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnReason, setReturnReason] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedTreasuryId, setSelectedTreasuryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقدا');
  const [refundAmount, setRefundAmount] = useState(0);
  const [doRefund, setDoRefund] = useState(false);

  // Return items
  const [returnItems, setReturnItems] = useState<any[]>([]);

  // Product search
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState<Record<string, boolean>>({});

  const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'unpaid');

  const handleClearFilters = () => {
    setClientFilter('any');
    setClientSearchQuery('');
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

  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find(i => i.id === invId);
    if (inv && inv.items) {
      const items = Array.isArray(inv.items) ? inv.items : [];
      setReturnItems(items.map((item: any, idx: number) => ({
        id: `ret-item-${idx}-${Date.now()}`,
        productId: item.productId || '',
        itemName: item.itemName || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        returnQty: item.quantity || 1
      })));
      setRefundAmount(inv.total || 0);
    } else {
      setReturnItems([]);
      setRefundAmount(0);
    }
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
    setReturnItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          productId: product.id,
          itemName: product.name,
          unitPrice: parseFloat(product.selling_price) || 0
        };
      })
    );
    setShowProductDropdown(prev => ({ ...prev, [itemId]: false }));
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

  const handleAddReturn = async () => {
    if (!selectedInvoiceId) {
      showToast?.('الرجاء اختيار الفاتورة المراد إرجاعها.', 'error');
      return;
    }
    if (!selectedWarehouseId) {
      showToast?.('الرجاء اختيار المستودع.', 'error');
      return;
    }

    const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
    if (!invoice) return;

    const returnItemsWithProduct = returnItems.filter(item => item.productId && item.returnQty > 0);
    if (returnItemsWithProduct.length === 0) {
      showToast?.('الرجاء اختيار منتجات للإرجاع.', 'error');
      return;
    }

    const totalReturnQty = returnItemsWithProduct.reduce((sum, item) => sum + item.returnQty, 0);
    if (totalReturnQty <= 0) {
      showToast?.('الرجاء إدخال كميات صحيحة للإرجاع.', 'error');
      return;
    }

    const returnNumber = getNextReturnNumber();
    const returnId = `ret-${Date.now()}`;

    const totalReturnValue = returnItemsWithProduct.reduce((sum, item) => sum + (item.unitPrice * item.returnQty), 0);

    const isFullReturn = totalReturnValue >= invoice.total;

    await supabase.from('returned_invoices').insert({
      id: returnId,
      return_number: returnNumber,
      invoice_id: selectedInvoiceId,
      client_id: invoice.client_id || null,
      client_name: invoice.clientName || invoice.client_name || '',
      date: returnDate,
      items: returnItemsWithProduct,
      total: totalReturnValue,
      status: isFullReturn ? 'refunded' : 'partially-refunded',
      notes: returnReason,
      warehouse_id: selectedWarehouseId,
      treasury_id: doRefund ? selectedTreasuryId : null
    });

    for (const item of returnItemsWithProduct) {
      await recordInventoryMovement(
        item.productId,
        selectedWarehouseId,
        'sale_return',
        'returned_invoice',
        returnId,
        returnNumber,
        item.returnQty,
        'Abdo Yaser'
      );
    }

    if (doRefund && selectedTreasuryId && totalReturnValue > 0) {
      const { data: treasury } = await supabase
        .from('safes_banks')
        .select('balance')
        .eq('id', selectedTreasuryId)
        .single();

      const currentBalance = treasury ? parseFloat(treasury.balance) : 0;
      const newBalance = currentBalance - totalReturnValue;

      await supabase
        .from('safes_banks')
        .update({ balance: newBalance })
        .eq('id', selectedTreasuryId);

      await supabase.from('treasury_transactions').insert({
        treasury_id: selectedTreasuryId,
        transaction_type: 'payment_voucher',
        reference_type: 'returned_invoice',
        reference_id: returnId,
        reference_number: returnNumber,
        description: `رد قيمة مرتجع مبيعات ${returnNumber} للفاتورة #${invoice.invoiceNumber}`,
        amount: totalReturnValue,
        balance_before: currentBalance,
        balance_after: newBalance,
        created_by: 'Abdo Yaser'
      });
    }

    setInvoices(prev => prev.map(inv =>
      inv.id === selectedInvoiceId ? { ...inv, status: 'returned', alreadyPaid: false } : inv
    ));

    const returned: ReturnedInvoice = {
      id: returnId,
      invoiceNumber: invoice.invoiceNumber,
      returnNumber,
      clientName: invoice.clientName || invoice.client_name || '',
      date: returnDate,
      total: totalReturnValue,
      status: isFullReturn ? 'refunded' : 'partially-refunded',
      currency: 'EGP'
    };
    setReturnedInvoices(prev => [returned, ...prev]);

    setShowAddModal(false);
    setSelectedInvoiceId('');
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnReason('');
    setSelectedWarehouseId('');
    setSelectedTreasuryId('');
    setReturnItems([]);
    setRefundAmount(0);
    setDoRefund(false);
    showToast?.(`تم تسجيل مرتجع بقيمة ${totalReturnValue.toLocaleString('ar-EG')} ج.م للفاتورة #${invoice.invoiceNumber} بنجاح.`);
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
                        <select value={orderSource} onChange={(e) => setOrderSource(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400 text-right pl-8" style={{ direction: 'rtl' }}>
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
          {(() => {
            const filteredReturns = returnedInvoices.filter(inv => clientFilter === 'any' || inv.clientName === clientFilter);
            return filteredReturns.length === 0 ? (
              <div className="border border-[#ffebcc] bg-[#fffbf2] text-amber-800 rounded p-4 text-center flex items-center justify-center gap-2 select-none shadow-3xs">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-xs font-bold">{returnedInvoices.length === 0 ? 'لا يوجد إيصالات ارتجاع' : 'لا توجد نتائج مطابقة للبحث'}</span>
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
                    {filteredReturns.map((inv) => (
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
          );
          })()}
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
              className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden"
            >
              <div className="bg-[#0d385a] px-5 py-3.5 text-white flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                  <span>تسجيل مرتجع مبيعات</span>
                </div>
                <button type="button" className="p-1 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer" onClick={() => { setShowAddModal(false); setReturnItems([]); }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-right max-h-[70vh] overflow-y-auto">
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
                          onChange={(e) => handleInvoiceSelect(e.target.value)}
                          className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none appearance-none cursor-pointer text-right pl-8"
                          style={{ direction: 'rtl' }}
                        >
                          <option value="">-- اختر فاتورة --</option>
                          {paidInvoices.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              #{inv.invoiceNumber} - {inv.clientName || inv.client_name} - {inv.total?.toLocaleString('ar-EG')} ج.م
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {selectedInvoiceId && (
                      <>
                        {/* Warehouse Selection */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">المستودع <span className="text-rose-500">*</span></label>
                          <select
                            value={selectedWarehouseId}
                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                            className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-700 outline-none text-right"
                          >
                            <option value="">(اختر المستودع)</option>
                            {warehouses.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Return Items */}
                        <div className="border border-slate-200 rounded overflow-hidden">
                          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-700">البنود المرتجعة</span>
                          </div>
                          <div className="p-3 space-y-3">
                            {returnItems.map((item, idx) => (
                              <div key={item.id} className="flex items-center gap-2 border-b border-dashed border-slate-100 pb-2">
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    value={item.productId ? item.itemName : productSearchQuery}
                                    onChange={(e) => {
                                      setProductSearchQuery(e.target.value);
                                      setShowProductDropdown(prev => ({ ...prev, [item.id]: true }));
                                      if (!e.target.value) {
                                        setReturnItems(prev => prev.map(i => i.id === item.id ? { ...i, productId: '', itemName: '' } : i));
                                      }
                                    }}
                                    onFocus={() => setShowProductDropdown(prev => ({ ...prev, [item.id]: true }))}
                                    onBlur={() => setTimeout(() => setShowProductDropdown(prev => ({ ...prev, [item.id]: false })), 200)}
                                    placeholder="ابحث عن منتج..."
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                                  />
                                  {showProductDropdown[item.id] && (
                                    <div className="absolute z-50 top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-36 overflow-y-auto">
                                      {getFilteredProducts(productSearchQuery).map((p: any) => (
                                        <div
                                          key={p.id}
                                          onMouseDown={() => handleSelectProduct(item.id, p)}
                                          className="px-3 py-1.5 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex justify-between"
                                        >
                                          <span className="font-bold">{p.name}</span>
                                          <span className="text-slate-400">{p.code}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="w-20">
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.quantity || 999}
                                    value={item.returnQty}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setReturnItems(prev => prev.map(i => i.id === item.id ? { ...i, returnQty: val } : i));
                                    }}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-center font-mono"
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 w-16 text-left">الكمية: {item.quantity}</span>
                              </div>
                            ))}
                          </div>
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

                        {/* Refund Section */}
                        <div className="bg-amber-50 border border-amber-100 rounded p-3 space-y-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={doRefund}
                              onChange={(e) => setDoRefund(e.target.checked)}
                              className="w-4 h-4 text-amber-600"
                            />
                            <span className="text-xs font-bold text-slate-700">رد المبلغ للعميل</span>
                          </label>

                          {doRefund && (
                            <div className="space-y-3 pr-6">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">طريقة الدفع</label>
                                <select
                                  value={paymentMethod}
                                  onChange={(e) => setPaymentMethod(e.target.value)}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold"
                                >
                                  <option value="نقدا">نقدا</option>
                                  <option value="بنك">بنك</option>
                                  <option value="شيك">شيك</option>
                                  <option value="تحويل">تحويل</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">الخزنة / الحساب البنكي</label>
                                <select
                                  value={selectedTreasuryId}
                                  onChange={(e) => setSelectedTreasuryId(e.target.value)}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold"
                                >
                                  <option value="">(اختر الخزنة)</option>
                                  {safesBanks.map(sb => (
                                    <option key={sb.id} value={sb.id}>{sb.name} ({sb.type === 'safe' ? 'خزنة' : 'بنك'})</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleAddReturn}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تسجيل المرتجع</span>
                      </button>
                      <button
                        onClick={() => { setShowAddModal(false); setReturnItems([]); }}
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
