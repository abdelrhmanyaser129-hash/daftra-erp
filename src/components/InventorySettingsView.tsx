import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Edit3, Trash2, Check, X, Building2, MapPin, Hash, Tag, Award, Layers } from 'lucide-react';

type TabId = 'branches' | 'categories' | 'brands';

interface Branch {
  id: string; name: string; code: string; location: string; status: string; created_at: string;
}
interface CatItem {
  id: string; name: string; status: string; created_at: string;
}
interface BrandItem {
  id: string; name: string; status: string; created_at: string;
}

interface InventorySettingsViewProps {
  setView: (view: string) => void;
}

export default function InventorySettingsView({ setView }: InventorySettingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('branches');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<CatItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState('نشط');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [b, c, br] = await Promise.all([
      supabase.from('branches').select('*').order('name'),
      supabase.from('product_categories').select('*').order('name'),
      supabase.from('product_brands').select('*').order('name'),
    ]);
    if (b.data) setBranches(b.data as Branch[]);
    if (c.data) setCategories(c.data as CatItem[]);
    if (br.data) setBrands(br.data as BrandItem[]);
  };

  const tableName = (): string => {
    switch (activeTab) {
      case 'branches': return 'branches';
      case 'categories': return 'product_categories';
      case 'brands': return 'product_brands';
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormCode('');
    setFormLocation('');
    setFormStatus('نشط');
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCode(item.code || '');
    setFormLocation(item.location || '');
    setFormStatus(item.status || 'نشط');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = activeTab === 'branches' ? 'الفرع' : activeTab === 'categories' ? 'التصنيف' : 'الماركة';
    if (!formName.trim()) { alert(`الرجاء إدخال اسم ${label}`); return; }
    const tbl = tableName();
    const payload: any = { name: formName.trim(), status: formStatus };
    if (activeTab === 'branches') {
      payload.code = formCode.trim();
      payload.location = formLocation.trim();
    }
    if (editingId) {
      const { error } = await supabase.from(tbl).update(payload).eq('id', editingId);
      if (error) { alert(`فشل تحديث ${label}: ${error.message}`); return; }
    } else {
      const { error } = await supabase.from(tbl).insert(payload);
      if (error) { alert(`فشل إنشاء ${label}: ${error.message}`); return; }
    }
    setShowForm(false);
    setEditingId(null);
    loadAll();
  };

  const handleDelete = async (id: string) => {
    const label = activeTab === 'branches' ? 'الفرع' : activeTab === 'categories' ? 'التصنيف' : 'الماركة';
    if (!window.confirm(`هل أنت متأكد من حذف ${label}؟`)) return;
    const { error } = await supabase.from(tableName()).delete().eq('id', id);
    if (error) { alert(`فشل حذف ${label}: ${error.message}`); return; }
    loadAll();
  };

  const tabs: { id: TabId; label: string; icon: any; count: number }[] = [
    { id: 'branches', label: 'الفروع', icon: Building2, count: branches.length },
    { id: 'categories', label: 'التصنيفات', icon: Tag, count: categories.length },
    { id: 'brands', label: 'الماركات', icon: Award, count: brands.length },
  ];

  const activeList = activeTab === 'branches' ? branches : activeTab === 'categories' ? categories : brands;
  const hasCode = activeTab === 'branches';
  const hasLocation = activeTab === 'branches';
  const addLabel = activeTab === 'branches' ? 'إضافة فرع' : activeTab === 'categories' ? 'إضافة تصنيف' : 'إضافة ماركة';

  return (
    <div className="max-w-5xl mx-auto space-y-4 text-right font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-md border border-[#d4e1ed]">
        <div className="flex items-center gap-2 flex-row-reverse">
          <button onClick={() => setView('dashboard')} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <Layers className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-bold text-slate-800">إعدادات المخزون</h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#0074b1] hover:bg-[#005a8c] text-white px-4 h-8 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{addLabel}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden">
        <div className="flex border-b border-[#e9eff4] bg-[#fcfdfe]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#0074b1] border-b-2 border-[#0074b1] bg-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0074b1]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-[#0074b1]/10 text-[#0074b1]' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold text-slate-800 mb-4">
                {editingId ? 'تعديل' : 'إضافة'} {activeTab === 'branches' ? 'فرع' : activeTab === 'categories' ? 'تصنيف' : 'ماركة'}
              </h3>
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    الاسم <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
                </div>
                {hasCode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">كود الفرع</label>
                    <input type="text" value={formCode} onChange={e => setFormCode(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
                  </div>
                )}
                {hasLocation && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الموقع</label>
                    <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الحالة</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-right focus:outline-none focus:border-[#0074b1]">
                    <option value="نشط">نشط</option>
                    <option value="غير نشط">غير نشط</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-4 h-8 rounded text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /><span>حفظ</span>
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="bg-white border border-slate-300 text-slate-600 px-4 h-8 rounded text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /><span>إلغاء</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold">
              <tr>
                <th className="text-right px-4 py-2.5">الاسم</th>
                {hasCode && <th className="text-right px-4 py-2.5">الكود</th>}
                {hasLocation && <th className="text-right px-4 py-2.5">الموقع</th>}
                <th className="text-right px-4 py-2.5">الحالة</th>
                <th className="text-center px-4 py-2.5">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {activeList.length === 0 && (
                <tr><td colSpan={hasCode ? 5 : 3} className="text-center py-8 text-slate-400">
                  لا توجد {activeTab === 'branches' ? 'فروع' : activeTab === 'categories' ? 'تصنيفات' : 'ماركات'} مضافة بعد
                </td></tr>
              )}
              {activeList.map((item: any) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {activeTab === 'branches' && <Building2 className="w-4 h-4 text-slate-400" />}
                      {activeTab === 'categories' && <Tag className="w-4 h-4 text-slate-400" />}
                      {activeTab === 'brands' && <Award className="w-4 h-4 text-slate-400" />}
                      <span className="font-bold text-slate-700">{item.name}</span>
                    </div>
                  </td>
                  {hasCode && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-600">{item.code || '—'}</span>
                      </div>
                    </td>
                  )}
                  {hasLocation && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-600">{item.location || '—'}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'نشط' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1 hover:bg-blue-50 rounded cursor-pointer text-slate-400 hover:text-blue-600 transition-colors" title="تعديل">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-red-50 rounded cursor-pointer text-slate-400 hover:text-red-600 transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
