/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Trash2,
  FileText,
  User,
  Calendar,
  Percent,
  Calculator,
  ChevronDown,
  ChevronLeft,
  X,
  FileCheck,
  Printer,
  HelpCircle,
  Eye,
  Bold,
  Italic,
  Underline,
  List,
  Link2,
  Strikethrough,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Client, Invoice, InvoiceItem, ProductService } from '../types';
import { INITIAL_PRODUCTS } from '../data';

interface CreateInvoiceViewProps {
  setView: (view: string) => void;
}

export default function CreateInvoiceView({
  setView
}: CreateInvoiceViewProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('clients').select('*').then(({ data }) => { if (data) setClients(data); });
    supabase.from('invoices').select('*').then(({ data }) => { if (data) setInvoices(data); });
  }, []);

  // Generate next automatic invoice number
  const getNextInvoiceNumber = () => {
    if (invoices.length === 0) return '000001';
    const lastNum = invoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return String(lastNum + 1).padStart(6, '0');
  };

  // State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(getNextInvoiceNumber());
  const [invoiceDate, setInvoiceDate] = useState<string>('2026-06-05');
  const [issueDate, setIssueDate] = useState<string>('2026-06-05');
  const [salesAgent, setSalesAgent] = useState<string>('Abdo Yaser #000001');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [billingTemplate, setBillingTemplate] = useState<string>('التصميم الافتراضي للفاتورة');
  
  // Row Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'row-1',
      itemName: '',
      description: '',
      unitPrice: 0,
      quantity: 1,
      discount: 0,
      taxValue: 14, // Default 14% Egyptian VAT
      total: 0
    }
  ]);

  // Bottom Tabs
  const [activeTab, setActiveTab] = useState<'discount' | 'deposit' | 'shipping' | 'attachments'>('discount');
  
  // Global form adjustments
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>(
    'شكراً لتعاملكم معنا. الرجاء تسديد قيمة المستحق في موعد غايته شروط الفاتورة.'
  );
  const [alreadyPaid, setAlreadyPaid] = useState<boolean>(false);

  // Math Computations
  const [subtotal, setSubtotal] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  // Preview Modal overlay
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Auto Calculations when row items or adjustment variables modify
  useEffect(() => {
    let computedSubtotal = 0;
    
    const updatedRows = items.map(row => {
      const rowNet = (row.unitPrice * row.quantity) - row.discount;
      const rowTax = rowNet * (row.taxValue / 100);
      const rowTotal = rowNet + rowTax;
      
      computedSubtotal += (row.unitPrice * row.quantity);
      return {
        ...row,
        total: parseFloat(rowTotal.toFixed(2))
      };
    });

    setSubtotal(parseFloat(computedSubtotal.toFixed(2)));

    // Net value across all row totals
    let rowsTotalSum = updatedRows.reduce((acc, row) => acc + row.total, 0);

    // Apply global discount
    let totalAfterDiscount = rowsTotalSum;
    if (globalDiscountType === 'percentage') {
      totalAfterDiscount = rowsTotalSum - (rowsTotalSum * (globalDiscountValue / 100));
    } else {
      totalAfterDiscount = rowsTotalSum - globalDiscountValue;
    }

    // Apply Adjustment
    const finalTotal = Math.max(0, totalAfterDiscount + adjustmentValue);
    setGrandTotal(parseFloat(finalTotal.toFixed(2)));

  }, [items, globalDiscountType, globalDiscountValue, adjustmentValue]);

  // Handler to add a new line row item
  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    setItems(prev => [
      ...prev,
      {
        id: newId,
        itemName: '',
        description: '',
        unitPrice: 0,
        quantity: 1,
        discount: 0,
        taxValue: 14,
        total: 0
      }
    ]);
  };

  // Handler to delete a row item
  const handleDeleteRow = (id: string) => {
    if (items.length === 1) {
      alert('يجب أن تحتوي الفاتورة على بند واحد على الأقل.');
      return;
    }
    setItems(prev => prev.filter(row => row.id !== id));
  };

  // Row update helper
  const handleUpdateRow = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        
        const updated = { ...row, [field]: value };
        
        // If updating itemName, check if we can autofill description and unit price from known items
        if (field === 'itemName') {
          const matchedItem = INITIAL_PRODUCTS.find(p => p.name === value);
          if (matchedItem) {
            updated.description = matchedItem.description;
            updated.unitPrice = matchedItem.price;
            updated.taxValue = matchedItem.taxRate;
          }
        }
        return updated;
      })
    );
  };

  // Submits the draft
  const handleSaveDraft = async (statusOverride?: 'paid' | 'unpaid' | 'draft') => {
    const finalSelectedClient = clients.find(c => c.id === selectedClientId);
    if (!finalSelectedClient) {
      alert('الرجاء اختيار العميل أولاً لحفظ الفاتورة.');
      return;
    }

    const calculatedStatusValue = statusOverride || (alreadyPaid ? 'paid' : 'unpaid');

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: invoiceDate,
      issueDate,
      clientName: finalSelectedClient.fullName,
      salesAgent,
      paymentTerms,
      items,
      status: calculatedStatusValue,
      discountType: globalDiscountType,
      discountValue: globalDiscountValue,
      adjustment: adjustmentValue,
      subtotal,
      total: grandTotal,
      notes,
      alreadyPaid,
      currency: 'EGP'
    };

    const { data: newInv } = await supabase.from('invoices').insert({
      id: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      date: newInvoice.date,
      issueDate: newInvoice.issueDate,
      clientName: newInvoice.clientName,
      salesAgent: newInvoice.salesAgent,
      paymentTerms: newInvoice.paymentTerms,
      items: newInvoice.items,
      status: newInvoice.status,
      discountType: newInvoice.discountType,
      discountValue: newInvoice.discountValue,
      adjustment: newInvoice.adjustment,
      subtotal: newInvoice.subtotal,
      total: newInvoice.total,
      notes: newInvoice.notes,
      alreadyPaid: newInvoice.alreadyPaid,
      currency: newInvoice.currency
    }).select().single();
    setView('manage-invoices');
  };

  const getSelectedClientDetails = () => {
    return clients.find(c => c.id === selectedClientId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* 1. Header Toolbar Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0d385a] text-white p-3.5 sm:p-4 rounded-lg shadow gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-daftra-blue p-1.5 rounded text-white hidden xs:block">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-md font-bold">إنشاء فاتورة مبيعات</h2>
            <p className="text-[11px] text-slate-300">قم بتعبئة البنود والضرائب واختيار العميل لإصدار الفاتورة</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Print Save Button */}
          <button
            onClick={() => handleSaveDraft(alreadyPaid ? 'paid' : 'unpaid')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>حفظ وطباعة</span>
          </button>

          {/* Preview Button */}
          <button
            onClick={() => {
              const client = clients.find(c => c.id === selectedClientId);
              if (!client) {
                alert('برجاء اختيار العميل أولاً لمعاينة كيف تبدو طباعة الفاتورة.');
                return;
              }
              setIsPreviewOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0074b1] hover:bg-[#005e8e] rounded text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
          >
            <Eye className="w-4 h-4 shrink-0" />
            <span>معاينة الفاتورة</span>
          </button>

          {/* Save as Draft */}
          <button
            onClick={() => handleSaveDraft('draft')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-600 hover:bg-slate-700 hover:bg-opacity-85 rounded text-xs font-bold transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>حفظ كمسودة</span>
          </button>
        </div>
      </div>

      {/* 2. Top box: Invoice Template Styling selector */}
      <div className="bg-white rounded-lg border border-daftra-border shadow-sm p-4">
        <label className="block text-xs font-bold text-slate-700 mb-1.5">قالب الفاتورة وطريقة الإخراج</label>
        <select
          value={billingTemplate}
          onChange={(e) => setBillingTemplate(e.target.value)}
          className="w-full max-w-sm px-3 py-2 bg-slate-50 border border-daftra-border rounded text-xs focus:ring-1 focus:ring-daftra-blue focus:outline-none"
        >
          <option value="التصميم الافتراضي للفاتورة">التصميم الافتراضي للفاتورة</option>
          <option value="شريط علوي احترافي كلاسيكي">شريط علوي احترافي كلاسيكي (بدون ضريبة)</option>
          <option value="قالب مبسط للعملاء الأفراد">قالب مبسط للعملاء الأفراد (مصر بوز)</option>
          <option value="تصميم فواتير الخدمات السحابية">تصميم فواتير الخدمات السحابية (باهي)</option>
        </select>
      </div>

      {/* 3. Main Form Details Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Right Section in RTL (Customer & General Methods) */}
        <div className="bg-white rounded-lg border border-daftra-border shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1 bg-slate-50/50 -m-5 mb-0 p-3 rounded-t-lg">
            <span>العميل وطرق التحصيل</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Method (الطريقة) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">الطريقة:</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded text-xs focus:ring-1 focus:ring-daftra-blue focus:outline-none">
                <option>طباعة (دفع نقدي / إلكتروني)</option>
                <option>إرسال بالبريد الإلكتروني للعميل</option>
                <option>خصم تلقائي من رصيد المحفظة</option>
              </select>
            </div>

            {/* Client Select Form with asterisk (العميل) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  العميل <span className="text-rose-500 font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setView('add-client')}
                  className="text-[10px] text-daftra-blue hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>جديد</span>
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50/20 border border-daftra-blue rounded text-xs font-bold text-daftra-dark-blue focus:ring-2 focus:ring-daftra-blue focus:outline-none"
                >
                  <option value="">(اختر العميل المعني)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} [{c.codeNumber}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active currency notice */}
          {selectedClientId && (
            <div className="bg-sky-50 text-[11px] text-[#006296] p-2.5 rounded border border-sky-100 flex items-center justify-between font-bold">
              <span>العملة المعتمدة لهذا العميل:</span>
              <span className="font-mono text-xs text-daftra-blue">{getSelectedClientDetails()?.currency}</span>
            </div>
          )}
        </div>

        {/* Left Section in RTL (Invoice Codes & Dates details) */}
        <div className="bg-white rounded-lg border border-daftra-border shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1 bg-slate-50/50 -m-5 mb-0 p-3 rounded-t-lg">
            <span>بيانات الفاتورة والرموز</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
            {/* Invoice ID Code */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">رقم الفاتورة:</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded font-mono text-center font-bold text-[#0d385a]"
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">تاريخ الفاتورة:</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded text-center font-mono"
              />
            </div>

            {/* Sales Agent */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">مسؤول مبيعات:</label>
              <select
                value={salesAgent}
                onChange={(e) => setSalesAgent(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded font-bold text-slate-700 focus:outline-none"
              >
                <option value="Abdo Yaser #000001">Abdo Yaser #000001 (المدير)</option>
                <option value="محمود علي #000002">محمود علي #000002 (المبيعات)</option>
                <option value="نور الشريف #000003">نور الشريف #000003 (مبيعات فرع)</option>
              </select>
            </div>

            {/* Issue Date */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">تاريخ الاستحقاق:</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded text-center font-mono"
              />
            </div>

            {/* Terms */}
            <div className="space-y-1 md:col-span-2">
              <label className="block font-bold text-slate-700">شروط الدفع:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="أيام (الدفع الفوري / 30 / 15)"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded text-right placeholder-slate-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Table Spreadsheet Spreadsheet Grid */}
      <div className="bg-white rounded-lg border border-daftra-border shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-daftra-border px-4 py-3">
          <h3 className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
            <span>جدول البنود والمنتجات المدرجة</span>
            <span className="text-[10px] text-slate-400 font-bold font-mono">العملة: جنيه مصري (EGP)</span>
          </h3>
        </div>

        {/* Columns: Item, Description, Unit Price, Qty, Disc, Tax, Total */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs table-fixed min-w-[900px]">
            <thead className="bg-slate-50/75 text-slate-600 border-b border-daftra-border font-bold">
              <tr>
                <th className="p-3 w-[250px]">بند المنتج / الخدمة</th>
                <th className="p-3 w-[2700px] min-w-[200px]">الوصف التوضيحي</th>
                <th className="p-3 w-[120px]">سعر الوحدة</th>
                <th className="p-3 w-[80px] text-center">الكمية</th>
                <th className="p-3 w-[100px]">خصم البند</th>
                <th className="p-3 w-[140px]">الضريبة 1</th>
                <th className="p-3 w-[110px] text-left leading-none">المجموع النظري</th>
                <th className="p-3 w-[50px] text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/30 transition-colors">
                  {/* Item selector or input */}
                  <td className="p-3.5">
                    <select
                      value={row.itemName}
                      onChange={(e) => handleUpdateRow(row.id, 'itemName', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-yellow-50/15 border border-yellow-200 rounded font-bold text-slate-800 focus:outline-none focus:border-daftra-blue"
                    >
                      <option value="">(اختر بند مبيعات جاهز)</option>
                      {INITIAL_PRODUCTS.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name} - [{p.price.toLocaleString('ar-EG')} جم]
                        </option>
                      ))}
                      <option value="بند مخصص ومكتوب يدوياً">بند مبيعات مخصص يدوي...</option>
                    </select>
                    {row.itemName === 'بند مخصص ومكتوب يدوياً' && (
                      <input
                        type="text"
                        placeholder="اكتب اسم البند المخصص هنا..."
                        onChange={(e) => handleUpdateRow(row.id, 'itemName', e.target.value)}
                        className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-daftra-blue"
                      />
                    )}
                  </td>

                  {/* Description */}
                  <td className="p-3">
                    <textarea
                      rows={2}
                      value={row.description}
                      onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                      placeholder="وصف إضافي يسجل في تفاصيل مطبوعة الفاتورة..."
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded resize-none text-[11px] leading-snug focus:outline-none"
                    />
                  </td>

                  {/* Unit price */}
                  <td className="p-3">
                    <div className="relative">
                      <input
                        type="number"
                        value={row.unitPrice}
                        onChange={(e) => handleUpdateRow(row.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-center font-mono font-bold font-semibold text-[#0d385a]"
                      />
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => handleUpdateRow(row.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                      className="w-full max-w-[60px] px-1 py-1.5 bg-slate-50 border border-slate-200 rounded text-center font-mono font-bold"
                    />
                  </td>

                  {/* Row Discount */}
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      value={row.discount}
                      onChange={(e) => handleUpdateRow(row.id, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-center font-mono text-rose-600 font-semibold"
                    />
                  </td>

                  {/* Tax dropdown (بدون ضريبة / ضريبة القيمة المضافة) */}
                  <td className="p-3">
                    <select
                      value={row.taxValue}
                      onChange={(e) => handleUpdateRow(row.id, 'taxValue', parseInt(e.target.value, 10))}
                      className="w-full px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-center select-none"
                    >
                      <option value={0}>بدون ضريبة 0%</option>
                      <option value={14}>ضريبة 14% (فات)</option>
                      <option value={5}>ضريبة استهلاك 5%</option>
                      <option value={10}>ضريبة مبيعات مخصصة 10%</option>
                    </select>
                  </td>

                  {/* Total item cost calculated */}
                  <td className="p-3 text-left font-mono font-bold text-slate-800">
                    <span className="text-xs">{row.total.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                    <span className="text-[10px] text-slate-400 mr-1.5">ج.م</span>
                  </td>

                  {/* Delete button */}
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-full hover:bg-rose-50 cursor-pointer active:scale-95 transition-all"
                      title="حذف هذا البند"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grid footer controller adding buttons on right, total on left */}
        <div className="bg-slate-50/50 border-t border-daftra-border px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Right portion adding row lines */}
          <div className="flex gap-2">
            <button
              onClick={handleAddRow}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-daftra-border rounded text-xs font-bold text-slate-700 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-daftra-blue" />
              <span>إضافة سطر بند</span>
            </button>

          </div>

          {/* Left portion displaying simple subtotal calculations */}
          <div className="flex flex-col items-end gap-1.5 text-xs text-slate-600 min-w-[200px] ml-4">
            <div className="flex justify-between w-full font-bold">
              <span>الإجمالي الفرعي (قبل الخصم والضريبة):</span>
              <span className="font-mono text-slate-800">{subtotal.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
            </div>
            <div className="flex justify-between w-full font-bold text-slate-800 text-sm border-t border-slate-200 pt-1">
              <span>المجموع النهائي المقدر:</span>
              <span className="font-mono text-daftra-blue font-extrabold">{grandTotal.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Tabs & Adjustment details & formatted Notes rich editor */}
      <div className="bg-white rounded-lg border border-daftra-border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Right 8/12 - Notes details with Rich editor formatting toolbar and tabs */}
        <div className="md:col-span-8 p-5 border-l border-slate-100 space-y-4">
          {/* Tabs bar */}
          <div className="border-b border-slate-100 flex flex-nowrap overflow-x-auto gap-1 pb-2">
            <button
              onClick={() => setActiveTab('discount')}
              className={`px-3 py-1.5 rounded text-xs font-bold shrink-0 transition-colors ${
                activeTab === 'discount' ? 'bg-daftra-light-blue text-daftra-blue' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الخصم والتسوية
            </button>

          </div>

          {/* Under tab content */}
          {activeTab === 'discount' && (
            <div className="bg-slate-50/50 p-4 rounded border border-slate-100 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Global Discount */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">الخصم الإجمالي على الفاتورة:</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={globalDiscountValue}
                      onChange={(e) => setGlobalDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-daftra-border rounded text-center font-mono font-bold"
                    />
                    <select
                      value={globalDiscountType}
                      onChange={(e) => setGlobalDiscountType(e.target.value as 'percentage' | 'amount')}
                      className="px-2 py-1.5 bg-white border border-daftra-border rounded font-bold"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="amount">قيمة نقدية ثابثة (جم)</option>
                    </select>
                  </div>
                </div>

                {/* Adjustment التسوية */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">التسوية (إضافة / طرح قيمة تعديلية):</label>
                  <input
                    type="number"
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-white border border-daftra-border rounded text-center font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes Rich style Text area and simulation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">الملاحظات / الشروط والأحكام الخاصة بالفاتورة:</label>
            
            {/* Rich style formatting bar like the screenshots exactly */}
            <div className="bg-slate-50 border border-daftra-border border-b-0 rounded-t p-1 flex flex-wrap items-center gap-1">
              <button type="button" className="p-1 px-1.5 hover:bg-slate-200 text-slate-600 font-bold rounded text-xs flex items-center gap-0.5" title="عريض" onClick={() => setNotes(prev => `**${prev}**`)}>
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 px-1.5 hover:bg-slate-200 text-slate-600 italic rounded text-xs flex items-center gap-0.5" title="مائل" onClick={() => setNotes(prev => `*${prev}*`)}>
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 px-1.5 hover:bg-slate-200 text-slate-600 underline rounded text-xs flex items-center gap-0.5" title="تسطير" onClick={() => setNotes(prev => `__${prev}__`)}>
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 px-1.5 hover:bg-slate-200 text-slate-600 line-through rounded text-xs flex items-center gap-0.5" title="توسط الخط" onClick={() => setNotes(prev => `~~${prev}~~`)}>
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-slate-300 mx-1" />
              <button type="button" className="p-1 px-1.5 hover:bg-slate-200 text-slate-600 rounded text-xs flex items-center gap-0.5" title="قائمة نقطية">
                <List className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 px-1.5 hover:bg-slate-200 text-slate-600 rounded text-xs flex items-center gap-0.5" title="إدراج رابط شبكة">
                <Link2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-daftra-border rounded-b text-xs focus:ring-1 focus:ring-daftra-blue focus:outline-none leading-relaxed text-slate-700"
            />
          </div>
        </div>

        {/* Left 4/12 - Immediate summary of Totals and direct checkbox already paid */}
        <div className="md:col-span-4 p-5 bg-slate-50/50 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <h4 className="text-xs font-extrabold text-slate-800 pb-2 border-b border-slate-200">ملخص العمليات الحسابية النهائية</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">مجموع البنود الفرعي:</span>
                <span className="font-mono font-bold text-slate-700">{subtotal.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
              </div>
              
              {globalDiscountValue > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>قيمة خصم الفاتورة الإجمالي:</span>
                  <span className="font-mono">- {globalDiscountValue.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} {globalDiscountType === 'percentage' ? '%' : 'ج.م'}</span>
                </div>
              )}

              {adjustmentValue !== 0 && (
                <div className="flex justify-between text-indigo-600 font-semibold">
                  <span>قيمة التسوية التعديلية:</span>
                  <span className="font-mono">{adjustmentValue > 0 ? '+' : ''}{adjustmentValue.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-800">
                <span>الصافي المستحق النهائي:</span>
                <span className="font-mono text-daftra-blue font-extrabold text-base">{grandTotal.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
              </div>
            </div>
          </div>

          {/* Already Paid Block (مدفوع بالفعل؟) */}
          <div className="bg-white p-3.5 rounded border border-daftra-border shadow-inner space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={alreadyPaid}
                onChange={(e) => setAlreadyPaid(e.target.checked)}
                className="w-4.5 h-4.5 rounded text-daftra-blue border-daftra-border focus:ring-daftra-blue cursor-pointer"
              />
              <span className="text-xs font-extrabold text-slate-800">مدفوع بالفعل ؟ (تسجيل سند تحصيل فوري لجميع البنود)</span>
            </label>
            <p className="text-[10px] text-slate-400 leading-normal pr-7">
              يفضل وضع علامة صح عند استلام النقدية يداً بيد من العميل أو نجاح تصفية تحصيل الفيزا الإلكترونية ليرتفع مؤشر المبيعات فوراً.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Invoice Printable Preview Modal/Drawer Overlay */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col animate-scaleIn max-h-[90vh]">
            {/* Modal header details */}
            <div className="bg-[#0d385a] px-5 py-3.5 text-white flex justify-between items-center border-b border-daftra-blue">
              <div className="flex items-center gap-2 text-sm font-bold">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span>معاينة محاكاة قالب المطبوعة الورقية للفاتورة الرسمية</span>
              </div>
              <button
                type="button"
                className="p-1 px-1.5 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer"
                onClick={() => setIsPreviewOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Printed Invoice scroll area to inspect detail matches */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-[#f8fafc] text-slate-800 text-xs">
              <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 uppercase max-w-3xl mx-auto space-y-6 text-right">
                
                {/* Visual Company Header Block */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <h1 className="text-base sm:text-lg font-black text-daftra-dark-blue">Abdo Yaser</h1>
                    <p className="text-[10px] text-slate-400">Main Branch - القاهرة، مصر</p>
                    <p className="text-[10px] text-slate-400">سجل تجاري: 48593/ق | بطاقة ضريبية: 738-429-105</p>
                  </div>
                  
                  {/* Logo block */}
                  <div className="text-left">
                    <span className="text-lg font-black tracking-widest text-[#0074b1]">DAFTRA ERP</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">حلول برمجية سحابية موثقة</div>
                  </div>
                </div>

                {/* Bill Header Info Layout Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-100">
                    <span className="text-slate-400 font-bold block pb-1 border-b border-slate-200">العميل المعني بالفاتورة:</span>
                    {selectedClientId ? (
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-slate-800 text-[13px]">{getSelectedClientDetails()?.fullName}</div>
                        <div className="text-slate-500">{getSelectedClientDetails()?.email}</div>
                        <div className="text-slate-500">{getSelectedClientDetails()?.phone}</div>
                        <div className="text-slate-500">{getSelectedClientDetails()?.address1}، {getSelectedClientDetails()?.city}</div>
                      </div>
                    ) : (
                      <span className="text-rose-500 font-bold block">لم يتحدد عميل رسمي بعد! يرجى اختيار عميل لحفظ البيانات.</span>
                    )}
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-100 text-left">
                    <span className="text-slate-400 font-bold block pb-1 border-b border-slate-200 text-right">معطيات المستند الفني:</span>
                    <table className="w-full text-right text-[11px] leading-relaxed">
                      <tbody>
                        <tr>
                          <td className="text-slate-400 py-0.5">رقم الفاتورة:</td>
                          <td className="font-mono font-bold text-slate-800 py-0.5 text-left bg-slate-200/40 px-1 rounded inline-block">#{invoiceNumber}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-400 py-0.5">تاريخ الفاتورة:</td>
                          <td className="font-mono text-slate-600 py-0.5 text-left">{invoiceDate}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-400 py-0.5">مسؤول المبيعات:</td>
                          <td className="font-bold text-slate-600 py-0.5 text-left">{salesAgent}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-400 py-0.5">العملة:</td>
                          <td className="font-bold text-daftra-blue py-0.5 text-left">جنيه مصري (EGP)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Items details table inside invoice */}
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="p-2.5">البند</th>
                        <th className="p-2.5">الوصف</th>
                        <th className="p-2.5 text-center">سعر الوحدة</th>
                        <th className="p-2.5 text-center">الكمية</th>
                        <th className="p-2.5 text-center">الضريبة</th>
                        <th className="p-2.5 text-left">الإجمالي اللائحي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((row) => (
                        <tr key={row.id}>
                          <td className="p-2.5 font-bold text-slate-800">{row.itemName || '(بند فارغ)'}</td>
                          <td className="p-2.5 text-slate-500 whitespace-pre-wrap">{row.description || '-'}</td>
                          <td className="p-2.5 text-center font-mono">{row.unitPrice.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</td>
                          <td className="p-2.5 text-center font-mono">{row.quantity}</td>
                          <td className="p-2.5 text-center font-mono text-slate-500">{row.taxValue}%</td>
                          <td className="p-2.5 text-left font-mono font-bold text-slate-800">
                            {row.total.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary calculation parameters in printed box */}
                <div className="flex justify-between items-start pt-4 border-t border-slate-100">
                  <div className="w-1/2 p-3 bg-slate-50 rounded text-[11px] leading-relaxed text-slate-600 font-medium">
                    <span className="font-bold text-slate-800 block mb-1">ملاحظات وشروط الفاتورة للمستلم:</span>
                    <p className="whitespace-pre-wrap">{notes}</p>
                  </div>
                  
                  <div className="w-1/3 space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between pb-1 border-b border-slate-100">
                      <span className="text-slate-400">الإجمالي الأولي:</span>
                      <span className="font-mono">{subtotal.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
                    </div>
                    {globalDiscountValue > 0 && (
                      <div className="flex justify-between text-rose-600 pb-1 border-b border-slate-100">
                        <span>الخصم التسويقي:</span>
                        <span className="font-mono">-{globalDiscountValue.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} {globalDiscountType === 'percentage' ? '%' : 'جم'}</span>
                      </div>
                    )}
                    {adjustmentValue !== 0 && (
                      <div className="flex justify-between text-indigo-600 pb-1 border-b border-slate-100">
                        <span>قيمة التسوية:</span>
                        <span className="font-mono">{adjustmentValue > 0 ? '+' : ''}{adjustmentValue.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-slate-800 text-sm pt-2">
                      <span className="text-daftra-blue">الصافي المطلوب:</span>
                      <span className="font-mono text-daftra-blue">{grandTotal.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <span className={`inline-block px-3 py-1 rounded text-[11px] font-black tracking-wide ${
                        alreadyPaid ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {alreadyPaid ? '◆ مدفوعة بالكامل ◆' : '◇ بانتظار سداد القيمة لعقود الدفع ◇'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR code stamp block */}
                <div className="pt-8 flex justify-between items-center text-slate-400 text-[10px] font-medium border-t border-dashed border-slate-100">
                  <div>
                    <span>تم التثبيت التلقائي وتدقيق الحساب عبر نظام مبيعات دفتره السحابي</span>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 border border-slate-200 grid place-items-center rounded text-slate-300 font-mono text-[9px] select-none shadow-inner">
                    QR CODE
                  </div>
                </div>

              </div>
            </div>

            {/* Close footer elements inside preview */}
            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                className="px-4 py-2 bg-[#0d385a] hover:bg-[#082236] text-white text-xs font-bold rounded shadow cursor-pointer transition-colors"
                onClick={() => {
                  window.print();
                }}
              >
                تأكيد طباعة الورقة
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded cursor-pointer transition-colors"
                onClick={() => setIsPreviewOpen(false)}
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
