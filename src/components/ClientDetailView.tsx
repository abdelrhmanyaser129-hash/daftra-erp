import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Phone, Calendar, Weight, Activity, MessageCircle,
  ArrowRight, Plus, Trash2, Save, X, Edit3, Scale,
  FileText, TrendingUp, TrendingDown, Minus, Target, Clock
} from 'lucide-react';
import { Client, WeightRecord } from '../types';
import { supabase } from '../lib/supabase';

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
}

const formatDate = (d: string) => {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
};

const todayStr = () => new Date().toISOString().split('T')[0];

export default function ClientDetailView({ clientId, onBack }: ClientDetailViewProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(todayStr());
  const [formWeight, setFormWeight] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [targetWeightVal, setTargetWeightVal] = useState('');
  const [startDateVal, setStartDateVal] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const loadClient = useCallback(async () => {
    const { data } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (data) {
      setClient({
        id: data.id,
        type: data.type || 'individual',
        fullName: data.full_name || '',
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        mobile: data.mobile || '',
        address1: data.address1 || '',
        address2: data.address2 || '',
        city: data.city || '',
        region: data.region || '',
        zipCode: data.zip_code || '',
        country: data.country || '',
        commercialRegistry: data.commercial_registry || '',
        taxCard: data.tax_card || '',
        nationalId: data.national_id || '',
        codeNumber: data.code_number || '',
        currency: data.currency || 'EGP',
        notes: data.notes || '',
        category: data.category || '',
        billingMethod: data.billing_method || '',
        startDate: data.start_date || '',
        targetWeight: data.target_weight || 0,
        nextFollowUp: data.next_follow_up || '',
        lastWeight: data.last_weight || 0,
        followUpCount: data.follow_up_count || 0,
      });
      setFollowUpDate(data.next_follow_up || '');
      setTargetWeightVal(data.target_weight ? String(data.target_weight) : '');
      setStartDateVal(data.start_date || '');
    }
    setLoading(false);
  }, [clientId]);

  const loadWeights = useCallback(async () => {
    const { data } = await supabase
      .from('weight_records')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();
    if (data) {
      setWeightRecords([{
        id: data.id,
        clientId: data.client_id,
        date: data.date || '',
        weight: data.weight,
        notes: data.notes || '',
      }]);
    } else {
      setWeightRecords([]);
    }
  }, [clientId]);

  const loadNotes = useCallback(async () => {
    const { data } = await supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();
    if (data) {
      setGeneralNotes(data.content || '');
    }
  }, [clientId]);

  useEffect(() => {
    loadClient();
    loadWeights();
    loadNotes();
  }, [loadClient, loadWeights, loadNotes]);

  const currentRecord = weightRecords[0] || null;
  const followUpCount = currentRecord ? 1 : 0;
  const targetDiff = currentRecord && parseFloat(targetWeightVal) ? currentRecord.weight - parseFloat(targetWeightVal) : 0;

  const autoSaveFollowUp = async (val: string) => {
    setFollowUpDate(val);
    await supabase.from('clients').update({ next_follow_up: val }).eq('id', clientId);
  };

  const autoSaveTargetWeight = async (val: string) => {
    setTargetWeightVal(val);
    const num = parseFloat(val) || 0;
    await supabase.from('clients').update({ target_weight: num }).eq('id', clientId);
  };

  const autoSaveStartDate = async (val: string) => {
    setStartDateVal(val);
    await supabase.from('clients').update({ start_date: val }).eq('id', clientId);
  };

  const handleAdd = async () => {
    if (!formWeight || !formDate) return;
    const { data: existing } = await supabase.from('weight_records').select('id').eq('client_id', clientId).maybeSingle();
    if (existing) {
      await supabase.from('weight_records').update({ date: formDate, weight: parseFloat(formWeight), notes: formNotes }).eq('id', existing.id);
      setWeightRecords([{ id: existing.id, clientId: clientId, date: formDate, weight: parseFloat(formWeight), notes: formNotes }]);
    } else {
      const { data, error } = await supabase.from('weight_records').insert({ client_id: clientId, date: formDate, weight: parseFloat(formWeight), notes: formNotes }).select().single();
      if (error) { alert('خطأ في الحفظ: ' + error.message); return; }
      if (data) setWeightRecords([{ id: data.id, clientId: data.client_id, date: data.date, weight: data.weight, notes: data.notes || '' }]);
    }
    await supabase.from('clients').update({ last_weight: parseFloat(formWeight), follow_up_count: 1 }).eq('id', clientId);
    setShowAddForm(false);
    resetForm();
  };

  const handleEdit = (record: WeightRecord) => {
    setEditingId(record.id);
    setFormDate(record.date);
    setFormWeight(record.weight.toString());
    setFormNotes(record.notes);
    setShowAddForm(true);
  };

  const handleUpdate = async () => {
    if (!formWeight || !formDate || !editingId) return;
    const { error } = await supabase
      .from('weight_records')
      .update({ date: formDate, weight: parseFloat(formWeight), notes: formNotes })
      .eq('id', editingId);
    if (error) { alert('خطأ في التحديث: ' + error.message); return; }
    setWeightRecords(prev => prev.map(r =>
      r.id === editingId ? { ...r, date: formDate, weight: parseFloat(formWeight), notes: formNotes } : r
    ));
    await supabase.from('clients').update({ last_weight: parseFloat(formWeight) }).eq('id', clientId);
    setEditingId(null);
    setShowAddForm(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('weight_records').delete().eq('id', id);
    if (error) { alert('خطأ في الحذف: ' + error.message); return; }
    setWeightRecords([]);
    await supabase.from('clients').update({ last_weight: null, follow_up_count: 0 }).eq('id', clientId);
  };

  const resetForm = () => {
    setFormDate(todayStr());
    setFormWeight('');
    setFormNotes('');
    setEditingId(null);
  };

  const handleSaveNotes = async () => {
    const existing = await supabase.from('client_notes').select('id').eq('client_id', clientId).maybeSingle();
    if (existing.data) {
      await supabase.from('client_notes').update({ content: generalNotes }).eq('client_id', clientId);
    } else {
      await supabase.from('client_notes').insert({ client_id: clientId, content: generalNotes });
    }
  };

  const normalizePhone = (phone: string): string => {
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('00')) p = p.slice(2);
    if (p.startsWith('0')) p = '20' + p.slice(1);
    if (!p.startsWith('20')) p = '20' + p;
    return p;
  };

  const openWhatsApp = () => {
    const phone = client?.phone || client?.mobile || '';
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) return;
    const weightStr = currentRecord ? `${currentRecord.weight} كجم` : 'غير مسجل';
    const targetStr = parseFloat(targetWeightVal) ? `${targetWeightVal} كجم` : 'غير محدد';
    const diffStr = currentRecord && parseFloat(targetWeightVal)
      ? (Math.abs(targetDiff).toFixed(1) + (targetDiff > 0 ? ' كجم زيادة' : ' كجم نقص'))
      : '--';
    const notesStr = currentRecord?.notes || 'لا يوجد';
    const followUpStr = followUpDate ? formatDate(followUpDate) : 'غير محدد';
    const msg = encodeURIComponent(
      `مرحباً ${client?.fullName || 'العميل'}\n\nملخص المتابعة الخاص بك:\n• آخر وزن: ${weightStr}\n• عدد المتابعات: ${followUpCount}\n• الوزن المستهدف: ${targetStr}\n• الفرق المتبقي: ${diffStr}\n• موعد المتابعة القادمة: ${followUpStr}\n\nنتمنى لك التوفيق والاستمرار في تحقيق أهدافك.\n\nملاحظات:\n${notesStr}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  if (!client) {
    return (
      <div className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 text-slate-800 antialiased animate-fadeIn leading-relaxed">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-black text-slate-500">العميل غير موجود</h2>
          <button onClick={onBack} className="mt-4 text-[#1E88E5] font-bold text-sm hover:underline cursor-pointer">
            العودة لقائمة العملاء
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 text-slate-800 antialiased animate-fadeIn leading-relaxed" dir="rtl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1E88E5]/10 flex items-center justify-center">
            <User className="w-6 h-6 text-[#1E88E5]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{client.fullName}</h1>
            <p className="text-xs text-slate-400 font-semibold">ملخص متابعة العميل وبياناته</p>
          </div>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 transition-all font-bold text-sm cursor-pointer">
          <ArrowRight className="w-4 h-4 shrink-0" />
          <span>العودة للقائمة</span>
        </button>
      </div>

      {/* Client Info Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <User className="w-4.5 h-4.5 text-[#1E88E5]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold">الاسم</p>
            <p className="text-xs font-black text-slate-800 truncate">{client.fullName}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Phone className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold">الهاتف</p>
            <p className="text-xs font-black text-slate-800 truncate" dir="ltr">{client.phone || client.mobile || '-'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Calendar className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold">تاريخ بداية المتابعة</p>
            <input type="date" value={startDateVal} onChange={e => autoSaveStartDate(e.target.value)}
              className="text-xs font-black text-slate-800 bg-transparent border-none p-0 focus:outline-none cursor-pointer [color-scheme:light]" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <Weight className="w-4.5 h-4.5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold">آخر وزن</p>
            <p className="text-xs font-black text-slate-800">
              {currentRecord ? `${currentRecord.weight} كجم` : '--'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5 text-rose-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold">عدد المتابعات</p>
            <p className="text-xs font-black text-slate-800">{followUpCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
            {targetDiff > 0 ? <TrendingUp className="w-4.5 h-4.5 text-red-500" /> :
             targetDiff < 0 ? <TrendingDown className="w-4.5 h-4.5 text-emerald-500" /> :
             <Minus className="w-4.5 h-4.5 text-slate-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold">الفرق عن الهدف</p>
            <p className={`text-xs font-black ${targetDiff > 0 ? 'text-red-500' : targetDiff < 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
              {targetDiff !== 0 ? `${targetDiff > 0 ? '+' : ''}${targetDiff.toFixed(1)} كجم` : 'حقق الهدف'}
            </p>
          </div>
        </div>
      </div>

      {/* Second Row: Target Weight + Next Follow-up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 font-bold mb-1">الوزن المستهدف (كجم)</p>
            <input type="number" step="0.1" min="0" value={targetWeightVal}
              onChange={e => autoSaveTargetWeight(e.target.value)}
              placeholder="أدخل الوزن المستهدف"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 [appearance:textfield]" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 font-bold mb-1">موعد المتابعة القادمة</p>
            <input type="date" value={followUpDate}
              onChange={e => autoSaveFollowUp(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer [color-scheme:light]" />
          </div>
        </div>
      </div>

      {/* WhatsApp + Notes Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center justify-center gap-3">
          <button onClick={openWhatsApp}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95 cursor-pointer">
            <MessageCircle className="w-7 h-7" />
          </button>
          <p className="text-xs font-bold text-slate-600">إرسال عبر واتساب</p>
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            يتم إنشاء رسالة تحتوي على آخر وزن وتاريخ تلقائياً
          </p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#1E88E5]" />
              ملاحظات عامة
            </h3>
            <button onClick={handleSaveNotes}
              className="flex items-center gap-1 bg-[#1E88E5] hover:bg-[#1976D2] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer">
              <Save className="w-3.5 h-3.5" />
              حفظ
            </button>
          </div>
          <textarea
            value={generalNotes}
            onChange={e => setGeneralNotes(e.target.value)}
            placeholder="أضف ملاحظات عامة عن العميل..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/20 focus:border-[#1E88E5] transition-all resize-none min-h-[80px]"
          />
        </div>
      </div>

      {/* Weight Tracking Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4.5 h-4.5 text-[#1E88E5]" />
            <h2 className="text-sm font-black text-slate-800">جدول متابعة الوزن</h2>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
              {currentRecord ? 1 : 0} تسجيل
            </span>
          </div>
          {!showAddForm && (
            <button onClick={() => { resetForm(); setShowAddForm(true); }}
              className="flex items-center gap-1.5 bg-[#1E88E5] hover:bg-[#1976D2] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#1E88E5]/20 cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              إضافة قياس جديد
            </button>
          )}
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              ref={formRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-100"
            >
              <div className="p-5 bg-slate-50/50 space-y-4">
                <div className="flex items-center gap-2">
                  {editingId ? <Edit3 className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-emerald-500" />}
                  <h3 className="text-sm font-bold text-slate-700">{editingId ? 'تعديل القياس' : 'إضافة قياس جديد'}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">التاريخ</label>
                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/20 [color-scheme:light]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">الوزن (كجم)</label>
                    <div className="relative">
                      <input type="number" step="0.1" min="0" value={formWeight} onChange={e => setFormWeight(e.target.value)}
                        placeholder="مثال: 85"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/20" />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">كجم</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">الملاحظات</label>
                    <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)}
                      placeholder="ملاحظات القياس..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/20" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={editingId ? handleUpdate : handleAdd}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    <Save className="w-3.5 h-3.5" />
                    {editingId ? 'تحديث' : 'حفظ'}
                  </button>
                  <button onClick={() => { setShowAddForm(false); resetForm(); }}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                <th className="p-3.5 pr-5">التاريخ</th>
                <th className="p-3.5">الوزن</th>
                <th className="p-3.5">الملاحظات</th>
                <th className="p-3.5 pl-5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!currentRecord ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Scale className="w-8 h-8 text-slate-300" />
                      <span className="font-bold text-sm">لا يوجد وزن مسجل</span>
                      <span className="text-[11px]">اضغط "إضافة قياس جديد" لتسجيل أول قياس</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5 pr-5 font-semibold text-slate-700">{formatDate(currentRecord.date)}</td>
                  <td className="p-3.5">
                    <span className="font-black text-slate-800 font-mono text-sm">{currentRecord.weight}</span>
                    <span className="text-[10px] text-slate-400 mr-1">كجم</span>
                  </td>
                  <td className="p-3.5 text-slate-500 font-semibold max-w-[200px] truncate">{currentRecord.notes || '-'}</td>
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => handleEdit(currentRecord)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(currentRecord.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {currentRecord && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
              <Weight className="w-3.5 h-3.5 text-purple-400" />
              <span>آخر وزن: <span className="font-black text-slate-800">{currentRecord.weight} كجم</span></span>
              <span className="text-slate-300">|</span>
              <span>{formatDate(currentRecord.date)}</span>
              {followUpDate && (
                <>
                  <span className="text-slate-300">|</span>
                  <Clock className="w-3 h-3 text-teal-400" />
                  <span>المتابعة القادمة: <span className="font-black text-slate-800">{formatDate(followUpDate)}</span></span>
                </>
              )}
            </div>
            <button onClick={openWhatsApp}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-[11px] font-bold transition-all cursor-pointer">
              <MessageCircle className="w-3.5 h-3.5" />
              مشاركة عبر واتساب
            </button>
          </div>
        )}
      </div>

    </div>
  );
}