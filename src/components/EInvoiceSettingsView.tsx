/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ChevronLeft,
  X,
  Download,
  Plus,
  Trash2,
  FileDown,
  Sparkles,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface EInvoiceSettingsViewProps {
  onBack: () => void;
  onSave: (message: string) => void;
}

interface TaxMapping {
  id: string;
  systemTax: string;
  etaTaxType: string;
  etaTaxSubtype: string;
}

export default function EInvoiceSettingsView({ onBack, onSave }: EInvoiceSettingsViewProps) {
  // Main feature toggles
  const [eInvoiceEnabled, setEInvoiceEnabled] = useState(true);
  const [eReceiptEnabled, setEReceiptEnabled] = useState(false);
  
  // Credentials
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [useSandbox, setUseSandbox] = useState(false);

  // General Settings
  const [taxActivityCode, setTaxActivityCode] = useState('');
  const [defaultCoding, setDefaultCoding] = useState('EGS');
  const [itemCodeField, setItemCodeField] = useState('item_code');
  const [itemTypeField, setItemTypeField] = useState('item_type');
  const [purchaseOrderRef, setPurchaseOrderRef] = useState('');
  const [purchaseOrderDesc, setPurchaseOrderDesc] = useState('');
  const [salesOrderRef, setSalesOrderRef] = useState('');
  const [salesOrderDesc, setSalesOrderDesc] = useState('');
  const [exportProformaRef, setExportProformaRef] = useState('');
  const [certIssuerName, setCertIssuerName] = useState('');
  const [digitalSignatureEnabled, setDigitalSignatureEnabled] = useState(false);

  // Tax Mappings Table state
  const [taxMappings, setTaxMappings] = useState<TaxMapping[]>([
    {
      id: '1',
      systemTax: 'Value Added Tax (VAT) 14%',
      etaTaxType: 'T1 - Value Added Tax',
      etaTaxSubtype: 'V009 - General Goods with 14% rate'
    },
    {
      id: '2',
      systemTax: 'Withholding Tax (WHT) 1%',
      etaTaxType: 'T4 - Withholding WHT',
      etaTaxSubtype: 'W001 - Contracting / Services 1%'
    }
  ]);

  // Handle adding tax mapping inline row
  const handleAddTaxMapping = () => {
    const newMapping: TaxMapping = {
      id: Date.now().toString(),
      systemTax: '',
      etaTaxType: '',
      etaTaxSubtype: ''
    };
    setTaxMappings([...taxMappings, newMapping]);
  };

  const handleUpdateTaxMapping = (id: string, field: keyof TaxMapping, value: string) => {
    setTaxMappings(
      taxMappings.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveTaxMapping = (id: string) => {
    setTaxMappings(taxMappings.filter((m) => m.id !== id));
  };

  const handleTriggerSave = () => {
    onSave('تم حفظ إعدادات الفاتورة الإلكترونية والربط مع مصلحة الضرائب المصرية بنجاح!');
    onBack();
  };

  // Predefined selections to make the UI populated and fully functional
  const activityCodes = [
    { value: '462000', label: '462000 - تجارة الاستيراد والتصدير والتوزيع' },
    { value: '620100', label: '620100 - أنشطة برمجة وتصميم الحاسب الآلي' },
    { value: '474100', label: '474100 - تجارة التجزئة لأجهزة الحاسب والبرمجيات' },
    { value: '702000', label: '702000 - الأنشطة الاستشارية في مجال الإدارة والتشغيل' }
  ];

  const systemTaxesSelection = [
    'ضريبة القيمة المضافة 14%',
    'ضريبة القيمة المضافة 5%',
    'ضريبة الجدول 8%',
    'ضريبة الخصم والتحصيل 1%',
    'ضريبة كسب العمل',
    'ضريبة دمغة مخصصة'
  ];

  const etaTaxTypesSelection = [
    'T1 - ضريبة القيمة المضافة',
    'T2 - ضريبة الجدول (نسبية)',
    'T3 - ضريبة الجدول (نوعية)',
    'T4 - الخصم تحت حساب الضريبة',
    'T5 - رسم تنمية الموارد',
    'T6 - رسم خدمة جمركية'
  ];

  const etaTaxSubtypesSelection = [
    'V009 - سلع عامة بمعدل 14%',
    'V001 - سلع وخدمات جدول بفئة 5%',
    'V012 - خدمات التصدير (معفاة)',
    'W001 - المقاولات والتوريدات بمعدل 1%',
    'W002 - الخدمات والاستشارات بمعدل 3%'
  ];

  return (
    <div id="daftra-einvoice-settings-view" className="flex flex-col min-h-screen text-right font-sans select-none bg-[#f4f7f9] pb-12">
      
      {/* 1. Exactly Styled Action Navbar */}
      <div className="bg-white border-b border-[#dae4f0] px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-3xs">
        {/* Left Actions - exactly mirroring the design of Daftra top bar layout */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerSave}
            className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-5 py-1.5 rounded text-xs font-bold shadow-3xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>حفظ</span>
          </button>
          
          <button
            onClick={onBack}
            className="bg-white hover:bg-slate-50 text-slate-500 border border-[#e1e8ed] px-4 py-1.5 rounded text-xs font-bold shadow-3xs flex items-center gap-1 cursor-pointer transition-all"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
            <span>إلغاء</span>
          </button>
        </div>

        {/* Right Nav path: Sales Settings -> Electronic Invoice Settings */}
        <div className="flex items-center gap-2 text-xs">
          <button onClick={onBack} className="text-[#0f5fc2] hover:underline font-bold">
            إعدادات المبيعات
          </button>
          <ChevronLeft className="w-3.5 h-3.5 text-[#0f5fc2]" />
          <span className="text-slate-500 font-bold">إعدادات الفاتورة الإلكترونية</span>
        </div>
      </div>

      {/* 2. Form container with center layout like Daftra setting page screen structure */}
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Card wrappers exactly mimicking screen grids */}
        <div className="space-y-6">

          {/* SECTION 1: تفعيل الفواتير الإلكترونية */}
          <div className="bg-white rounded border border-[#dae4f0] shadow-3xs p-6 space-y-6 relative overflow-hidden">
            {/* Header section toggle checkmark */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-700">تفعيل الفواتير الإلكترونية</h3>
              </div>
              <input
                type="checkbox"
                checked={eInvoiceEnabled}
                onChange={(e) => setEInvoiceEnabled(e.target.checked)}
                className="w-4 h-4 text-[#0f5fc2] border-gray-300 rounded focus:ring-[#0f5fc2] cursor-pointer"
              />
            </div>

            <AnimatePresence>
              {eInvoiceEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Grid layout for Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Secret */}
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-slate-600 block">
                        كلمة سر العميل <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="كلمة سر العميل"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right transition-colors"
                      />
                    </div>

                    {/* Client ID */}
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-slate-600 block">
                        معرف العميل <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="معرف العميل"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right transition-colors"
                      />
                    </div>
                  </div>

                  {/* Test Mode sandbox block styled as light grey alert card */}
                  <div className="my-3 p-3 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-right">
                    <label className="text-xs font-bold text-slate-500 mr-2 flex-1 pointer-events-none select-none">
                      إستخدام الوضع التجريبي
                    </label>
                    <input
                      type="checkbox"
                      checked={useSandbox}
                      onChange={(e) => setUseSandbox(e.target.checked)}
                      className="w-4 h-4 text-[#0f5fc2] border-gray-200 rounded focus:ring-[#0f5fc2] cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 2: تفعيل الإيصالات الإلكترونية */}
          <div className="bg-white rounded border border-[#dae4f0] shadow-3xs p-4 flex items-center justify-between text-right">
            <span className="text-xs font-bold text-slate-700">تفعيل الإيصال الإلكتروني مصلحة الضرائب المصرية</span>
            <input
              type="checkbox"
              checked={eReceiptEnabled}
              onChange={(e) => setEReceiptEnabled(e.target.checked)}
              className="w-4 h-4 text-[#0f5fc2] border-gray-300 rounded focus:ring-[#0f5fc2] cursor-pointer"
            />
          </div>

          {/* SECTION 3: الإعدادات العامة */}
          <div className="bg-white rounded border border-[#dae4f0] shadow-3xs p-6 space-y-6">
            <div className="pb-3 border-b border-[#f1f5f9]">
              <h3 className="text-sm font-bold text-[#0f5fc2]">الإعدادات العامة</h3>
            </div>

            {/* Grid structure (2 columns) with actual responsive inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              
              {/* Row 1 - Right: كود النشاط الضريبي */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">
                  كود النشاط الضريبي <span className="text-red-500">*</span>
                </label>
                <select
                  value={taxActivityCode}
                  onChange={(e) => setTaxActivityCode(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right cursor-pointer"
                >
                  <option value="">إختر كود النشاط الضريبي</option>
                  {activityCodes.map((code) => (
                    <option key={code.value} value={code.value}>{code.label}</option>
                  ))}
                </select>
              </div>

              {/* Row 1 - Left: الترميز الإفتراضي */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">
                  الترميز الإفتراضي <span className="text-red-500">*</span>
                </label>
                <select
                  value={defaultCoding}
                  onChange={(e) => setDefaultCoding(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right cursor-pointer"
                >
                  <option value="EGS">EGS (الترميز المصري السلعي)</option>
                  <option value="GS1">GS1 (الترميز العالمي السلعي)</option>
                </select>
              </div>

              {/* Row 2 - Right: حقل ترميز العنصر */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">
                  حقل ترميز العنصر <span className="text-red-500">*</span>
                </label>
                <select
                  value={itemCodeField}
                  onChange={(e) => setItemCodeField(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right cursor-pointer"
                >
                  <option value="item_code">Item Code Input</option>
                  <option value="barcode">الباركود (Barcode)</option>
                  <option value="sku">رقم وحدة التخزين (SKU)</option>
                  <option value="custom_id">معرف مخصص</option>
                </select>
              </div>

              {/* Row 2 - Left: حقل نوع العنصر */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">
                  حقل نوع العنصر <span className="text-red-500">*</span>
                </label>
                <select
                  value={itemTypeField}
                  onChange={(e) => setItemTypeField(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right cursor-pointer"
                >
                  <option value="item_type">Item Type Input</option>
                  <option value="category">التصنيف رئيسي</option>
                  <option value="fixed_gs1">GS1 ثابت لكل العناصر</option>
                </select>
              </div>

              {/* Row 3 - Right: مرجع طلب الشراء */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">مرجع طلب الشراء</label>
                <select
                  value={purchaseOrderRef}
                  onChange={(e) => setPurchaseOrderRef(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right cursor-pointer"
                >
                  <option value="">إختر حقل</option>
                  <option value="po_number">رقم طلب الشراء</option>
                  <option value="po_ref">مرجع خارجي</option>
                </select>
              </div>

              {/* Row 3 - Left: وصف طلب الشراء */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">وصف طلب الشراء</label>
                <select
                  value={purchaseOrderDesc}
                  onChange={(e) => setPurchaseOrderDesc(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right cursor-pointer"
                >
                  <option value="">إختر حقل</option>
                  <option value="text_desc">شرح وتفاصيل الطلب</option>
                  <option value="notes">ملاحظات الفاتورة</option>
                </select>
              </div>

              {/* Row 4 - Right: مرجع طلب المبيعات */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">مرجع طلب المبيعات</label>
                <select
                  value={salesOrderRef}
                  onChange={(e) => setSalesOrderRef(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right cursor-pointer"
                >
                  <option value="">إختر حقل</option>
                  <option value="so_number">رقم أمر البيع</option>
                  <option value="draft_id">معرف المسودة</option>
                </select>
              </div>

              {/* Row 4 - Left: وصف طلب المبيعات */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">وصف طلب المبيعات</label>
                <select
                  value={salesOrderDesc}
                  onChange={(e) => setSalesOrderDesc(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right cursor-pointer"
                >
                  <option value="">إختر حقل</option>
                  <option value="so_desc">تفاصيل أمر المبيعات</option>
                  <option value="custom_comment">تعليق مخصص</option>
                </select>
              </div>

              {/* Row 5 - Right: رقم الفاتورة المبدئية للتصدير */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">رقم الفاتورة المبدئية للتصدير</label>
                <select
                  value={exportProformaRef}
                  onChange={(e) => setExportProformaRef(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right cursor-pointer"
                >
                  <option value="">إختر حقل</option>
                  <option value="proforma_invoice_id">رقم الفاتورة الأولية</option>
                </select>
              </div>

              {/* Row 5 - Left: تحميل برنامج التوقيع الإلكتروني */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">تحميل برنامج التوقيع الإلكتروني</label>
                <div className="flex items-center gap-2 p-1.5 bg-[#f8fafc] border border-dashed border-[#dae4f0] rounded hover:border-slate-400 transition-colors cursor-pointer select-none">
                  <div className="bg-[#0f5fc2]/10 text-[#0f5fc2] p-2 rounded">
                    <Download className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-700 truncate">برنامج دفترة للتوقيع الإلكتروني</p>
                    <p className="text-[9px] text-slate-400 font-mono">Size: 55.90 MB</p>
                  </div>
                </div>
              </div>

              {/* Row 6 - Right: إسم مصدر الشهادة */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-600 block">إسم مصدر الشهادة</label>
                <input
                  type="text"
                  placeholder="إسم مصدر الشهادة"
                  value={certIssuerName}
                  onChange={(e) => setCertIssuerName(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] hover:border-slate-400 rounded px-3 py-2 text-xs text-slate-700 outline-none text-right transition-colors"
                />
              </div>

              {/* Row 6 - Left: التوقيع الإلكتروني */}
              <div className="space-y-1.5 text-right select-none">
                <label className="text-xs font-bold text-slate-600 block">التوقيع الإلكتروني</label>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[11px] font-bold text-slate-500">التوقيع الإلكتروني</span>
                  <input
                    type="checkbox"
                    checked={digitalSignatureEnabled}
                    onChange={(e) => setDigitalSignatureEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#0f5fc2] border-gray-300 rounded focus:ring-[#0f5fc2] cursor-pointer"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 4: إعدادات الضرائب */}
          <div className="bg-white rounded border border-[#dae4f0] shadow-3xs p-6 space-y-4">
            <div className="pb-3 border-b border-[#f1f5f9]">
              <h3 className="text-sm font-bold text-[#0f5fc2]">إعدادات الضرائب</h3>
            </div>

            {/* Interactive Tax mapping table responsive structure */}
            <div className="overflow-x-auto border border-[#e2e8f0] rounded">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#334155] font-bold">
                    <th className="p-3 text-right">ضرائب النظام</th>
                    <th className="p-3 text-right">أنواع مصلحة الضرائب المصرية</th>
                    <th className="p-3 text-right">الأنواع الفرعية لمصلحة الضرائب</th>
                    <th className="p-3 text-center w-16">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {taxMappings.map((mapping) => (
                    <tr key={mapping.id} className="hover:bg-slate-50 transition-colors">
                      {/* Direct input/selection for System tax mapping */}
                      <td className="p-2">
                        <select
                          value={mapping.systemTax}
                          onChange={(e) => handleUpdateTaxMapping(mapping.id, 'systemTax', e.target.value)}
                          className="w-full bg-white border border-[#e2e8f0] rounded px-2.5 py-1 text-xs outline-none text-right cursor-pointer"
                        >
                          <option value="">إختر ضريبة النظام</option>
                          {systemTaxesSelection.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Select for ETA Tax type code */}
                      <td className="p-2">
                        <select
                          value={mapping.etaTaxType}
                          onChange={(e) => handleUpdateTaxMapping(mapping.id, 'etaTaxType', e.target.value)}
                          className="w-full bg-white border border-[#e2e8f0] rounded px-2.5 py-1 text-xs outline-none text-right cursor-pointer"
                        >
                          <option value="">إختر نوعاً من مصلحة الضرائب</option>
                          {etaTaxTypesSelection.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </td>

                      {/* Select for ETA Tax subtype code */}
                      <td className="p-2">
                        <select
                          value={mapping.etaTaxSubtype}
                          onChange={(e) => handleUpdateTaxMapping(mapping.id, 'etaTaxSubtype', e.target.value)}
                          className="w-full bg-white border border-[#e2e8f0] rounded px-2.5 py-1 text-xs outline-none text-right cursor-pointer"
                        >
                          <option value="">إختر نوعاً فرعياً</option>
                          {etaTaxSubtypesSelection.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </td>

                      {/* Row remove button */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTaxMapping(mapping.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors mx-auto block cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {taxMappings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">
                        لا يوجد ربط ضريبي مضاف حالياً. قم بإضافة ضريبة للربط مع مصلحة الضرائب.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Inline custom button with green plus icon at table bottom */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddTaxMapping}
                className="text-[#1abc9c] hover:text-[#16a085] text-xs font-bold flex items-center justify-end gap-1 px-3 py-1.5 rounded hover:bg-[#1abc9c]/5 border border-dashed border-[#1abc9c] cursor-pointer transition-all"
              >
                <span>إضافة</span>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
