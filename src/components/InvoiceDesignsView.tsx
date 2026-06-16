/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import InvoiceDesignEditorView from './InvoiceDesignEditorView';
import {
  ChevronLeft,
  X,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Check,
  Eye,
  FileText,
  Copy,
  Printer,
  Sparkles,
  Layout,
  Palette,
  FileCheck,
  RotateCcw
} from 'lucide-react';

interface InvoiceDesignsViewProps {
  onBack: () => void;
  onSave: (message: string) => void;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  createdAt: string;
  type: 'A4' | 'Thermal' | 'A5';
  primaryColor: string;
  isDefault: boolean;
  businessName: string;
  taxNumber: string;
  logoColor: string;
}

export default function InvoiceDesignsView({ onBack, onSave }: InvoiceDesignsViewProps) {
  // Existing designs
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([
    {
      id: 'template-1',
      name: 'فاتورة حرارية',
      createdAt: '04/06/2026',
      type: 'Thermal',
      primaryColor: '#000000',
      isDefault: true,
      businessName: 'مؤسسة العراقة للتجارة',
      taxNumber: '310459275829143',
      logoColor: '#204060'
    },
    {
      id: 'template-2',
      name: 'القالب الكلاسيكي المطور',
      createdAt: '22/05/2026',
      type: 'A4',
      primaryColor: '#0f5fc2',
      isDefault: false,
      businessName: 'مؤسسة العراقة للتجارة',
      taxNumber: '310459275829143',
      logoColor: '#0f5fc2'
    },
    {
      id: 'template-3',
      name: 'القالب الحديث الاحترافي',
      createdAt: '28/05/2026',
      type: 'A5',
      primaryColor: '#1abc9c',
      isDefault: false,
      businessName: 'مؤسسة العراقة للتجارة',
      taxNumber: '310459275829143',
      logoColor: '#1abc9c'
    }
  ]);

  // Active UI modes
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null);

  // Creator state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'A4' | 'Thermal' | 'A5'>('A4');
  const [newTemplateColor, setNewTemplateColor] = useState('#0f5fc2');
  const [newTemplateBusinessName, setNewTemplateBusinessName] = useState('مؤسسة العراقة للتجارة');

  // Handle defaults
  const handleSetDefault = (id: string) => {
    setTemplates(
      templates.map((t) => ({
        ...t,
        isDefault: t.id === id
      }))
    );
    setActiveMenuId(null);
    onSave('تم تعيين القالب كقالب افتراضي لجميع طباعات الفواتير بنجاح!');
  };

  // Handle copy
  const handleDuplicate = (template: InvoiceTemplate) => {
    const duplicated: InvoiceTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (نسخة)`,
      createdAt: new Date().toLocaleDateString('en-GB'),
      isDefault: false
    };
    setTemplates([...templates, duplicated]);
    setActiveMenuId(null);
    onSave(`تم تكرار القالب "${template.name}" بنجاح!`);
  };

  // Handle delete
  const handleDelete = (id: string, name: string) => {
    if (templates.length <= 1) {
      onSave('خطأ: لا يمكن حذف القالب الوحيد المتبقي!');
      return;
    }
    setTemplates(templates.filter((t) => t.id !== id));
    setActiveMenuId(null);
    onSave(`تم حذف القالب "${name}" بنجاح!`);
  };
  
  // Handle save from editor builder
  const handleSaveEditor = (message: string, updatedTemplate: InvoiceTemplate) => {
    if (isCreatingNew) {
      setTemplates([updatedTemplate, ...templates]);
      setIsCreatingNew(false);
    } else if (editingTemplate) {
      setTemplates(
        templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
      );
      setEditingTemplate(null);
    }
    onSave(message);
  };

  // Handle create save
  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('الرجاء إدخال اسم التصميم أولاً');
      return;
    }

    const created: InvoiceTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      createdAt: new Date().toLocaleDateString('en-GB'),
      type: newTemplateType,
      primaryColor: newTemplateColor,
      isDefault: false,
      businessName: newTemplateBusinessName,
      taxNumber: '310459275829143',
      logoColor: newTemplateColor
    };

    setTemplates([created, ...templates]);
    setShowCreator(false);
    // Reset form
    setNewTemplateName('');
    setNewTemplateType('A4');
    setNewTemplateColor('#0f5fc2');
    onSave(`تم إنشاء نموذج التصميم الجديد "${created.name}" بنجاح!`);
  };

  if (isCreatingNew) {
    return (
      <InvoiceDesignEditorView
        template={null}
        onBack={() => setIsCreatingNew(false)}
        onSave={handleSaveEditor}
      />
    );
  }

  if (editingTemplate) {
    return (
      <InvoiceDesignEditorView
        template={editingTemplate}
        onBack={() => setEditingTemplate(null)}
        onSave={handleSaveEditor}
      />
    );
  }

  return (
    <div id="daftra-invoice-designs-view" className="flex flex-col min-h-screen text-right font-sans select-none bg-[#f4f7f9] pb-12">
      
      {/* 1. Exactly Styled Action Navbar mimicking Daftra header */}
      <div className="bg-white border-b border-[#dae4f0] px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-3xs">
        {/* Left Actions - exactly mirroring the design of Daftra top bar layout */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingNew(true)}
            className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-5 py-1.5 rounded text-xs font-bold shadow-3xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تصميم جديد</span>
          </button>
          
          <button
            onClick={onBack}
            className="bg-white hover:bg-slate-50 text-slate-500 border border-[#e1e8ed] px-4 py-1.5 rounded text-xs font-bold shadow-3xs flex items-center gap-1 cursor-pointer transition-all"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
            <span>إلغاء</span>
          </button>
        </div>

        {/* Right Nav path: قوالب للطباعة > إعدادات المبيعات > تصاميم الفواتير/عروض الأسعار */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">قوالب للطباعة</span>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
          <button onClick={onBack} className="text-[#0f5fc2] hover:underline font-bold">
            إعدادات المبيعات
          </button>
          <ChevronLeft className="w-3.5 h-3.5 text-[#0f5fc2]" />
          <span className="text-slate-500 font-bold">تصاميم الفواتير/عروض الأسعار</span>
        </div>
      </div>

      {/* Main Body Grid containing templates list */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        <div className="space-y-6">
          
          {/* Loop over templates in the exact style of Daftra layouts card listing */}
          <div className="grid grid-cols-1 gap-4">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="bg-white rounded border border-[#dae4f0] shadow-3xs p-5 relative flex flex-row-reverse items-center justify-between transition-all hover:border-slate-300 group"
              >
                
                {/* Right side: Mock thumbnail + Title */}
                <div className="flex flex-row-reverse items-center gap-5">
                  
                  {/* High fidelity mini inline responsive blueprint preview of the chosen invoice type */}
                  <div className="relative w-28 h-36 bg-gray-50 border border-slate-200 rounded p-2 overflow-hidden shadow-2xs flex flex-col justify-between shrink-0 font-mono select-none pointer-events-none scale-100 group-hover:scale-[1.02] transition-transform duration-200">
                    {/* Header in invoice thumbnail */}
                    <div>
                      <div className="flex items-center justify-between text-[6px] text-slate-400 border-b border-slate-200 pb-1">
                        <span className="font-bold truncate max-w-[45px] text-slate-600">فاتورة</span>
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: template.primaryColor || '#0f5fc2' }}
                        />
                      </div>
                      <div className="mt-1 flex flex-col gap-0.5">
                        <div className="w-12 h-1 bg-slate-300 rounded-3xs"></div>
                        <div className="w-14 h-0.5 bg-slate-200 rounded-3xs"></div>
                      </div>
                    </div>

                    {/* Middle list elements in thumbnail */}
                    <div className="space-y-0.5 my-1">
                      <div className="flex justify-between items-center text-[4px] text-slate-400">
                        <div className="w-8 h-1 bg-slate-200 rounded-3xs"></div>
                        <div className="w-3 h-1 bg-slate-200 rounded-3xs"></div>
                      </div>
                      <div className="flex justify-between items-center text-[4px] text-slate-400">
                        <div className="w-6 h-1 bg-slate-200 rounded-3xs"></div>
                        <div className="w-3 h-1 bg-slate-200 rounded-3xs"></div>
                      </div>
                      <div className="flex justify-between items-center text-[4px] text-slate-400 border-t border-dashed border-slate-200 pt-0.5">
                        <div className="w-4 h-1 bg-slate-300 rounded-3xs"></div>
                        <div className="w-2 h-1 bg-slate-450 rounded-3xs font-bold"></div>
                      </div>
                    </div>

                    {/* Thermal or standard layout differences visually */}
                    {template.type === 'Thermal' ? (
                      <div className="flex flex-col items-center justify-center gap-0.5 border-t border-slate-100 pt-1">
                        <div className="w-3 h-3 bg-slate-800 rounded flex items-center justify-center text-[3px] text-white">QR</div>
                        <div className="w-12 h-0.5 bg-slate-400"></div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between border-t border-slate-200 pt-1">
                        <div className="w-3 h-3 bg-slate-400 rounded-xs flex items-center justify-center text-[3px] text-white">QR</div>
                        <div className="w-10 h-1 bg-slate-200 rounded-3xs"></div>
                      </div>
                    )}

                    {/* Default badge overlay */}
                    {template.isDefault && (
                      <div className="absolute top-0 right-0 bg-[#1abc9c] text-white font-sans font-bold text-[6px] px-1.5 py-0.5 rounded-bl">
                        افتراضي
                      </div>
                    )}
                  </div>

                  {/* Title and metadata */}
                  <div className="text-right space-y-1.5">
                    <div className="flex items-center gap-2 flex-row-reverse justify-end">
                      <h3 className="text-sm font-bold text-slate-700 hover:text-[#0f5fc2] cursor-pointer" onClick={() => setPreviewTemplate(template)}>
                        {template.name}
                      </h3>
                      {template.isDefault && (
                        <span className="text-[10px] font-bold text-[#1abc9c] bg-[#1abc9c]/10 px-2 py-0.5 rounded-full">
                          افتراضي
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">
                      أنشأت في: {template.createdAt}
                    </p>
                    <div className="flex gap-2 text-[10px] font-bold justify-end">
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {template.type === 'Thermal' ? 'ورق حراري (Receipt)' : template.type === 'A4' ? 'حجم A4 رئيسي' : 'حجم A5 ميني'}
                      </span>
                      <span 
                        className="text-white px-2 py-0.5 rounded"
                        style={{ backgroundColor: template.primaryColor || '#94a3b8' }}
                      >
                        لون الهوية
                      </span>
                    </div>
                  </div>

                </div>

                {/* Left side actions and the `...` menu button precisely placed as shown in screenshot */}
                <div className="relative flex items-center gap-3">
                  
                  {/* Preview quick button */}
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="hidden group-hover:flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>عرض معاينة</span>
                  </button>

                  <button
                    onClick={() => setActiveMenuId(activeMenuId === template.id ? null : template.id)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer backdrop-blur-xs shadow-3xs"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Context menu overlay */}
                  <AnimatePresence>
                    {activeMenuId === template.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute left-0 top-12 z-40 w-48 bg-white border border-[#cbd5e1] rounded-md shadow-lg py-1 text-right divide-y divide-slate-100 font-sans"
                        >
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setEditingTemplate(template);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer font-bold border-b border-slate-50 pb-1.5"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                              <span>تعديل التصميم</span>
                            </button>
                            <button
                              onClick={() => {
                                setPreviewTemplate(template);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer pt-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>معاينة الفاتورة</span>
                            </button>
                            <button
                              onClick={() => handleSetDefault(template.id)}
                              className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>تعيين كقالب افتراضي</span>
                            </button>
                          </div>
                          <div className="py-1">
                            <button
                              onClick={() => handleDuplicate(template)}
                              className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>تكرار التصميم</span>
                            </button>
                          </div>
                          <div className="py-1">
                            <button
                              onClick={() => handleDelete(template.id, template.name)}
                              className="w-full text-right px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center justify-between cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>حذف القالب</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>

      {/* --- POPUP 1: MODAL INTERACTIVE TEMPLATE CREATOR WIZARD --- */}
      <AnimatePresence>
        {showCreator && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg border border-[#dae4f0] shadow-2xl max-w-lg w-full overflow-hidden text-right font-sans"
            >
              {/* Header */}
              <div className="bg-[#f8fafc] px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
                <button
                  onClick={() => setShowCreator(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-700">إنشاء تصميم فاتورة جديد</h3>
                  <Sparkles className="w-4 h-4 text-[#1abc9c]" />
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Form fields */}
                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-500">اسم التصميم الجديد</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: فاتورة ضريبية رئيسية، تصميم الكاشير الحراري..."
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs outline-none text-right"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-500">اسم المنشأة في ترويسة الفاتورة</label>
                  <input
                    type="text"
                    placeholder="مؤسسة العراقة للتجارة"
                    value={newTemplateBusinessName}
                    onChange={(e) => setNewTemplateBusinessName(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs outline-none text-right"
                  />
                </div>

                {/* Block select template type */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-500">نوع وهيكل الطباعة لورقة الفاتورة</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'A4', label: 'A4 رئيسي', desc: 'لجميع الطابعات العادية' },
                      { type: 'Thermal', label: 'كاشير حراري', desc: 'طابعات 80mm / 58mm' },
                      { type: 'A5', label: 'A5 صغير', desc: 'حجم مخصص ودفاتر يدوية' }
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setNewTemplateType(item.type as any)}
                        className={`p-3 rounded border text-right space-y-1 select-none transition-all cursor-pointer ${
                          newTemplateType === item.type
                            ? 'border-[#0f5fc2] bg-[#0f5fc2]/5 text-[#0f5fc2]'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-xs font-bold">{item.label}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select branding primary accent color palette */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-500 block">لون ترويسة وعناوين الفاتورة</label>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {[
                      { color: '#0f5fc2', name: 'أزرق الدافترا' },
                      { color: '#1abc9c', name: 'أخضر الفاتورة' },
                      { color: '#2c3e50', name: 'رمادي غامق' },
                      { color: '#e74c3c', name: 'أحمر قاني' },
                      { color: '#8e44ad', name: 'بنفسجي ملكي' },
                      { color: '#e67e22', name: 'برتقالي هادئ' },
                      { color: '#000000', name: 'أسود خالص' }
                    ].map((palette) => (
                      <button
                        key={palette.color}
                        type="button"
                        onClick={() => setNewTemplateColor(palette.color)}
                        className={`p-1.5 rounded border flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all ${
                          newTemplateColor === palette.color 
                            ? 'border-slate-800 bg-slate-50' 
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[10px] font-semibold text-slate-600">{palette.name}</span>
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: palette.color }} />
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Run validation and buttons */}
              <div className="bg-[#f8fafc] px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between">
                <button
                  onClick={() => setShowCreator(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded text-xs font-bold text-slate-500 transition-colors cursor-pointer"
                >
                  إلغاء التغييرات
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="px-5 py-2 bg-[#1abc9c] hover:bg-[#16a085] text-white rounded text-xs font-bold shadow-3xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>حفظ وإضافة القالب</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- POPUP 2: INTERACTIVE LIVE PRINT PREVIEW ON DEMAND --- */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 md:p-8 select-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-slate-100 rounded-lg shadow-2xl max-w-3xl w-full text-right font-sans my-auto flex flex-col h-[90vh] overflow-hidden"
            >
              
              {/* Header section of the editor window */}
              <div className="bg-white px-6 py-4 border-b border-[#dae4f0] flex items-center justify-between shrink-0">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1 px-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-slate-700">معاينة حية: {previewTemplate.name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">مظهر الفاتورة للعملاء عند الإرسال والطباعة</p>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-150 text-slate-600">
                    <Printer className="w-5 h-5 text-[#0f5fc2]" />
                  </div>
                </div>
              </div>

              {/* Scrollable invoice visual sheet simulator */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-200/50 select-none">
                
                {previewTemplate.type === 'Thermal' ? (
                  /* ---------------- THERMAL TICKET PATTERN STYLE ---------------- */
                  <div className="w-[300px] bg-white text-black size-auto shadow-sm border border-slate-300 p-4 font-mono text-[10px] space-y-4 text-center pb-8 select-none">
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full border border-black flex items-center justify-center mx-auto text-[11px] font-bold">
                        {previewTemplate.businessName.charAt(0)}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 tracking-tight">{previewTemplate.businessName}</h4>
                      <p className="text-[9px] text-slate-500">الرقم الضريبي الموحد: {previewTemplate.taxNumber}</p>
                      <p className="text-[9px] text-slate-500">عنوان: الرياض، المملكة العربية السعودية</p>
                    </div>

                    {/* Meta section */}
                    <div className="text-right border-y border-dashed border-black py-2 space-y-1 text-[9px]">
                      <p className="flex justify-between flex-row-reverse text-slate-700 font-semibold">
                        <span>رقم الفاتورة:</span>
                        <span className="font-bold">#INV-2026-003</span>
                      </p>
                      <p className="flex justify-between flex-row-reverse text-slate-700 font-semibold">
                        <span>التاريخ والوقت:</span>
                        <span>05/06/2026 12:45 PM</span>
                      </p>
                      <p className="flex justify-between flex-row-reverse text-slate-700 font-semibold">
                        <span>العميل:</span>
                        <span>شركة النخبة للخدمات التقنية</span>
                      </p>
                    </div>

                    {/* Table list items of receipt */}
                    <div className="space-y-1.5 text-right">
                      <div className="flex justify-between flex-row-reverse text-[9px] font-bold border-b border-black pb-1.5 text-slate-800">
                        <span className="w-3/5 text-right">العنصر</span>
                        <span className="w-1/5 text-center">الكمية</span>
                        <span className="w-1/5 text-left">الإجمالي</span>
                      </div>
                      
                      <div className="flex justify-between flex-row-reverse text-[9px] text-slate-700">
                        <span className="w-3/5 text-right leading-tight">خدمة دعم فني شهري متميز</span>
                        <span className="w-1/5 text-center">1</span>
                        <span className="w-1/5 text-left font-bold">1,500.00</span>
                      </div>
                      <div className="flex justify-between flex-row-reverse text-[9px] text-slate-700">
                        <span className="w-3/5 text-right leading-tight">تطوير لوحة تحكم إلكترونية مخصصة</span>
                        <span className="w-1/5 text-center">1</span>
                        <span className="w-1/5 text-left font-bold">4,000.00</span>
                      </div>
                    </div>

                    {/* Totals receipt math block */}
                    <div className="border-t border-dashed border-black pt-2 text-right space-y-1 text-[9px] font-semibold">
                      <p className="flex justify-between flex-row-reverse text-slate-600">
                        <span>المجموع الفرعي:</span>
                        <span>5,500.00 ج.م</span>
                      </p>
                      <p className="flex justify-between flex-row-reverse text-slate-600">
                        <span>ضريبة القيمة المضافة (14%):</span>
                        <span>770.00 ج.م</span>
                      </p>
                      <p className="flex justify-between flex-row-reverse text-sm font-bold border-t border-black pt-1.5 text-slate-900 font-sans">
                        <span>الإجمالي الكلي:</span>
                        <span>6,270.00 ج.م</span>
                      </p>
                    </div>

                    {/* Thermal QR and thank you */}
                    <div className="space-y-2 pt-4">
                      {/* Fake QR code representation */}
                      <div className="w-20 h-20 border border-slate-300 bg-white p-1.5 mx-auto flex flex-col justify-between items-center bg-radial">
                        <div className="grid grid-cols-5 gap-1 w-full h-full">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`rounded-3xs ${
                                (i * 7 + 13) % 5 === 0 || i % 4 === 0 || (i > 5 && i < 12) ? 'bg-black' : 'bg-white'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-500 font-bold leading-normal">شكراً لتعاملكم معنا لخدمة نظام الفواتير الإلكترونية المعتمد لدفترة ومصلحة الضرائب</p>
                    </div>

                  </div>
                ) : (
                  /* ---------------- A4 & A5 RICH SHEET TEMPLATE STYLE ---------------- */
                  <div className="w-full max-w-2xl bg-white shadow-xl border border-slate-200 p-8 rounded font-sans text-slate-800 text-xs space-y-8 min-h-[750px] flex flex-col justify-between select-none">
                    
                    {/* Upper block with custom color design accent bands */}
                    <div>
                      {/* Accent Header Border */}
                      <div className="h-2 rounded mb-6" style={{ backgroundColor: previewTemplate.primaryColor }} />

                      {/* Header metadata row */}
                      <div className="flex justify-between items-start flex-row-reverse">
                        
                        {/* Company branding right logic */}
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-white text-[10px]" style={{ backgroundColor: previewTemplate.primaryColor }}>
                              {previewTemplate.businessName.charAt(0)}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{previewTemplate.businessName}</h4>
                          </div>
                          <p className="text-slate-400 font-semibold text-[10px]">الرقم الضريبي للمنشأة: {previewTemplate.taxNumber}</p>
                          <p className="text-slate-400 font-semibold text-[10px]">المقر الرئيسي: الرياض، حي الورود، المملكة العربية السعودية</p>
                        </div>

                        {/* Invoice title text left logic */}
                        <div className="text-left space-y-1">
                          <h2 className="text-lg font-bold uppercase tracking-tight" style={{ color: previewTemplate.primaryColor }}>فـاتـورة ضـريـبـيـة</h2>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            <p>رقم الفاتورة: <span className="font-bold text-slate-800">#INV-2026-003</span></p>
                            <p>تاريخ الإصدار: 05/06/2026</p>
                            <p>تاريخ الاستحقاق: 15/06/2026</p>
                          </div>
                        </div>

                      </div>

                      {/* Line partition */}
                      <div className="border-t border-slate-100 my-6"></div>

                      {/* Billing targets */}
                      <div className="grid grid-cols-2 gap-6 text-right flex-row-reverse mb-8">
                        <div>
                          <h5 className="font-bold text-slate-500 mb-1.5 text-[10px]">الفاتورة موجهة إلى:</h5>
                          <p className="font-bold text-slate-800">شركة النخبة للخدمات التقنية والتطوير المباشر</p>
                          <p className="text-[10px] text-slate-400 font-semibold">الرقم الضريبي الموحد للعميل: 398205729188204</p>
                          <p className="text-[10px] text-slate-400 font-semibold">العنوان: شارع التخصصي الفاخر، الرياض، السعودية</p>
                        </div>

                        <div className="border-r border-slate-150 pr-6 space-y-1">
                          <h5 className="font-bold text-slate-500 mb-0.5 text-[10px]">تفاصيل وربط الإرسال:</h5>
                          <p className="text-slate-600 font-semibold text-[10px]">طريقة السداد: حوالة بنكية فورية</p>
                          <p className="text-slate-600 font-semibold text-[10px]">العملة المستخدمة: جنيه مصري (ج.م)</p>
                          <p className="text-slate-600 font-semibold text-[10px]">حالة الفاتورة: غير مدفوعة (بانتظار السداد)</p>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="border border-slate-150 rounded overflow-hidden">
                        <table className="w-full text-right border-collapse text-[10px]">
                          <thead>
                            <tr className="text-white font-bold" style={{ backgroundColor: previewTemplate.primaryColor }}>
                              <th className="p-2.5 text-right">رقم البند</th>
                              <th className="p-2.5 text-right w-1/2">البيان / الخدمة</th>
                              <th className="p-2.5 text-center">سعر الوحدة</th>
                              <th className="p-2.5 text-center">الكمية</th>
                              <th className="p-2.5 text-center">الضريبة</th>
                              <th className="p-2.5 text-left">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-slate-700">
                            <tr className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold">1</td>
                              <td className="p-2.5">
                                <p className="font-bold text-slate-800">تقديم خدمات استشارات تقنية ودعم برمي شهري شامل</p>
                                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">تحسين وتوطين لوحة التحكم والربط مع الواجهات البرمجية (APIs) لمصلحة الضرائب المصرية</p>
                              </td>
                              <td className="p-2.5 text-center">1,500.00</td>
                              <td className="p-2.5 text-center font-bold">1</td>
                              <td className="p-2.5 text-center">14%</td>
                              <td className="p-2.5 text-left font-bold">1,710.00 ج.م</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold">2</td>
                              <td className="p-2.5">
                                <p className="font-bold text-slate-800">تطوير وبناء لوحة تحكم إلكترونية مخصصة لتتبع الفواتير</p>
                                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">بناء واجهات برمجية ديناميكية مع خاصية المعاينة الحية وإدارة قوالب الطباعة</p>
                              </td>
                              <td className="p-2.5 text-center">4,000.00</td>
                              <td className="p-2.5 text-center font-bold">1</td>
                              <td className="p-2.5 text-center">14%</td>
                              <td className="p-2.5 text-left font-bold">4,560.00 ج.م</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Calculations breakdown block */}
                      <div className="flex justify-between items-start mt-6 flex-row-reverse">
                        
                        {/* Summary numbers block */}
                        <div className="w-1/2 space-y-1.5 text-right font-semibold text-[10px] pr-8">
                          <div className="flex justify-between flex-row-reverse text-slate-500 pb-1 border-b border-slate-100">
                            <span>المجموع الفرعي (غير شامل الضريبة):</span>
                            <span>5,500.00 ج.م</span>
                          </div>
                          <div className="flex justify-between flex-row-reverse text-slate-500 pb-1 border-b border-slate-100">
                            <span>مجموع ضريبة القيمة المضافة (14%):</span>
                            <span>770.00 ج.م</span>
                          </div>
                          <div className="flex justify-between flex-row-reverse text-sm font-bold text-slate-900 pt-1.5">
                            <span>الإجمالي الكلي المستحق:</span>
                            <span style={{ color: previewTemplate.primaryColor }}>6,270.00 ج.م</span>
                          </div>
                        </div>

                        {/* Remarks block and QR code */}
                        <div className="w-1/2 flex items-center gap-4 text-right">
                          {/* Simulated QR code */}
                          <div className="w-16 h-16 border border-slate-200 bg-white p-1 flex-shrink-0">
                            <div className="grid grid-cols-5 gap-1 w-full h-full">
                              {Array.from({ length: 25 }).map((_, i) => (
                                <div key={i} className={`rounded-3xs ${i % 3 === 0 || i % 5 === 1 ? 'bg-black' : 'bg-white'}`} style={{ opacity: i === 12 || i === 13 ? 0.2 : 1 }} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <h6 className="font-bold text-[9px] text-slate-600 mb-0.5">ملاحظات وشروط الفاتورة:</h6>
                            <p className="text-[8px] text-slate-450 font-semibold leading-normal">
                              جميع المبالغ المشمولة بالفواتير خاضعة للقانون الضريبي للمملكة العربية السعودية ومصلحة الضرائب. يرجى توجيه الدفعات فوراً قبل انتهاء المدة المحددة.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Footer branding of Invoice designs creator */}
                    <div className="border-t border-slate-100 pt-3 text-center text-[9px] text-slate-400 font-semibold flex items-center justify-between">
                      <p>فاتورة إلكترونية معتمدة - منشأة بالربط مع نظام دفترة الفواتير</p>
                      <p>صفحة 1 من 1</p>
                    </div>

                  </div>
                )}

              </div>

              {/* Print action footer drawer buttons */}
              <div className="bg-white p-4 border-t border-[#dae4f0] flex items-center justify-between shrink-0">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-5 py-2 hover:bg-slate-50 text-slate-500 border border-slate-200 rounded text-xs font-bold transition-all cursor-pointer"
                >
                  الرجوع لقائمة التصاميم
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-bold ml-2">يتطابق تماماً مع معايير ومخرجات الطابعات</span>
                  <button
                    onClick={() => {
                      alert('تم محاكاة إرسال الفاتورة للطابعة بنجاح! جاري إعداد ملف ومستند الـ PDF للتحميل.');
                      onSave('تم إرسال مستند الفاتورة الضريبية إلى الطابعة وتحميل الملف المخصص للتصميم بنجاح!');
                    }}
                    className="px-5 py-2 bg-[#0f5fc2] hover:bg-[#0c50a3] text-white rounded text-xs font-bold shadow-3xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>محاكاة الطباعة وتحميل ملف PDF</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
