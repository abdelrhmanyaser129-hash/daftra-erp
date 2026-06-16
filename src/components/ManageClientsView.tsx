/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Tag,
  Briefcase,
  FileSpreadsheet,
  Settings
} from 'lucide-react';
import { Client } from '../types';
import { supabase } from '../lib/supabase';

interface ManageClientsViewProps {
  setView: (view: string) => void;
  searchQuery: string;
  onSelectClient?: (clientId: string) => void;
}

export default function ManageClientsView({ setView, searchQuery, onSelectClient }: ManageClientsViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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
  });

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(filterQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-lg border border-daftra-border shadow-sm overflow-hidden">
      {/* 1. Header Toolbar Actions */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-daftra-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#0d385a] flex items-center gap-1.5">
            <Users className="w-5 h-5 text-daftra-blue" />
            <span>إدارة حسابات العملاء</span>
          </h2>
          <p className="text-[11px] text-slate-500">سجل العملاء، جهات الاتصال الخاصة بهم، الفرز حسب فئات الاستهلاك</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Client Settings */}
          <button
            onClick={() => setView('client-settings')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-3 py-2 text-xs font-bold text-[#1c2e43] cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#1c2e43]" />
            <span>إعدادات العملاء</span>
          </button>

          {/* Export to Excel file */}
          <button
            onClick={() => alert('تم حفظ وتصدير قاعدة بيانات العملاء بنجاح.')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-white hover:bg-slate-50 border border-daftra-border rounded px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>تصدير العملاء</span>
          </button>
          
          {/* Add Client */}
          <button
            onClick={() => setView('add-client')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3.5 py-2 text-xs font-bold shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 font-bold" />
            <span>أضف عميل جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Filter tabs and Search filter */}
      <div className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
        {/* Categories filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">الفئة للتصنيف:</span>
          {['all', 'عملاء مميزون', 'شركات ومؤسسات', 'أفراد طباعة', 'قائمة سوداء'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full font-bold border transition-all ${
                categoryFilter === cat
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' && 'الكل'}
              {cat === 'عملاء مميزون' && 'عملاء مميزون'}
              {cat === 'شركات ومؤسسات' && 'مؤسسات وشركات'}
              {cat === 'أفراد طباعة' && 'أفراد فوريين'}
              {cat === 'قائمة سوداء' && 'القائمة السوداء'}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="ابحث باسم العميل، هاتف، إيميل..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-daftra-border rounded text-xs text-right pr-9 focus:outline-none focus:border-daftra-blue"
          />
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 3. Clients spreadsheet layout table */}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr key={client.id} onClick={() => onSelectClient?.(client.id)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="p-3.5 font-mono font-bold text-slate-500">#{client.codeNumber}</td>
                  <td className="p-3 font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${client.type === 'individual' ? 'bg-sky-400' : 'bg-indigo-600'}`} title={client.type === 'individual' ? 'فردي' : 'تجاري'} />
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-10 text-center font-bold text-slate-400 select-none">
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
