/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Percent,
  CreditCard,
  Package,
  FileSpreadsheet,
  Check,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Eye,
  Lock,
  Globe,
  Share2,
  Undo
} from 'lucide-react';

interface InvoiceSettingsViewProps {
  onBack: () => void;
  onSave: (message: string) => void;
}

export default function InvoiceSettingsView({ onBack, onSave }: InvoiceSettingsViewProps) {
  // Navigation tabs in Arabic RTL
  const [activeTab, setActiveTab] = useState<'issuance' | 'pricing' | 'payment' | 'inventory' | 'accounting'>('issuance');

  // --- STATE FOR ALL FIELDS ---
  // Tab 1: إصدار الفاتورة
  const [nextInvoiceNum, setNextInvoiceNum] = useState('000001');
  const [allowManualInvoiceId, setAllowManualInvoiceId] = useState(true);
  const [billingMethod, setBillingMethod] = useState('both'); // "both" is print + email
  const [freeTextEditing, setFreeTextEditing] = useState(true);
  const [priceVisibility, setPriceVisibility] = useState('hidden'); // "hidden" is hide min & last sale price
  const [copyNotesOnConvert, setCopyNotesOnConvert] = useState(false);
  const [previewBeforeSave, setPreviewBeforeSave] = useState(true);
  const [customStatusOption, setCustomStatusOption] = useState(false);
  const [profitTabVisible, setProfitTabVisible] = useState(false);
  const [decimalZeros, setDecimalZeros] = useState('auto'); // auto, show, hide
  const [currencyExchangeSelector, setCurrencyExchangeSelector] = useState('hide'); // show, hide
  const [socialMediaSharing, setSocialMediaSharing] = useState(false);

  // Tab 2: التسعير والخصومات
  const [discountApplication, setDiscountApplication] = useState('both'); // sum and item together
  const [maxDiscountLimit, setMaxDiscountLimit] = useState(false);
  const [advancedPricingOptions, setAdvancedPricingOptions] = useState(true);
  const [minPriceTaxInclusion, setMinPriceTaxInclusion] = useState('include'); // include, exclude
  const [lowerThanCostSale, setLowerThanCostSale] = useState(true);
  const [allowPriceListChange, setAllowPriceListChange] = useState(false);
  const [allowSalesAdjustments, setAllowSalesAdjustments] = useState(true);

  // Tab 3: الدفع والائتمان
  const [initPaidByDefault, setInitPaidByDefault] = useState(false);
  const [autoPayWithClientCredit, setAutoPayWithClientCredit] = useState(true);
  const [generateDebitNotes, setGenerateDebitNotes] = useState(false);

  // Tab 4: قيود توفر وصلاحية المخزون
  const [exceptCategories, setExceptCategories] = useState('none');
  const [activityType, setActivityType] = useState('both'); // both, products, services

  // Tab 5: القيود المحاسبية
  const [customJournalMemo, setCustomJournalMemo] = useState(false);

  const tabsList = [
    {
      id: 'issuance' as const,
      title: 'إصدار الفاتورة',
      description: 'إدارة إعدادات إنشاء الفاتورة وطريقة عرضها ومشاركتها مع العملاء.',
      icon: FileText
    },
    {
      id: 'pricing' as const,
      title: 'التسعير والخصومات',
      description: 'التحكم في قواعد تسعير العناصر، وإدخال الخصومات، والحدود المسموح بها.',
      icon: Percent
    },
    {
      id: 'payment' as const,
      title: 'الدفع والائتمان',
      description: 'تهيئة سلوك الدفع التلقائي وإدارة رصيد العميل والأرصدة المستحقة.',
      icon: CreditCard
    },
    {
      id: 'inventory' as const,
      title: 'قيود توفر وصلاحية المخزون',
      description: 'تحكم في توفر المنتجات والخدمات للفوترة وسلوكها ضمن عملية البيع.',
      icon: Package
    },
    {
      id: 'accounting' as const,
      title: 'القيود المحاسبية',
      description: 'تحكم في كيفية إدخال أوصاف قيود اليومية للفواتير داخل نظام المحاسبة.',
      icon: FileSpreadsheet
    }
  ];

  const handleSave = () => {
    onSave('تم حفظ إعدادات الفواتير بنجاح وتحديث النظام الرقمي لمبيعات دفترة!');
    onBack();
  };

  return (
    <div id="daftra-invoice-settings-screen" className="flex flex-col min-h-screen text-right font-sans select-none pb-12">
      
      {/* 1. Header Toolbar styled exactly like Daftra with Save / Ignore actions */}
      <div className="bg-white border-b border-[#dae4f0] px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-3xs">
        {/* Left Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-5 py-1.5 rounded text-xs font-bold shadow-3xs flex items-center gap-1.5 cursor-pointer select-none transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>حفظ</span>
          </button>
          
          <button
            onClick={onBack}
            className="bg-white hover:bg-slate-50 text-slate-500 border border-[#e1e8ed] px-4 py-1.5 rounded text-xs font-bold shadow-3xs cursor-pointer select-none transition-all"
          >
            تجاهل
          </button>
        </div>

        {/* Right Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs">
          <button onClick={onBack} className="text-[#0f5fc2] hover:underline font-bold">
            إعدادات المبيعات
          </button>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">إعدادات الفواتير</span>
        </div>
      </div>

      {/* 2. Main Two Column Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        
        {/* LEFT COLUMN: Configuration settings area (RTL order - visual col-span 8 or 9) */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded border border-[#dae4f0] shadow-3xs overflow-hidden p-6 sm:p-8 space-y-8">
            
            {/* -------------------- TAB 1: إصدار الفاتورة -------------------- */}
            {activeTab === 'issuance' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-800">إصدار الفاتورة</h3>
                  <p className="text-xs text-slate-400 mt-1">إدارة إعدادات إنشاء الفاتورة وطريقة عرضها ومشاركتها مع العملاء.</p>
                </div>

                {/* Field 1: الرقم التسلسلي للفاتورة التالية */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">الرقم التسلسلي للفاتورة التالية</label>
                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      type="text"
                      value={nextInvoiceNum}
                      onChange={(e) => setNextInvoiceNum(e.target.value)}
                      className="flex-1 bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none transition-colors text-right font-mono"
                    />
                    <button
                      type="button"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-[#cbd5e1] px-3.5 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>إعدادات الترقيم المتسلسل</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">الرقم الذي سيخصصه النظام للعنصر.</span>
                </div>

                {/* Field 2: تعديل رقم الفاتورة يدوياً */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">تعديل رقم الفاتورة يدوياً</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAllowManualInvoiceId(!allowManualInvoiceId)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        allowManualInvoiceId ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        allowManualInvoiceId ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{allowManualInvoiceId ? 'مسموح' : 'غير مسموح'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">يسمح للمستخدمين بتعيين أو تعديل رقم الفاتورة يدوياً أثناء الإنشاء.</span>
                </div>

                {/* Field 3: طريقة الفوترة */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">طريقة الفوترة</label>
                  <div className="relative max-w-md">
                    <select
                      value={billingMethod}
                      onChange={(e) => setBillingMethod(e.target.value)}
                      className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none transition-colors accent-[#1abc9c] cursor-pointer text-right pl-8"
                      style={{ direction: 'rtl' }}
                    >
                      <option value="both">طباعة وإرسال عبر البريد الإلكتروني معاً</option>
                      <option value="print">طباعة فقط</option>
                      <option value="email">إلكترونياً عبر البريد الإلكتروني فقط</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">اختر طريقة إرسال الفواتير للعملاء.</span>
                </div>

                {/* Field 4: الإدخال الحر وتعديل بيانات الأصناف */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">الإدخال الحر وتعديل بيانات الأصناف في الفاتورة</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFreeTextEditing(!freeTextEditing)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        freeTextEditing ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        freeTextEditing ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{freeTextEditing ? 'مسموح' : 'غير مسموح'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    يسمح للمستخدمين بتعديل المنتجات يدوياً أو إدخال منتجات غير مسجلة عند إنشاء الفاتورة. هذا إعداد عام، يمكن إدارة الصلاحيات من خلال إعدادات أدوار الموظفين والصلاحيات.
                  </span>
                </div>

                {/* Field 5: عرض الحد الأدنى للسعر وآخر سعر بيع */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">عرض الحد الأدنى للسعر وآخر سعر بيع لكل صنف</label>
                  <div className="relative max-w-md">
                    <select
                      value={priceVisibility}
                      onChange={(e) => setPriceVisibility(e.target.value)}
                      className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none transition-colors accent-[#1abc9c] cursor-pointer text-right pl-8"
                      style={{ direction: 'rtl' }}
                    >
                      <option value="hidden">إخفاء الحد الأدنى وآخر سعر بيع</option>
                      <option value="visible">إظهار لمحرري المبيعات فقط</option>
                      <option value="all">إظهار لجميع المستخدمين</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    تحكم في طريقة عرض هذه القيم أثناء إنشاء الفواتير. هذه المعلومات مرجعية فقط ولا تظهر للعملاء أو في نسخة الفاتورة النهائية. يتم تحديد السعر الأدنى لكل صنف من خلال صفحة تعديل المنتج أو الخدمة.
                  </span>
                </div>

                {/* Field 6: نسخ الملاحظات/الشروط */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">نسخ الملاحظات/الشروط عند تحويل عرض سعر أو أمر بيع إلى فاتورة</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCopyNotesOnConvert(!copyNotesOnConvert)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        copyNotesOnConvert ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        copyNotesOnConvert ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{copyNotesOnConvert ? 'مفعل' : 'غير مفعل'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">يقوم النظام تلقائياً بنقل الملاحظات والشروط من عرض السعر أو أمر البيع إلى الفاتورة أثناء التحويل.</span>
                </div>

                {/* Field 7: معاينة الفاتورة قبل الحفظ */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">معاينة الفاتورة قبل الحفظ</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPreviewBeforeSave(!previewBeforeSave)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        previewBeforeSave ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        previewBeforeSave ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{previewBeforeSave ? 'مفعل' : 'غير مفعل'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">يتيح للمستخدمين معاينة النسخة القابلة للطباعة من الفاتورة قبل الحفظ.</span>
                </div>

                {/* Field 8: حالات الفاتورة المخصصة */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">حالات الفاتورة المخصصة</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCustomStatusOption(!customStatusOption)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        customStatusOption ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        customStatusOption ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{customStatusOption ? 'مفعل' : 'غير مفعل'}</span>
                    
                    {customStatusOption && (
                      <button
                        type="button"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-[#cbd5e1] px-3.5 py-1 rounded text-[11px] font-bold transition-colors mr-2"
                      >
                        إدارة الحالات المخصصة
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    أنشئ حالات مخصصة تناسب سير العمل لديك، مثل "قيد التسليم" أو "قيد المراجعة"، وقم بتعيينها إلى الفواتير. يمكن استخدام هذه الحالات في التصفية والبحث عن الفواتير والتقارير.
                  </span>
                </div>

                {/* Field 9: تبويب الربح في الفاتورة */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">تبويب الربح في الفاتورة (لا يظهر للعميل)</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setProfitTabVisible(!profitTabVisible)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        profitTabVisible ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        profitTabVisible ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{profitTabVisible ? 'مفعل' : 'غير مفعل'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    تفعيل تبويب الربح في صفحة الفاتورة، ويكون مرئياً فقط للمستخدمين المصرح لهم. يتم احتساب الربح بناءً على متوسط تكلفة المنتج في فواتير الشراء، يمكن التحكم بمن يمكنه رؤية التبويب من خلال إعدادات أدوار الموظفين والصلاحيات.
                  </span>
                </div>

                {/* Field 10: عرض الأصفار في الأرقام العشرية (Reds & Radios) */}
                <div className="space-y-3 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">عرض الأصفار في الأرقام العشرية</label>
                  <div className="space-y-2 max-w-lg">
                    {/* Option 1 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-600 transition-colors">
                      <input
                        type="radio"
                        name="decimalZeros"
                        checked={decimalZeros === 'show'}
                        onChange={() => setDecimalZeros('show')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        عرض الأصفار دائماً <span className="text-slate-400 font-mono font-normal mr-1">(إظهار دائماً مثل 10.00)</span>
                      </span>
                    </label>

                    {/* Option 2 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-600 transition-colors">
                      <input
                        type="radio"
                        name="decimalZeros"
                        checked={decimalZeros === 'hide'}
                        onChange={() => setDecimalZeros('hide')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        إخفاء الأصفار دائماً <span className="text-slate-400 font-mono font-normal mr-1">(إخفاء دائماً مثل 10)</span>
                      </span>
                    </label>

                    {/* Option 3 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-[#0f5fc2] bg-[#f0f7ff] cursor-pointer text-xs font-bold text-slate-700 transition-colors">
                      <input
                        type="radio"
                        name="decimalZeros"
                        checked={decimalZeros === 'auto'}
                        onChange={() => setDecimalZeros('auto')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        تلقائي (حسب القيمة) <span className="text-slate-400 font-mono font-normal mr-1">(إظهار الأصفار للقيم الأقل من 1000 فقط (مثل 100.00) وإخفاؤها للقيم 1000 أو أكثر (مثل 1000))</span>
                      </span>
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">تحكم في كيفية عرض الأصفار في الأرقام العشرية.</span>
                </div>

                {/* Field 11: معامل تحويل العملات */}
                <div className="space-y-3 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">معامل تحويل العملات</label>
                  <div className="space-y-2 max-w-lg">
                    {/* Option 1 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-600 transition-colors">
                      <input
                        type="radio"
                        name="currencyExchangeSelector"
                        checked={currencyExchangeSelector === 'show'}
                        onChange={() => setCurrencyExchangeSelector('show')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        عرض <span className="text-slate-400 font-medium mr-1">(اعرض حقل معامل تحويل العملة، حيث يمكن للمستخدم تعديل سعر العملة يدوياً مع وجود خيار لتحديث أسعار النظام بالقيمة المدخلة.)</span>
                      </span>
                    </label>

                    {/* Option 2 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-[#0f5fc2] bg-[#f0f7ff] cursor-pointer text-xs font-bold text-slate-700 transition-colors">
                      <input
                        type="radio"
                        name="currencyExchangeSelector"
                        checked={currencyExchangeSelector === 'hide'}
                        onChange={() => setCurrencyExchangeSelector('hide')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        إخفاء <span className="text-slate-400 font-medium mr-1">(أخف حقل سعر العملة وطبق أسعار التحويل التلقائية المحددة في النظام.)</span>
                      </span>
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">تحكم في كيفية تعامل النظام مع أسعار العملات عند استخدام عملات غير العملة الافتراضية في القيود المحاسبية.</span>
                </div>

                {/* Field 12: إرسال الفواتير عبر وسائل التواصل الاجتماعي */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">إرسال الفواتير عبر وسائل التواصل الاجتماعي</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSocialMediaSharing(!socialMediaSharing)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        socialMediaSharing ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        socialMediaSharing ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{socialMediaSharing ? 'مسموح' : 'غير مسموح'}</span>

                    {socialMediaSharing && (
                      <button
                        type="button"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-[#cbd5e1] px-3.5 py-1 rounded text-[11px] font-bold transition-colors mr-2"
                      >
                        إدارة منصات التواصل الاجتماعي المفعلة
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    يمكنك مشاركة الفواتير مع عملائك عبر وسائل التواصل الاجتماعي، كما يمكنك دائماً مشاركتها عبر الرسائل النصية أو البريد الإلكتروني بشكل افتراضي.
                  </span>
                </div>

              </div>
            )}


            {/* -------------------- TAB 2: التسعير والخصومات -------------------- */}
            {activeTab === 'pricing' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-800">التسعير والخصومات</h3>
                  <p className="text-xs text-slate-400 mt-1">التحكم في قواعد تسعير العناصر، وإدخال الخصومات، والحدود المسموح بها.</p>
                </div>

                {/* Field 1: طريقة تطبيق الخصومات */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">طريقة تطبيق الخصومات</label>
                  <div className="relative max-w-md">
                    <select
                      value={discountApplication}
                      onChange={(e) => setDiscountApplication(e.target.value)}
                      className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none transition-colors accent-[#1abc9c] cursor-pointer text-right pl-8"
                      style={{ direction: 'rtl' }}
                    >
                      <option value="both">خصم على إجمالي الفاتورة ولكل بند معاً</option>
                      <option value="sum_only">خصم على إجمالي الفاتورة فقط</option>
                      <option value="item_only">خصم لكل بند على حدة فقط</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    حدد طريقة إدخال الخصومات - سواء على إجمالي الفاتورة أو لكل بند أو كلاهما. هذا إعداد عام يحدد طريقة الإدخال، استخدم صفحة الصلاحيات والأدوار لتحديد من يمكنه تطبيق الخصومات.
                  </span>
                </div>

                {/* Field 2: الحد الأقصى لنسبة الخصم */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">الحد الأقصى لنسبة الخصم</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMaxDiscountLimit(!maxDiscountLimit)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        maxDiscountLimit ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        maxDiscountLimit ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{maxDiscountLimit ? 'مفعل' : 'غير مفعل'}</span>

                    {maxDiscountLimit && (
                      <button
                        type="button"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-[#cbd5e1] px-3.5 py-1 rounded text-[11px] font-bold transition-colors mr-2"
                      >
                        إدارة حدود الخصم للمستخدمين
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block font-sans">
                    أنشئ سياسة لتحديد الحد الأقصى لنسبة الخصم المسموح بها لكل مستخدم. استخدم صفحة الصلاحيات والأدوار للتحكم في من يمكنه تطبيق الخصومات.
                  </span>
                </div>

                {/* Field 3: خيارات التسعير المتقدمة */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">خيارات التسعير المتقدمة</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAdvancedPricingOptions(!advancedPricingOptions)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        advancedPricingOptions ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        advancedPricingOptions ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{advancedPricingOptions ? 'مفعل' : 'غير مفعل'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    فعل حقول التسعير المتقدمة مثل الحد الأدنى للسعر، وقيم الخصم، وهوامش الربح لكل منتج. ستظهر هذه الحقول في صفحة إضافة/تعديل المنتج أو الخدمة، ويتم تطبيقها على العناصر المحددة داخل الفواتير.
                  </span>
                </div>

                {/* Field 4: احتساب الحد الأدنى لسعر البيع */}
                <div className="space-y-3 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">احتساب الحد الأدنى لسعر البيع</label>
                  
                  <div className="space-y-2 max-w-lg">
                    {/* Option 1 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-[#0f5fc2] bg-[#f0f7ff] cursor-pointer text-xs font-bold text-slate-700 transition-colors">
                      <input
                        type="radio"
                        name="minPriceTaxInclusion"
                        checked={minPriceTaxInclusion === 'include'}
                        onChange={() => setMinPriceTaxInclusion('include')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        يشمل الضريبة <span className="text-slate-400 font-medium mr-1">(الحد الأدنى للسعر سيشمل الضريبة، لا يمكن للمستخدم البيع بأقل من إجمالي (السعر + الضريبة).)</span>
                      </span>
                    </label>

                    {/* Option 2 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-600 transition-colors">
                      <input
                        type="radio"
                        name="minPriceTaxInclusion"
                        checked={minPriceTaxInclusion === 'exclude'}
                        onChange={() => setMinPriceTaxInclusion('exclude')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        لا يشمل الضريبة <span className="text-slate-400 font-medium mr-1">(سيطبق الحد الأدنى على السعر فقط بدون الضريبة، الضريبة لا تؤثر على الحد الأدنى للسعر.)</span>
                      </span>
                    </label>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    حدد ما إذا كانت الضريبة مضمنة في الحد الأدنى للسعر بشكل افتراضي لجميع العناصر. الحد الأدنى لسعر البيع: عند تعيينه لمنتج أو خدمة، لا يمكن إصدار فاتورة بيع بسعر أقل من الحد الأدنى المحدد.
                  </span>
                </div>

                {/* Field 5: البيع بأقل من سعر متوسط التكلفة */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">البيع بأقل من سعر متوسط التكلفة</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLowerThanCostSale(!lowerThanCostSale)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        lowerThanCostSale ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        lowerThanCostSale ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{lowerThanCostSale ? 'مفعل' : 'مغلق'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    اسمح أو امنع بيع المنتجات بسعر أقل من متوسط تكلفتها. يتم حساب متوسط التكلفة تلقائياً بناءً على أسعار الشراء التراكمية في فواتير الشراء الخاصة بكل صنف.
                  </span>
                </div>

                {/* Field 6: تغيير قائمة الأسعار */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">تغيير قائمة الأسعار عند إنشاء الفواتير</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAllowPriceListChange(!allowPriceListChange)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        allowPriceListChange ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        allowPriceListChange ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{allowPriceListChange ? 'مفعل' : 'غير مفعل'}</span>

                    {allowPriceListChange && (
                      <button
                        type="button"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-[#cbd5e1] px-3.5 py-1 rounded text-[11px] font-bold transition-colors mr-2"
                      >
                        إدارة قوائم الأسعار
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    اختر قائمة أسعار مختلفة عن المحددة مسبقاً للعميل أثناء إنشاء الفاتورة، تتيح لك قوائم الأسعار تحديد أسعار بيع مختلفة مثل "جملة" أو "تجزئة" بناءً على القائمة المحددة.
                  </span>
                </div>

                {/* Field 7: تسوية المبيعات */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">تسوية المبيعات</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAllowSalesAdjustments(!allowSalesAdjustments)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        allowSalesAdjustments ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        allowSalesAdjustments ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{allowSalesAdjustments ? 'مفعل' : 'غير مفعل'}</span>

                    {allowSalesAdjustments && (
                      <button
                        type="button"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-[#cbd5e1] px-3.5 py-1.5 rounded text-[11px] font-bold transition-colors mr-2"
                      >
                        إدارة تسويات المبيعات الإضافية
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    تتيح تسوية المبيعات إضافة مبلغ أو طرحه من إجمالي الفاتورة بقيمة موجبة أو سالبة أثناء إنشائها مع إمكانية إدخال تسمية مخصصة وربطها بحساب محاسبي. لإضافة تسويات إضافية مرتبطة بحسابات محددة وتسميات مخصصة مسبقاً على نفس الفاتورة، إدارتها "إدارة تسويات المبيعات الإضافية".
                  </span>
                </div>

              </div>
            )}


            {/* -------------------- TAB 3: الدفع والائتمان -------------------- */}
            {activeTab === 'payment' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-800">الدفع والائتمان</h3>
                  <p className="text-xs text-slate-400 mt-1">تهيئة سلوك الدفع التلقائي وإدارة رصيد العميل والأرصدة المستحقة.</p>
                </div>

                {/* Field 1: إجعل الفواتير مدفوعة بالفعل افتراضياً */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">إجعل الفواتير مدفوعة بالفعل افتراضياً</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setInitPaidByDefault(!initPaidByDefault)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        initPaidByDefault ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        initPaidByDefault ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{initPaidByDefault ? 'مفعل' : 'غير مفعل'}</span>

                    {initPaidByDefault && (
                      <button
                        type="button"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-[#cbd5e1] px-3.5 py-1 rounded text-[11px] font-bold transition-colors mr-2"
                      >
                        إدارة طرق الدفع
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    تحديد الفواتير كمدفوعة افتراضياً، يمكنك اختيار وسيلة الدفع والخزينة أثناء إنشاء الفاتورة. سيتم إنشاء معاملة دفع تلقائياً، ويمكنك إلغاء هذه العلامة يدوياً أثناء إنشاء الفاتورة.
                  </span>
                </div>

                {/* Field 2: دفع الفاتورة تلقائياً في حالة وجود رصيد للعميل */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">دفع الفاتورة تلقائياً في حالة وجود رصيد للعميل</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAutoPayWithClientCredit(!autoPayWithClientCredit)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoPayWithClientCredit ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        autoPayWithClientCredit ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{autoPayWithClientCredit ? 'مفعل' : 'غير مفعل'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    قم باستخدام الرصيد المتاح للعميل تلقائياً لسداد الفواتير الجديدة كلياً أو جزئياً.
                  </span>
                </div>

                {/* Field 3: اشعار مدين */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">اشعار مدين</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGenerateDebitNotes(!generateDebitNotes)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        generateDebitNotes ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        generateDebitNotes ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{generateDebitNotes ? 'مفعل' : 'غير مفعل'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    قم بإصدار إشعارات المدين لتسجيل زيادة في مديونية أو لتعديل فواتير سابقة تم إصدارها بقيمة أقل، أو لإضافة رسوم إضافية. ترتبط إشعارات المدين بالفاتورة الأصلية وتحدث الرصيد المستحق على العميل.
                  </span>
                </div>

              </div>
            )}


            {/* -------------------- TAB 4: قيود توفر وصلاحية المخزون -------------------- */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-800">قيود توفر وصلاحية المخزون</h3>
                  <p className="text-xs text-slate-400 mt-1">تحكم في توفر المنتجات والخدمات للفوترة وسلوكها ضمن عملية البيع.</p>
                </div>

                {/* Field 1: منع بيع وإصدار الفواتير لفئات منتجات وخدمات محددة */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">منع بيع و إصدار الفواتير لفئات منتجات وخدمات محددة</label>
                  <div className="relative max-w-md">
                    <select
                      value={exceptCategories}
                      onChange={(e) => setExceptCategories(e.target.value)}
                      className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none transition-colors accent-[#1abc9c] cursor-pointer text-right pl-8"
                      style={{ direction: 'rtl' }}
                    >
                      <option value="none">اختر الفئة...</option>
                      <option value="discontinued">منتجات متوقفة</option>
                      <option value="internal">مواد خام وتوريدات داخلية للمصنع</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    حدد الفئات التي يجب استثناؤها من عمليات البيع أو الفوترة، تحكم في فئات العناصر غير المخصصة للبيع بحسب احتياجات العمل أو قواعد التحكم في المخزون.
                  </span>
                </div>

                {/* Field 2: طبيعة مبيعات النشاط */}
                <div className="space-y-3 border-t border-slate-50 pt-4">
                  <label className="text-xs font-bold text-slate-700 block">طبيعة مبيعات النشاط</label>
                  
                  <div className="space-y-2 max-w-lg">
                    {/* Option 1 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-600 transition-colors">
                      <input
                        type="radio"
                        name="activityType"
                        checked={activityType === 'products'}
                        onChange={() => setActivityType('products')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        المنتجات فقط <span className="text-slate-400 font-medium mr-1">(نشاطك يقدم منتجات فقط، يمكن تتبع كمياتها وإدارتها كوحدات في المخزون، وإصدار أذون لتسجيل الحركات المخزنية الواردة والصادرة وفقاً لإعدادات المخزون.)</span>
                      </span>
                    </label>

                    {/* Option 2 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-600 transition-colors">
                      <input
                        type="radio"
                        name="activityType"
                        checked={activityType === 'services'}
                        onChange={() => setActivityType('services')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        الخدمات فقط <span className="text-slate-400 font-medium mr-1">(نشاطك يقدم خدمات فقط، يمكن تحديد مدة لها واستخدامها في الحجوزات والمشاريع.)</span>
                      </span>
                    </label>

                    {/* Option 3 */}
                    <label className="flex items-center justify-start gap-3 p-3 rounded border border-[#0f5fc2] bg-[#f0f7ff] cursor-pointer text-xs font-bold text-slate-700 transition-colors">
                      <input
                        type="radio"
                        name="activityType"
                        checked={activityType === 'both'}
                        onChange={() => setActivityType('both')}
                        className="w-4 h-4 accent-[#0f5fc2]"
                      />
                      <span>
                        منتجات وخدمات <span className="text-slate-400 font-medium mr-1">(نشاطك يقدم منتجات وخدمات معاً.)</span>
                      </span>
                    </label>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    حدد ما إذا كان نشاطك التجاري يبيع منتجات، أو خدمات، أو كلاهما. يتحكم هذا الإعداد في ما يمكن إضافته إلى المخزون. يمكن تحديث هذا الإعداد لاحقاً دون التأثير على العناصر أو السجلات الحالية.
                  </span>
                </div>

              </div>
            )}


            {/* -------------------- TAB 5: القيود المحاسبية -------------------- */}
            {activeTab === 'accounting' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-800">القيود المحاسبية</h3>
                  <p className="text-xs text-slate-400 mt-1">تحكم في كيفية إدخال أوصاف قيود اليومية للفواتير داخل نظام المحاسبة.</p>
                </div>

                {/* Field 1: وصف مخصص لقيود اليومية */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">وصف مخصص لقيود اليومية</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCustomJournalMemo(!customJournalMemo)}
                      className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        customJournalMemo ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        customJournalMemo ? '-translate-x-6' : '-translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{customJournalMemo ? 'مسموح' : 'غير مسموح/مغلق'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-relaxed">
                    افتراضياً، يتم استخدام رقم الفاتورة كوصف للقيد اليومي (مثال: فاتورة #2136). فعل هذا الخيار لتخصيص الوصف باستخدام متغيرات ونصوص تحددها بنفسك.
                  </span>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Right vertical tabs sidebar in Arabic RTL (visual col-span 3) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-[#fcfdfe] rounded border border-[#dae4f0] shadow-3xs overflow-hidden">
            <div className="p-4 bg-[#f4f7f9] border-b border-[#ebd5f0] text-center">
              <span className="text-xs font-bold text-[#204060]">تبويبات إعدادات الفواتير</span>
            </div>

            <div className="divide-y divide-slate-100 flex flex-col">
              {tabsList.map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full p-4 text-right flex items-start gap-3 transition-all cursor-pointer relative select-none ${
                      isSelected
                        ? 'bg-white border-r-4 border-[#0f5fc2] text-slate-900 shadow-2xs font-bold'
                        : 'bg-[#fafcfd] hover:bg-slate-50/85 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded shrink-0 mt-0.5 ${
                      isSelected ? 'bg-[#e2f0fd] text-[#0f5fc2]' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <TabIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <h4 className="text-xs font-bold leading-none">{tab.title}</h4>
                      <p className="text-[9px] text-slate-400 font-medium truncate whitespace-normal leading-normal line-clamp-2">
                        {tab.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
