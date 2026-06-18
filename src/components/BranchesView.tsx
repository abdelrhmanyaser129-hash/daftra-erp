import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Edit3, Trash2, Check, X, Building2, MapPin, Hash } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
  status: string;
  created_at: string;
}

interface BranchesViewProps {
  setView: (view: string) => void;
}

export default function BranchesView({ setView }: BranchesViewProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState('نشط');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    const { data } = await supabase.from('branches').select('*').order('name');
    if (data) setBranches(data as Branch[]);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormCode('');
    setFormLocation('');
    setFormStatus('نشط');
    setShowForm(true);
  };

  const handleEdit = (b: Branch) => {
    setEditingId(b.id);
    setFormName(b.name);
    setFormCode(b.code || '');
    setFormLocation(b.location || '');
    setFormStatus(b.status || 'نشط');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { alert('الرجاء إدخال اسم الفرع'); return; }
    const payload = {
      name: formName.trim(),
      code: formCode.trim(),
      location: formLocation.trim(),
      status: formStatus,
    };
    if (editingId) {
      const { error } = await supabase.from('branches').update(payload).eq('id', editingId);
      if (error) { alert('فشل تحديث الفرع: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('branches').insert(payload);
      if (error) { alert('فشل إنشاء الفرع: ' + error.message); return; }
    }
    setShowForm(false);
    setEditingId(null);
    loadBranches();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) { alert('فشل حذف الفرع: ' + error.message); return; }
    loadBranches();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 text-right font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-md border border-[#d4e1ed]">
        <div className="flex items-center gap-2 flex-row-reverse">
          <button onClick={() => setView('dashboard')} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">إدارة الفروع</h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#0074b1] hover:bg-[#005a8c] text-white px-4 h-8 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة فرع</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-800 mb-4">{editingId ? 'تعديل الفرع' : 'إضافة فرع جديد'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم الفرع <span className="text-rose-500">*</span></label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">كود الفرع</label>
                <input type="text" value={formCode} onChange={e => setFormCode(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الموقع</label>
                <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-right focus:outline-none focus:border-[#0074b1]" />
              </div>
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
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ</span>
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="bg-white border border-slate-300 text-slate-600 px-4 h-8 rounded text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branches Table */}
      <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden">
        <div className="bg-[#fcfdfe] px-4 py-2.5 border-b border-[#e9eff4]">
          <span className="text-slate-800 font-bold block">قائمة الفروع</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold">
              <tr>
                <th className="text-right px-4 py-2.5">الاسم</th>
                <th className="text-right px-4 py-2.5">الكود</th>
                <th className="text-right px-4 py-2.5">الموقع</th>
                <th className="text-right px-4 py-2.5">الحالة</th>
                <th className="text-center px-4 py-2.5">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">لا توجد فروع مضافة بعد</td></tr>
              )}
              {branches.map(b => (
                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600">{b.code || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600">{b.location || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'نشط' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(b)} className="p-1 hover:bg-blue-50 rounded cursor-pointer text-slate-400 hover:text-blue-600 transition-colors" title="تعديل">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-1 hover:bg-red-50 rounded cursor-pointer text-slate-400 hover:text-red-600 transition-colors" title="حذف">
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
