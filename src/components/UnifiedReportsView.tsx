import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, FileText, Users, Package, Warehouse, Receipt,
  BarChart3, CreditCard, DollarSign, UserCheck, Search, Calendar,
  ArrowLeft, Download, Printer, Eye, FileSpreadsheet, FileBarChart,
  ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  items: { itemName: string; unitPrice: number; quantity: number; total: number }[];
  status: 'draft' | 'paid' | 'unpaid' | 'overdue';
  total: number;
}

interface Client {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost?: number;
  stockQty?: number;
}

interface UnifiedReportsViewProps {
  setView: (view: string) => void;
}

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const reportCards: ReportCard[] = [
  { id: 'sales', title: 'تقارير المبيعات', description: 'تحليل شامل للمبيعات والإيرادات والاتجاهات اليومية والشهرية', icon: TrendingUp, color: '#1E88E5', bgColor: '#E3F2FD' },
  { id: 'invoices', title: 'تقارير الفواتير', description: 'جميع فواتير البيع والمشتريات مع إمكانية التصفية والبحث المتقدم', icon: FileText, color: '#26A69A', bgColor: '#E0F2F1' },
  { id: 'customers', title: 'تقارير العملاء', description: 'تحليل قاعدة العملاء وسجل المعاملات والتصنيفات', icon: Users, color: '#7E57C2', bgColor: '#EDE7F6' },
  { id: 'products', title: 'تقارير المنتجات', description: 'أداء المنتجات والخدمات والأصناف الأكثر مبيعاً', icon: Package, color: '#F9A825', bgColor: '#FFF8E1' },
  { id: 'inventory', title: 'تقارير المخزون', description: 'حالة المخزون والمستودعات ومستويات إعادة الطلب', icon: Warehouse, color: '#EF5350', bgColor: '#FFEBEE' },
  { id: 'expenses', title: 'تقارير المصروفات', description: 'جميع المصروفات التشغيلية والإدارية مع التفاصيل', icon: Receipt, color: '#FF7043', bgColor: '#FFF3E0' },
  { id: 'pnl', title: 'تقارير الأرباح والخسائر', description: 'قائمة الدخل الشاملة وصافي الربح والإيرادات', icon: BarChart3, color: '#2E7D32', bgColor: '#E8F5E9' },
  { id: 'payments', title: 'تقارير المدفوعات', description: 'المدفوعات المستلمة والمرسلة وحالة التحصيل', icon: CreditCard, color: '#00897B', bgColor: '#E0F2F1' },
  { id: 'financial', title: 'التقارير المالية', description: 'الميزانية العمومية والتدفقات النقدية والمؤشرات المالية', icon: DollarSign, color: '#5C6BC0', bgColor: '#E8EAF6' },
];

function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number || '',
    date: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    clientName: (row as any).client_name || '',
    items: row.items || [],
    status: row.status || 'draft',
    total: row.total || 0,
  };
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name || '',
    price: row.price || 0,
    cost: row.cost,
    stockQty: row.quantity || row.stock_qty || 0,
  };
}

const reportLabels: Record<string, string> = {
  sales: 'تقارير المبيعات',
  invoices: 'تقارير الفواتير',
  customers: 'تقارير العملاء',
  products: 'تقارير المنتجات',
  inventory: 'تقارير المخزون',
  expenses: 'تقارير المصروفات',
  pnl: 'تقارير الأرباح والخسائر',
  payments: 'تقارير المدفوعات',
  financial: 'التقارير المالية',
};

function ReportPage({ reportType, onBack, invoices, clients, products }: {
  reportType: string;
  onBack: () => void;
  invoices: Invoice[];
  clients: Client[];
  products: Product[];
}) {
  const [locals, setLocals] = useState(invoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const rowsPerPage = 10;

  useEffect(() => { setLocals(invoices); }, [invoices]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (!error) setLocals(p => p.filter(i => i.id !== id));
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filteredData = useMemo(() => {
    let data = [...locals];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
      );
    }
    if (dateFrom) data = data.filter(inv => inv.date >= dateFrom);
    if (dateTo) data = data.filter(inv => inv.date <= dateTo);
    data.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'total') cmp = a.total - b.total;
      else if (sortField === 'clientName') cmp = a.clientName.localeCompare(b.clientName);
      else if (sortField === 'invoiceNumber') cmp = a.invoiceNumber.localeCompare(b.invoiceNumber);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [locals, searchQuery, dateFrom, dateTo, sortField, sortDir]);

  useEffect(() => { setPage(1); }, [searchQuery, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const summary = useMemo(() => {
    switch (reportType) {
      case 'sales': {
        const total = locals.reduce((s, i) => s + i.total, 0);
        const paid = locals.filter(i => i.status === 'paid').length;
        return [
          { label: 'إجمالي المبيعات', value: `${total.toLocaleString()} ج.م` },
          { label: 'عدد الفواتير', value: `${locals.length}` },
          { label: 'المدفوعة', value: `${paid}` },
        ];
      }
      case 'invoices': {
        const paid = locals.filter(i => i.status === 'paid').length;
        const unpaid = locals.filter(i => i.status === 'unpaid').length;
        return [
          { label: 'إجمالي الفواتير', value: `${locals.length}` },
          { label: 'مدفوعة', value: `${paid}` },
          { label: 'غير مدفوعة', value: `${unpaid}` },
        ];
      }
      case 'customers': {
        const unique = new Set(locals.map(i => i.clientName));
        return [
          { label: 'إجمالي العملاء', value: `${clients.length}` },
          { label: 'لديهم فواتير', value: `${unique.size}` },
        ];
      }
      case 'products': {
        const totalQty = products.reduce((s, p) => s + (p.stockQty || 0), 0);
        return [
          { label: 'عدد المنتجات', value: `${products.length}` },
          { label: 'إجمالي الوحدات', value: `${totalQty}` },
        ];
      }
      case 'inventory': {
        const val = products.reduce((s, p) => s + (p.cost || p.price * 0.7) * (p.stockQty || 0), 0);
        const low = products.filter(p => (p.stockQty || 0) <= 3).length;
        return [
          { label: 'قيمة المخزون', value: `${val.toLocaleString()} ج.م` },
          { label: 'منخفضة', value: `${low}` },
        ];
      }
      case 'expenses': {
        const cost = locals.reduce((s, inv) => s + (inv.items || []).reduce((is, it) => is + (it.unitPrice * 0.6) * it.quantity, 0), 0);
        return [
          { label: 'إجمالي التكاليف', value: `${cost.toLocaleString()} ج.م` },
          { label: 'مصروفات تقديرية', value: `${(cost * 0.15).toLocaleString()} ج.م` },
        ];
      }
      case 'pnl': {
        const revenue = locals.reduce((s, i) => s + i.total, 0);
        const cost = locals.reduce((s, inv) => s + (inv.items || []).reduce((is, it) => is + (it.unitPrice * 0.6) * it.quantity, 0), 0);
        return [
          { label: 'الإيرادات', value: `${revenue.toLocaleString()} ج.م` },
          { label: 'التكاليف', value: `${cost.toLocaleString()} ج.م` },
          { label: 'صافي الربح', value: `${Math.max(0, revenue - cost).toLocaleString()} ج.م` },
        ];
      }
      case 'payments': {
        const paid = locals.filter(i => i.status === 'paid');
        const totalPaid = paid.reduce((s, i) => s + i.total, 0);
        return [
          { label: 'المدفوعات المستلمة', value: `${totalPaid.toLocaleString()} ج.م` },
          { label: 'عدد المعاملات', value: `${paid.length}` },
        ];
      }
      case 'financial': {
        const revenue = locals.reduce((s, i) => s + i.total, 0);
        const cost = locals.reduce((s, inv) => s + (inv.items || []).reduce((is, it) => is + (it.unitPrice * 0.6) * it.quantity, 0), 0);
        return [
          { label: 'إجمالي الأصول', value: `${revenue.toLocaleString()} ج.م` },
          { label: 'إجمالي الالتزامات', value: `${cost.toLocaleString()} ج.م` },
          { label: 'حقوق الملكية', value: `${Math.max(0, revenue - cost).toLocaleString()} ج.م` },
        ];
      }
      default: return [];
    }
  }, [reportType, locals, clients, products]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
      overdue: 'bg-rose-50 text-rose-700 border-rose-200',
      draft: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    const labels: Record<string, string> = {
      paid: 'مدفوعة', unpaid: 'غير مدفوعة', overdue: 'متأخرة', draft: 'مسودة',
    };
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors[status] || colors.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 text-slate-800 antialiased animate-fadeIn leading-relaxed" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1E88E5]/10 flex items-center justify-center">
            <BarChart3 className="w-5.5 h-5.5 text-[#1E88E5]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{reportLabels[reportType] || reportType}</h1>
            <p className="text-xs text-slate-400 font-semibold">عرض وتحليل البيانات</p>
          </div>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 transition-all font-bold text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>العودة للتقارير</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        {summary.map((s, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-[11px] text-slate-500 font-semibold mb-1">{s.label}</div>
            <div className="text-sm font-black text-slate-800 font-mono">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="بحث في الفواتير..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/20 focus:border-[#1E88E5] transition-all" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 w-full focus:outline-none [color-scheme:light]" placeholder="من تاريخ" />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 w-full focus:outline-none [color-scheme:light]" placeholder="إلى تاريخ" />
          </div>
        </div>
      </div>

      <div id="report-results" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4.5 h-4.5 text-[#1E88E5]" />
            <h2 className="text-sm font-black text-slate-800">النتائج</h2>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{filteredData.length} سجل</span>
          </div>
          <div className="flex items-center gap-2">
            {['date', 'clientName', 'total', 'status'].map(f => (
              <button key={f} onClick={() => handleSort(f)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${sortField === f ? 'bg-[#1E88E5]/10 text-[#1E88E5]' : 'text-slate-500 hover:bg-slate-50'}`}>
                {f === 'date' ? 'التاريخ' : f === 'clientName' ? 'العميل' : f === 'total' ? 'المبلغ' : 'الحالة'} {sortField === f ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                <th className="p-3.5 pr-5">رقم الفاتورة</th>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5 text-left">المبلغ</th>
                <th className="p-3.5 text-center">الحالة</th>
                <th className="p-3.5 pl-5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span className="font-bold text-sm">لا توجد نتائج للعرض</span>
                      <span className="text-[11px]">حاول تعديل معايير البحث</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 pr-5 font-black text-slate-800">#{inv.invoiceNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{inv.clientName}</td>
                    <td className="p-3.5 text-slate-500 font-semibold">{inv.date}</td>
                    <td className="p-3.5 font-mono font-black text-slate-800 text-left">{inv.total.toLocaleString()} <span className="text-[10px] font-semibold text-slate-400">ج.م</span></td>
                    <td className="p-3.5 text-center">{statusBadge(inv.status)}</td>
                    <td className="p-3.5 pl-5 text-center">
                      <button onClick={() => handleDelete(inv.id)}
                        className="text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5 inline ml-1" />
                        حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredData.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-semibold">
              عرض {Math.min(rowsPerPage, filteredData.length)} من {filteredData.length} سجل
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${page === pageNum ? 'bg-[#1E88E5] text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnifiedReportsView({ setView }: UnifiedReportsViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id,name'),
      supabase.from('products').select('*'),
    ]).then(([invRes, clRes, prodRes]) => {
      if (invRes.data) setInvoices(invRes.data.map(mapInvoice));
      if (clRes.data) setClients(clRes.data);
      if (prodRes.data) setProducts(prodRes.data.map(mapProduct));
      setLoading(false);
    });
  }, []);

  const handleDeleteInvoice = useCallback(async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (!error) setInvoices(p => p.filter(i => i.id !== id));
  }, []);

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return reportCards;
    const q = searchQuery.trim().toLowerCase();
    return reportCards.filter(c => c.title.includes(q) || c.description.includes(q));
  }, [searchQuery]);

  if (activeReport) {
    return (
      <ReportPage
        reportType={activeReport}
        onBack={() => setActiveReport(null)}
        invoices={invoices}
        clients={clients}
        products={products}
      />
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
      overdue: 'bg-rose-50 text-rose-700 border-rose-200',
      draft: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    const labels: Record<string, string> = {
      paid: 'مدفوعة', unpaid: 'غير مدفوعة', overdue: 'متأخرة', draft: 'مسودة',
    };
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors[status] || colors.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getReportSummary = (type: string): { label: string; value: string }[] => {
    switch (type) {
      case 'sales': {
        const total = invoices.reduce((s, i) => s + i.total, 0);
        const paid = invoices.filter(i => i.status === 'paid').length;
        return [
          { label: 'إجمالي المبيعات', value: `${total.toLocaleString()} ج.م` },
          { label: 'عدد الفواتير', value: `${invoices.length}` },
          { label: 'المدفوعة', value: `${paid}` },
        ];
      }
      case 'invoices': {
        const paid = invoices.filter(i => i.status === 'paid').length;
        const unpaid = invoices.filter(i => i.status === 'unpaid').length;
        return [
          { label: 'إجمالي الفواتير', value: `${invoices.length}` },
          { label: 'مدفوعة', value: `${paid}` },
          { label: 'غير مدفوعة', value: `${unpaid}` },
        ];
      }
      case 'customers': return [
        { label: 'إجمالي العملاء', value: `${clients.length}` },
      ];
      case 'products': {
        const totalQty = products.reduce((s, p) => s + (p.stockQty || 0), 0);
        return [
          { label: 'عدد المنتجات', value: `${products.length}` },
          { label: 'إجمالي الوحدات', value: `${totalQty}` },
        ];
      }
      case 'inventory': {
        const val = products.reduce((s, p) => s + (p.cost || p.price * 0.7) * (p.stockQty || 0), 0);
        const low = products.filter(p => (p.stockQty || 0) <= 3).length;
        return [
          { label: 'قيمة المخزون', value: `${val.toLocaleString()} ج.م` },
          { label: 'منخفضة', value: `${low}` },
        ];
      }
      case 'expenses': {
        const cost = invoices.reduce((s, inv) => s + (inv.items || []).reduce((is, it) => is + (it.unitPrice * 0.6) * it.quantity, 0), 0);
        return [
          { label: 'إجمالي التكاليف', value: `${cost.toLocaleString()} ج.م` },
          { label: 'مصروفات تقديرية', value: `${(cost * 0.15).toLocaleString()} ج.م` },
        ];
      }
      case 'pnl': {
        const revenue = invoices.reduce((s, i) => s + i.total, 0);
        const cost = invoices.reduce((s, inv) => s + (inv.items || []).reduce((is, it) => is + (it.unitPrice * 0.6) * it.quantity, 0), 0);
        return [
          { label: 'الإيرادات', value: `${revenue.toLocaleString()} ج.م` },
          { label: 'التكاليف', value: `${cost.toLocaleString()} ج.م` },
          { label: 'صافي الربح', value: `${Math.max(0, revenue - cost).toLocaleString()} ج.م` },
        ];
      }
      case 'payments': {
        const paidInvs = invoices.filter(i => i.status === 'paid');
        return [
          { label: 'المدفوعات المستلمة', value: `${paidInvs.reduce((s, i) => s + i.total, 0).toLocaleString()} ج.م` },
          { label: 'عدد المعاملات', value: `${paidInvs.length}` },
        ];
      }
      case 'financial': {
        const revenue = invoices.reduce((s, i) => s + i.total, 0);
        const cost = invoices.reduce((s, inv) => s + (inv.items || []).reduce((is, it) => is + (it.unitPrice * 0.6) * it.quantity, 0), 0);
        return [
          { label: 'إجمالي الأصول', value: `${revenue.toLocaleString()} ج.م` },
          { label: 'صافي الربح', value: `${Math.max(0, revenue - cost).toLocaleString()} ج.م` },
        ];
      }
      default: return [];
    }
  };

  if (loading) {
    return (
      <div className="w-full mx-auto text-right font-sans select-none text-slate-800 antialiased" dir="rtl">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="text-slate-400 font-bold">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 text-slate-800 antialiased animate-fadeIn leading-relaxed" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1E88E5]/10 flex items-center justify-center">
            <BarChart3 className="w-5.5 h-5.5 text-[#1E88E5]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">التقارير</h1>
            <p className="text-xs text-slate-400 font-semibold">اختر نوع التقرير لعرض البيانات</p>
          </div>
        </div>
        <button onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 transition-all font-bold text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>العودة للوحة التحكم</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="ابحث عن تقرير..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/20 focus:border-[#1E88E5] transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button key={card.id}
              whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
              onClick={() => setActiveReport(card.id)}
              className="w-full text-right bg-white rounded-2xl border border-slate-100 shadow-sm p-5 transition-all cursor-pointer group hover:shadow-md hover:border-slate-200">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: card.bgColor, color: card.color }}>
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-800 mb-0.5">{card.title}</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-snug line-clamp-2">{card.description}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[11px] font-bold text-[#1E88E5] inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      عرض التقرير
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
        {filteredCards.length === 0 && (
          <div className="col-span-full p-10 text-center text-slate-400">
            <div className="font-bold text-sm">لا توجد تقارير تطابق بحثك</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4.5 h-4.5 text-[#1E88E5]" />
            <h2 className="text-sm font-black text-slate-800">آخر الفواتير</h2>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{invoices.length} سجل</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                <th className="p-3.5 pr-5">رقم الفاتورة</th>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5 text-left">المبلغ</th>
                <th className="p-3.5 text-center">الحالة</th>
                <th className="p-3.5 pl-5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span className="font-bold text-sm">لا توجد فواتير</span>
                      <span className="text-[11px]">قم بإضافة فاتورة جديدة من صفحة الفواتير</span>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 pr-5 font-black text-slate-800">#{inv.invoiceNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{inv.clientName}</td>
                    <td className="p-3.5 text-slate-500 font-semibold">{inv.date}</td>
                    <td className="p-3.5 font-mono font-black text-slate-800 text-left">{inv.total.toLocaleString()} <span className="text-[10px] font-semibold text-slate-400">ج.م</span></td>
                    <td className="p-3.5 text-center">{statusBadge(inv.status)}</td>
                    <td className="p-3.5 pl-5 text-center">
                      <button onClick={() => handleDeleteInvoice(inv.id)}
                        className="text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5 inline ml-1" />
                        حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
