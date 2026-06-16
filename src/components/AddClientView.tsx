/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Save,
  X,
  UploadCloud,
  FilePlus,
  Users,
  MapPin,
  Hash,
  Contact,
  FileUp,
  Link,
  Plus,
  Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddClientViewProps {
  setView: (view: string) => void;
}

export default function AddClientView({ setView }: AddClientViewProps) {
  // 1. Right Side (بيانات العميل) State
  const [type, setType] = useState<'individual' | 'commercial'>('individual');
  const [fullName, setFullName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('مصر (EG)');
  const [commercialRegistry, setCommercialRegistry] = useState('');
  const [taxCard, setTaxCard] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [contacts, setContacts] = useState<{ name: string; position: string; phone: string }[]>([]);

  // 2. Left Side (بيانات الحساب) State
  const [codeNumber, setCodeNumber] = useState('000001');
  const [billingMethod, setBillingMethod] = useState('طباعة');
  const [currency, setCurrency] = useState('EGP جنيه مصري');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('عملاء مميزون');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [notes, setNotes] = useState('');
  const [language, setLanguage] = useState('العربية');
  
  // File upload simulation properties
  const [isDragging, setIsDragging] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  // Fetch next sequential code number from database
  useEffect(() => {
    const fetchNextCode = async () => {
      const { data } = await supabase
        .from('clients')
        .select('code_number')
        .order('code_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.code_number) {
        const num = parseInt(data.code_number, 10);
        if (!isNaN(num)) {
          setCodeNumber(String(num + 1).padStart(6, '0'));
        }
      }
    };
    fetchNextCode();
  }, []);

  const handleAddContact = () => {
    setContacts(prev => [...prev, { name: '', position: '', phone: '' }]);
  };

  const handleRemoveContact = (idx: number) => {
    setContacts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateContact = (idx: number, field: string, value: string) => {
    setContacts(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  // Drag over triggers
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
      const fileNames: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        fileNames.push(e.dataTransfer.files[i].name);
      }
      setAttachedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        fileNames.push(e.target.files[i].name);
      }
      setAttachedFiles(prev => [...prev, ...fileNames]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert('الرجاء كتابة "الاسم الكامل / الاسم التجاري" للعميل أولاً، حيث أنه حقل إلزامي.');
      return;
    }

    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('full_name', fullName.trim())
      .maybeSingle();

    if (existing) {
      alert('هذا العميل موجود بالفعل. الرجاء استخدام اسم آخر.');
      return;
    }

    const { data } = await supabase
      .from('clients')
      .insert({
        type,
        full_name: fullName.trim(),
        first_name: firstName.trim() || fullName.split(' ')[0] || '',
        last_name: lastName.trim() || fullName.split(' ').slice(1).join(' ') || '',
        email: email.trim(),
        phone: phone.trim(),
        mobile: mobile.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        city: city.trim(),
        region: region.trim(),
        zip_code: zipCode.trim(),
        country,
        commercial_registry: commercialRegistry.trim(),
        tax_card: taxCard.trim(),
        national_id: nationalId.trim(),
        code_number: codeNumber,
        currency,
        notes: notes.trim(),
        category,
        billing_method: billingMethod
      })
      .select()
      .single();

    setView('manage-clients');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
      
      {/* 1. Header Navigation action panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg border border-daftra-border shadow-sm gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-100 p-2 rounded-full hidden sm:block">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0d385a]">إضافة عميل جديد</h2>
            <p className="text-[11px] text-slate-500">قم بتغطية بيانات التسجيل وعقود الفوترة الخاصة به</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Cancel */}
          <button
            type="button"
            onClick={() => setView('manage-clients')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-daftra-border text-slate-700 text-xs font-bold rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
            <span>إلغاء</span>
          </button>
          
          {/* Save */}
          <button
            type="submit"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow cursor-pointer transition-all active:scale-95"
          >
            <Save className="w-4 h-4 font-bold" />
            <span>حفظ وبياناته</span>
          </button>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Matching Arabic RTL coordinates) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Right Area (بيانات العميل) - Takes 7/12 */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-daftra-border shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 border-b border-daftra-border px-5 py-3 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-daftra-blue" />
            <h3 className="text-xs font-extrabold text-slate-800">بيانات العميل الأساسية</h3>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Client Type: Individual vs Commercial (نوع العميل) */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">نوع العميل:</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="clientType"
                    checked={type === 'individual'}
                    onChange={() => setType('individual')}
                    className="w-4 h-4 text-daftra-blue border-daftra-border focus:ring-daftra-blue cursor-pointer"
                  />
                  <span>فردي / مستخدم مباشر</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="clientType"
                    checked={type === 'commercial'}
                    onChange={() => setType('commercial')}
                    className="w-4 h-4 text-daftra-blue border-daftra-border focus:ring-daftra-blue cursor-pointer"
                  />
                  <span>تجاري / شركة أو مؤسسة مسجلة</span>
                </label>
              </div>
            </div>

            {/* Full Name with asterisk (الاسم الكامل / الاسم التجاري) */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">
                الاسم الكامل / الاسم التجاري <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: شركة النيل الحديثة للتجارة والتوكيلات"
                className="w-full px-3 py-2 bg-slate-50/55 border border-daftra-blue rounded focus:outline-none focus:ring-2 focus:ring-daftra-blue/20 text-slate-800 font-bold"
              />
            </div>

            {/* Split Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الاسم الأول (للإتصال):</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="محمد"
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الاسم الأخير / العائلة:</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="الشرقاوي"
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded focus:outline-none"
                />
              </div>
            </div>

            {/* Phone & Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الهاتف الأرضي:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0221234567"
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">جوال المحمول:</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded font-mono"
                />
              </div>
            </div>

            {/* Street Addresses 1 & 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">عنوان الشارع 1:</label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="مثال: 12 شارع طلعت حرب، وسط البلد"
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">عنوان الشارع 2:</label>
                <input
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  placeholder="رقم البرج، رقم الدور والشقة..."
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded focus:outline-none"
                />
              </div>
            </div>

            {/* Location indicators: City, Region, Zip, Country */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">البلد:</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded focus:outline-none"
                >
                  <option value="مصر (EG)">مصر (EG)</option>
                  <option value="المملكة العربية السعودية (SA)">المملكة العربية السعودية (SA)</option>
                  <option value="الإمارات العربية المتحدة (AE)">الإمارات العربية المتحدة (AE)</option>
                  <option value="الأردن (JO)">الأردن (JO)</option>
                  <option value="دولة الكويت (KW)">دولة الكويت (KW)</option>
                  <option value="غير مصنف">بلد آخر...</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">المحافظة / المنطقة:</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="القاهرة"
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">المدينة:</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="المعادي"
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الرمز البريدي:</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="11511"
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">رقم الهوية الوطنية:</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="29811050102634"
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded font-mono"
                />
              </div>
            </div>

            {/* Commercial Registry & Tax Card for Commercial Client Type */}
            {type === 'commercial' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/20 p-3.5 border border-emerald-100 rounded">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">السجل التجاري للشركة:</label>
                  <input
                    type="text"
                    value={commercialRegistry}
                    onChange={(e) => setCommercialRegistry(e.target.value)}
                    placeholder="9482938"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">الرقم الضريبي الموحد / بطاقة ضريبية:</label>
                  <input
                    type="text"
                    value={taxCard}
                    onChange={(e) => setTaxCard(e.target.value)}
                    placeholder="984-231-105"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>
            )}

            {/* Interactive Contact List block (قائمة الاتصال) */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center pb-1">
                <label className="font-bold text-[#0d385a]">جهات الاتصال والممثليين المعتمدين:</label>
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#0d385a] hover:text-daftra-blue border border-daftra-border rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة جهة</span>
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded p-4 text-center">
                  لاتوجد أي جهات اتصال مدرجة حالياً. سيتم ربط الفاتورة بنظام العميل الرئيسي مباشرة.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {contacts.map((c, i) => (
                    <div key={i} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded border border-slate-200 relative">
                      <input
                        type="text"
                        placeholder="الاسم"
                        value={c.name}
                        onChange={(e) => handleUpdateContact(i, 'name', e.target.value)}
                        className="w-1/3 px-2 py-1 bg-white border border-slate-200 rounded text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="المنصب"
                        value={c.position}
                        onChange={(e) => handleUpdateContact(i, 'position', e.target.value)}
                        className="w-1/3 px-2 py-1 bg-white border border-slate-200 rounded text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="الهاتف"
                        value={c.phone}
                        onChange={(e) => handleUpdateContact(i, 'phone', e.target.value)}
                        className="w-1/3 px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(i)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Left Area (بيانات الحساب) - Takes 5/12 */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-daftra-border shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 border-b border-daftra-border px-5 py-3 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-daftra-blue" />
            <h3 className="text-xs font-extrabold text-slate-800">بيانات الحساب ومواصفات الفواتير</h3>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Split row: Code number (رقم الكود) and Method (طريقة الفوترة) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">رقم الكود التسلسلي:</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={codeNumber}
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded select-none text-center font-mono font-bold text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">طريقة الفوترة:</label>
                <select
                  value={billingMethod}
                  onChange={(e) => setBillingMethod(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded font-bold"
                >
                  <option value="طباعة">طباعة نقدية</option>
                  <option value="إرسال إلكتروني">إيميل إلكتروني</option>
                  <option value="سندات مسبقة الدفع">سندات مسبقة</option>
                </select>
              </div>
            </div>

            {/* Currency Selector (العملة) */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">العملة المقررة:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded font-bold text-slate-700 focus:outline-none"
              >
                <option value="EGP جنيه مصري">EGP جنيه مصري (مصر)</option>
                <option value="SAR ريال سعودي">SAR ريال سعودي (المملكة)</option>
                <option value="USD دولار أمريكي">USD دولار أمريكي (دولي)</option>
                <option value="EUR يورو أوروبي">EUR يورو أوروبي</option>
              </select>
            </div>

            {/* Email (البريد الإلكتروني) */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-500">البريد الإلكتروني للعميل:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@domain.com"
                className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded text-left font-mono"
              />
            </div>

            {/* Category / Group selector (التصنيف) */}
            <div className="space-y-1.5 text-right">
              <div className="flex justify-between items-center flex-row-reverse">
                <label className="block font-bold text-slate-700">تصنيف العميل:</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(!isCustomCategory);
                    if (!isCustomCategory) {
                      setCategory('');
                    } else {
                      setCategory('عملاء مميزون');
                    }
                  }}
                  className="text-[11px] text-[#0d385a] hover:text-daftra-blue font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isCustomCategory ? 'اختر من التصنيفات الجاهزة' : '✍️ كتابة تصنيف مخصص'}
                </button>
              </div>
              
              {isCustomCategory ? (
                <div className="relative">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="اكتب تصنيف العميل الجديد يدوياً (مثال: عملاء الجملة)"
                    className="w-full px-3 py-2 bg-white border border-daftra-blue rounded focus:outline-none focus:ring-2 focus:ring-daftra-blue/25 text-slate-800 font-bold transition-all text-right"
                  />
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCategory(true);
                      setCategory('');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="عملاء مميزون">عملاء مميزون (VIP)</option>
                  <option value="شركات ومؤسسات">شركات ومؤسسات تجارية</option>
                  <option value="أفراد طباعة">أفراد طباعة فوريين</option>
                  <option value="قائمة سوداء">قائمة سوداء (متعثرون)</option>
                  <option value="__custom__">✍️ كتابة تصنيف مخصص...</option>
                </select>
              )}
            </div>

            {/* Large notes (الملاحظات) */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">ملاحظات داخلية مسجلة بالحساب:</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف أية تفاصيل خاصة ببنود التعاقد، الحدود الضرائبية، أو شروط مخفية للادارة..."
                className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded resize-none focus:outline-none leading-relaxed text-slate-700"
              />
            </div>

            {/* Drag and Drop Upload simulate area (المرفقات) */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">المرفقات السحابية (أوراق، رخصة، سجل):</label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-5 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
                  isDragging
                    ? 'border-daftra-blue bg-daftra-light-blue'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleManualUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="تحميل مستند"
                />
                
                <UploadCloud className="w-7 h-7 text-slate-400" />
                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-center gap-0.5 select-none">
                  <span className="text-daftra-blue hover:underline">افلت الملف هنا</span>
                  <span className="text-slate-400">او اختر من جهازك</span>
                </div>
                <span className="text-[9.5px] text-slate-400 select-none">الحد الأقصى للمستند الواحد: 15 ميجابايت</span>
              </div>

              {/* Uploaded files listing feedback */}
              {attachedFiles.length > 0 && (
                <div className="mt-2 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded flex flex-col gap-1 border border-emerald-100 select-none">
                  <span className="text-slate-500 block border-b border-emerald-100 pb-0.5">الملفات التي سيتم تحميلها:</span>
                  {attachedFiles.map((fn, idx) => (
                    <span key={idx} className="truncate flex items-center gap-1">
                      📄 {fn}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Display Language (لغة العرض) */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 font-bold">لغة فرز وطباعة المستندات:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded focus:outline-none"
              >
                <option value="العربية">العربية (الأصلية)</option>
                <option value="الإنجليزية">English (الإنجليزية)</option>
                <option value="الفرنسية">Français (الفرنسية)</option>
              </select>
            </div>

          </div>
        </div>

      </div>

    </form>
  );
}
