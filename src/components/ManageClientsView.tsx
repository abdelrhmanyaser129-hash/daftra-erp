import { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Mail, Phone, MapPin, Tag, Briefcase, Settings,
  Calendar, Clock, AlertCircle, CheckCircle2, Filter
} from 'lucide-react';
import { Client } from '../types';
import { supabase } from '../lib/supabase';

interface ManageClientsViewProps {
  setView: (view: string) => void;
  searchQuery: string;
  onSelectClient?: (clientId: string) => void;
}

const todayStr = () => new Date().toISOString().split('T')[0];
const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export default function ManageClientsView({ setView, searchQuery, onSelectClient }: ManageClientsViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [followUpFilter, setFollowUpFilter] = useState<string>('today');
  const [customDate, setCustomDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setFilterQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data) {
      setClients(data.map(mapClientRow));
    }
    setLoading(false);
  };

  const mapClientRow = (row: any): Client => ({
    id: row.id,
    type: row.type || 'individual',
    fullName: row.full_name || '',
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    email: row.email || '',
    phone: row.phone || '',
    mobile: row.mobile || '',
    address1: row.address1 || '',
    address2: row.address2 || '',
    city: row.city || '',
    region: row.region || '',
    zipCode: row.zip_code || '',
    country: row.country || '',
    commercialRegistry: row.commercial_registry || '',
    taxCard: row.tax_card || '',
    nationalId: row.national_id || '',
    codeNumber: row.code_number || '',
    currency: row.currency || 'EGP',
    notes: row.notes || '',
    category: row.category || '',
    billingMethod: row.billing_method || '',
    startDate: row.start_date || '',
    targetWeight: row.target_weight || 0,
    nextFollowUp: row.next_follow_up || '',
  });

  const today = todayStr();
  const weekEnd = daysFromNow(7);

  const followUpCounts = {
    today: clients.filter(c => c.nextFollowUp === today).length,
    overdue: clients.filter(c => c.nextFollowUp && c.nextFollowUp < today).length,
    thisWeek: clients.filter(c => c.nextFollowUp && c.nextFollowUp >= today && c.nextFollowUp <= weekEnd).length,
  };

  const selectedDateCount = customDate
    ? clients.filter(c => c.nextFollowUp === customDate).length
    : 0;

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;

    let matchesFollowUp = true;
    if (followUpFilter === 'today') {
      matchesFollowUp = c.nextFollowUp === today;
    } else if (followUpFilter === 'overdue') {
      matchesFollowUp = !!c.nextFollowUp && c.nextFollowUp < today;
    } else if (followUpFilter === 'thisWeek') {
      matchesFollowUp = !!c.nextFollowUp && c.nextFollowUp >= today && c.nextFollowUp <= weekEnd;
    } else if (followUpFilter === 'custom' && customDate) {
      matchesFollowUp = c.nextFollowUp === customDate;
    } else if (followUpFilter === 'all') {
      matchesFollowUp = true;
    } else {
      matchesFollowUp = true;
    }

    return matchesSearch && matchesCategory && matchesFollowUp;
  });

  const handleFollowUpFilter = (filter: string) => {
    setFollowUpFilter(filter);
    if (filter === 'custom') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
      setCustomDate('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-daftra-border shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-daftra-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#0d385a] flex items-center gap-1.5">
            <Users className="w-5 h-5 text-daftra-blue" />
            <span>إدارة حسابات العملاء</span>
          </h2>
          <p className="text-[11px] text-slate-500">سجل العملاء، جهات الاتصال الخاصة بهم، الفرز حسب فئات الاستهلاك</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={() => setView('client-settings')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-3 py-2 text-xs font-bold text-[#1c2e43] cursor-pointer">
            <Settings className="w-4 h-4 text-[#1c2e43]" />
            <span>إعدادات العملاء</span>
          </button>
          <button onClick={() => alert('تم حفظ وتصدير قاعدة بيانات العملاء بنجاح.')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-white hover:bg-slate-50 border border-daftra-border rounded px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>تصدير العملاء</span>
          </button>
          <button onClick={() => setView('add-client')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3.5 py-2 text-xs font-bold shadow transition-all cursor-pointer">
            <Plus className="w-4 h-4 font-bold" />
            <span>أضف عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Follow-up Stats Bar */}
      <div className="px-4 py-3 bg-gradient-to-l from-blue-50/40 to-transparent border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            موعد المتابعة:
          </span>
          <button onClick={() => handleFollowUpFilter('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
              followUpFilter === 'today' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            اليوم
            <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full text-[10px]">{followUpCounts.today}</span>
          </button>
          <button onClick={() => handleFollowUpFilter('overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
              followUpFilter === 'overdue' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            <AlertCircle className="w-3.5 h-3.5" />
            متأخر
            <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full text-[10px]">{followUpCounts.overdue}</span>
          </button>
          <button onClick={() => handleFollowUpFilter('thisWeek')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
              followUpFilter === 'thisWeek' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            <Clock className="w-3.5 h-3.5" />
            7 أيام
            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px]">{followUpCounts.thisWeek}</span>
          </button>
          <button onClick={() => handleFollowUpFilter('custom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
              followUpFilter === 'custom' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            <Filter className="w-3.5 h-3.5" />
            فلترة
            {selectedDateCount > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px]">{selectedDateCount}</span>}
          </button>
          <button onClick={() => handleFollowUpFilter('all')}
            className={`text-[11px] font-bold px-2 py-1 rounded transition-all ${
              followUpFilter === 'all' ? 'text-slate-800 bg-slate-100' : 'text-slate-400 hover:text-slate-600'
            }`}>
            الكل
          </button>
        </div>

        {showDatePicker && (
          <div className="mt-3 flex items-center gap-3">
            <input type="date" value={customDate} onChange={e => { setCustomDate(e.target.value); setFollowUpFilter('custom'); }}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 [color-scheme:light]" />
            <span className="text-[11px] text-slate-500 font-semibold">
              {selectedDateCount > 0 ? `${selectedDateCount} عميل في هذا التاريخ` : 'لا يوجد عملاء في هذا التاريخ'}
            </span>
            <button onClick={() => { setShowDatePicker(false); setCustomDate(''); setFollowUpFilter('today'); }}
              className="text-[11px] text-slate-400 hover:text-slate-600 font-bold">
              إلغاء
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">الفئة للتصنيف:</span>
          {['all', 'عملاء مميزون', 'شركات ومؤسسات', 'أفراد طباعة', 'قائمة سوداء'].map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full font-bold border transition-all ${
                categoryFilter === cat
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {cat === 'all' && 'الكل'}
              {cat === 'عملاء مميزون' && 'عملاء مميزون'}
              {cat === 'شركات ومؤسسات' && 'مؤسسات وشركات'}
              {cat === 'أفراد طباعة' && 'أفراد فوريين'}
              {cat === 'قائمة سوداء' && 'القائمة السوداء'}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <input type="text" placeholder="ابحث باسم العميل، هاتف، إيميل..."
            value={filterQuery} onChange={e => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-daftra-border rounded text-xs text-right pr-9 focus:outline-none focus:border-daftra-blue" />
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs table-auto">
          <thead className="bg-slate-50/75 border-b border-daftra-border font-bold text-slate-700 select-none">
            <tr>
              <th className="p-3 w-[100px]">كود العميل</th>
              <th className="p-3 w-1/4">الاسم الكامل لجهة التعامل</th>
              <th className="p-3 w-1/5">البريد الإلكتروني</th>
              <th className="p-3 w-1/6">الهاتف / الجوال</th>
              <th className="p-3 w-1/5">العنوان السكني</th>
              <th className="p-3 text-center">التصنيف الحسابي</th>
              <th className="p-3 text-center">موعد المتابعة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr key={client.id} onClick={() => onSelectClient?.(client.id)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="p-3.5 font-mono font-bold text-slate-500">#{client.codeNumber}</td>
                  <td className="p-3 font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${client.type === 'individual' ? 'bg-sky-400' : 'bg-indigo-600'}`} />
                    <span>{client.fullName}</span>
                  </td>
                  <td className="p-3 text-slate-500 font-mono flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-300" />
                    <span>{client.email || '-'}</span>
                  </td>
                  <td className="p-3 font-mono font-semibold text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-300" />
                      <span>{client.mobile || client.phone || '-'}</span>
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 max-w-[200px] truncate">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-300" />
                      <span>{client.city} - {client.address1}</span>
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      client.category === 'عملاء مميزون' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      client.category === 'شركات ومؤسسات' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                      client.category === 'قائمة سوداء' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {client.category}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {client.nextFollowUp ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        client.nextFollowUp === today ? 'bg-teal-100 text-teal-700' :
                        client.nextFollowUp < today ? 'bg-rose-100 text-rose-700' :
                        client.nextFollowUp <= weekEnd ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {(() => { const p = client.nextFollowUp!.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; })()}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[10px]">--</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-10 text-center font-bold text-slate-400 select-none">
                  لا يوجد عملاء يطابقون هذه المواصفات.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}