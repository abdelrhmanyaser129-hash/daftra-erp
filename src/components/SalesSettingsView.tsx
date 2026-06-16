/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import InvoiceSettingsView from './InvoiceSettingsView';
import EInvoiceSettingsView from './EInvoiceSettingsView';
import InvoiceDesignsView from './InvoiceDesignsView';
import {
  FileText,
  FileCheck,
  Palette,
  ChevronLeft,
  X,
  Check,
  Sparkles
} from 'lucide-react';

interface SalesSettingsViewProps {
  setView: (view: string) => void;
}

interface SettingCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  iconBgColor: string;
  iconColor: string;
}

export default function SalesSettingsView({ setView }: SalesSettingsViewProps) {
  const [activeSetting, setActiveSetting] = useState<SettingCard | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showInvoiceSettings, setShowInvoiceSettings] = useState(false);
  const [showEInvoiceSettings, setShowEInvoiceSettings] = useState(false);
  const [showDesignSettings, setShowDesignSettings] = useState(false);

  // Define cards under "الفواتير والمدفوعات"
  const invoiceAndPaymentCards: SettingCard[] = [
    {
      id: 'invoice-settings',
      title: 'إعدادات الفواتير',
      description: 'تحكم في إعداد نموذج الفواتير وكيفية عرضها داخل النظام.',
      icon: FileText,
      iconBgColor: 'bg-slate-100',
      iconColor: 'text-slate-700'
    },
    {
      id: 'einvoice-settings',
      title: 'إعدادات الفاتورة الإلكترونية',
      description: 'قم بإعداد وربط إعدادات الفواتير والإيصالات الإلكترونية مع الهيئة المختصة بالضرائب.',
      icon: FileCheck,
      iconBgColor: 'bg-slate-100',
      iconColor: 'text-slate-700'
    },
    {
      id: 'design-settings',
      title: 'تصميمات الفواتير وعروض الأسعار',
      description: 'صمم وخصص نماذج عرض وطباعة مستندات المبيعات المختلفة.',
      icon: Palette,
      iconBgColor: 'bg-slate-100',
      iconColor: 'text-slate-700'
    }
  ];

  const handleCardClick = (card: SettingCard) => {
    if (card.id === 'invoice-settings') {
      setShowInvoiceSettings(true);
    } else if (card.id === 'einvoice-settings') {
      setShowEInvoiceSettings(true);
    } else if (card.id === 'design-settings') {
      setShowDesignSettings(true);
    } else {
      setActiveSetting(card);
    }
  };

  const handleSaveConfig = () => {
    setToastMessage(`تم حفظ تعديلات "${activeSetting?.title}" بنجاح!`);
    setActiveSetting(null);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (showInvoiceSettings) {
    return (
      <InvoiceSettingsView
        onBack={() => setShowInvoiceSettings(false)}
        onSave={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    );
  }

  if (showEInvoiceSettings) {
    return (
      <EInvoiceSettingsView
        onBack={() => setShowEInvoiceSettings(false)}
        onSave={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    );
  }

  if (showDesignSettings) {
    return (
      <InvoiceDesignsView
        onBack={() => setShowDesignSettings(false)}
        onSave={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    );
  }

  return (
    <div id="daftra-sales-settings" className="space-y-8 text-right select-none font-sans pb-12">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-md shadow-lg text-sm font-bold flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Section 1: الفواتير والمدفوعات --- */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-500 pb-1 border-b border-slate-100 flex items-center justify-end gap-2 pr-1">
          <span>الفواتير والمدفوعات</span>
        </h3>
        
        {/* Responsive Grid with EXACT look: column-wise layout in standard grid desktop layout, mirroring the Daftra dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoiceAndPaymentCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={card.id}
                onClick={() => handleCardClick(card)}
                whileHover={{ y: -2 }}
                className="bg-white rounded border border-[#dae4f0] hover:border-slate-300 p-5 cursor-pointer transition-all shadow-3xs flex flex-row-reverse items-start gap-4 text-right"
              >
                <div className={`p-3.5 rounded ${card.iconBgColor} shrink-0`}>
                  <IconComponent className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div className="space-y-1.5 flex-1 pr-1">
                  <h4 className="text-xs font-bold text-[#204060]">{card.title}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive config side drawer modal on click */}
      <AnimatePresence>
        {activeSetting && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end select-none">
            {/* Modal backdrop closer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setActiveSetting(null)}
            />
            
            {/* Setting Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative max-w-lg w-full bg-slate-50 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200"
            >
              
              {/* Drawer Header */}
              <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveSetting(null)}
                  className="p-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors duration-150 cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-right">
                    <h3 className="text-sm font-bold text-[#204060]">{activeSetting.title}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">تهيئة خيارات النظام والتفضيلات</p>
                  </span>
                  <div className="p-2 rounded bg-slate-50 text-slate-600">
                    <activeSetting.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Drawer Body (Empty as requested, waiting for screenshots of specific settings) */}
              <div className="flex-1 overflow-y-auto p-8 text-right flex flex-col items-center justify-center bg-[#fcfdfe] select-none">
                <div className="text-center p-8 border border-dashed border-[#dae4f0] rounded-lg max-w-sm bg-white space-y-3 shadow-3xs">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5 text-[#1abc9c]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">هذا القسم فارغ حالياً</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    بانتظار إرسال لقطات الشاشة أو تفاصيل الحقول والخيارات الخاصة بإعداد <strong>{activeSetting.title}</strong> لتصميمها وتفعيلها لك بدقة.
                  </p>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="bg-white p-5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSetting(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-3xs"
                >
                  العودة للإعدادات
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
