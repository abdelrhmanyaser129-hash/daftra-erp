/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  Building,
  Download
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  company: string;
  opening_balance: number;
}

interface Transaction {
  date: string;
  description: string;
  type: 'فاتورة شراء' | 'مدفوعات' | 'مرتجع';
  debit: number;
  credit: number;
  runningBalance: number;
}

interface ReportData {
  vendorName: string;
  openingBalance: number;
  totalPurchases: number;
  totalPayments: number;
  totalReturns: number;
  closingBalance: number;
  transactions: Transaction[];
}

interface SupplierStatementViewProps {
  setView: (view: string) => void;
}

export default function SupplierStatementView({ setView }: SupplierStatementViewProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
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
    const loadVendors = async () => {
      const { data, error } = await supabase.from('purchase_vendors').select('id, name, company, opening_balance');
      if (error) {
        console.error('Failed to load vendors', error);
        return;
      }
      setVendors(data || []);
    };
    loadVendors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowVendorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.company?.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  const handleGenerateReport = async () => {
    if (!selectedVendorId) {
      setError('الرجاء اختيار مورد');
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
      const vendor = selectedVendor!;
      const openingBase = Number(vendor.opening_balance) || 0;

      // Fetch ALL data (no date filter) to calculate opening balance from pre-range transactions
      const [invoicesResult, paymentsResult, returnsResult] = await Promise.all([
        supabase
          .from('purchase_invoices')
          .select('id, invoice_number, date, total, status, notes')
          .eq('vendor_id', selectedVendorId)
          .neq('status', 'draft'),
        supabase
          .from('purchase_vendor_payments')
          .select('id, payment_number, amount, payment_date, created_at, notes')
          .eq('vendor_id', selectedVendorId),
        supabase
          .from('purchase_returns')
          .select('id, return_number, date, total, notes')
          .eq('vendor_id', selectedVendorId),
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;
      if (returnsResult.error) throw returnsResult.error;

      const allRows: { date: string; description: string; type: Transaction['type']; debit: number; credit: number; sortKey: string }[] = [];

      (invoicesResult.data || []).forEach(inv => {
        const date = inv.date || '';
        allRows.push({
          date,
          description: `فاتورة شراء #${inv.invoice_number}${inv.notes ? ` - ${inv.notes}` : ''}`,
          type: 'فاتورة شراء',
          debit: Number(inv.total) || 0,
          credit: 0,
          sortKey: `${date}_A_${inv.invoice_number}`,
        });
      });

      (paymentsResult.data || []).forEach(pmt => {
        const date = pmt.payment_date || (pmt.created_at ? pmt.created_at.split('T')[0] : '');
        allRows.push({
          date,
          description: `مدفوعات #${pmt.payment_number}${pmt.notes ? ` - ${pmt.notes}` : ''}`,
          type: 'مدفوعات',
          debit: 0,
          credit: Number(pmt.amount) || 0,
          sortKey: `${date}_B_${pmt.payment_number}`,
        });
      });

      (returnsResult.data || []).forEach(ret => {
        const date = ret.date || '';
        allRows.push({
          date,
          description: `مرتجع #${ret.return_number}${ret.notes ? ` - ${ret.notes}` : ''}`,
          type: 'مرتجع',
          debit: 0,
          credit: Number(ret.total) || 0,
          sortKey: `${date}_C_${ret.return_number}`,
        });
      });

      allRows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

      const beforeRows = allRows.filter(row => row.date && row.date < fromDate);
      const rangeRows = allRows.filter(row => (!row.date || row.date >= fromDate) && (!row.date || row.date <= toDate));
      const openingBalance = beforeRows.reduce((sum, row) => sum + row.debit - row.credit, openingBase);

      let balance = openingBalance;
      const transactions = rangeRows.map(row => {
        balance += row.debit - row.credit;
        return { ...row, runningBalance: balance };
      });

      setReportData({
        vendorName: vendor.name,
        openingBalance,
        totalPurchases: rangeRows.filter(row => row.type === 'فاتورة شراء').reduce((sum, row) => sum + row.debit, 0),
        totalPayments: rangeRows.filter(row => row.type === 'مدفوعات').reduce((sum, row) => sum + row.credit, 0),
        totalReturns: rangeRows.filter(row => row.type === 'مرتجع').reduce((sum, row) => sum + row.credit, 0),
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
      ['إجمالي المشتريات', '', '', reportData.totalPurchases.toFixed(2), '', ''],
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
    a.download = `كشف_حساب_مورد_${reportData.vendorName}_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="supplier-statement-module" className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 antialiased">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-row-reverse text-xs gap-3">
        <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
          <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>التقارير</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-extrabold text-[13px]">كشف حساب المورد</span>
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
            <label className="font-black text-slate-600 block text-right text-xs">المورد</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن مورد..."
                value={selectedVendor ? selectedVendor.name : vendorSearch}
                onChange={(e) => {
                  setVendorSearch(e.target.value);
                  setSelectedVendorId('');
                  setShowVendorDropdown(true);
                }}
                onFocus={() => setShowVendorDropdown(true)}
                className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none pr-8"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
            </div>
            {showVendorDropdown && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredVendors.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">لا يوجد موردين</div>
                ) : (
                  filteredVendors.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVendorId(v.id);
                        setVendorSearch(v.name);
                        setShowVendorDropdown(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                        selectedVendorId === v.id ? 'bg-daftra-light-blue text-daftra-blue font-bold' : 'text-slate-700'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{v.name}</span>
                      {v.company && <span className="text-[10px] text-slate-400">- {v.company}</span>}
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
              <Building className="w-5 h-5 text-[#0074b1]" />
              <span>كشف حساب: {reportData.vendorName}</span>
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
                            t.type === 'فاتورة شراء' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
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
                <span className="block text-[10px] font-bold text-blue-600 mb-1">إجمالي المشتريات</span>
                <span className="block text-base font-black text-blue-800">{reportData.totalPurchases.toFixed(2)}</span>
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
