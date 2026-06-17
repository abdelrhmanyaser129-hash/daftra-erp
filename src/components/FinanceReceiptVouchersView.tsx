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
  Check,
  ChevronDown,
  Eye,
  Sliders,
  DollarSign,
  TrendingUp,
  Printer
} from 'lucide-react';

interface ReceiptVoucher {
  id: string;
  code: string; // رقم الكود
  amount: number; // المبلغ
  currency: string; // العملة
  description: string; // الوصف
  date: string; // التاريخ
  seller: string; // البائع (أو المستلم)
  category: string; // التصنيف
  subAccount: string; // الحساب الفرعي
  taxes: string; // الضرائب
  isRecurring: boolean; // متكرر
  status: 'Draft' | 'Saved';
  treasuryId?: string; // الخزينة/الحساب البنكي المرتبط
}

interface FinanceReceiptVouchersViewProps {
  setView: (view: string) => void;
}

export default function FinanceReceiptVouchersView({ setView }: FinanceReceiptVouchersViewProps) {
  // Modes: 'list' | 'add'
  const [currentMode, setCurrentMode] = useState<'list' | 'add'>('list');
  const [vouchers, setVouchers] = useState<ReceiptVoucher[]>([]);

  // Search filter states for list page
  const [filterCode, setFilterCode] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Form states for Add Voucher
  const [amount, setAmount] = useState('0.00');
  const [currency, setCurrency] = useState('EGP');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [date, setDate] = useState('2026-06-14');
  const [seller, setSeller] = useState('');
  const [category, setCategory] = useState('');
  const [subAccount, setSubAccount] = useState('آلي');
  const [taxes, setTaxes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Attachment upload simulation
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Selected Voucher View Modal
  const [viewingVoucher, setViewingVoucher] = useState<ReceiptVoucher | null>(null);

  // Edit state / treasury selection
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [treasuryId, setTreasuryId] = useState('');
  const [safesBanks, setSafesBanks] = useState<any[]>([]);

  // Load initial data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const [vouchersRes, safesRes] = await Promise.all([
        supabase.from('receipt_vouchers').select('*').order('created_at', { ascending: false }),
        supabase.from('safes_banks').select('id, name, type, currency').order('name'),
      ]);
      if (vouchersRes.error) {
        console.error('Error fetching receipt vouchers:', vouchersRes.error);
        return;
      }
      if (vouchersRes.data) {
        const mapped = vouchersRes.data.map((v: any) => ({
          id: v.id,
          code: v.code,
          amount: v.amount,
          currency: v.currency,
          description: v.description,
          date: v.date,
          seller: v.seller,
          category: v.category,
          subAccount: v.sub_account,
          taxes: v.taxes,
          isRecurring: v.is_recurring,
          status: v.status,
          treasuryId: v.treasury_id || '',
        }));
        setVouchers(mapped);
      }
      if (safesRes.data) {
        setSafesBanks(safesRes.data);
      }
    };
    fetchData();
  }, []);

  // Generate next code for receipt voucher
  const getNextCode = (list: ReceiptVoucher[]) => {
    if (list.length === 0) return '000001';
    const codes = list.map(v => {
      const num = parseInt(v.code, 10);
      return isNaN(num) ? 0 : num;
    });
    const maxVal = Math.max(...codes, 0);
    return String(maxVal + 1).padStart(6, '0');
  };

  const handleOpenAdd = () => {
    const nextCode = getNextCode(vouchers);
    setCode(nextCode);
    setAmount('0.00');
    setCurrency('EGP');
    setDescription('');
    setDate('2026-06-14');
    setSeller('');
    setCategory('');
    setSubAccount('آلي');
    setTaxes('');
    setIsRecurring(false);
    setAttachmentName(null);
    setTreasuryId('');
    setEditingVoucherId(null);
    setCurrentMode('add');
    setViewingVoucher(null);
  };

  const handleOpenEdit = (vouch: ReceiptVoucher) => {
    setEditingVoucherId(vouch.id);
    setCode(vouch.code);
    setAmount(String(vouch.amount));
    setCurrency(vouch.currency);
    setDescription(vouch.description);
    setDate(vouch.date);
    setSeller(vouch.seller);
    setCategory(vouch.category);
    setSubAccount(vouch.subAccount);
    setTaxes(vouch.taxes);
    setIsRecurring(vouch.isRecurring);
    setTreasuryId(vouch.treasuryId || '');
    setAttachmentName(null);
    setCurrentMode('add');
    setViewingVoucher(null);
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

  const handleSaveVoucher = async (status: 'Saved' | 'Draft') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح لسند القبض أكبر من صفر.');
      return;
    }
    if (!treasuryId) {
      alert('الرجاء اختيار الخزينة أو الحساب البنكي المستلم.');
      return;
    }

    const payload = {
      code: code || getNextCode(vouchers),
      amount: numAmount,
      currency,
      description,
      date,
      seller: seller || 'بائع مالي عام',
      category: category || 'إيرادات عامة',
      sub_account: subAccount,
      taxes: taxes || 'لا توجد ضرائب',
      is_recurring: isRecurring,
      treasury_id: treasuryId,
      status,
    };

    let data: any;

    if (editingVoucherId) {
      const { data: updatedData, error } = await supabase
        .from('receipt_vouchers')
        .update(payload)
        .eq('id', editingVoucherId)
        .select()
        .single();

      if (error) {
        console.error('Error updating receipt voucher:', error);
        alert('حدث خطأ أثناء تحديث السند.');
        return;
      }
      data = updatedData;
    } else {
      const { data: insertedData, error } = await supabase
        .from('receipt_vouchers')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Error saving receipt voucher:', error);
        alert('حدث خطأ أثناء حفظ السند.');
        return;
      }
      data = insertedData;
    }

    if (data) {
      const mapped: ReceiptVoucher = {
        id: data.id,
        code: data.code,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        date: data.date,
        seller: data.seller,
        category: data.category,
        subAccount: data.sub_account,
        taxes: data.taxes,
        isRecurring: data.is_recurring,
        status: data.status,
        treasuryId: data.treasury_id || '',
      };
      if (editingVoucherId) {
        setVouchers(vouchers.map(v => (v.id === editingVoucherId ? mapped : v)));
      } else {
        setVouchers([mapped, ...vouchers]);
      }
    }
    setEditingVoucherId(null);
    setCurrentMode('list');
  };

  const handleDeleteVoucher = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا السند نهائياً؟')) {
      const { error } = await supabase
        .from('receipt_vouchers')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Error deleting receipt voucher:', error);
        return;
      }
      setVouchers(vouchers.filter(v => v.id !== id));
    }
  };

  // Filtration computations
  const filteredVouchers = vouchers.filter(v => {
    if (filterCode && !v.code.includes(filterCode)) return false;
    if (filterCategory !== 'all' && v.category !== filterCategory) return false;
    if (filterDateFrom && v.date < filterDateFrom) return false;
    if (filterDateTo && v.date > filterDateTo) return false;
    return true;
  });

  // Extract unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(vouchers.map(v => v.category).filter(Boolean)));

  return (
    <div id="daftra-finance-receipt-vouchers-container" className="w-full mx-auto text-right font-sans select-none pb-12 antialiased">
      
      {/* ----------------- MODE 1: LIST VIEW ----------------- */}
      {currentMode === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Action Header Nav */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>المالية</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-extrabold text-[13px]">سندات القبض</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${showFilters ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                <Sliders className="w-4 h-4" />
                <span>البحث المتقدم</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 bg-[#0074b1] hover:bg-[#005f90] text-white px-4 py-2 rounded-lg transition-all font-bold cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سند قبض</span>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center flex-row-reverse">
            <h1 className="text-2xl font-black text-[#1a2e40] leading-none">سندات القبض</h1>
            <p className="text-xs text-slate-400 font-bold">إقرار مالي وتأكيد للمبالغ والتدفقات النقدية الواردة إلى الخزائن والحسابات الجارية.</p>
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
                      <label className="font-bold text-slate-600 block">رقم الكود المحاسبي</label>
                      <input
                        type="text"
                        placeholder="رقم السند"
                        value={filterCode}
                        onChange={(e) => setFilterCode(e.target.value)}
                        className="w-full text-right p-2 border border-slate-200 rounded outline-none focus:border-[#0074b1]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">التصنيف والبنود</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full text-right p-2 border border-slate-200 rounded outline-none cursor-pointer text-slate-705 font-bold"
                      >
                        <option value="all">الكل</option>
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
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold cursor-pointer text-xs"
                    >
                      إلغاء الفلتر
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conditional Empty List State vs Table Grid */}
          {vouchers.length === 0 ? (
            /* EMPTY STATE with big centered direct button */
            <div id="receipt-vouchers-empty-state" className="bg-white py-16 px-6 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-10 h-10" />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-extrabold text-[#2a3a4c] block">
                  لا يوجد سندات قبض حالية بعد
                </h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed block">
                  لم يتم قيد أي سندات قبض للإيرادات الواردة في الدفاتر المالية والمنشأة حتى الآن. يمكنك تسجيل أول سند قبض نقدية الآن.
                </p>
              </div>

              {/* Action handle click button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-6 py-3 bg-[#0074b1] hover:bg-[#005f90] text-white rounded-lg text-sm font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-2 flex-row-reverse animate-pulse"
              >
                <Plus className="w-5 h-5" />
                <span>إضافة سند قبض</span>
              </button>
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white rounded-xl border border-slate-205 shadow-xs overflow-hidden">
              <div className="bg-slate-50/70 p-4 border-b border-slate-150 text-right">
                <span className="text-xs font-bold text-slate-700">سندات القبض المقيدة</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-550 border-b border-slate-100 font-extrabold">
                      <th className="p-4">رقم الكود</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">التصنيف</th>
                      <th className="p-4">الوصف</th>
                      <th className="p-4">البائع المستلم</th>
                      <th className="p-4 text-left">قيمة السند</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {filteredVouchers.map((vouch) => (
                      <tr
                        key={vouch.id}
                        onClick={() => setViewingVoucher(vouch)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-black text-[#0074b1] font-mono">{vouch.code}</td>
                        <td className="p-4 font-mono text-slate-500">{vouch.date}</td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
                            {vouch.category}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs truncate text-slate-500" title={vouch.description}>
                          {vouch.description || '—'}
                        </td>
                        <td className="p-4 text-slate-800 font-bold">{vouch.seller}</td>
                        <td className="p-4 text-left font-mono font-black text-[#1a2e40] text-sm">
                          {vouch.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {vouch.currency}
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(vouch)}
                            className="p-1 px-2 hover:bg-slate-50 text-amber-600 border border-slate-200 rounded text-[11px] font-bold"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingVoucher(vouch)}
                            className="p-1 px-2 hover:bg-slate-50 text-[#0074b1] border border-slate-200 rounded text-[11px] font-bold"
                          >
                            عرض
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteVoucher(vouch.id, e)}
                            className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition-colors"
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


      {/* ----------------- MODE 2: DETAILS DIALOG ----------------- */}
      {viewingVoucher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-xl w-full text-right overflow-hidden flex flex-col">
            
            {/* Header Path */}
            <div className="p-4 bg-[#f8fafc] border-b border-slate-150 flex justify-between items-center flex-row-reverse text-xs">
              <span className="text-[#0074b1] font-black">تفاصيل مستند القبض المحاسبي #{viewingVoucher.code}</span>
              <button
                onClick={() => setViewingVoucher(null)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip contents */}
            <div className="p-6 space-y-4 text-xs font-semibold">
              
              <div className="flex justify-between items-start flex-row-reverse border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px]">البائع المسجل للدفعة:</span>
                  <p className="text-base font-black text-slate-800 block">{viewingVoucher.seller}</p>
                </div>
                <div className="text-left space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px]">تصنيف الإيراد:</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded text-[11px] font-extrabold border border-emerald-100 inline-block">
                    {viewingVoucher.category}
                  </span>
                </div>
              </div>

              {/* Grid data */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 text-right">
                  <span className="text-slate-450 block font-bold text-[10px]">معلومات السند</span>
                  <p className="text-slate-700">رقم السند المالي: <span className="font-mono text-slate-900 font-bold">{viewingVoucher.code}</span></p>
                  <p className="text-slate-700">تاريخ المعاملة: <span className="font-mono text-slate-900 font-bold">{viewingVoucher.date}</span></p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 text-right">
                  <span className="text-slate-450 block font-bold text-[10px]">بيانات القيد والتأثير</span>
                  <p className="text-slate-700">حساب الإيداع: <span className="text-slate-800 font-bold">الحسابات الجارية &larr; {viewingVoucher.subAccount}</span></p>
                  <p className="text-slate-700">الضريبة المترتبة: <span className="text-slate-650 font-bold">{viewingVoucher.taxes}</span></p>
                </div>

              </div>

              {/* Big amount declaration display */}
              <div className="bg-[#f0fef4]/50 p-4 border border-emerald-600/30 rounded-lg text-center space-y-0.5">
                <span className="text-slate-450 font-bold block text-[10px]">القيمة الكاملة المودعة للوارد</span>
                <span className="text-3xl font-black text-emerald-600 font-mono leading-none block">
                  {viewingVoucher.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {viewingVoucher.currency}
                </span>
                <span className="text-[10px] text-slate-500 block font-bold">
                  التأثير: زيادة المبيعات / الإيرادات ({viewingVoucher.isRecurring ? 'دفعة متكررة تلقائية' : 'معاملة منفردة'})
                </span>
              </div>

              {/* Description explanation notes block */}
              {viewingVoucher.description && (
                <div className="bg-slate-50 p-3 rounded border border-slate-205 text-xs select-text">
                  <span className="font-black text-slate-850 block mb-1">📝 وصف الشرح المكتوب لوارد السند:</span>
                  <p className="text-slate-650 leading-relaxed block font-semibold">{viewingVoucher.description}</p>
                </div>
              )}

            </div>

            {/* Bottom Actions footer bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setViewingVoucher(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-705 rounded font-bold cursor-pointer transition-colors"
              >
                إغلاق النافذة
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0074b1] hover:bg-[#005f90] text-white rounded font-bold cursor-pointer transition-all flex items-center gap-1.5 flex-row-reverse"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة السند</span>
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ----------------- MODE 3: ADD RECEIPT VOUCHER FORM (SCREENSHOT EXACT LAYOUT MATCH) ----------------- */}
      {currentMode === 'add' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Form Toolbar resembling screenshot structure: Buttons Left, Title Right */}
          <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex-row">
            
            {/* Left: Cancel and Save Dropdown */}
            <div className="flex items-center gap-2">
              {/* cancel button */}
              <button
                type="button"
                onClick={() => setCurrentMode('list')}
                className="px-4 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-bold text-xs flex items-center gap-1.5 flex-row-reverse cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>إلغاء</span>
              </button>

              {/* save button with arrow */}
              <div className="relative inline-flex">
                <button
                  type="submit"
                  onClick={() => handleSaveVoucher('Saved')}
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
                onClick={() => handleSaveVoucher('Draft')}
                className="px-4 py-2 bg-[#e2e8f0]/80 hover:bg-[#cbd5e1] text-slate-705 rounded font-bold text-xs cursor-pointer transition-all border border-slate-300"
              >
                حفظ كمسودة
              </button>
            </div>

          </div>

          {/* Form Breadcrumb Row matching screenshot visual path */}
          <div className="flex items-center gap-1.5 flex-row-reverse text-xs text-slate-400 font-extrabold">
            <span className="text-[#0a78b4] hover:underline cursor-pointer" onClick={() => setCurrentMode('list')}>سندات القبض</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-black">{editingVoucherId ? 'تعديل سند قبض' : 'إضافة'}</span>
          </div>

          {/* Screenshot Form elements box wrapper */}
          <div className="bg-[#f8fafc] rounded-xl border border-slate-200 p-8 space-y-6 shadow-xs">
            
            {/* White card container mirroring screenshot inputs */}
            <div className="bg-white p-6 rounded-lg border border-slate-205 shadow-xs space-y-5 text-right text-xs font-semibold">
              
              {/* Row 1 matching the top element grid: Amount, description & Attachments */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* 1. المبلغ (Amount) - Right side of layout (cols 4) */}
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
                      <option value="USD">USD</option>
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

                {/* 2. الوصف (Description) - Middle layout (cols 4) */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">الوصف</label>
                  <textarea
                    rows={2}
                    value={description}
                    placeholder="بيان والملحوظات المكملة لسند القبض..."
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 text-right border border-slate-200 rounded min-h-[44px] outline-none focus:border-[#0074b1] font-semibold text-[11px]"
                  />
                </div>

                {/* 3. المرفقات (Attachments) - Left layout (cols 4) */}
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
                      id="receipt-attachment-input"
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
                      <span className="text-[9px] text-slate-400">ملفات PDF أو مستند مالي</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Row 2: Treasury / Bank Account selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">الخزينة / الحساب البنكي <span className="text-rose-500">*</span></label>
                  <select
                    value={treasuryId}
                    onChange={(e) => setTreasuryId(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-200 rounded outline-none cursor-pointer font-bold focus:border-[#0074b1]"
                  >
                    <option value="">اختر الخزينة أو الحساب البنكي</option>
                    {safesBanks.map((sb) => (
                      <option key={sb.id} value={sb.id}>
                        {sb.name} ({sb.type === 'safe' ? 'خزينة' : 'بنكي'} - {sb.currency})
                      </option>
                    ))}
                  </select>
                </div>
                <div />
              </div>

              {/* Row 3 matching screenshot layout: Code | Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                
                {/* 4. رقم الكود * (Mandatory Code Field) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center flex-row-reverse text-[11px]">
                    <span className="font-extrabold text-slate-650 block">رقم الكود <span className="text-rose-500">*</span></span>
                    <button type="button" className="text-slate-405 hover:text-slate-600 block">
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

                {/* 5. التاريخ (Date input) */}
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

              </div>

              {/* Row 3 layout matching screenshot: Seller | Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                
                {/* 6. البائع (Seller) dropdown */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">البائع</label>
                  <select
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-205 rounded outline-none cursor-pointer focus:border-[#0074b1]"
                  >
                    <option value="">إختر البائع أو الطرف المودع</option>
                    <option value="شركة العلا للحلول">شركة العلا للحلول التكنولوجية</option>
                    <option value="مؤسسة الرياض">مؤسسة الرياض للبرمجيات</option>
                    <option value="أبو ياسر (أنت)">أبو ياسر (أنت)</option>
                    <option value="مجموعة البركة للتجارة">مجموعة البركة للتجارة والتفوق</option>
                  </select>
                </div>

                {/* 7. التصنيف (Category) */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-650 block text-[11px]">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-right p-2.5 border border-slate-205 rounded outline-none cursor-pointer focus:border-[#0074b1]"
                  >
                    <option value="">(إضافة تصنيف البند)</option>
                    <option value="مبيعات منتجات عامة">مبيعات منتجات عامة</option>
                    <option value="إيرادات خدمات تقنية">إيرادات خدمات تقنية</option>
                    <option value="أرباح وعوائد استثمارات">أرباح وعوائد استثمارات</option>
                    <option value="دعم تمويلي حكومي">دعم تمويلي حكومي</option>
                    <option value="إيرادات تشغيلية أخرى">إيرادات تشغيلية أخرى</option>
                  </select>
                </div>

              </div>

              {/* Row 4: Checkbox for isRecurring (الخيار متكرر) */}
              <div className="flex items-center justify-between flex-row-reverse border-t border-slate-100 pt-4 text-[11.5px]">
                
                <div className="flex items-center gap-2 flex-row-reverse">
                  <input
                    type="checkbox"
                    id="isRecurringReceiptCheckbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0074b1] focus:ring-[#0074b1] cursor-pointer"
                  />
                  <label htmlFor="isRecurringReceiptCheckbox" className="font-extrabold text-slate-705 cursor-pointer selection:bg-transparent">
                    متكرر (إنشاء قيود وقبض دوري تلقائي)
                  </label>
                </div>

                <div className="text-slate-400 font-bold block">
                  ⚙️ سيتم تطبيق الأثر المالي في حساب الإيرادات تلقائياً فور الحفظ.
                </div>

              </div>

              {/* Row 5: Taxes & Sub-account */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end border-t border-slate-100 pt-4">
                
                {/* 8. الحساب الفرعي (Sub-account select) */}
                <div className="space-y-1.5 text-right">
                  <label className="font-extrabold text-slate-650 block text-[11px]">الحساب الفرعي</label>
                  <select
                    value={subAccount}
                    onChange={(e) => setSubAccount(e.target.value)}
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded font-bold outline-none text-slate-600 text-[11px]"
                  >
                    <option value="آلي">آلي (توليد محاسبي ذكي)</option>
                    <option value="حساب مبيعات وتوريدات">حساب مبيعات وتوريدات #401</option>
                    <option value="حساب إيرادات استشارية">حساب إيرادات استشارية #402</option>
                  </select>
                </div>

                {/* 9. الضرائب (Taxes selection) */}
                <div className="space-y-1.5 text-right font-semibold">
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

            </div>

            {/* Bottom Actions Form buttons bar */}
            <div className="flex justify-start gap-2.5 bg-white p-4 rounded-lg border border-slate-200/80 flex-row">
              <button
                type="button"
                onClick={() => handleSaveVoucher('Saved')}
                className="px-6 py-2.5 bg-[#24a148] hover:bg-[#1d8239] text-white rounded text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1 flex-row"
              >
                <Check className="w-4 h-4" />
                <span>حفظ سند القبض</span>
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
