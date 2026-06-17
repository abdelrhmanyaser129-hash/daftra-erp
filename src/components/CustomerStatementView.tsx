import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import {
  Printer,
  FileDown,
  FileSpreadsheet,
  Search,
  Calendar,
  Filter,
  ChevronLeft,
  User,
  Download
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  balance: number;
}

interface Transaction {
  date: string;
  description: string;
  type: 'فاتورة مبيعات' | 'مدفوعات' | 'مرتجع مبيعات';
  debit: number;
  credit: number;
  runningBalance: number;
}

interface ReportData {
  clientName: string;
  openingBalance: number;
  totalSales: number;
  totalPayments: number;
  totalReturns: number;
  closingBalance: number;
  transactions: Transaction[];
}

interface CustomerStatementViewProps {
  setView: (view: string) => void;
}

export default function CustomerStatementView({ setView }: CustomerStatementViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!fromDate) {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      setFromDate(firstDay);
    }
    if (!toDate) setToDate(today);
  }, []);

  useEffect(() => {
    const loadClients = async () => {
      const { data, error } = await supabase.from('clients').select('id, name, balance');
      if (error) {
        console.error('Failed to load clients', error);
        return;
      }
      setClients(data || []);
    };
    loadClients();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleGenerateReport = async () => {
    if (!selectedClientId) {
      setError('الرجاء اختيار عميل');
      return;
    }
    if (!fromDate || !toDate) {
      setError('الرجاء تحديد نطاق التاريخ');
      return;
    }

    setLoading(true);
    setError('');
    setReportData(null);

    try {
      const client = selectedClient!;
      const openingBalance = Number(client.balance) || 0;

      const [invoicesResult, returnsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, total, paid, created_at, notes')
          .eq('client_id', selectedClientId)
          .gte('created_at', fromDate)
          .lte('created_at', toDate + 'T23:59:59Z')
          .order('created_at', { ascending: true }),
        supabase
          .from('returned_invoices')
          .select('id, return_number, date, total, notes')
          .eq('client_id', selectedClientId)
          .gte('date', fromDate)
          .lte('date', toDate)
          .order('date', { ascending: true }),
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (returnsResult.error) throw returnsResult.error;

      const transactions: Transaction[] = [];
      let totalSales = 0;
      let totalPayments = 0;
      let totalReturns = 0;

      const tempRows: { date: string; description: string; type: Transaction['type']; debit: number; credit: number; sortKey: string }[] = [];

      (invoicesResult.data || []).forEach(inv => {
        const total = Number(inv.total) || 0;
        const paid = Number(inv.paid) || 0;
        totalSales += total;

        tempRows.push({
          date: inv.created_at ? inv.created_at.split('T')[0] : '',
          description: `فاتورة مبيعات #${inv.invoice_number}${inv.notes ? ` - ${inv.notes}` : ''}`,
          type: 'فاتورة مبيعات',
          debit: total,
          credit: 0,
          sortKey: `A_${inv.created_at}_${inv.invoice_number}`,
        });

        if (paid > 0) {
          totalPayments += paid;
          tempRows.push({
            date: inv.created_at ? inv.created_at.split('T')[0] : '',
            description: `مدفوعات عن فاتورة #${inv.invoice_number}`,
            type: 'مدفوعات',
            debit: 0,
            credit: paid,
            sortKey: `B_${inv.created_at}_${inv.invoice_number}`,
          });
        }
      });

      (returnsResult.data || []).forEach(ret => {
        const total = Number(ret.total) || 0;
        totalReturns += total;
        tempRows.push({
          date: ret.date || '',
          description: `مرتجع مبيعات #${ret.return_number}${ret.notes ? ` - ${ret.notes}` : ''}`,
          type: 'مرتجع مبيعات',
          debit: 0,
          credit: total,
          sortKey: `C_${ret.date}_${ret.return_number}`,
        });
      });

      tempRows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

      let balance = openingBalance;
      tempRows.forEach(row => {
        balance += row.debit - row.credit;
        transactions.push({ ...row, runningBalance: balance });
      });

      setReportData({
        clientName: client.name,
        openingBalance,
        totalSales,
        totalPayments,
        totalReturns,
        closingBalance: balance,
        transactions,
      });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!reportData) return;

    const headers = ['التاريخ', 'البيان', 'النوع', 'مدين', 'دائن', 'الرصيد'];
    const rows = reportData.transactions.map(t => [
      t.date,
      t.description,
      t.type,
      t.debit.toFixed(2),
      t.credit.toFixed(2),
      t.runningBalance.toFixed(2),
    ]);

    const summaryRows = [
      [],
      ['الملخص', '', '', '', '', ''],
      ['رصيد افتتاحي', '', '', '', '', reportData.openingBalance.toFixed(2)],
      ['إجمالي المبيعات', '', '', reportData.totalSales.toFixed(2), '', ''],
      ['إجمالي المدفوعات', '', '', '', reportData.totalPayments.toFixed(2), ''],
      ['إجمالي المرتجعات', '', '', '', reportData.totalReturns.toFixed(2), ''],
      ['الرصيد الختامي', '', '', '', '', reportData.closingBalance.toFixed(2)],
    ];

    const csvContent = [headers, ...rows, ...summaryRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `كشف_حساب_عميل_${reportData.clientName}_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="customer-statement-module" className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 antialiased">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-row-reverse text-xs gap-3">
        <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
          <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>التقارير</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-extrabold text-[13px]">كشف حساب العميل</span>
        </div>
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:bg-slate-150 px-4 py-2 rounded-lg border border-slate-200 transition-all font-bold cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>لوحة التحكم</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 flex-row-reverse">
          <Filter className="w-5 h-5 text-[#0074b1]" />
          <span>تصفية التقرير</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="font-black text-slate-600 block text-right text-xs">العميل</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن عميل..."
                value={selectedClient ? selectedClient.name : clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setSelectedClientId('');
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none pr-8"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
            </div>
            {showClientDropdown && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">لا يوجد عملاء</div>
                ) : (
                  filteredClients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setClientSearch(c.name);
                        setShowClientDropdown(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                        selectedClientId === c.id ? 'bg-daftra-light-blue text-daftra-blue font-bold' : 'text-slate-700'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-black text-slate-600 block text-right text-xs">من تاريخ</label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-black text-slate-600 block text-right text-xs">إلى تاريخ</label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0074b1] hover:bg-[#005f90] text-white px-4 py-2.5 rounded-lg transition-all font-bold cursor-pointer shadow-sm disabled:opacity-50 text-xs"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'جارٍ إنشاء التقرير...' : 'عرض التقرير'}</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}
      </div>

      {reportData && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800">
              <User className="w-5 h-5 text-[#0074b1]" />
              <span>كشف حساب: {reportData.clientName}</span>
              <span className="text-xs font-bold text-slate-400 mx-2">|</span>
              <span className="text-xs font-bold text-slate-500">{fromDate} إلى {toDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border border-rose-200"
              >
                <FileDown className="w-4 h-4" />
                <span>تصدير PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border border-emerald-200"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 select-none">
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">البيان</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">مدين</th>
                    <th className="p-3">دائن</th>
                    <th className="p-3">الرصيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {reportData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">لا توجد معاملات في هذا النطاق</td>
                    </tr>
                  ) : (
                    reportData.transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-mono text-slate-500">{t.date}</td>
                        <td className="p-3 text-slate-800">{t.description}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                            t.type === 'فاتورة مبيعات' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            t.type === 'مدفوعات' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-left text-rose-600">{t.debit > 0 ? t.debit.toFixed(2) : '—'}</td>
                        <td className="p-3 font-mono text-left text-emerald-600">{t.credit > 0 ? t.credit.toFixed(2) : '—'}</td>
                        <td className={`p-3 font-mono text-left font-black ${t.runningBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                          {t.runningBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-800 mb-4">ملخص كشف الحساب</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="block text-[10px] font-bold text-slate-500 mb-1">رصيد افتتاحي</span>
                <span className="block text-base font-black text-slate-800">{reportData.openingBalance.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
                <span className="block text-[10px] font-bold text-blue-600 mb-1">إجمالي المبيعات</span>
                <span className="block text-base font-black text-blue-800">{reportData.totalSales.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                <span className="block text-[10px] font-bold text-emerald-600 mb-1">إجمالي المدفوعات</span>
                <span className="block text-base font-black text-emerald-800">{reportData.totalPayments.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-lg">
                <span className="block text-[10px] font-bold text-orange-600 mb-1">إجمالي المرتجعات</span>
                <span className="block text-base font-black text-orange-800">{reportData.totalReturns.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-[#0074b1]/10 border border-[#0074b1]/30 rounded-lg">
                <span className="block text-[10px] font-bold text-[#0074b1] mb-1">الرصيد الختامي</span>
                <span className="block text-base font-black text-[#0074b1]">{reportData.closingBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
