/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  X,
  Settings,
  Type,
  Image,
  Building,
  User,
  Truck,
  Columns,
  PlusSquare,
  Bookmark,
  FileText,
  Printer,
  ChevronLeft,
  LayoutTemplate,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Eye,
  RotateCcw,
  Palette
} from 'lucide-react';

interface InvoiceDesignEditorViewProps {
  template: {
    id: string;
    name: string;
    createdAt: string;
    type: 'A4' | 'Thermal' | 'A5';
    primaryColor: string;
    isDefault: boolean;
    businessName: string;
    taxNumber: string;
    logoColor: string;
  } | null; // null if creating a new design
  onBack: () => void;
  onSave: (message: string, updatedTemplate: any) => void;
}

type TabType =
  | 'template'
  | 'title'
  | 'logo'
  | 'business'
  | 'customer'
  | 'shipping'
  | 'items'
  | 'customFields'
  | 'terminology'
  | 'intro'
  | 'footer'
  | 'style'
  | 'notes';

export default function InvoiceDesignEditorView({
  template,
  onBack,
  onSave
}: InvoiceDesignEditorViewProps) {
  // Is this editing an existing template or creating a new one?
  const isEditing = !!template;

  // 1. Core State mirroring the screenshot and options
  const [templateName, setTemplateName] = useState(template?.name || 'فاتورة جديدة');
  const [templateType, setTemplateType] = useState<'A4' | 'Thermal' | 'A5'>(template?.type || 'A4');
  const [isDefault, setIsDefault] = useState(template?.isDefault || false);
  const [hideCurrencySymbol, setHideCurrencySymbol] = useState(true);
  const [alwaysShowPaidAndDue, setAlwaysShowPaidAndDue] = useState(true);
  const [addShippingInfo, setAddShippingInfo] = useState(false);
  const [quantityPlacement, setQuantityPlacement] = useState('before'); // "before" or "after" unit price

  // Advanced configurations for other tabs to provide ultra high fidelity
  const [documentTitle, setDocumentTitle] = useState('فاتورة');
  const [showLogo, setShowLogo] = useState(true);
  const [logoSize, setLogoSize] = useState('medium'); // "small" | "medium" | "large"
  const [businessName, setBusinessName] = useState(template?.businessName || 'عبدالرحمن ياسر');
  const [businessAddress, setBusinessAddress] = useState('القاهرة، مصر');
  const [taxNumber, setTaxNumber] = useState(template?.taxNumber || '310459275829143');
  const [customerName, setCustomerName] = useState('شركة العميل');
  const [customerAddress, setCustomerAddress] = useState('الرياض، المملكة العربية السعودية');
  const [terms, setTerms] = useState('شكراً لتسوقكم معنا.');
  const [primaryColor, setPrimaryColor] = useState(template?.primaryColor || '#0f5fc2');

  // Currently Active Tab in the far right sidebar
  const [activeTab, setActiveTab] = useState<TabType>('template');

  // Defined side tabs matching Arabic terminology in screenshot precisely
  const sidebarTabs = [
    { id: 'template', label: 'بيانات القالب', icon: Settings },
    { id: 'title', label: 'مسمى', icon: Type },
    { id: 'logo', label: 'الشعار', icon: Image },
    { id: 'business', label: 'بيانات العمل', icon: Building },
    { id: 'customer', label: 'بيانات العميل', icon: User },
    { id: 'shipping', label: 'معلومات الشحن', icon: Truck },
    { id: 'items', label: 'أعمدة البنود', icon: Columns },
    { id: 'customFields', label: 'الحقول الإضافية', icon: PlusSquare },
    { id: 'terminology', label: 'المسميات', icon: Bookmark },
    { id: 'intro', label: 'المقدمة', icon: FileText },
    { id: 'footer', label: 'التذييل', icon: FileText },
    { id: 'style', label: 'التنسيق', icon: Palette },
    { id: 'notes', label: 'الملاحظات', icon: FileText }
  ];

  // Callback save
  const handleSave = () => {
    const updated = {
      id: template?.id || `template-${Date.now()}`,
      name: templateName,
      createdAt: template?.createdAt || new Date().toLocaleDateString('en-GB'),
      type: templateType,
      primaryColor: primaryColor,
      isDefault: isDefault,
      businessName: businessName,
      taxNumber: taxNumber,
      logoColor: primaryColor
    };

    onSave(
      isEditing
        ? `تم تحديث تصميم الفاتورة "${templateName}" بنجاح!`
        : `تم إنشاء وإضافة تصميم الفاتورة الجديد "${templateName}" بنجاح!`,
      updated
    );
  };

  return (
    <div id="daftra-invoice-design-builder" className="flex flex-col h-screen text-right font-sans select-none bg-[#abb5c0]">
      
      {/* 1. Styled Top Navigation bar mimicking exactly the screen */}
      <div className="bg-[#1c2e43] text-white px-6 py-2.5 flex items-center justify-between shadow-md shrink-0">
        
        {/* Left Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-5 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>حفظ</span>
          </button>
          
          <button
            onClick={onBack}
            className="bg-[#34495e] hover:bg-[#2c3e50] text-slate-200 border border-[#4a5c6e] px-4 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>إلغاء</span>
          </button>
        </div>

        {/* Center Builder Header title */}
        <div className="hidden md:block">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1abc9c]" />
            <span>منشئ تصاميم الفواتير</span>
          </h2>
        </div>

        {/* Right Nav Path indicators */}
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400 font-semibold">تعديل</span>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-200 font-bold max-w-[120px] truncate">
            {templateName} #{template?.id ? '1#' : 'جديد'}
          </span>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
          <button onClick={onBack} className="text-slate-300 hover:text-white font-bold transition-colors">
            تصاميم الفواتير
          </button>
        </div>
      </div>

      {/* 2. Main Builder Core Workspace Container splits into columns from Left to Right */}
      <div className="flex flex-1 overflow-hidden">

        {/* A. LEFT COLUMN: PREVIEW CANVAS (Large layout rendering live sheet simulator) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start bg-[#abb5c0]">
          
          <div className="relative w-full max-w-lg mt-2 min-h-[600px]">
            {/* Float watermark layout banner block indicating template preview type */}
            <div className="absolute -top-6 right-2 text-[11px] font-bold text-slate-700 bg-white/40 backdrop-blur-3xs px-3 py-0.5 rounded-full z-10">
              {templateType === 'Thermal' ? 'فاتورة حرارية' : templateType === 'A4' ? 'حجم A4 الكلاسيكي' : 'حجم A5'}
            </div>

            {/* --- CORE DYNAMIC INVOICE SHEET CONTAINER MOCKUP --- */}
            {templateType === 'Thermal' ? (
              /* ----------------- THERMAL VISUAL BLUEPRINT DESIGN SHOWN IN CAPTION ----------------- */
              <div className="w-[310px] mx-auto bg-white text-black shadow-lg border border-slate-300 p-4 font-mono text-[9px] space-y-4 text-center select-none pb-12 transition-all">
                <div className="text-[10px] text-slate-400 font-bold border-b border-slate-100 pb-1.5 flex justify-between">
                  <span>{`{%sticky_header%}`}</span>
                  <span>معاينة حية</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">{documentTitle}</h4>
                  
                  {/* Optional Dynamic Logo placeholder */}
                  {showLogo && (
                    <div className="w-20 h-20 bg-[#f1f5f9] border border-dashed border-slate-300 flex flex-col items-center justify-center mx-auto my-2 text-slate-400 text-[9px]">
                      <span className="font-bold">Your Logo</span>
                    </div>
                  )}

                  <p className="text-[11px] font-bold text-slate-800">{businessName}</p>
                  <p className="text-[9px] text-slate-500">العنوان: {businessAddress}</p>
                  <p className="text-[9px] text-slate-500">الرقم الضريبي للمنشأة: {taxNumber}</p>
                </div>

                {/* Billing customer section block */}
                <div className="text-right border-y border-dashed border-black py-2.5 space-y-1 text-[8.5px] leading-relaxed">
                  <p className="flex justify-between flex-row-reverse text-slate-700 font-semibold">
                    <span>فاتورة إلى:</span>
                    <span className="font-bold">{customerName}</span>
                  </p>
                  <p className="flex justify-between flex-row-reverse text-slate-700">
                    <span>العنوان:</span>
                    <span>{customerAddress}</span>
                  </p>
                  {addShippingInfo && (
                    <p className="flex justify-between flex-row-reverse text-slate-600 border-t border-dashed border-slate-200 pt-1 mt-1">
                      <span>عنوان الشحن الثانوي:</span>
                      <span>توصيل سريع مخصص للموقع</span>
                    </p>
                  )}
                  <p className="flex justify-between flex-row-reverse text-slate-700 font-semibold border-t border-dashed border-slate-100 pt-1">
                    <span>رقم المقارنة:</span>
                    <span className="font-bold">#000000</span>
                  </p>
                  <p className="flex justify-between flex-row-reverse text-slate-700 font-semibold">
                    <span>تاريخ المعاملة:</span>
                    <span>05/06/2026</span>
                  </p>
                </div>

                {/* Interactive Dynamic Grid mimicking the screenshot table columns */}
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between flex-row-reverse text-[9px] font-bold border-b border-black pb-1 text-slate-800">
                    <span className="w-2/5 text-right">الاسم / البند</span>
                    <span className="w-1/5 text-center">كمية</span>
                    <span className="w-1/5 text-center">سعر</span>
                    <span className="w-1/5 text-left">المجموع</span>
                  </div>
                  
                  <div className="flex justify-between flex-row-reverse text-[8.5px] text-slate-700">
                    <span className="w-2/5 text-right leading-tight">كرسي مكتبي دوار مريح</span>
                    
                    {/* Render currency or not according to toggle state */}
                    {quantityPlacement === 'before' ? (
                      <>
                        <span className="w-1/5 text-center font-bold">1</span>
                        <span className="w-1/5 text-center">200.00 {!hideCurrencySymbol && 'ج.م'}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1/5 text-center">200.00 {!hideCurrencySymbol && 'ج.م'}</span>
                        <span className="w-1/5 text-center font-bold">1</span>
                      </>
                    )}
                    
                    <span className="w-1/5 text-left font-bold">200.00 {!hideCurrencySymbol && 'ج.م'}</span>
                  </div>

                  <div className="text-right pt-1 pb-1 flex justify-end">
                    <span className="text-[7.5px] text-slate-400 border border-dashed border-slate-300 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-50 transition-colors">
                      إضافة حقول أخرى
                    </span>
                  </div>
                </div>

                {/* Totals receipt math block */}
                <div className="border-t border-dashed border-[#888888] pt-2.5 text-right space-y-1.5 text-[9px] font-semibold">
                  <div className="flex justify-between flex-row-reverse text-slate-700">
                    <span>المجموع الفرعي:</span>
                    <span>200.00 {!hideCurrencySymbol && 'ج.م'}</span>
                  </div>
                  
                  <div className="flex justify-between flex-row-reverse text-slate-900 font-bold border-t border-black pt-1 px-0.5 text-[10px]">
                    <span>الإجمالي:</span>
                    <span>200.00 {!hideCurrencySymbol && 'ج.م'}</span>
                  </div>

                  {alwaysShowPaidAndDue && (
                    <>
                      <div className="flex justify-between flex-row-reverse text-slate-600">
                        <span>مدفوع:</span>
                        <span>0.00 {!hideCurrencySymbol && 'ج.م'}</span>
                      </div>
                      <div className="flex justify-between flex-row-reverse text-slate-900 border-t border-dashed border-slate-200 font-bold text-[9.5px]">
                        <span>الرصيد المستحق:</span>
                        <span>200.00 {!hideCurrencySymbol && 'ج.م'}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Barcode / QR Section */}
                <div className="space-y-2 pt-5 border-t border-dashed border-slate-300">
                  <div className="w-18 h-12 bg-white border border-slate-200 mx-auto flex flex-col justify-between items-center p-1 font-sans">
                    <div className="flex items-center gap-0.5 h-full pt-1.5">
                      <div className="w-1 bg-black h-4"></div>
                      <div className="w-0.5 bg-black h-4"></div>
                      <div className="w-1 bg-black h-4"></div>
                      <div className="w-0.5 bg-black h-4"></div>
                      <div className="w-1.5 bg-black h-4"></div>
                      <div className="w-1 bg-black h-4"></div>
                      <div className="w-0.5 bg-black h-4"></div>
                    </div>
                    <span className="text-[6.5px] font-mono text-slate-500">CODE-128-DEMO</span>
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold">{terms}</p>
                </div>

              </div>
            ) : (
              /* ----------------- STANDARD A4 OR A5 RICH BLUEPRINT VIEW ----------------- */
              <div className="w-full bg-white text-slate-800 shadow-xl border border-slate-300 p-6 rounded font-sans text-xs space-y-6 select-none transition-all">
                
                {/* Visual Accent bar aligned to custom primary color */}
                <div className="h-1 rounded" style={{ backgroundColor: primaryColor }} />

                {/* Upper block info */}
                <div className="flex justify-between items-start flex-row-reverse">
                  
                  {/* Dynamic Logo + Creator Profile */}
                  <div className="text-right space-y-1.5">
                    {showLogo && (
                      <div 
                        className={`bg-slate-50 border border-slate-200 rounded flex items-center justify-center font-bold text-white mb-2 ${
                          logoSize === 'small' ? 'w-8 h-8 text-xs' : logoSize === 'medium' ? 'w-12 h-12 text-sm' : 'w-16 h-16 text-md'
                        }`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        {businessName.charAt(0) || 'D'}
                      </div>
                    )}
                    <h4 className="text-xs font-bold text-slate-900">{businessName}</h4>
                    <p className="text-[9px] text-slate-400">{businessAddress}</p>
                    <p className="text-[9px] text-slate-400">الرقم الضريبي: {taxNumber}</p>
                  </div>

                  {/* Header labels */}
                  <div className="text-left space-y-1">
                    <h2 className="text-base font-bold uppercase tracking-wide" style={{ color: primaryColor }}>
                      {documentTitle}
                    </h2>
                    <div className="text-[9px] text-slate-400 font-semibold space-y-0.5">
                      <p>رقم الفاتورة: <span className="font-bold text-slate-700">#INV-2026-003</span></p>
                      <p>التاريخ: 05/06/2026</p>
                    </div>
                  </div>

                </div>

                <div className="border-t border-slate-100"></div>

                {/* Customer addressing info column grids */}
                <div className="grid grid-cols-2 gap-4 text-right flex-row-reverse">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 block font-bold">موجّهة إلى:</span>
                    <p className="font-bold text-slate-700">{customerName}</p>
                    <p className="text-[9px] text-slate-400">{customerAddress}</p>
                  </div>

                  {addShippingInfo && (
                    <div className="border-r border-slate-100 pr-4 space-y-1">
                      <span className="text-[9px] text-slate-400 block font-bold">معلومات الشحن والتوصيل:</span>
                      <p className="text-slate-650 font-bold">منفذ شحن مخصص</p>
                      <p className="text-[9px] text-slate-405 leading-relaxed">الرياض، المملكة العربية السعودية</p>
                    </div>
                  )}
                </div>

                {/* Main Table details mock */}
                <div className="border border-slate-150 rounded overflow-hidden">
                  <table className="w-full text-right border-collapse text-[9.5px]">
                    <thead>
                      <tr className="text-white font-bold" style={{ backgroundColor: primaryColor }}>
                        <th className="p-2 text-right">رقم البند</th>
                        <th className="p-2 text-right w-1/2">البيان والخدمات</th>
                        <th className="p-2 text-center">سعر الوحدة</th>
                        <th className="p-2 text-center">الكمية</th>
                        <th className="p-2 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      <tr>
                        <td className="p-2 font-bold">1</td>
                        <td className="p-2">كرسي مكتبي دوار مريح ومصنّع بجودة عالية ومثالي للقرارات الصعبة</td>
                        <td className="p-2 text-center">200.00 {!hideCurrencySymbol && 'ج.م'}</td>
                        <td className="p-2 text-center font-bold">1</td>
                        <td className="p-2 text-left font-bold">200.00 {!hideCurrencySymbol && 'ج.م'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary numeric calculations flow */}
                <div className="flex justify-between items-start flex-row-reverse pt-2">
                  <div className="w-1/2 space-y-1.5 text-right text-[9.5px] font-semibold">
                    <div className="flex justify-between flex-row-reverse text-slate-500 pb-1 border-b border-slate-100">
                      <span>المقرر الفرعي للتكلفة:</span>
                      <span>200.00 {!hideCurrencySymbol && 'ج.م'}</span>
                    </div>

                    <div className="flex justify-between flex-row-reverse text-slate-900 font-bold text-xs pt-1">
                      <span>الإجمالي الكلي:</span>
                      <span style={{ color: primaryColor }}>200.00 {!hideCurrencySymbol && 'ج.م'}</span>
                    </div>

                    {alwaysShowPaidAndDue && (
                      <>
                        <div className="flex justify-between flex-row-reverse text-slate-500 pt-0.5">
                          <span>المبلغ المدفوع:</span>
                          <span>0.00 {!hideCurrencySymbol && 'ج.م'}</span>
                        </div>
                        <div className="flex justify-between flex-row-reverse text-slate-900 font-bold border-t border-dashed border-slate-200 pt-1 text-[11px]">
                          <span>المستحق للدفع:</span>
                          <span>200.00 {!hideCurrencySymbol && 'ج.م'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="w-1/2 text-right pr-4">
                    <p className="text-[8.5px] text-slate-400 font-bold">{terms}</p>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* B. MIDDLE COLUMN: OPTIONS CONTAINER (Inputs list dynamically updating according to far right active tab) */}
        <div className="w-80 bg-white border-l border-[#dae4f0] shadow-md overflow-y-auto flex flex-col justify-between">
          
          <div className="p-5 space-y-6">
            
            {/* Dynamically checking matching content of active settings card */}
            {activeTab === 'template' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">إعدادات القالب العامة</h3>
                  <div className="h-0.5 bg-[#f1f5f9] w-full" />
                </div>

                {/* Template Name Input - matches "عدل بيانات القالب" view */}
                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-600 block">
                    مسمى القالب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="مثال: فاتورة حرارية"
                    className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-1.5 text-xs text-slate-700 outline-none text-right transition-colors"
                  />
                </div>

                {/* Layout size template selection */}
                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-600 block">حجم الورق للطباعة</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value as any)}
                    className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-2.5 py-1.5 text-xs text-slate-700 outline-none text-right cursor-pointer transition-colors"
                  >
                    <option value="Thermal">كاشير حراري (Thermal)</option>
                    <option value="A4">طابعة عادية (A4)</option>
                    <option value="A5">طباعة مصغرة (A5)</option>
                  </select>
                </div>

                {/* Make it default card toggle */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded flex items-center justify-between transition-colors">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#0f5fc2] border-gray-300 rounded focus:ring-[#0f5fc2] cursor-pointer"
                  />
                  <label className="text-xs font-bold text-slate-500 leading-tight flex-1 text-right mr-3">
                    إجعل هذا التصميم هو القالب الافتراضي لجميع الفواتير
                  </label>
                </div>

                {/* Toggle: Hide currency symbol in item prices */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100 text-right">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hideCurrencySymbol}
                      onChange={(e) => setHideCurrencySymbol(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    لا تظهر علامة العملة في سعر البنود
                  </span>
                </div>

                {/* Toggle: Always show paid and due amount */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-right">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alwaysShowPaidAndDue}
                      onChange={(e) => setAlwaysShowPaidAndDue(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    أظهر دائماً المبلغ المدفوع والمبلغ المستحق
                  </span>
                </div>

                {/* Toggle: Add secondary shipping address */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-right">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addShippingInfo}
                      onChange={(e) => setAddShippingInfo(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    إضافة بيانات الشحن (عنوان ثانوي) للفاتورة
                  </span>
                </div>

                {/* Quantity placement dropdown */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-500 block">خيارات الكمية وسعر الوحدة</label>
                  <select
                    value={quantityPlacement}
                    onChange={(e) => setQuantityPlacement(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded px-2.5 py-1.5 text-xs text-slate-700 outline-none text-right cursor-pointer"
                  >
                    <option value="before">إظهار الكمية قبل سعر الوحدة</option>
                    <option value="after">إظهار الكمية بعد سعر الوحدة</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB: TITLE */}
            {activeTab === 'title' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">مسمى العنوان الرئيسي</h3>
                  <div className="h-0.5 bg-[#f1f5f9] w-full" />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-600 block">مسمى مستند الفاتورة</label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 outline-none text-right"
                  />
                  <p className="text-[9px] text-slate-400">مثال: فاتورة ضريبية مبسطة، إشعار دائن، إيصال مبيعات</p>
                </div>
              </div>
            )}

            {/* TAB: LOGO */}
            {activeTab === 'logo' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">شعار الفاتورة</h3>
                  <div className="h-0.5 bg-[#f1f5f9] w-full" />
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-right">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-600">عرض شعار الهوية التجارية</span>
                </div>

                {showLogo && (
                  <div className="space-y-2 text-right">
                    <label className="text-xs font-bold text-slate-600 block">حجم الشعار</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['small', 'medium', 'large'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setLogoSize(sz)}
                          className={`p-1.5 rounded border text-xs font-bold text-center cursor-pointer transition-all ${
                            logoSize === sz ? 'bg-[#0f5fc2] text-white border-[#0f5fc2]' : 'bg-slate-50 text-slate-500 hover:bg-slate-150 border-slate-200'
                          }`}
                        >
                          {sz === 'small' ? 'صغير' : sz === 'medium' ? 'متوسط' : 'كبير'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BUSINESS */}
            {activeTab === 'business' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">بيانات العمل المطبوعة</h3>
                  <div className="h-0.5 bg-[#f1f5f9] w-full" />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-600 block font-sans">اسم المنشأة</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 text-right outline-none"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-600 block">العنوان ومقر عملك الرئيسي</label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 text-right outline-none"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-600 block">الرقم الموحد المالي الضريبي</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 text-right outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB: CUSTOMER */}
            {activeTab === 'customer' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">بيانات العميل الحيوية</h3>
                  <div className="h-0.5 bg-[#f1f5f9] w-full" />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-600 block">اسم نموذج العميل الافتراضي</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 text-right outline-none"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-600 block">العنوان الدائم للعميل</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-slate-700 text-right outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB: NOTES & TERMS */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">الملاحظات والشروط المرجعية</h3>
                  <div className="h-0.5 bg-[#f1f5f9] w-full" />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-600 block">شروط الضمان وسياسة الاسترجاع</label>
                  <textarea
                    rows={4}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded p-2.5 text-xs text-slate-700 text-right outline-none transition-all"
                    placeholder="مثال: البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام من تاريخ الاستلام..."
                  />
                </div>
              </div>
            )}

            {/* TAB: STYLE */}
            {activeTab === 'style' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">الألوان وصيغة التنسيق</h3>
                  <div className="h-0.5 bg-[#f1f5f9] w-full" />
                </div>

                <div className="space-y-2 text-right">
                  <label className="text-xs font-bold text-slate-600 block">لون ترويسة الهوية</label>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {[
                      { color: '#0f5fc2', name: 'أزرق' },
                      { color: '#1abc9c', name: 'أخضر' },
                      { color: '#2c3e50', name: 'رمادي' },
                      { color: '#e74c3c', name: 'أحمر' },
                      { color: '#8e44ad', name: 'بنفسجي' },
                      { color: '#000000', name: 'أسود' }
                    ].map((pal) => (
                      <button
                        key={pal.color}
                        type="button"
                        onClick={() => setPrimaryColor(pal.color)}
                        className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                          primaryColor === pal.color ? 'ring-2 ring-slate-800 scale-110' : 'border-slate-200 hover:scale-105'
                        }`}
                        style={{ backgroundColor: pal.color }}
                        title={pal.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback mock description for other tabs to keep the interface complete and helpful */}
            {!['template', 'title', 'logo', 'business', 'customer', 'notes', 'style'].includes(activeTab) && (
              <div className="p-4 bg-slate-50 rounded border border-slate-150 text-right space-y-3">
                <p className="text-xs font-bold text-slate-600">خيارات متطورة لـ {sidebarTabs.find((t) => t.id === activeTab)?.label}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  تحتوي هذه اللوحة على إعدادات متقدمة لإدارة وتخصيص هيكل وتصميم الفاتورة ومطابقتها للمعايير والأنظمة المعتمدة لدفترة. تم تفعيل الربط التلقائي والافتراضي مع نموذج الطباعة للعميل.
                </p>
                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('template')}
                    className="text-[#0f5fc2] hover:underline text-[10px] font-bold cursor-pointer"
                  >
                    الرجوع للإعدادات العامة
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Quick tips panel bottom of middle options layout */}
          <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] text-right">
            <div className="flex gap-2 items-start flex-row-reverse">
              <HelpCircle className="w-4 h-4 text-[#0f5fc2] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-755 leading-normal">تلميحات النظام الكاشير</p>
                <p className="text-[9px] text-slate-400 font-semibold leading-normal">
                  استخدم الفواتير الحرارية Thermal لتقديم أفضل تجربة سريعة للزبائن في متاجر البيع المباشر ونقاط البيع.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* C. FAR RIGHT COLUMN: TAB NAVIGATION TRACKER (A slate sidebar containing vertical tab buttons) */}
        <div className="w-44 bg-[#234b75] flex flex-col pt-4 overflow-y-auto shrink-0 border-l border-[#193a5e] select-none text-right">
          
          <div className="px-3 pb-2.5 border-b border-[#2d5c8e] mb-2 flex items-center justify-between text-white/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">خيارات ومقاييس البيانات</span>
            <LayoutTemplate className="w-3.5 h-3.5" />
          </div>

          <div className="flex flex-col gap-0.5 px-1 pb-6">
            {sidebarTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold transition-all relative overflow-hidden group cursor-pointer ${
                    isActive 
                      ? 'bg-white text-[#204060] rounded-r shadow-xs font-extrabold border-r-3 border-[#1abc9c]' 
                      : 'text-slate-100 hover:bg-[#2d5c8e]/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-row-reverse justify-end w-full">
                    <IconComponent className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 duration-100 ${isActive ? 'text-[#0f5fc2]' : 'text-slate-300'}`} />
                    <span className="truncate pr-1">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
