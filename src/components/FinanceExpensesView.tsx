/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  X,
  Upload,
  Info,
  Check,
  ChevronDown,
  Building,
  AlertCircle,
  Hash,
  Eye,
  Tag,
  Briefcase,
  Users,
  Percent,
  RefreshCw,
  Search,
  Sliders
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
}

interface Expense {
  id: string;
  code: string; // رقم الكود
  amount: number; // المبلغ
  currency: string; // العملة
  description: string; // الوصف
  date: string; // التاريخ
  unit: string; // الوحدة
  seller: string; // البائع
  category: string; // التصنيف
  subAccount: string; // الحساب الفرعي
  vendorId: string; // المورد المرتبط
  vendorName: string;
  taxes: string; // الضرائب
  isRecurring: boolean; // متكرر
  status: 'Draft' | 'Saved';
}

interface FinanceExpensesViewProps {
  setView: (view: string) => void;
}

const mapExpense = (db: any): Expense => ({
  id: db.id,
  code: db.code,
  amount: Number(db.amount),
  currency: db.currency,
  description: db.description,
  date: db.date,
  unit: db.unit,
  seller: db.seller,
  category: db.category,
  subAccount: db.sub_account,
  vendorId: db.vendor_id,
  vendorName: db.vendor_name,
  taxes: db.taxes,
  isRecurring: db.is_recurring,
  status: db.status as 'Draft' | 'Saved',
});

export default function FinanceExpensesView({ setView }: FinanceExpensesViewProps) {
  // Modes: 'list' | 'add'
  const [currentMode, setCurrentMode] = useState<'list' | 'add'>('list');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Search filter states for list page
  const [filterCode, setFilterCode] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Form states for Add Expense
  const [amount, setAmount] = useState('0.00');
  const [currency, setCurrency] = useState('EGP');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [date, setDate] = useState('2026-06-14');
  const [unit, setUnit] = useState('Select Unit');
  const [seller, setSeller] = useState('');
  const [category, setCategory] = useState('');
  const [subAccount, setSubAccount] = useState('آلي');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [taxes, setTaxes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Attachment upload simulation
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Selected Expense View Modal
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

  // Load initial data
  useEffect(() => {
    // Load vendors for dropdown
    const localVendors = localStorage.getItem('daftra_vendors');
    if (localVendors) {
      try {
        setVendors(JSON.parse(localVendors));
      } catch (e) {
        console.error('Error parsing vendors:', e);
      }
    } else {
      // Mock vendors if none exist
      const mockVendors = [
        { id: 'v-1', name: 'الشركة العربية للتوريدات', company: 'العربية', phone: '010023455', email: 'arab@corp.com' },
        { id: 'v-2', name: 'مؤسسة الرياض التجارية', company: 'الرياض ميديا', phone: '011232321', email: 'contact@riyadh.sa' }
      ];
      setVendors(mockVendors);
      localStorage.setItem('daftra_vendors', JSON.stringify(mockVendors));
    }

    // Load expenses from Supabase
    const loadExpenses = async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error loading expenses:', error);
      } else if (data) {
        setExpenses(data.map(mapExpense));
      }
    };
    loadExpenses();
  }, []);

  // Generate next code for expense
  const getNextCode = (list: Expense[]) => {
    if (list.length === 0) return '000001';
    const codes = list.map(e => {
      const num = parseInt(e.code, 10);
      return isNaN(num) ? 0 : num;
    });
    const maxVal = Math.max(...codes, 0);
    return String(maxVal + 1).padStart(6, '0');
  };

  const handleOpenAdd = () => {
    const nextCode = getNextCode(expenses);
    setCode(nextCode);
    setAmount('0.00');
    setCurrency('EGP');
    setDescription('');
    setDate('2026-06-14');
    setUnit('Select Unit');
    setSeller('');
    setCategory('');
    setSubAccount('آلي');
    setSelectedVendorId('');
    setTaxes('');
    setIsRecurring(false);
    setAttachmentName(null);
    setCurrentMode('add');
    setViewingExpense(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachmentName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSaveExpense = async (status: 'Saved' | 'Draft') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('الرجاء إدخال قيمة للمصروف أكبر من صفر.');
      return;
    }

    let vendorName = 'بدون مورد مرتبط';
    if (selectedVendorId) {
      const found = vendors.find(v => v.id === selectedVendorId);
      if (found) {
        vendorName = found.name;
      }
    }

    const { data, error } = await supabase.from('expenses').insert({
      code: code || getNextCode(expenses),
      amount: numAmount,
      currency,
      description,
      date,
      unit: unit === 'Select Unit' ? 'الفرع الافتراضي' : unit,
      seller: seller || 'بائع مالي عام',
      category: category || 'مصروفات تشغيلية عامة',
      sub_account: subAccount,
      vendor_id: selectedVendorId,
      vendor_name: vendorName,
      taxes: taxes || 'لا توجد ضرائب',
      is_recurring: isRecurring,
      status
    }).select().single();

    if (error) {
      console.error('Error saving expense:', error);
      alert('حدث خطأ أثناء حفظ المصروف.');
      return;
    }

    if (data) {
      setExpenses([mapExpense(data), ...expenses]);
    }
    setCurrentMode('list');
  };

  const handleDeleteExpense = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا المصروف نهائياً؟')) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        console.error('Error deleting expense:', error);
        alert('حدث خطأ أثناء حذف المصروف.');
        return;
      }
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  // Filtering calculations
  const filteredExpenses = expenses.filter(exp => {
    if (filterCode && !exp.code.includes(filterCode)) return false;
    if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
    if (filterDateFrom && exp.date < filterDateFrom) return false;
    if (filterDateTo && exp.date > filterDateTo) return false;
    return true;
  });

  // Extract unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(expenses.map(e => e.category).filter(Boolean)));

  return (
    <div id="daftra-finance-expenses-container" className="w-full mx-auto text-right font-sans select-none pb-12 antialiased">
      
      {/* ----------------- MODE 1: EXPENSES LIST VIEW ----------------- */}
      {currentMode === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Action Header Nav */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>المالية</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-extrabold text-[13px]">المصروفات</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${showFilters ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                <Sliders className="w-4 h-4" />
                <span>الفلاتر وحقول البحث</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 bg-[#0074b1] hover:bg-[#005f90] text-white px-4 py-2 rounded-lg transition-all font-bold cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>سند صرف جديد</span>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center flex-row-reverse">
            <h1 className="text-2xl font-black text-[#1a2e40] leading-none">إدارة المصروفات</h1>
            <p className="text-xs text-slate-400 font-bold">متابعة وتسجيل كافة المدفوعات والبنود المخصومة من الحسابات العامة وفروع المنشأة.</p>
          </div>

          {/* Collapsible search filtration panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">رقم الكود</label>
                      <input
                        type="text"
                        placeholder="ابحث برقم المعاملة"
                        value={filterCode}
                        onChange={(e) => setFilterCode(e.target.value)}
                        className="w-full text-right p-2 border border-slate-200 rounded outline-none focus:border-[#0074b1]"
                      />
                    </div>
                    <div className="grid-cols-1 space-y-1">
                      <label className="font-bold text-slate-600 block">التصنيف</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full text-right p-2 border border-slate-200 rounded outline-none cursor-pointer"
                      >
                        <option value="all">كل التصنيفات والبنود</option>
                        {uniqueCategories.map((cat, i) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">من تاريخ</label>
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-full text-center p-1.5 border border-slate-200 rounded outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">إلى تاريخ</label>
                      <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="w-full text-center p-1.5 border border-slate-200 rounded outline-none font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-start gap-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => {
                        setFilterCode('');
                        setFilterCategory('all');
                        setFilterDateFrom('');
                        setFilterDateTo('');
                      }}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold cursor-pointer"
                    >
                      إعادة ضبط الفلتر
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List contents conditional display */}
          {expenses.length === 0 ? (
            /* EMPTY STATE with customized UI and big center button */
            <div id="expenses-empty-state" className="bg-white py-16 px-6 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10" />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-extrabold text-[#2a3a4c] block">
                  لا يوجد مصروفات حالية بعد
                </h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed block">
                  لم تقم بتسجيل أي سندات صرف أو مصروفات مالية في المنشأة حتى الآن. يمكنك تسجيل مصروفك الأول بخطوات سريعة.
                </p>
              </div>

              {/* Big, clean "سند صرف / إضافة مصروف" Action button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-6 py-3 bg-[#0074b1] hover:bg-[#005f90] text-white rounded-lg text-sm font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-2 flex-row-reverse animate-pulse"
              >
                <Plus className="w-5 h-5" />
                <span>إضافة سند صرف للمصروفات</span>
              </button>
            </div>
          ) : (
            /* TABLE VIEW OF CURRENT STORAGE */
            <div className="bg-white rounded-xl border border-slate-205 shadow-xs overflow-hidden">
              <div className="bg-slate-50/70 p-4 border-b border-slate-150 text-right">
                <span className="text-xs font-bold text-slate-700">سندات المصروفات المقيدة</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-550 border-b border-slate-100 font-extrabold">
                      <th className="p-4">كود القيد</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">التصنيف البندي</th>
                      <th className="p-4">الوصف التشغيلي</th>
                      <th className="p-4">البائع المستلم</th>
                      <th className="p-4 text-center">المورد التابع</th>
                      <th className="p-4 text-left">قيمة المصروف</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {filteredExpenses.map((exp) => (
                      <tr
                        key={exp.id}
                        onClick={() => setViewingExpense(exp)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-black text-[#0074b1] font-mono">{exp.code}</td>
                        <td className="p-4 font-mono text-slate-500">{exp.date}</td>
                        <td className="p-4">
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-100">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs truncate text-slate-500" title={exp.description}>
                          {exp.description || '—'}
                        </td>
                        <td className="p-4 text-slate-800">{exp.seller}</td>
                        <td className="p-4 text-center text-slate-500">
                          {exp.vendorName}
                        </td>
                        <td className="p-4 text-left font-mono font-black text-[#1a2e40] text-sm">
                          {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {exp.currency}
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setViewingExpense(exp)}
                            className="p-1 px-2 hover:bg-slate-50 text-[#0074b1] border border-slate-200 rounded text-[11px] font-bold"
                          >
                            عرض السند
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteExpense(exp.id, e)}
                            className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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


      {/* ----------------- MODE 2: DETAILED SLIP DIALOG / MODAL ----------------- */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-xl w-full text-right overflow-hidden flex flex-col">
            
            {/* Modal path representation */}
            <div className="p-4 bg-[#f8fafc] border-b border-slate-150 flex justify-between items-center flex-row-reverse text-xs">
              <span className="text-[#0074b1] font-black">تفاصيل مستند الصرف المصروفي #{viewingExpense.code}</span>
              <button
                onClick={() => setViewingExpense(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt body contents */}
            <div className="p-6 space-y-4">
              
              <div className="flex justify-between items-start flex-row-reverse border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px]">البائع المستحق:</span>
                  <p className="text-base font-black text-slate-800 block">{viewingExpense.seller}</p>
                </div>
                <div className="text-left space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px]">رمز تصنيف البند:</span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[11px] font-extrabold border border-purple-100 inline-block">
                    {viewingExpense.category}
                  </span>
                </div>
              </div>

              {/* Specs detailed card lists */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 text-right">
                  <span className="text-slate-450 block font-bold text-[10px]">تفاصيل الدورة المالية</span>
                  <p className="text-slate-700">رقم الكود المحاسبي: <span className="font-mono text-slate-900 font-bold">{viewingExpense.code}</span></p>
                  <p className="text-slate-700">تاريخ صرف السند: <span className="font-mono text-slate-900 font-bold">{viewingExpense.date}</span></p>
                  <p className="text-slate-700">المقيد بمؤسسة فرعية: <span className="text-slate-800 font-bold">{viewingExpense.unit}</span></p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 text-right">
                  <span className="text-slate-450 block font-bold text-[10px]">التحكم والروابط الإضافية</span>
                  <p className="text-slate-700">الحساب الرئيسي: <span className="text-slate-800 font-bold">الحسابات الفرعية &larr; {viewingExpense.subAccount}</span></p>
                  <p className="text-slate-700">المورد المحاسب: <span className="text-slate-900 font-bold">{viewingExpense.vendorName}</span></p>
                  <p className="text-slate-700">الضريبة المطبقة: <span className="text-slate-650 font-bold">{viewingExpense.taxes}</span></p>
                </div>

              </div>

              {/* Big display for total amount */}
              <div className="bg-[#f0f9ff]/50 p-4 border border-[#0074b1]/30 rounded-lg text-center space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px]">القيمة المقيدة المخصومة</span>
                <span className="text-3xl font-black text-[#0074b1] font-mono leading-none block">
                  {viewingExpense.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {viewingExpense.currency}
                </span>
                <span className="text-[10px] text-slate-500 font-bold block">
                  تأثير ضريبي: {viewingExpense.taxes} ({viewingExpense.isRecurring ? 'متكرر دورياً' : 'دفعة مفردة'})
                </span>
              </div>

              {/* Description explanation notes block */}
              {viewingExpense.description && (
                <div className="bg-slate-50 p-3 rounded border border-slate-205 text-xs select-text">
                  <span className="font-black text-slate-850 block mb-1">📝 وصف توضيحي للمصروف:</span>
                  <p className="text-slate-600 leading-relaxed font-semibold block">{viewingExpense.description}</p>
                </div>
              )}

            </div>

            {/* Bottom Actions footer bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer transition-colors"
              >
                إغلاق النافذة
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0074b1] hover:bg-[#005f90] text-white rounded font-bold cursor-pointer transition-all flex items-center gap-1.5 flex-row-reverse"
              >
                <span>طباعة السند</span>
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ----------------- MODE 3: ADD EXPENSE FORM VIEW (SCREENSHOT EXACT MATCH) ----------------- */}
      {currentMode === 'add' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Form Toolbar: Cancel | Save Dropdown (Left) , Save as Draft (Right) */}
          <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex-row">
            
            {/* Left: Cancel Button and Save Menu */}
            <div className="flex items-center gap-2">
              {/* cancel button (grey text with small gray background, 'X' icon) */}
              <button
                type="button"
                onClick={() => setCurrentMode('list')}
                className="px-4 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-bold text-xs flex items-center gap-1.5 flex-row-reverse cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>إلغاء</span>
              </button>

              {/* save button (green with check icon and dropdown button) */}
              <div className="relative inline-flex">
                <button
                  type="submit"
                  onClick={() => handleSaveExpense('Saved')}
                  className="bg-[#24a148] hover:bg-[#1d8239] text-white px-4 py-2 rounded-r font-extrabold text-xs flex items-center gap-1.5 flex-row-reverse transition-all border-r border-[#1d8239] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
                <div className="bg-[#24a148] hover:bg-[#1d8239] hover:bg-opacity-90 text-white px-2 rounded-l flex items-center justify-center border-l border-emerald-700 cursor-pointer">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Right: Save as Draft title */}
            <div className="flex">
              <button
                type="button"
                onClick={() => handleSaveExpense('Draft')}
                className="px-4 py-2 bg-[#e2e8f0]/80 hover:bg-[#cbd5e1] text-slate-700 rounded font-bold text-xs cursor-pointer transition-all border border-slate-300"
              >
                حفظ كمسودة
              </button>
            </div>

          </div>

          {/* Form Breadcrumb Row resembling screenshot hierarchy */}
          <div className="flex items-center gap-1.5 flex-row-reverse text-xs text-slate-400 font-extrabold">
            <span className="text-[#0a78b4] hover:underline cursor-pointer" onClick={() => setCurrentMode('list')}>المصروفات</span>
            <span className="text-slate-300 font-normal">/</span>
            <span className="text-slate-800 font-black">إضافة</span>
          </div>

          {/* Screenshot Form Container card */}
          <div className="bg-[#f8fafc] rounded-xl border border-slate-200 p-8 space-y-6 shadow-xs">
            
            {/* Major grid rows matching the input boxes inside the white inner area */}
            <div className="bg-white p-6 rounded-lg border border-slate-205 shadow-xs space-y-5 text-right text-xs font-semibold">
              
              {/* Row 1 matching the top element grid: Amount, description & Attachments */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* 1. المبلغ (Amount) - Right side (cols 4) */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">المبلغ</label>
                  <div className="flex rounded border border-slate-200 bg-white overflow-hidden focus-within:border-[#0074b1]">
                    {/* Currency selection element */}
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="p-2.5 bg-slate-50 text-slate-600 border-l border-slate-200 outline-none font-bold text-center cursor-pointer text-[11px]"
                    >
                      <option value="EGP">EGP</option>
                      <option value="SAR">SAR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">USD</option>
                    </select>

                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onClick={() => { if (amount === '0.00') setAmount(''); }}
                      onChange={(e) => setAmount(e.target.value)}
                      onBlur={() => { if (!amount) setAmount('0.00'); }}
                      className="w-full p-2.5 text-center font-bold text-slate-800 font-mono outline-none text-base bg-white"
                      required
                    />
                  </div>
                </div>

                {/* 2. الوصف (Description) - Middle (cols 4) */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">الوصف</label>
                  <textarea
                    rows={2}
                    value={description}
                    placeholder="تفاصيل وسبب سند صرف المصروفات..."
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 text-right border border-slate-200 rounded min-h-[44px] outline-none focus:border-[#0074b1] font-semibold text-[11px]"
                  />
                </div>

                {/* 3. المرفقات (Attachments) - Left side (cols 4) */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px] text-right">المرفقات</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${isDragging ? 'bg-[#0074b1]/5 border-[#0074b1]' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'}`}
                  >
                    <input
                      type="file"
                      id="expense-attachment-input"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                    
                    <div className="flex items-center gap-1.5 text-[#0074b1] text-[10px] font-bold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>افلت الملف هنا او اختر من جهازك</span>
                    </div>

                    {attachmentName ? (
                      <span className="text-[10px] text-emerald-600 font-bold line-clamp-1">
                        📎 {attachmentName}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400">ملفات PDF أو صورة الفاتورة</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Row 2 matching screenshot layout: Code | Date | Unit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                
                {/* 4. رقم الكود * (Code Number) - Mandatory with red asterisk */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center flex-row-reverse text-[11px]">
                    <span className="font-extrabold text-slate-650 block">رقم الكود <span className="text-rose-500">*</span></span>
                    <button type="button" className="text-slate-400 hover:text-slate-600 block" title="تعديل يدوي">
                      ✏️
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full text-center p-2 border border-slate-200 rounded font-mono outline-none font-bold focus:border-[#0074b1]"
                  />
                </div>

                {/* 5. التاريخ (Date) */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">التاريخ</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-right p-2 border border-slate-200 rounded outline-none font-mono font-bold focus:border-[#0074b1]"
                  />
                </div>

                {/* 6. الوحدة (Unit) */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">الوحدة</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-right p-2 border border-slate-200 rounded outline-none cursor-pointer font-bold focus:border-[#0074b1]"
                  >
                    <option value="Select Unit">Select Unit</option>
                    <option value="الفرع الرئيسي">الفرع الرئيسي</option>
                    <option value="فرع الرياض">فرع الرياض</option>
                    <option value="المستودع الرئيسي">المستودع الرئيسي</option>
                  </select>
                </div>

              </div>

              {/* Row 3 matching screenshot: Seller | Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                
                {/* 7. البائع (Seller) */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">البائع</label>
                  <select
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-205 rounded outline-none cursor-pointer focus:border-[#0074b1]"
                  >
                    <option value="">إختر البائع او المستحق</option>
                    <option value="شركة الغاز">شركة الغاز الطبيعي</option>
                    <option value="إدارة العقار">إدارة مالك العقار المالي</option>
                    <option value="شركة الكهرباء الوطنية">شركة الكهرباء الوطنية</option>
                    <option value="مكتبة الفاروق الكبرى">مكتبة الفاروق الكبرى</option>
                  </select>
                </div>

                {/* 8. التصنيف (Category) */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-205 rounded outline-none cursor-pointer focus:border-[#0074b1]"
                  >
                    <option value="">(إضافة تصنيف البند)</option>
                    <option value="المرافق العامة والصيانة">المرافق العامة والصيانة</option>
                    <option value="أدوات مكتبية ومطبوعات">أدوات مكتبية ومطبوعات</option>
                    <option value="مصاريف رواتب وتأمينات">مصاريف رواتب وتأمينات</option>
                    <option value="إيجار فروع ومكاتب">إيجار فروع ومكاتب</option>
                    <option value="مصاريف شحن ولوجستيات">مصاريف شحن ولوجستيات</option>
                  </select>
                </div>

              </div>

              {/* Row 4: Sub-account | Vendor selection with links and options */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-t border-slate-100 pt-4">
                
                {/* 9. الحساب الفرعي (Sub-account) - Cols 4 */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">الحساب الفرعي</label>
                  <select
                    value={subAccount}
                    onChange={(e) => setSubAccount(e.target.value)}
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded font-bold outline-none text-slate-600 text-[11px]"
                  >
                    <option value="آلي">آلي (توليد محاسبي ذكي)</option>
                    <option value="حساب مصاريف التشغيل">حساب مصاريف التشغيل #501</option>
                    <option value="حساب مصاريف إدارية وعمومية">حساب مصاريف إدارية وعمومية #502</option>
                  </select>
                </div>

                {/* 10. المورد (Vendor) - with a small blue '+ جديد' button and a 'متعدد' toggle - Cols 4 */}
                <div className="md:col-span-4 space-y-1.5">
                  <div className="flex justify-between items-center flex-row-reverse text-[11.5px] font-bold">
                    <span>المورد</span>
                    <div className="flex items-center gap-1.5 flex-row-reverse">
                      <button 
                        type="button" 
                        onClick={() => setView('purchase-vendors')}
                        className="text-[#0074b1] hover:underline cursor-pointer"
                      >
                        + جديد
                      </button>
                      <span className="text-slate-300">|</span>
                      <button type="button" className="text-[#0a78b4] hover:underline cursor-pointer font-extrabold">متعدد</button>
                    </div>
                  </div>

                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-200 rounded outline-none cursor-pointer focus:border-[#0074b1] text-[11px]"
                  >
                    <option value="">اختر مورد</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                {/* 11. الضرائب (Taxes) - with '+ إضافة ضرائب' link - Cols 4 */}
                <div className="md:col-span-4 space-y-1.5">
                  <div className="flex justify-between items-center flex-row-reverse text-[11.5px] font-bold">
                    <span>الضرائب</span>
                    <button type="button" className="text-[#0074b1] hover:underline font-extrabold cursor-pointer">
                      + إضافة ضرائب
                    </button>
                  </div>
                  
                  <select
                    value={taxes}
                    onChange={(e) => setTaxes(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-200 rounded outline-none focus:border-[#0074b1] text-[11px] font-semibold"
                  >
                    <option value="">إختر معاملة الضريبة</option>
                    <option value="قيمة مضافة 14%">ضريبة القيمة المضافة 14%</option>
                    <option value="ضريبة جدول 5%">ضريبة جدول 5%</option>
                    <option value="لا توجد ضرائب">لا توجد ضرائب (معفى)</option>
                  </select>
                </div>

              </div>

              {/* Row 5 Checklist options matching screenshot footer area with checkbox */}
              <div className="flex items-center justify-between flex-row-reverse border-t border-slate-100 pt-4 text-[11.5px]">
                
                {/* Checkbox for متكرر (Recurring) */}
                <div className="flex items-center gap-2 flex-row-reverse">
                  <input
                    type="checkbox"
                    id="isRecurringCheckbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0074b1] focus:ring-[#0074b1] cursor-pointer"
                  />
                  <label htmlFor="isRecurringCheckbox" className="font-extrabold text-slate-705 cursor-pointer selection:bg-transparent">
                    متكرر (إنشاء قيود وصرف دوري تلقائي)
                  </label>
                </div>

                <div className="flex text-slate-400 font-bold block">
                  ⚙️ سيتم تحديث شجرة الحسابات والدفتر العام تلقائياً فور الحفظ.
                </div>

              </div>

            </div>

            {/* Sticky/Sub Save Buttons Bar at bottom as backup matching native Daftra form */}
            <div className="flex justify-start gap-2.5 bg-white p-4 rounded-lg border border-slate-200/80 flex-row">
              <button
                type="button"
                onClick={() => handleSaveExpense('Saved')}
                className="px-6 py-2.5 bg-[#24a148] hover:bg-[#1d8239] text-white rounded text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1 flex-row"
              >
                <Check className="w-4 h-4" />
                <span>حفظ المصروف</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentMode('list')}
                className="px-5 py-2.5 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                الرجوع للقائمة
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
