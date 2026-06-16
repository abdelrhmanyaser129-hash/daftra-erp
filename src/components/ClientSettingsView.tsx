/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  X,
  FileText,
  Users,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
  MapPin,
  Map,
  Hash,
  HelpCircle,
  Calendar,
  User,
  Barcode,
  Grid,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Settings,
  ArrowRight,
  ExternalLink,
  MessageCircle
} from 'lucide-react';

interface ClientSettingsViewProps {
  setView: (view: string) => void;
  onSave: (message: string) => void;
}

type TabType = 'profile_setup' | 'messaging_sharing';

export default function ClientSettingsView({ setView, onSave }: ClientSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile_setup');

  // --- Profile Setup State ---
  const [clientType, setClientType] = useState<'individual' | 'commercial' | 'both'>('both');
  const [nextSerial, setNextSerial] = useState('000001');
  
  // Financial fields toggles
  const [openingBalance, setOpeningBalance] = useState(false);
  const [creditLimit, setCreditLimit] = useState(false);
  const [creditPeriod, setCreditPeriod] = useState(false);

  // Identity fields toggles
  const [showImage, setShowImage] = useState(false);
  const [showNationalId, setShowNationalId] = useState(true);
  const [showBirthdate, setShowBirthdate] = useState(false);
  const [showGender, setShowGender] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);

  // Address and contacts toggles
  const [showSocialLink, setShowSocialLink] = useState(false);
  const [showMultipleAddresses, setShowMultipleAddresses] = useState(false);
  const [showMapLocation, setShowMapLocation] = useState(false);

  // --- Messaging Sharing State ---
  const [enableClientMessaging, setEnableClientMessaging] = useState(false);
  const [enableAppointmentsMessaging, setEnableAppointmentsMessaging] = useState(false);

  // Actions
  const handleSave = () => {
    onSave('تم حفظ إعدادات العملاء وتحديث تهيئة ملفات العملاء بنجاح!');
    setView('manage-clients');
  };

  const handleCancel = () => {
    setView('manage-clients');
  };

  return (
    <div id="daftra-client-settings-page" className="flex flex-col bg-[#f0f4f8] -m-4 sm:-m-6 md:-m-8 min-h-screen text-right font-sans select-none">
      
      {/* 1. Header Toolbar mimicking Daftra Action Header */}
      <div className="bg-[#1c2e43] text-white px-6 py-3 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-20">
        
        {/* Save and Cancel buttons aligned to the Left */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-5 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>حفظ</span>
          </button>
          
          <button
            onClick={handleCancel}
            className="bg-[#34495e] hover:bg-[#2c3e50] text-slate-200 border border-[#4a5c6e] px-4 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
            <span>تجاهل</span>
          </button>
        </div>

        {/* Dynamic Title Indicator */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
          <span className="text-[#1abc9c] font-bold">تعديل</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-200 font-extrabold">إعدادات العملاء</span>
          <span className="text-slate-400">/</span>
          <button 
            onClick={() => setView('manage-clients')} 
            className="text-slate-300 hover:text-white font-bold transition-colors"
          >
            إدارة العملاء
          </button>
        </div>
      </div>

      {/* 2. Main Layout Dual-Column Workspace */}
      <div className="flex flex-col lg:flex-row flex-1">
        
        {/* A. Left Container: Real content panel which scrolls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          
          {/* Active Tab rendering: Profile Setup */}
          {activeTab === 'profile_setup' && (
            <div className="space-y-6 max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200">
              
              {/* Inner Tab Title & Help Subtext */}
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-lg font-extrabold text-[#1a2e40] flex items-center gap-2 flex-row-reverse justify-end">
                  <span className="p-1 px-2 rounded-md bg-sky-50 text-sky-700 text-xs">تفضيلات</span>
                  <span>تهيئة ملف العميل</span>
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">تحكم في بيانات ملف العميل وآلية ظهورها داخل النظام.</p>
              </div>

              {/* 1. Client Type (نوع العميل) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#1c2e43] border-r-3 border-[#0d5fc2] pr-2">نوع العميل</h3>
                
                <div className="space-y-3 mt-2 pr-2">
                  {/* Option 1: Individual only */}
                  <div 
                    onClick={() => setClientType('individual')}
                    className={`p-4 rounded border-2 cursor-pointer transition-all flex items-start gap-3 flex-row-reverse text-right hover:border-slate-300 ${
                      clientType === 'individual' ? 'border-[#0f5fc2] bg-blue-50/10' : 'border-slate-200 bg-transparent'
                    }`}
                  >
                    <div className="flex h-5 items-center">
                      <input
                        type="radio"
                        checked={clientType === 'individual'}
                        readOnly
                        className="h-4 w-4 border-slate-300 text-[#0f5fc2] focus:ring-[#0f5fc2]"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-extrabold text-slate-800 block">فردي فقط</span>
                      <span className="text-xs text-slate-400 font-semibold leading-relaxed block">
                        إضافة ملف عميل يمثل نفسه كشخص فقط ولا يمثل كياناً اعتبارياً كالمؤسسات والشركات. يشمل الملف بياناته الشخصية مثل الاسم، رقم الهوية، تاريخ الميلاد، العنوان، ورقم الهاتف.
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Commercial only */}
                  <div 
                    onClick={() => setClientType('commercial')}
                    className={`p-4 rounded border-2 cursor-pointer transition-all flex items-start gap-3 flex-row-reverse text-right hover:border-slate-300 ${
                      clientType === 'commercial' ? 'border-[#0f5fc2] bg-blue-50/10' : 'border-slate-200 bg-transparent'
                    }`}
                  >
                    <div className="flex h-5 items-center">
                      <input
                        type="radio"
                        checked={clientType === 'commercial'}
                        readOnly
                        className="h-4 w-4 border-slate-300 text-[#0f5fc2] focus:ring-[#0f5fc2]"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-extrabold text-slate-800 block">تجاري فقط</span>
                      <span className="text-xs text-slate-400 font-semibold leading-relaxed block">
                        إضافة ملف شركة أو مؤسسة أو كيان تجاري يشمل بيانات كـ "الاسم التجاري" و "السجل التجاري" و "البطاقة الضريبية".
                      </span>
                    </div>
                  </div>

                  {/* Option 3: Both (Individual & Commercial) */}
                  <div 
                    onClick={() => setClientType('both')}
                    className={`p-4 rounded border-2 cursor-pointer transition-all flex items-start gap-3 flex-row-reverse text-right hover:border-slate-300 ${
                      clientType === 'both' ? 'border-[#0f5fc2] bg-blue-50/10' : 'border-slate-200 bg-transparent'
                    }`}
                  >
                    <div className="flex h-5 items-center">
                      <input
                        type="radio"
                        checked={clientType === 'both'}
                        readOnly
                        className="h-4 w-4 border-slate-300 text-[#0f5fc2] focus:ring-[#0f5fc2]"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-extrabold text-[#0f5fc2] block">فردي وتجاري معاً</span>
                      <span className="text-xs text-slate-400 font-semibold leading-relaxed block">
                        عند إضافة عميل جديد يمكنك اختيار نوع العميل سواء كان فردي أو تجاري.
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 font-bold bg-slate-50 p-2.5 rounded border border-slate-100 mt-2">
                    💡 حدد أنواع العملاء التي تتعامل معها عادةً لتهيئة ملفاتهم في النظام، عند إضافة عميل جديد، ستتغير الحقول في النموذج تلقائياً حسب نوعه (فردي أو تجاري).
                  </p>
                </div>
              </div>

              {/* 2. Next Serial Number */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-[#1c2e43]">الرقم التسلسلي للعميل التالي</h3>
                <div className="flex gap-2 max-w-md flex-row-reverse">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={nextSerial}
                      onChange={(e) => setNextSerial(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded px-3 py-2 text-xs font-mono font-bold text-center text-slate-800 focus:bg-white outline-none"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => alert('إعدادات الترقيم المتسلسل التلقائي تفاعلية')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    ⚙️ إعدادات الترقيم المتسلسل
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">الرقم الذي سيخصصه النظام للعميل التالي.</p>
              </div>

              {/* 3. Financial Data (البيانات المالية) */}
              <div className="space-y-4 pt-6 border-t border-slate-100 text-right">
                <h3 className="text-sm font-bold text-[#1c2e43] border-r-3 border-[#0d5fc2] pr-2">البيانات المالية</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Opening Balance */}
                  <div className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between h-32 text-right">
                    <div className="flex justify-between items-start flex-row-reverse">
                      <span className="font-extrabold text-xs text-slate-800">الرصيد الافتتاحي</span>
                      <button
                        type="button"
                        onClick={() => setOpeningBalance(!openingBalance)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${openingBalance ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${openingBalance ? '-translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      إمكانية إضافة رصيد في حساب العميل عند إضافته لأول مرة في البرنامج.
                    </p>
                  </div>

                  {/* Credit Limit */}
                  <div className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between h-32 text-right">
                    <div className="flex justify-between items-start flex-row-reverse">
                      <span className="font-extrabold text-xs text-slate-800">الحد الائتماني</span>
                      <button
                        type="button"
                        onClick={() => setCreditLimit(!creditLimit)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${creditLimit ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${creditLimit ? '-translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      قم بتعيين حد ائتماني يمنع إنشاء فواتير جديدة قبل سداد المدفوعات المستحقة.
                    </p>
                  </div>

                  {/* Credit Period */}
                  <div className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between h-32 text-right">
                    <div className="flex justify-between items-start flex-row-reverse">
                      <span className="font-extrabold text-xs text-slate-800">المدة الائتمانية</span>
                      <button
                        type="button"
                        onClick={() => setCreditPeriod(!creditPeriod)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${creditPeriod ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${creditPeriod ? '-translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      حدد أقصى فترة مسموح بها لتسوية فواتير العميل، لا يمكن إصدار فواتير جديدة حتى يتم سداد الفواتير المتأخرة.
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-bold italic mt-1">
                  * فعّل الحقول المالية في ملف العميل لتتيح الأرصدة والائتمان بالشكل المطابق لدفترح.
                </p>
              </div>

              {/* 4. Identity Data (بيانات الهوية) */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-[#1c2e43] border-r-3 border-[#0d5fc2] pr-2">بيانات الهوية</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Photo toggle */}
                  <div className="p-3 border border-slate-150 rounded-md bg-[#fafbfc] flex items-center justify-between flex-row-reverse hover:bg-slate-50 transition-all">
                    <button
                      type="button"
                      onClick={() => setShowImage(!showImage)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${showImage ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showImage ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div className="text-right flex-1 pr-3">
                      <p className="text-xs font-extrabold text-slate-800">صورة العميل / الشعار</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                        إمكانية رفع شعار الشركة أو صورة شخصية، وفي حال لم يتم رفع صورة، يظهر الحرف الأول افتراضياً.
                      </p>
                    </div>
                  </div>

                  {/* National ID Toggle (Enabled in Mockup Screen) */}
                  <div className="p-3 border border-slate-150 rounded-md bg-[#fafbfc] flex items-center justify-between flex-row-reverse hover:bg-slate-50 transition-all">
                    <button
                      type="button"
                      onClick={() => setShowNationalId(!showNationalId)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${showNationalId ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showNationalId ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div className="text-right flex-1 pr-3">
                      <p className="text-xs font-extrabold text-slate-800">رقم الهوية الوطنية / السجل التجاري</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                        يُستخدم لتسجيل رقم الهوية للعميل، متاح لكل من الأفراد والشركات.
                      </p>
                    </div>
                  </div>

                  {/* Birthdate toggle */}
                  <div className="p-3 border border-slate-150 rounded-md bg-[#fafbfc] flex items-center justify-between flex-row-reverse hover:bg-slate-50 transition-all">
                    <button
                      type="button"
                      onClick={() => setShowBirthdate(!showBirthdate)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${showBirthdate ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showBirthdate ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div className="text-right flex-1 pr-3">
                      <p className="text-xs font-extrabold text-slate-800">تاريخ الميلاد</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                        لتسجيل وعرض تاريخ ميلاد العميل وتتبع أيام ميلاده لتقديم العروض.
                      </p>
                    </div>
                  </div>

                  {/* Gender toggle */}
                  <div className="p-3 border border-slate-150 rounded-md bg-[#fafbfc] flex items-center justify-between flex-row-reverse hover:bg-slate-50 transition-all">
                    <button
                      type="button"
                      onClick={() => setShowGender(!showGender)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${showGender ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showGender ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div className="text-right flex-1 pr-3">
                      <p className="text-xs font-extrabold text-slate-800">النوع (ذكر / أنثى)</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                        لتحديد جنس العميل للتصنيفات واستخدامها في الإحصاءات الموجهة.
                      </p>
                    </div>
                  </div>

                  {/* Barcode toggle */}
                  <div className="p-3 border border-slate-150 rounded-md bg-[#fafbfc] flex items-center justify-between flex-row-reverse hover:bg-slate-50 transition-all">
                    <button
                      type="button"
                      onClick={() => setShowBarcode(!showBarcode)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${showBarcode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showBarcode ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div className="text-right flex-1 pr-3">
                      <p className="text-xs font-extrabold text-slate-800">الباركود وحسابات العضويات</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                        باركود مميز يُمنح لكل عميل لتتبع الفواتير والاشتراكات والخصومات.
                      </p>
                    </div>
                  </div>

                </div>

                <p className="text-[10.5px] text-slate-400 font-bold pr-1 pt-1">
                  💡 اختر بيانات الهوية والمعلومات الشخصية التي سيتم عرضها في ملفات العملاء، بغض النظر عن نوع ملف العميل.
                </p>
              </div>

              {/* 5. Contact Info & Addresses (بيانات التواصل والعناوين) */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-[#1c2e43] border-r-3 border-[#0d5fc2] pr-2">بيانات التواصل والعناوين</h3>
                
                <div className="space-y-2">
                  
                  {/* Web URLs */}
                  <div className="p-3 border border-slate-150 rounded bg-[#fafbfc] flex items-center justify-between flex-row-reverse hover:bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setShowSocialLink(!showSocialLink)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${showSocialLink ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showSocialLink ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div className="text-right flex-1 pr-3">
                      <span className="text-xs font-extrabold text-slate-800 block">الرابط وعناوين الإنترنت</span>
                      <span className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5 block">
                        حقل مخصص لإدخال الروابط مثل حسابات التواصل الاجتماعي أو الموقع الإلكتروني أو ملف اللينكد إن.
                      </span>
                    </div>
                  </div>

                  {/* Multiple addresses */}
                  <div className="p-3 border border-slate-150 rounded bg-[#fafbfc] flex items-center justify-between flex-row-reverse hover:bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setShowMultipleAddresses(!showMultipleAddresses)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${showMultipleAddresses ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showMultipleAddresses ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div className="text-right flex-1 pr-3">
                      <span className="text-xs font-extrabold text-slate-800 block">العناوين المتعددة الشاملة</span>
                      <span className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5 block">
                        يتيح لك إضافة عناوين متعددة للعميل الواحد، مثل العنوان الأساسي، العنوان الثانوي، وعنوان الشحن والتوصيل.
                      </span>
                    </div>
                  </div>

                  {/* Location on Map */}
                  <div className="p-3 border border-slate-150 rounded bg-[#fafbfc] flex items-center justify-between flex-row-reverse hover:bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setShowMapLocation(!showMapLocation)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${showMapLocation ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showMapLocation ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div className="text-right flex-1 pr-3">
                      <span className="text-xs font-extrabold text-slate-800 block">تحديد الموقع على الخريطة (Geocoding)</span>
                      <span className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5 block">
                        ضع موقع العميل الجغرافي مباشرة على جوجل ماب، مع التنويه أن هذا الموقع يختلف عن العناوين النصية.
                      </span>
                    </div>
                  </div>

                </div>

                <p className="text-[10px] text-slate-400 font-bold">
                  * إدارة حقول التواصل والعناوين الإضافية لتسجيل كافة البيانات الجغرافية والافتراضية للاتصال بالعملاء.
                </p>
              </div>

              {/* Custom interactive banner mimicking screen layout sparklers */}
              <div 
                onClick={() => alert('إضافة حقول متباينة مخصصة هي ميزة متقدمة لتصميم حقول خاصة لبيانات عملائك.')}
                className="mt-6 border border-dashed border-daftra-blue bg-blue-50/20 p-4 rounded-lg flex items-center justify-between flex-row-reverse hover:bg-slate-50 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="p-2 bg-daftra-light-blue rounded-full text-daftra-blue">
                    <Sparkles className="w-5 h-5 text-daftra-blue" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-[#0f5fc2]">هل ترغب في إضافة حقول مخصصة لبيانات العملاء؟</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">أضف حقولاً مخصصة لتنظيم البيانات الإضافية وعرضها في ملف العميل والقوائم والتقارير.</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#0f5fc2] opacity-75" />
              </div>

            </div>
          )}

          {/* Active Tab rendering: Messaging Sharing */}
          {activeTab === 'messaging_sharing' && (
            <div className="space-y-6 max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200">
              
              {/* Inner Header tab */}
              <div className="border-b border-slate-100 pb-4 mb-6 text-right">
                <h2 className="text-lg font-extrabold text-[#1a2e40] flex items-center gap-2 flex-row-reverse justify-end">
                  <span className="p-1 px-2 rounded bg-amber-50 text-amber-700 text-xs font-bold">اتصالات</span>
                  <span>المراسلة والمشاركة</span>
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">مشاركة بيانات العملاء وتذكيرات المواعيد عبر تطبيقات المراسلة الفورية.</p>
              </div>

              {/* Card 1: Customer Data Sharing */}
              <div className="p-5 border border-slate-200 rounded-lg bg-slate-50/50 text-right space-y-4">
                <div className="flex justify-between items-center flex-row-reverse">
                  <h4 className="text-sm font-extrabold text-slate-800">إرسال بيانات العملاء عبر تطبيقات المراسلة</h4>
                  
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => setEnableClientMessaging(!enableClientMessaging)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${enableClientMessaging ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${enableClientMessaging ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-xs font-extrabold text-slate-500">
                      {enableClientMessaging ? 'مفعل' : 'غير مفعل'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  اختر المنصات، أضف رسالة مخصصة، واستخدم المتغيرات السحابية (مثال: <span className="text-daftra-blue font-mono">{'%'}client_first_name{'%'}</span>) لمشاركة بيانات المعاملات والعمليات الخاصة بالعملاء (مثل الفواتير، عروض الأسعار، والإيصالات المباشرة للحساب) عبر حسابات المراسلة الشائعة التي تستخدمها مثل واتسأب وتيليجرام وغيرها.
                </p>

                <div className="pt-2 flex justify-start">
                  <button 
                    type="button"
                    onClick={() => alert('إدارة الرسائل والمنصات التفاعلية')}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold shadow-3xs cursor-pointer transition-all active:scale-95"
                  >
                    💬 إدارة الرسائل والمنصات
                  </button>
                </div>
              </div>

              {/* Card 2: Appointments Sharing */}
              <div className="p-5 border border-slate-200 rounded-lg bg-slate-50/50 text-right space-y-4">
                <div className="flex justify-between items-center flex-row-reverse">
                  <h4 className="text-sm font-extrabold text-slate-800">إرسال تفاصيل المواعيد عبر تطبيقات المراسلة</h4>
                  
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => setEnableAppointmentsMessaging(!enableAppointmentsMessaging)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${enableAppointmentsMessaging ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${enableAppointmentsMessaging ? '-translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-xs font-extrabold text-slate-500">
                      {enableAppointmentsMessaging ? 'مفعل' : 'غير مفعل'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  أرسل تذكيرات المواعيد مثل الرسائل التلقائية التي تُخطر العملاء بمواعيدهم وجلساتهم وحجوزاتهم القادمة، مع إمكانية التخصيص الكامل للإنشاء التلقائي للرسالة باستخدام المتغيرات الذكية المدمجة (مثال: <span className="text-daftra-blue font-mono">{'%'}appointments_body{'%'}</span>) لإدراج تفاصيل الموعد والارتباط التلقائي ومشاركتها مع جهات الاتصال.
                </p>

                <div className="pt-2 flex justify-start">
                  <button 
                    type="button"
                    onClick={() => alert('إدارة رسائل المواعيد والمنصات')}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold shadow-3xs cursor-pointer transition-all active:scale-95"
                  >
                    💬 إدارة الرسائل والمنصات
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* B. Right Column: Vertical Tabs Sidebar like Daftra layout */}
        <div className="w-full lg:w-64 bg-white border-r lg:border-r-0 lg:border-l border-slate-200 shrink-0 p-4 space-y-3">
          
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 pb-2 border-b border-slate-100 flex items-center justify-between flex-row-reverse">
            <span>الخيارات المتاحة</span>
            <span className="text-[#0d5fc2]">★</span>
          </div>

          <div className="flex flex-col gap-1">
            {/* Tab 1: Configure Client Profile */}
            <button
              onClick={() => setActiveTab('profile_setup')}
              className={`w-full text-right p-3 rounded-md text-xs font-bold flex flex-col gap-1 transition-all cursor-pointer ${
                activeTab === 'profile_setup'
                  ? 'bg-daftra-light-blue text-daftra-blue border-r-4 border-daftra-blue font-extrabold'
                  : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-row-reverse justify-end w-full">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <span>تهيئة ملف العميل</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold pr-6 block text-right">
                تحكم في بيانات ملف العميل وآلية ظهورها داخل النظام.
              </span>
            </button>

            {/* Tab 2: Messaging & Sharing */}
            <button
              onClick={() => setActiveTab('messaging_sharing')}
              className={`w-full text-right p-3 rounded-md text-xs font-bold flex flex-col gap-1 transition-all cursor-pointer ${
                activeTab === 'messaging_sharing'
                  ? 'bg-daftra-light-blue text-daftra-blue border-r-4 border-daftra-blue font-extrabold'
                  : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-row-reverse justify-end w-full">
                <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                <span>المراسلة والمشاركة</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold pr-6 block text-right">
                مشاركة بيانات العملاء وتذكيرات المواعيد عبر تطبيقات المراسلة.
              </span>
            </button>
          </div>

          {/* Prompt help bubble below */}
          <div className="p-3 bg-slate-50 rounded-md border border-slate-150 space-y-1.5 mt-6 text-right">
            <h4 className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1 flex-row-reverse justify-end">
              <HelpCircle className="w-3.5 h-3.5 text-[#0f5fc2] shrink-0" />
              <span>إدارة الملفات</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              تحاكي هذه النافذة تفضيلات ملفات عملاء باقة دفتره السحابية. يمكنك تخصيص الحقول المالية وتقديم تجارب تواصل مرنة لكل زبون مسجل.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
