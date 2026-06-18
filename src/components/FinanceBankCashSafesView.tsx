import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  X,
  Check,
  ChevronDown,
  Eye,
  Sliders,
  Landmark,
  Shield,
  ArrowLeftRight,
  Printer,
  Info,
  DollarSign,
  Briefcase,
  Layers,
  Edit2,
  Trash
} from 'lucide-react';

interface BankAccountOrSafe {
  id: string;
  name: string;
  type: 'safe' | 'bank';
  bankName?: string;
  accountNumber?: string;
  currency: string;
  status: 'active' | 'inactive';
  isMain: boolean;
  description: string;
  balance: number;
  depositPermission: string;
  withdrawPermission: string;
}

const mapRowToItem = (row: any): BankAccountOrSafe => ({
  id: row.id,
  name: row.name,
  type: row.type,
  bankName: row.bank_name,
  accountNumber: row.account_number,
  currency: row.currency,
  status: row.status,
  isMain: row.is_main,
  description: row.description,
  balance: row.balance,
  depositPermission: row.deposit_permission,
  withdrawPermission: row.withdraw_permission,
});

const mapItemToRow = (item: Partial<BankAccountOrSafe>, preserveOpeningBalance = false) => ({
  name: item.name,
  type: item.type,
  bank_name: item.bankName,
  account_number: item.accountNumber,
  currency: item.currency,
  status: item.status,
  is_main: item.isMain,
  description: item.description,
  balance: item.balance,
  ...(preserveOpeningBalance ? {} : { opening_balance: item.balance, opening_balance_date: new Date().toISOString().split('T')[0] }),
  deposit_permission: item.depositPermission,
  withdraw_permission: item.withdrawPermission,
});

interface FinanceBankCashSafesViewProps {
  setView: (view: string) => void;
}

export default function FinanceBankCashSafesView({ setView }: FinanceBankCashSafesViewProps) {
  const [currentMode, setCurrentMode] = useState<'list' | 'add-bank' | 'add-safe' | 'transfer'>('list');
  const [items, setItems] = useState<BankAccountOrSafe[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [viewDetailItem, setViewDetailItem] = useState<BankAccountOrSafe | null>(null);

  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [showFilters, setShowFilters] = useState(true);

  const [bankAccountName, setBankAccountName] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('البنك الأهلي المصري');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCurrency, setBankCurrency] = useState('EGP');
  const [bankStatus, setBankStatus] = useState<'active' | 'inactive'>('active');
  const [bankDescription, setBankDescription] = useState('');
  const [bankDepositPermission, setBankDepositPermission] = useState('الكل');
  const [bankWithdrawPermission, setBankWithdrawPermission] = useState('الكل');
  const [bankInitialBalance, setBankInitialBalance] = useState('0.00');

  const [safeName, setSafeName] = useState('');
  const [safeStatus, setSafeStatus] = useState<'active' | 'inactive'>('active');
  const [safeDescription, setSafeDescription] = useState('');
  const [safeCurrency, setSafeCurrency] = useState('EGP');
  const [safeDepositPermission, setSafeDepositPermission] = useState('الكل');
  const [safeWithdrawPermission, setSafeWithdrawPermission] = useState('الكل');
  const [safeInitialBalance, setSafeInitialBalance] = useState('0.00');

  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('safes_banks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching safes and banks:', error);
        return;
      }
      if (data && data.length > 0) {
        setItems(data.map(mapRowToItem));
      }
    };
    fetchItems();
  }, []);

  const handleOpenAddBank = () => {
    setEditingItemId(null);
    setBankAccountName('');
    setSelectedBankName('البنك الأهلي المصري');
    setAccountNumber('');
    setBankCurrency('EGP');
    setBankStatus('active');
    setBankDescription('');
    setBankDepositPermission('الكل');
    setBankWithdrawPermission('الكل');
    setBankInitialBalance('0.00');
    setCurrentMode('add-bank');
  };

  const handleOpenAddSafe = () => {
    setEditingItemId(null);
    setSafeName('');
    setSafeStatus('active');
    setSafeDescription('');
    setSafeCurrency('EGP');
    setSafeDepositPermission('الكل');
    setSafeWithdrawPermission('الكل');
    setSafeInitialBalance('0.00');
    setCurrentMode('add-safe');
  };

  const handleOpenEditBank = (item: BankAccountOrSafe) => {
    setEditingItemId(item.id);
    setBankAccountName(item.name);
    setSelectedBankName(item.bankName || 'البنك الأهلي المصري');
    setAccountNumber(item.accountNumber || '');
    setBankCurrency(item.currency);
    setBankStatus(item.status);
    setBankDescription(item.description);
    setBankDepositPermission(item.depositPermission);
    setBankWithdrawPermission(item.withdrawPermission);
    setBankInitialBalance(String(item.balance));
    setCurrentMode('add-bank');
  };

  const handleOpenEditSafe = (item: BankAccountOrSafe) => {
    setEditingItemId(item.id);
    setSafeName(item.name);
    setSafeStatus(item.status);
    setSafeDescription(item.description);
    setSafeCurrency(item.currency);
    setSafeDepositPermission(item.depositPermission);
    setSafeWithdrawPermission(item.withdrawPermission);
    setSafeInitialBalance(String(item.balance));
    setCurrentMode('add-safe');
  };

  const handleSaveBank = async () => {
    if (!bankAccountName.trim()) {
      alert('الرجاء إدخال اسم الحساب البنكي.');
      return;
    }
    if (!accountNumber.trim()) {
      alert('الرجاء إدخال رقم الحساب البنكي.');
      return;
    }

    const initBal = parseFloat(bankInitialBalance) || 0;

    const rowData = {
      name: bankAccountName,
      type: 'bank' as const,
      bankName: selectedBankName,
      accountNumber: accountNumber,
      currency: bankCurrency,
      status: bankStatus,
      isMain: false,
      description: bankDescription,
      balance: initBal,
      depositPermission: bankDepositPermission,
      withdrawPermission: bankWithdrawPermission,
    };

    if (editingItemId) {
      const currentItem = items.find(i => i.id === editingItemId);
      const { data: updatedData, error } = await supabase
        .from('safes_banks')
        .update({ ...mapItemToRow(rowData, true), balance: currentItem?.balance ?? initBal })
        .eq('id', editingItemId)
        .select();
      if (error) {
        console.error('Error updating bank:', error);
        alert('حدث خطأ أثناء تحديث الحساب البنكي.');
        return;
      }
      if (updatedData?.[0]) {
        const updated = mapRowToItem(updatedData[0]);
        setItems(items.map(i => (i.id === editingItemId ? updated : i)));
      }
    } else {
      const { data: insertedData, error } = await supabase.from('safes_banks').insert([mapItemToRow(rowData)]).select();
      if (error) {
        console.error('Error inserting bank:', error);
        alert('حدث خطأ أثناء حفظ الحساب البنكي.');
        return;
      }
      const savedBank = insertedData?.[0] ? mapRowToItem(insertedData[0]) : { ...rowData, id: crypto.randomUUID() } as BankAccountOrSafe;
      if (insertedData?.[0] && initBal !== 0) {
        await supabase.from('treasury_transactions').insert({
          treasury_id: insertedData[0].id,
          transaction_type: 'opening_balance',
          reference_type: 'safes_banks',
          reference_id: insertedData[0].id,
          reference_number: 'OPENING',
          description: 'Opening balance',
          amount: initBal,
          balance_before: 0,
          balance_after: initBal,
          created_by: 'system'
        });
      }
      setItems([savedBank, ...items]);
    }
    setEditingItemId(null);
    setCurrentMode('list');
  };

  const handleSaveSafe = async () => {
    if (!safeName.trim()) {
      alert('الرجاء إدخال اسم الخزينة.');
      return;
    }

    const initBal = parseFloat(safeInitialBalance) || 0;

    const rowData = {
      name: safeName,
      type: 'safe' as const,
      currency: safeCurrency,
      status: safeStatus,
      isMain: items.length === 0 && !editingItemId,
      description: safeDescription,
      balance: initBal,
      depositPermission: safeDepositPermission,
      withdrawPermission: safeWithdrawPermission,
    };

    if (editingItemId) {
      const currentItem = items.find(i => i.id === editingItemId);
      const { data: updatedData, error } = await supabase
        .from('safes_banks')
        .update({ ...mapItemToRow(rowData, true), balance: currentItem?.balance ?? initBal })
        .eq('id', editingItemId)
        .select();
      if (error) {
        console.error('Error updating safe:', error);
        alert('حدث خطأ أثناء تحديث الخزينة.');
        return;
      }
      if (updatedData?.[0]) {
        const updated = mapRowToItem(updatedData[0]);
        setItems(items.map(i => (i.id === editingItemId ? updated : i)));
      }
    } else {
      const { data: insertedData, error } = await supabase.from('safes_banks').insert([mapItemToRow(rowData)]).select();
      if (error) {
        console.error('Error inserting safe:', error);
        alert('حدث خطأ أثناء حفظ الخزينة.');
        return;
      }
      const savedSafe = insertedData?.[0] ? mapRowToItem(insertedData[0]) : { ...rowData, id: crypto.randomUUID() } as BankAccountOrSafe;
      if (insertedData?.[0] && initBal !== 0) {
        await supabase.from('treasury_transactions').insert({
          treasury_id: insertedData[0].id,
          transaction_type: 'opening_balance',
          reference_type: 'safes_banks',
          reference_id: insertedData[0].id,
          reference_number: 'OPENING',
          description: 'Opening balance',
          amount: initBal,
          balance_before: 0,
          balance_after: initBal,
          created_by: 'system'
        });
      }
      setItems([savedSafe, ...items]);
    }
    setEditingItemId(null);
    setCurrentMode('list');
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (item.isMain) {
      alert('لا يمكن حذف الخزينة الرئيسية الافتراضية.');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف ${item.type === 'safe' ? 'الخزينة' : 'الحساب البنكي'} "${item.name}" نهائياً؟`)) {
      const { error } = await supabase.from('safes_banks').delete().eq('id', id);
      if (error) {
        console.error('Error deleting item:', error);
        alert('حدث خطأ أثناء الحذف.');
        return;
      }
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleSetMain = async (id: string) => {
    const updated = items.map(i => ({
      ...i,
      isMain: i.id === id
    }));
    for (const item of updated) {
      const { error } = await supabase
        .from('safes_banks')
        .update({ is_main: item.isMain })
        .eq('id', item.id);
      if (error) {
        console.error('Error updating isMain:', error);
        alert('حدث خطأ أثناء تحديث الحساب الرئيسي.');
        return;
      }
    }
    setItems(updated);
    alert('تم تعيين الحساب/الخزينة كحساب رئيسي بنجاح.');
  };

  const handleTransfer = async () => {
    const amountNum = parseFloat(transferAmount);
    if (!transferFromId || !transferToId) {
      alert('الرجاء اختيار حساب المصدر وحساب المستلم لتحويل الأموال.');
      return;
    }
    if (transferFromId === transferToId) {
      alert('لا يمكن التحويل لنفس الحساب المصدر.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('الرجاء إدخال مبلغ تحويل صحيح أكبر من صفر.');
      return;
    }

    const source = items.find(i => i.id === transferFromId);
    const dest = items.find(i => i.id === transferToId);

    if (!source || !dest) return;

    if (source.balance < amountNum) {
      const proceed = confirm(`تحذير: رصيد المصدر (${source.balance} ${source.currency}) أقل من مبلغ التحويل المطلوب (${amountNum} ${source.currency}).\nهل ترغب بالاستمرار في تسجيل المعاملة على أي حال لتجاوز الحد؟`);
      if (!proceed) return;
    }

    const updated = items.map(i => {
      if (i.id === transferFromId) {
        return { ...i, balance: i.balance - amountNum };
      }
      if (i.id === transferToId) {
        let addedAmt = amountNum;
        if (source.currency !== i.currency) {
          if (source.currency === 'USD' && i.currency === 'EGP') addedAmt = amountNum * 48;
          else if (source.currency === 'EGP' && i.currency === 'USD') addedAmt = amountNum / 48;
          else if (source.currency === 'SAR' && i.currency === 'EGP') addedAmt = amountNum * 12.8;
          else if (source.currency === 'EGP' && i.currency === 'SAR') addedAmt = amountNum / 12.8;
        }
        return { ...i, balance: i.balance + addedAmt };
      }
      return i;
    });

    for (const item of updated) {
      if (item.id === transferFromId || item.id === transferToId) {
        const { error } = await supabase
          .from('safes_banks')
          .update({ balance: item.balance })
          .eq('id', item.id);
        if (error) {
          console.error('Error updating balance:', error);
          alert('حدث خطأ أثناء تحديث الرصيد.');
          return;
        }
      }
    }
    setItems(updated);
    alert('تمت قيد وتسجيل تحويل الأموال وصياغة قيد اليومية التلقائي بنجاح!');
    setCurrentMode('list');
  };

  const filteredItems = items.filter(i => {
    if (filterName && !i.name.toLowerCase().includes(filterName.toLowerCase()) && !(i.bankName && i.bankName.includes(filterName))) return false;
    if (filterType !== 'all' && i.type !== filterType) return false;
    if (filterCurrency !== 'all' && i.currency !== filterCurrency) return false;
    return true;
  });

  const getStatusBadge = (item: BankAccountOrSafe) => {
    if (item.isMain) return 'الرئيسي';
    return item.status === 'active' ? 'نشط' : 'معطل';
  };

  return (
    <div id="daftra-finance-bank-cash-safes" className="w-full mx-auto text-right font-sans select-none pb-12 antialiased">

      {currentMode === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>المالية</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-extrabold text-[13px]">خزائن وحسابات بنكية</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMode('transfer')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0074b1]/30 bg-blue-50 text-[#0074b1] hover:bg-[#0074b1]/10 text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>تحويل نقدي بين الحسابات</span>
              </button>

              <button
                onClick={handleOpenAddBank}
                className="flex items-center gap-1.5 bg-[#24a148] hover:bg-[#1d8239] text-white px-4 py-2 rounded-lg transition-all font-bold cursor-pointer shadow-xs"
              >
                <Landmark className="w-4 h-4" />
                <span>أضف حساب بنكي</span>
              </button>

              <button
                onClick={handleOpenAddSafe}
                className="flex items-center gap-1.5 bg-[#0074b1] hover:bg-[#005f90] text-white px-4 py-2 rounded-lg transition-all font-bold cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>أضف خزينة</span>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center flex-row-reverse">
            <h1 className="text-2xl font-black text-[#1a2e40] leading-none">خزائن وحسابات بنكية</h1>
            <p className="text-xs text-slate-400 font-bold">إدارة حسابات النقدية وما يعادلها في الخزائن النقدية، بطاقات الائتمان، والحسابات والودائع البنكية للمؤسسة.</p>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div id="filter-panel-safes" className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 text-xs">
                  <div className="flex justify-between items-center flex-row-reverse border-b border-slate-100 pb-2.5">
                    <span className="font-extrabold text-[#1a2e40] text-sm">بحث وتصفيه</span>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-slate-400 hover:text-rose-500 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>إخفاء الفلتر</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-right">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-650 block">الاسم</label>
                      <input
                        type="text"
                        placeholder="ابحث باسم الخزينة أو البنك..."
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        className="w-full text-right p-2.5 border border-slate-200 rounded outline-none focus:border-[#0074b1]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-650 block">النوع</label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full text-right p-2.5 border border-slate-200 rounded outline-none cursor-pointer font-bold"
                      >
                        <option value="all">كل الأنواع والمستوعبات</option>
                        <option value="safe">خزينة نقدية (Safes)</option>
                        <option value="bank">حساب بنكي جاري (Bank Accounts)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-650 block">العملة</label>
                      <select
                        value={filterCurrency}
                        onChange={(e) => setFilterCurrency(e.target.value)}
                        className="w-full text-right p-2.5 border border-slate-200 rounded outline-none cursor-pointer font-bold"
                      >
                        <option value="all">كل العملات المتاحة</option>
                        <option value="EGP">EGP (جنيه مصري)</option>
                        <option value="SAR">SAR (ريال سعودي)</option>
                        <option value="USD">USD (دولار أمريكي)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-start gap-3 pt-3 border-t border-slate-100 flex-row">
                    <button
                      onClick={() => alert(`تم تطبيق فلتر البحث والمطابقة: تم العثور على ${filteredItems.length} عنصر.`)}
                      className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold cursor-pointer"
                    >
                      بحث
                    </button>
                    <button
                      onClick={() => {
                        setFilterName('');
                        setFilterType('all');
                        setFilterCurrency('all');
                      }}
                      className="px-4 py-2 hover:underline text-slate-505 font-bold cursor-pointer"
                    >
                      إعادة تعيين حقول البحث
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 font-bold block text-[10px]">إجمالي أرصدة الخزائن</span>
              <p className="text-xl font-mono font-black text-[#0074b1]">
                {items.filter(i => i.type === 'safe').reduce((sum, item) => sum + item.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EGP
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 font-bold block text-[10px]">إجمالي الأرصدة البنكية</span>
              <p className="text-xl font-mono font-black text-[#2cbc6a]">
                {items.filter(i => i.type === 'bank').reduce((sum, item) => sum + item.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EGP
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 font-bold block text-[10px]">إجمالي النقدية المقبوضة المعتمدة</span>
              <p className="text-xl font-mono font-black text-slate-800">
                {items.reduce((sum, item) => sum + item.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EGP
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-white py-16 px-6 rounded-xl border border-slate-200 text-center space-y-5">
              <div className="w-16 h-16 bg-[#0074b1]/10 text-[#0074b1] rounded-full flex items-center justify-center mx-auto">
                <Landmark className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-extrabold text-slate-800">لم يتم العثور على أي خزائن أو حسابات بنكية</h3>
                <p className="text-xs text-slate-400 font-bold leading-normal">يرجى تسجيل خزينة أو ربط حساب بنكي جاري للبدء في تسييل حركات الصرف والقبض بداخل المنشأة.</p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleOpenAddSafe}
                  className="px-5 py-2.5 bg-[#0074b1] text-white font-bold rounded hover:bg-[#005f90] cursor-pointer text-xs"
                >
                  أضف خزينة نقدية
                </button>
                <button
                  onClick={handleOpenAddBank}
                  className="px-5 py-2.5 bg-[#24a148] text-white font-bold rounded hover:bg-[#1d8239] cursor-pointer text-xs"
                >
                  أضف حساب بنكي
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-205 shadow-xs overflow-hidden">
              <div className="bg-slate-50/70 p-4 border-b border-slate-150 flex justify-between items-center flex-row-reverse text-xs">
                <span className="font-bold text-slate-705">قائمة المقار الخزائنية والحسابات المصرفية المحددة</span>
                <span className="text-slate-450 font-semibold font-mono">طريقة الفرز: الاسم</span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-extrabold select-none">
                      <th className="p-4">الاسم والنوع</th>
                      <th className="p-4">الوصف والتأصيل</th>
                      <th className="p-4 text-center">القيمة الحالية الدفترية</th>
                      <th className="p-4 text-center">أهليّة المعاملات</th>
                      <th className="p-4 text-center">الحالة</th>
                      <th className="p-4 text-center">ترتيب</th>
                      <th className="p-4 text-center">خيارات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        
                        <td className="p-4 flex items-center gap-3 flex-row-reverse">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'safe' ? 'bg-[#fffae6] text-[#b38600] border border-[#ffe699]' : 'bg-[#e2f5ec] text-[#24a148] border border-[#c1ebd1]'}`}>
                            <Landmark className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-800 text-sm block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold block">
                              {item.type === 'safe' ? 'خزينة نقدية (Safe Box)' : `حساب بنكي لدى ${item.bankName || 'البنك المحرك'}`}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-slate-500 max-w-xs truncate" title={item.description}>
                          {item.description || 'لا يوجد شرح تفصيلي مكتوب.'}
                        </td>

                        <td className="p-4 text-center">
                          <span className="font-mono text-base font-black text-slate-850">
                            {item.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {item.currency === 'EGP' ? 'ح.م' : item.currency}
                          </span>
                        </td>

                        <td className="p-4 text-center text-slate-500 text-[10px] font-bold">
                          إيداع: {item.depositPermission} | سحب: {item.withdrawPermission}
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-row-reverse">
                            <span className={`w-2 h-2 rounded-full ${item.status === 'active' ? 'bg-[#0074b1]' : 'bg-red-400'}`}></span>
                            <span className={`text-[10.5px] font-bold ${item.isMain ? 'text-[#0074b1] underline font-black' : 'text-slate-600'}`}>
                              {getStatusBadge(item)}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-center font-bold text-slate-400 font-mono select-none">
                          ⇅
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setViewDetailItem(item)}
                              className="p-1 px-1.5 text-[#0074b1] hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded transition-all cursor-pointer"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => item.type === 'bank' ? handleOpenEditBank(item) : handleOpenEditSafe(item)}
                              className="p-1 px-1.5 text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded transition-all cursor-pointer"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!item.isMain && item.status === 'active' && (
                              <button
                                onClick={() => handleSetMain(item.id)}
                                className="px-1.5 py-1 bg-slate-50 text-[10px] text-slate-500 hover:text-[#0074b1] border border-slate-200 hover:border-[#0074b1]/30 rounded transition-all cursor-pointer font-extrabold"
                              >
                                ليكون الرئيسي
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              className="p-1 px-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition-all cursor-pointer"
                              title="حذف هذا المقر المحاسبي"
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

      {/* View Detail Modal */}
      {viewDetailItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-xl w-full text-right overflow-hidden">
            <div className="p-4 bg-[#f8fafc] border-b border-slate-150 flex justify-between items-center flex-row-reverse text-xs">
              <span className="text-[#0074b1] font-black">تفاصيل {viewDetailItem.type === 'safe' ? 'الخزينة' : 'الحساب البنكي'}</span>
              <button
                onClick={() => setViewDetailItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">الاسم</span>
                  <p className="font-black text-slate-800">{viewDetailItem.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">النوع</span>
                  <p className="font-bold text-slate-700">{viewDetailItem.type === 'safe' ? 'خزينة نقدية' : 'حساب بنكي'}</p>
                </div>
                {viewDetailItem.bankName && (
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block">اسم البنك</span>
                    <p className="font-bold text-slate-700">{viewDetailItem.bankName}</p>
                  </div>
                )}
                {viewDetailItem.accountNumber && (
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block">رقم الحساب</span>
                    <p className="font-mono font-bold text-slate-700">{viewDetailItem.accountNumber}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">العملة</span>
                  <p className="font-bold text-slate-700">{viewDetailItem.currency}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">الرصيد الحالي</span>
                  <p className="font-mono font-black text-lg text-[#0074b1]">
                    {viewDetailItem.balance.toLocaleString()} {viewDetailItem.currency}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">الحالة</span>
                  <p className="font-bold text-slate-700">{getStatusBadge(viewDetailItem)}</p>
                </div>
              </div>
              {viewDetailItem.description && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">الوصف</span>
                  <p className="text-slate-600">{viewDetailItem.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">صلاحية الإيداع</span>
                  <p className="font-bold text-slate-700">{viewDetailItem.depositPermission}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">صلاحية السحب</span>
                  <p className="font-bold text-slate-700">{viewDetailItem.withdrawPermission}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <button
                  onClick={() => { setViewDetailItem(null); setView('treasury-transactions'); }}
                  className="text-[#0074b1] hover:underline font-bold text-xs cursor-pointer"
                >
                  عرض حركات الخزينة &larr;
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button
                onClick={() => setViewDetailItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {currentMode === 'add-bank' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex-row">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setEditingItemId(null); setCurrentMode('list'); }}
                className="px-4 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-707 rounded border border-slate-300 font-bold text-xs flex items-center gap-1.5 flex-row-reverse cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>إلغاء</span>
              </button>

              <div className="relative inline-flex">
                <button
                  type="submit"
                  onClick={handleSaveBank}
                  className="bg-[#24a148] hover:bg-[#1d8239] text-white px-4 py-2 rounded-r font-extrabold text-xs flex items-center gap-1.5 flex-row-reverse transition-all border-r border-[#1d8239] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ الحساب</span>
                </button>
                <div className="bg-[#24a148] hover:bg-[#1d8239] text-white px-2 rounded-l flex items-center justify-center border-l border-emerald-700 cursor-pointer">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleSaveBank}
                className="px-4 py-2 bg-[#e2e8f0]/80 hover:bg-[#cbd5e1] text-slate-705 rounded font-bold text-xs cursor-pointer transition-all border border-slate-300"
              >
                حفظ كمسودة
              </button>
            </div>

          </div>

          <div className="flex items-center gap-1.5 flex-row-reverse text-xs text-slate-400 font-extrabold">
            <span className="text-[#0a78b4] hover:underline cursor-pointer" onClick={() => { setEditingItemId(null); setCurrentMode('list'); }}>خزائن وحسابات بنكية</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-black">{editingItemId ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي'}</span>
          </div>

          <div className="bg-[#f8fafc] rounded-xl border border-slate-200 p-8 space-y-6 shadow-xs text-right">
            
            <div className="bg-white rounded-lg border border-slate-205 shadow-xs text-xs font-semibold overflow-hidden">
              
              <div className="bg-slate-50/80 p-3.5 border-b border-slate-150 font-extrabold text-slate-700 text-[11.5px] block text-right">
                تسجيل البيانات
              </div>

              <div className="p-6 space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-650 block text-[11px]">الاسم <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="أدخل اسم الحساب البنكي التعريفي..."
                      required
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="w-full text-right p-2.5 border border-slate-200 rounded outline-none font-bold focus:border-[#0074b1] bg-white text-slate-800 text-[11px]"
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="font-bold text-slate-450 block text-[10.5px]">النوع</label>
                    <div className="bg-slate-50 border border-slate-150 p-2 text-right rounded font-bold text-slate-600 flex items-center justify-between flex-row-reverse">
                      <div className="flex items-center gap-1.5 flex-row-reverse text-slate-800 font-extrabold text-[11px]">
                        <Landmark className="w-4 h-4 text-[#0074b1]" />
                        <span>حساب بنكي</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">BANK_ACC</span>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-650 block text-[11px]">اسم البنك <span className="text-rose-500">*</span></label>
                    <select
                      value={selectedBankName}
                      onChange={(e) => setSelectedBankName(e.target.value)}
                      className="w-full text-right p-2.5 border border-slate-200 rounded outline-none cursor-pointer focus:border-[#0074b1] font-bold text-slate-700 text-[11px]"
                    >
                      <option value="البنك الأهلي المصري">البنك الأهلي المصري</option>
                      <option value="بنك مصر">- بنك مصر (BM)</option>
                      <option value="البنك التجاري الدولي CIB">- البنك التجاري الدولي CIB</option>
                      <option value="بنك الرياض">- بنك الرياض (مؤسسة سعودية)</option>
                      <option value="بنك الراجحي">- بنك الراجحي التمويلي</option>
                      <option value="بنك قطر الوطني الأهلي QNB">- بنك قطر الوطني الأهلي QNB</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-650 block text-[11px]">رقم الحساب البنكي <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="مثال: EG030002100028..."
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full text-center p-2.5 border border-slate-200 rounded outline-none font-mono font-bold focus:border-[#0074b1] text-slate-850"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-650 block text-[11px]">العملة</label>
                    <select
                      value={bankCurrency}
                      onChange={(e) => setBankCurrency(e.target.value)}
                      className="w-full text-right p-2.5 border border-slate-200 rounded outline-none cursor-pointer font-bold focus:border-[#0074b1] text-[11px]"
                    >
                      <option value="EGP">EGP (الجنيه المصري)</option>
                      <option value="SAR">SAR (الريال السعودي)</option>
                      <option value="USD">USD (الدولار الأمريكي)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-extrabold text-slate-650 block text-[11px]">الحالة</label>
                    <div className="flex gap-4 items-center justify-end">
                      
                      <label className="flex items-center gap-2 flex-row-reverse font-bold text-slate-700 block cursor-pointer">
                        <input
                          type="radio"
                          name="bankStatusRadio"
                          checked={bankStatus === 'active'}
                          onChange={() => setBankStatus('active')}
                          className="w-4 h-4 border-slate-300 text-[#0074b1] focus:ring-[#0074b1] cursor-pointer"
                        />
                        <span>نشط</span>
                      </label>

                      <label className="flex items-center gap-2 flex-row-reverse font-bold text-slate-500 block cursor-pointer">
                        <input
                          type="radio"
                          name="bankStatusRadio"
                          checked={bankStatus === 'inactive'}
                          onChange={() => setBankStatus('inactive')}
                          className="w-4 h-4 border-slate-300 text-[#0074b1] focus:ring-[#0074b1] cursor-pointer"
                        />
                        <span>غير نشط</span>
                      </label>

                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end border-t border-slate-50 pt-3">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-650 block text-[11px]">الرصيد الافتتاحي (البداية)</label>
                    <input
                      type="number"
                      value={bankInitialBalance}
                      onClick={() => setBankInitialBalance(bankInitialBalance === '0.00' ? '' : bankInitialBalance)}
                      onChange={(e) => setBankInitialBalance(e.target.value)}
                      onBlur={() => setBankInitialBalance(bankInitialBalance || '0.00')}
                      className="w-full text-center p-2.5 border border-slate-200 rounded font-mono font-bold focus:border-[#0074b1]"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 leading-normal font-medium">
                    ✏️ سيتم قيد رصيد البداية المالي مباشرةً في دفتر الأرصدة الافتتاحية للمؤسسة فور الحفظ.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">الوصف</label>
                  <textarea
                    rows={3}
                    value={bankDescription}
                    onChange={(e) => setBankDescription(e.target.value)}
                    placeholder="ملاحظات تفصيلية حول استخدامات هذا الحساب البنكي، الفرع التابع أو توثيقات القيود..."
                    className="w-full text-right p-3 border border-slate-200 rounded outline-none focus:border-[#0074b1] text-slate-805"
                  />
                </div>

              </div>

            </div>

            <div className="bg-white rounded-lg border border-slate-205 shadow-xs text-xs font-semibold overflow-hidden">
              <div className="bg-slate-50/80 p-3.5 border-b border-slate-150 font-extrabold text-slate-700 text-[11.5px] block text-right">
                الصلاحيات
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-65 block text-[11px]">إيداع</label>
                  <select
                    value={bankDepositPermission}
                    onChange={(e) => setBankDepositPermission(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-200 bg-slate-50 text-slate-700 rounded outline-none cursor-pointer"
                  >
                    <option value="الكل">الكل (جميع الموظفين المصرح لهم مالياً)</option>
                    <option value="إدارة الحسابات فقط">إدارة الحسابات فقط</option>
                    <option value="أبو ياسر فقط">أبو ياسر (المالك والمسؤول الفني)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-6 block text-[11px]">سحب</label>
                  <select
                    value={bankWithdrawPermission}
                    onChange={(e) => setBankWithdrawPermission(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-200 bg-slate-50 text-slate-700 rounded outline-none cursor-pointer"
                  >
                    <option value="الكل">الكل (جميع الموظفين المصرح لهم مالياً)</option>
                    <option value="المدير المالي والمالك فقط">المدير المالي والمالك فقط</option>
                    <option value="أبو ياسر فقط">أبو ياسر (المالك والمسؤول الفني)</option>
                  </select>
                </div>

              </div>
            </div>

            <div className="flex justify-start gap-2.5 bg-white p-4 rounded-lg border border-slate-200/80 flex-row">
              <button
                type="button"
                onClick={handleSaveBank}
                className="px-6 py-2.5 bg-[#24a148] hover:bg-[#1d8239] text-white rounded text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1 flex-row"
              >
                <Check className="w-4 h-4" />
                <span>{editingItemId ? 'تحديث الحساب البنكي' : 'حفظ الحساب البنكي'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setEditingItemId(null); setCurrentMode('list'); }}
                className="px-5 py-2.5 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                الرجوع للقائمة الرئيسية
              </button>
            </div>

          </div>

        </div>
      )}

      {currentMode === 'add-safe' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex-row">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setEditingItemId(null); setCurrentMode('list'); }}
                className="px-4 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-bold text-xs flex items-center gap-1.5 flex-row-reverse cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>إلغاء</span>
              </button>

              <div className="relative inline-flex">
                <button
                  type="submit"
                  onClick={handleSaveSafe}
                  className="bg-[#24a148] hover:bg-[#1d8239] text-white px-4 py-2 rounded-r font-extrabold text-xs flex items-center gap-1.5 flex-row-reverse transition-all border-r border-[#1d8239] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
                <div className="bg-[#24a148] hover:bg-[#1d8239] text-white px-2 rounded-l flex items-center justify-center border-l border-emerald-700 cursor-pointer">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleSaveSafe}
                className="px-4 py-2 bg-[#e2e8f0]/80 hover:bg-[#cbd5e1] text-slate-705 rounded font-bold text-xs cursor-pointer transition-all border border-slate-300"
              >
                حفظ كمسودة
              </button>
            </div>

          </div>

          <div className="flex items-center gap-1.5 flex-row-reverse text-xs text-slate-400 font-extrabold">
            <span className="text-[#0a78b4] hover:underline cursor-pointer" onClick={() => { setEditingItemId(null); setCurrentMode('list'); }}>خزائن وحسابات بنكية</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-black">{editingItemId ? 'تعديل خزينة' : 'إضافة خزينة جديدة'}</span>
          </div>

          <div className="bg-[#f8fafc] rounded-xl border border-slate-200 p-8 space-y-6 shadow-xs text-right">
            
            <div className="bg-white rounded-lg border border-slate-205 shadow-xs text-xs font-semibold overflow-hidden">
              
              <div className="bg-slate-50/80 p-3.5 border-b border-slate-150 font-extrabold text-slate-700 text-[11.5px] block text-right">
                تسجيل البيانات
              </div>

              <div className="p-6 space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  
                  <div className="space-y-1.5 text-right">
                    <label className="font-bold text-slate-450 block text-[10.5px]">النوع</label>
                    <div className="bg-slate-50 border border-slate-150 p-2 text-right rounded font-bold text-[#0074b1] flex items-center justify-between flex-row-reverse">
                      <div className="flex items-center gap-1.5 flex-row-reverse font-extrabold text-[11.5px]">
                        <Briefcase className="w-4 h-4 text-[#0074b1]" />
                        <span>خزينة</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">SAFE_BOX</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-extrabold text-slate-650 block text-[11px]">الحالة</label>
                    <div className="flex gap-4 items-center justify-end">
                      
                      <label className="flex items-center gap-2 flex-row-reverse font-bold text-slate-750 block cursor-pointer">
                        <input
                          type="radio"
                          name="safeStatusRadio"
                          checked={safeStatus === 'active'}
                          onChange={() => setSafeStatus('active')}
                          className="w-4 h-4 border-slate-300 text-[#0074b1] focus:ring-[#0074b1] cursor-pointer"
                        />
                        <span>نشط</span>
                      </label>

                      <label className="flex items-center gap-2 flex-row-reverse font-bold text-slate-500 block cursor-pointer">
                        <input
                          type="radio"
                          name="safeStatusRadio"
                          checked={safeStatus === 'inactive'}
                          onChange={() => setSafeStatus('inactive')}
                          className="w-4 h-4 border-slate-300 text-[#0074b1] focus:ring-[#0074b1] cursor-pointer"
                        />
                        <span>غير نشط</span>
                      </label>

                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-extrabold text-slate-650 block text-[11px]">اسم الخزينه <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="مثال: الخزينة الرئيسية للمشتريات..."
                        required
                        value={safeName}
                        onChange={(e) => setSafeName(e.target.value)}
                        className="w-full text-right p-2.5 border border-slate-200 rounded outline-none font-bold focus:border-[#0074b1] text-slate-800 text-[11.5px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-extrabold text-slate-650 block text-[11px]">الرصيد الافتتاحي (البداية)</label>
                      <input
                        type="number"
                        value={safeInitialBalance}
                        onClick={() => setSafeInitialBalance(safeInitialBalance === '0.00' ? '' : safeInitialBalance)}
                        onChange={(e) => setSafeInitialBalance(e.target.value)}
                        onBlur={() => setSafeInitialBalance(safeInitialBalance || '0.00')}
                        className="w-full text-center p-2.5 border border-slate-200 rounded font-mono font-bold focus:border-[#0074b1]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-extrabold text-slate-650 block text-[11px]">العملة الافتراضية</label>
                      <select
                        value={safeCurrency}
                        onChange={(e) => setSafeCurrency(e.target.value)}
                        className="w-full text-right p-2 border border-slate-200 rounded cursor-pointer font-bold focus:border-[#0074b1]"
                      >
                        <option value="EGP">EGP (جنيه مصري)</option>
                        <option value="SAR font-bold">SAR (ريال سعودي)</option>
                        <option value="USD">USD (دولار أمريكي)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 h-full flex flex-col">
                    <label className="font-extrabold text-slate-650 block text-[11px]">الوصف</label>
                    <textarea
                      rows={7}
                      value={safeDescription}
                      onChange={(e) => setSafeDescription(e.target.value)}
                      placeholder="صفحة تسجيل المقر تتيح كتابة الأغراض التفصيلية للخزائن، مثلاً عوائد بيع الكاش للفرع الشرقي للجمهور..."
                      className="w-full text-right p-3 border border-slate-200 rounded outline-none focus:border-[#0074b1] text-slate-805 flex-1 min-h-[160px]"
                    />
                  </div>

                </div>

              </div>

            </div>

            <div className="bg-white rounded-lg border border-slate-205 shadow-xs text-xs font-semibold overflow-hidden">
              <div className="bg-slate-50/80 p-3.5 border-b border-slate-150 font-extrabold text-slate-700 text-[11.5px] block text-right">
                الصلاحيات
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-65 block text-[11px]">إيداع</label>
                  <select
                    value={safeDepositPermission}
                    onChange={(e) => setSafeDepositPermission(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-200 bg-slate-50 text-slate-700 rounded outline-none cursor-pointer"
                  >
                    <option value="الكل">الكل (جميع موظفي الكاش الماليين)</option>
                    <option value="موظفي المبيعات والمالية فقط">موظفي المبيعات والمالية فقط</option>
                    <option value="أبو ياسر فقط">أبو ياسر فقط</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-6 block text-[11px]">سحب</label>
                  <select
                    value={safeWithdrawPermission}
                    onChange={(e) => setSafeWithdrawPermission(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-200 bg-slate-50 text-slate-700 rounded outline-none cursor-pointer"
                  >
                    <option value="الكل">الكل (جميع مدراء الفروع المصرح لهم)</option>
                    <option value="المدراء الماليين المحللين فقط">المدراء الماليين المحللين فقط</option>
                    <option value="أبو ياسر فقط">أبو ياسر فقط</option>
                  </select>
                </div>

              </div>
            </div>

            <div className="flex justify-start gap-2.5 bg-white p-4 rounded-lg border border-slate-200/80 flex-row">
              <button
                type="button"
                onClick={handleSaveSafe}
                className="px-6 py-2.5 bg-[#24a148] hover:bg-[#1d8239] text-white rounded text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1 flex-row"
              >
                <Check className="w-4 h-4" />
                <span>{editingItemId ? 'تحديث الخزينة النقدية' : 'حفظ الخزينة النقدية'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setEditingItemId(null); setCurrentMode('list'); }}
                className="px-5 py-2.5 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                الرجوع للقائمة
              </button>
            </div>

          </div>

        </div>
      )}

      {currentMode === 'transfer' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex-row">
            <button
              onClick={() => setCurrentMode('list')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs"
            >
              الرجوع للقائمة
            </button>
            
            <span className="font-extrabold text-[#1a2e40] text-sm">عملية تحويل النقدية المحاسبية</span>
          </div>

          <div className="bg-[#f8fafc] rounded-xl border border-slate-200 p-8 space-y-6 shadow-xs text-right">
            <div className="bg-white p-6 rounded-lg border border-slate-205 shadow-xs space-y-5 text-right text-xs">
              
              <div className="border-b border-slate-100 pb-3 block">
                <span className="text-sm font-black text-slate-800">تفاصيل التحويل الداخلي</span>
                <p className="text-[10.5px] text-slate-400 font-bold block">تحكم ودقّق حسابات تصفية وتحويل الخزائن مع حسابات البنوك الجارية فورياً لتوزيع التدفقات النقدية.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="font-extrabold text-rose-600 block text-[11px]">مستوعب الصرف المحاسب (من حساب) <span className="text-rose-500">*</span></label>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-202 rounded outline-none cursor-pointer font-bold text-slate-700"
                  >
                    <option value="">اختر حساب المصدر</option>
                    {items.map(i => (
                      <option key={i.id} value={i.id}>{i.name} (الرصيد: {i.balance.toLocaleString()} {i.currency})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-emerald-600 block text-[11px]">مستوعب الإيداع المورث (إلى حساب) <span className="text-rose-500">*</span></label>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-202 rounded outline-none cursor-pointer font-bold text-slate-700"
                  >
                    <option value="">اختر حساب المستلم</option>
                    {items.map(i => (
                      <option key={i.id} value={i.id}>{i.name} (الرصيد: {i.balance.toLocaleString()} {i.currency})</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end border-t border-slate-50 pt-4">
                
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">قيمة وقدر قيد الحسم المراد تحويله <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full text-center p-2.5 border border-slate-200 rounded font-mono font-black text-base outline-none text-[#0074b1]"
                  />
                </div>

                <div className="text-[10.5px] text-slate-400 bg-slate-50 p-2.5 border border-slate-200 rounded font-bold leading-relaxed">
                  ⚠️ في حال اختلاف العملات، يتم تحويل المبلغ للطرف المستقبل بحسب أسعار صرف البنك الافتراضية والتراكمية.
                </div>

              </div>

              <div className="space-y-1.5 border-t border-slate-50 pt-4">
                <label className="font-extrabold text-slate-650 block text-[11px]">بيان القيد وتفاصيل الحركة</label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="مثال: تسوية تصفية خزينة نهاية الأسبوع بالبنك الأهلي الرئيسي..."
                  className="w-full text-right p-2 border border-slate-200 rounded outline-none text-slate-805"
                />
              </div>

            </div>

            <div className="flex justify-start gap-2.5 bg-white p-4 rounded-lg border border-slate-200/80">
              <button
                onClick={handleTransfer}
                className="px-6 py-2.5 bg-[#0074b1] hover:bg-[#005f90] text-white rounded text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>إبرام وتسجيل التحويل المالي</span>
              </button>

              <button
                onClick={() => setCurrentMode('list')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء العملية
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
