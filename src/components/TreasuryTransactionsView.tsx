import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Download,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react';

interface TreasuryTransaction {
  id: string;
  treasury_id: string;
  transaction_type: string;
  reference_type: string;
  reference_id: string;
  reference_number: string;
  description: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  created_by: string;
  created_at: string;
}

interface SafeBank {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
}

interface TreasuryTransactionsViewProps {
  setView: (view: string) => void;
}

export default function TreasuryTransactionsView({ setView }: TreasuryTransactionsViewProps) {
  const [safesBanks, setSafesBanks] = useState<SafeBank[]>([]);
  const [selectedTreasuryId, setSelectedTreasuryId] = useState('');
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchSafes = async () => {
      const { data, error } = await supabase
        .from('safes_banks')
        .select('id, name, type, currency, balance')
        .order('name');
      if (error) {
        console.error('Error fetching safes banks:', error);
        return;
      }
      if (data) {
        setSafesBanks(data);
      }
    };
    fetchSafes();
  }, []);

  useEffect(() => {
    if (!selectedTreasuryId) {
      setTransactions([]);
      return;
    }
    const fetchTransactions = async () => {
      setLoading(true);
      let query = supabase
        .from('treasury_transactions')
        .select('*')
        .eq('treasury_id', selectedTreasuryId)
        .order('created_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00Z`);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59Z`);
      }
      if (filterType !== 'all') {
        query = query.eq('transaction_type', filterType);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching transactions:', error);
      } else if (data) {
        setTransactions(data as TreasuryTransaction[]);
      }
      setLoading(false);
    };
    fetchTransactions();
  }, [selectedTreasuryId, dateFrom, dateTo, filterType]);

  const selectedTreasury = safesBanks.find(sb => sb.id === selectedTreasuryId);

  const totalDeposits = transactions
    .filter(t => t.balance_after > t.balance_before)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.balance_after < t.balance_before)
    .reduce((sum, t) => sum + t.amount, 0);

  const openingBalance = transactions.length > 0
    ? transactions[transactions.length - 1].balance_before
    : (selectedTreasury?.balance || 0);

  const currentBalance = transactions.length > 0
    ? transactions[0].balance_after
    : (selectedTreasury?.balance || 0);

  const lastTransactionDate = transactions.length > 0
    ? transactions[0].created_at
    : null;

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['التاريخ', 'الوقت', 'نوع العملية', 'رقم المرجع', 'الوصف', 'المبلغ المضاف', 'المبلغ المسحوب', 'الرصيد قبل', 'الرصيد بعد'];
    const rows = transactions.map(t => {
      const date = new Date(t.created_at);
      const dateStr = date.toLocaleDateString('ar-EG');
      const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const typeLabel = getTransactionTypeLabel(t.transaction_type);
      const added = t.balance_after > t.balance_before ? t.amount : '';
      const withdrawn = t.balance_after < t.balance_before ? t.amount : '';
      return [dateStr, timeStr, typeLabel, t.reference_number, t.description, added, withdrawn, t.balance_before, t.balance_after].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treasury_transactions_${selectedTreasuryId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'expense': 'مصروف',
      'receipt_voucher': 'سند قبض',
      'receipt_voucher_reversal': 'إلغاء سند قبض',
      'transfer_in': 'تحويل وارد',
      'transfer_out': 'تحويل صادر',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    if (type === 'expense') return 'text-rose-600 bg-rose-50 border-rose-200';
    if (type === 'receipt_voucher') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (type === 'receipt_voucher_reversal') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('ar-EG'),
      time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div id="daftra-treasury-transactions" className="w-full mx-auto text-right font-sans select-none pb-12 antialiased">
      
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex-row-reverse text-xs gap-3">
          <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
            <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>المالية</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-extrabold text-[13px]">حركة الخزينة</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={transactions.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center flex-row-reverse">
          <h1 className="text-2xl font-black text-[#1a2e40] leading-none">حركة الخزينة</h1>
          <p className="text-xs text-slate-400 font-bold">سجل جميع الحركات المالية على الخزائن والحسابات البنكية.</p>
        </div>

        {/* Account Selector & Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 text-xs shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-extrabold text-slate-650 block text-[11px]">الخزينة / الحساب البنكي <span className="text-rose-500">*</span></label>
              <select
                value={selectedTreasuryId}
                onChange={(e) => setSelectedTreasuryId(e.target.value)}
                className="w-full text-right p-2.5 border border-slate-200 rounded outline-none cursor-pointer font-bold focus:border-[#0074b1]"
              >
                <option value="">-- اختر الخزينة أو الحساب البنكي --</option>
                {safesBanks.map(sb => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name} ({sb.type === 'safe' ? 'خزينة' : 'بنكي'} - {sb.currency}) الرصيد: {sb.balance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-650 block text-[11px]">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full text-right p-2 border border-slate-200 rounded outline-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-650 block text-[11px]">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full text-right p-2 border border-slate-200 rounded outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {selectedTreasuryId && transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-right">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-emerald-500 font-bold block text-[10px] flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> إجمالي الإيداعات
              </span>
              <p className="text-lg font-mono font-black text-emerald-600">
                {totalDeposits.toLocaleString()} {selectedTreasury?.currency}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-rose-500 font-bold block text-[10px] flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> إجمالي المسحوبات
              </span>
              <p className="text-lg font-mono font-black text-rose-600">
                {totalWithdrawals.toLocaleString()} {selectedTreasury?.currency}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 font-bold block text-[10px] flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> الرصيد الافتتاحي
              </span>
              <p className="text-lg font-mono font-black text-slate-700">
                {openingBalance.toLocaleString()} {selectedTreasury?.currency}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[#0074b1] font-bold block text-[10px] flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> الرصيد الحالي
              </span>
              <p className="text-lg font-mono font-black text-[#0074b1]">
                {currentBalance.toLocaleString()} {selectedTreasury?.currency}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 font-bold block text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> آخر حركة
              </span>
              <p className="text-sm font-mono font-black text-slate-600">
                {lastTransactionDate ? new Date(lastTransactionDate).toLocaleDateString('ar-EG') : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedTreasuryId && (
          <div className="bg-white py-16 px-6 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="w-10 h-10" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-extrabold text-[#2a3a4c] block">
                اختر حساب لعرض الحركات
              </h3>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed block">
                قم باختيار الخزينة أو الحساب البنكي لعرض سجل الحركات والعمليات المالية المسجلة عليه.
              </p>
            </div>
          </div>
        )}

        {selectedTreasuryId && !loading && transactions.length === 0 && (
          <div className="bg-white py-16 px-6 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-extrabold text-[#2a3a4c] block">
                لا توجد حركات مسجلة
              </h3>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed block">
                لم يتم تسجيل أي معاملات مالية على هذا الحساب حتى الآن.
              </p>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {selectedTreasuryId && transactions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-205 shadow-xs overflow-hidden">
            <div className="bg-slate-50/70 p-4 border-b border-slate-150 text-right">
              <span className="text-xs font-bold text-slate-700">سجل الحركات ({transactions.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-550 border-b border-slate-100 font-extrabold">
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">الوقت</th>
                    <th className="p-3">نوع العملية</th>
                    <th className="p-3">رقم المرجع</th>
                    <th className="p-3">الوصف</th>
                    <th className="p-3 text-left">المبلغ المضاف</th>
                    <th className="p-3 text-left">المبلغ المسحوب</th>
                    <th className="p-3 text-left">الرصيد قبل</th>
                    <th className="p-3 text-left">الرصيد بعد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {transactions.map((t) => {
                    const { date, time } = formatDateTime(t.created_at);
                    const isAdded = t.balance_after > t.balance_before;
                    const isWithdrawn = t.balance_after < t.balance_before;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-3 font-mono text-slate-500">{date}</td>
                        <td className="p-3 font-mono text-slate-400">{time}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTransactionTypeColor(t.transaction_type)}`}>
                            {getTransactionTypeLabel(t.transaction_type)}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[#0074b1] font-black">{t.reference_number}</td>
                        <td className="p-3 max-w-[200px] truncate text-slate-500" title={t.description}>
                          {t.description || '—'}
                        </td>
                        <td className="p-3 text-left font-mono text-emerald-600 font-black">
                          {isAdded ? `+${t.amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-left font-mono text-rose-600 font-black">
                          {isWithdrawn ? `-${t.amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-left font-mono text-slate-500">
                          {t.balance_before.toLocaleString()}
                        </td>
                        <td className="p-3 text-left font-mono font-black text-slate-800">
                          {t.balance_after.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0074b1] mx-auto" />
          </div>
        )}

      </div>

    </div>
  );
}
