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
  CheckCircle2,
  Search
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
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [safesBanks, setSafesBanks] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('clients').select('*').then(({ data }) => {
      if (data) {
        setClients(data.map(mapClientRow));
      }
    });
    supabase.from('invoices').select('*').then(({ data }) => { if (data) setInvoices(data); });
    supabase.from('products').select('id, name, code, selling_price, tax1').then(({ data }) => { if (data) setProducts(data); });
    supabase.from('warehouses').select('id, name').then(({ data }) => { if (data) setWarehouses(data); });
    supabase.from('safes_banks').select('id, name, type').then(({ data }) => { if (data) setSafesBanks(data); });
  }, []);

  const mapClientRow = (row: any): any => ({
    id: row.id,
    name: row.name || '',
    fullName: row.full_name || row.name || '',
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    email: row.email || '',
    phone: row.phone || '',
    mobile: row.mobile || '',
    address1: row.address1 || row.address || '',
    address2: row.address2 || '',
    city: row.city || '',
    region: row.region || '',
    zipCode: row.zip_code || '',
    country: row.country || '',
    commercialRegistry: row.commercial_registry || '',
    taxCard: row.tax_card || '',
    nationalId: row.national_id || '',
    codeNumber: row.code_number || '',
    currency: row.currency || 'EGP',
    notes: row.notes || '',
    category: row.category || '',
    billingMethod: row.billing_method || '',
    balance: row.balance || 0,
  });

  const getNextInvoiceNumber = () => {
    if (invoices.length === 0) return '000001';
    const lastNum = invoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return String(lastNum + 1).padStart(6, '0');
  };

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(getNextInvoiceNumber());
  const [invoiceDate, setInvoiceDate] = useState<string>('2026-06-05');
  const [issueDate, setIssueDate] = useState<string>('2026-06-05');
  const [salesAgent, setSalesAgent] = useState<string>('Abdo Yaser #000001');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [billingTemplate, setBillingTemplate] = useState<string>('التصميم الافتراضي للفاتورة');

  const [items, setItems] = useState<any[]>([
    {
      id: 'row-1',
      productId: '',
      itemName: '',
      description: '',
      unitPrice: 0,
      quantity: 1,
      discount: 0,
      taxValue: 14,
      total: 0
    }
  ]);

  const [activeTab, setActiveTab] = useState<'discount' | 'deposit' | 'shipping' | 'attachments'>('discount');

  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>(
    'شكراً لتعاملكم معنا. الرجاء تسديد قيمة المستحق في موعد غايته شروط الفاتورة.'
  );
  const [alreadyPaid, setAlreadyPaid] = useState<boolean>(false);

  const [subtotal, setSubtotal] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('نقدا');
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>('');

  const [productSearchText, setProductSearchText] = useState<Record<string, string>>({});
  const [showProductDropdown, setShowProductDropdown] = useState<Record<string, boolean>>({});
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

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

    let rowsTotalSum = updatedRows.reduce((acc, row) => acc + row.total, 0);

    let totalAfterDiscount = rowsTotalSum;
    if (globalDiscountType === 'percentage') {
      totalAfterDiscount = rowsTotalSum - (rowsTotalSum * (globalDiscountValue / 100));
    } else {
      totalAfterDiscount = rowsTotalSum - globalDiscountValue;
    }

    const finalTotal = Math.max(0, totalAfterDiscount + adjustmentValue);
    setGrandTotal(parseFloat(finalTotal.toFixed(2)));
  }, [items, globalDiscountType, globalDiscountValue, adjustmentValue]);

  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    setItems(prev => [
      ...prev,
      {
        id: newId,
        productId: '',
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

  const handleDeleteRow = (id: string) => {
    if (items.length === 1) {
      alert('يجب أن تحتوي الفاتورة على بند واحد على الأقل.');
      return;
    }
    setItems(prev => prev.filter(row => row.id !== id));
  };

  const handleUpdateRow = (id: string, field: string, value: any) => {
    setItems(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        return { ...row, [field]: value };
      })
    );
  };

  const handleBatchUpdateRow = (id: string, fields: Record<string, any>) => {
    setItems(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        return { ...row, ...fields };
      })
    );
  };

  const handleSelectProduct = (rowId: string, product: any) => {
    setItems(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          productId: product.id,
          itemName: product.name,
          unitPrice: parseFloat(product.selling_price) || 0,
          taxValue: parseInt(product.tax1) || 14
        };
      })
    );
    setShowProductDropdown(prev => ({ ...prev, [rowId]: false }));
    setProductSearchText(prev => ({ ...prev, [rowId]: '' }));
  };

  const getFilteredProducts = (query: string) => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter((p: any) =>
      p.name.toLowerCase().includes(q) ||
      (p.code && p.code.toLowerCase().includes(q))
    );
  };

  const recordInventoryMovement = async (
    productId: string,
    warehouseId: string,
    movementType: string,
    referenceType: string,
    referenceId: string,
    referenceNumber: string,
    qtyChange: number,
    createdBy: string
  ) => {
    const { data: stock } = await supabase
      .from('warehouse_stock')
      .select('quantity')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .maybeSingle();

    const qtyBefore = stock ? parseFloat(stock.quantity) : 0;
    const qtyAfter = qtyBefore + qtyChange;

    await supabase
      .from('warehouse_stock')
      .upsert({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: qtyAfter
      }, { onConflict: 'product_id,warehouse_id' });

    await supabase
      .from('inventory_movements')
      .insert({
        product_id: productId,
        warehouse_id: warehouseId,
        movement_type: movementType,
        reference_type: referenceType,
        reference_id: referenceId,
        reference_number: referenceNumber,
        qty_before: qtyBefore,
        qty_change: qtyChange,
        qty_after: qtyAfter,
        created_by: createdBy
      });
  };

  const handleSaveDraft = async (statusOverride?: 'paid' | 'unpaid' | 'draft') => {
    const finalSelectedClient = clients.find(c => c.id === selectedClientId);
    if (!finalSelectedClient) {
      alert('الرجاء اختيار العميل أولاً لحفظ الفاتورة.');
      return;
    }

    const calculatedStatusValue = statusOverride || (alreadyPaid ? 'paid' : 'unpaid');

    if (calculatedStatusValue === 'paid' && !selectedWarehouseId) {
      alert('الرجاء اختيار المستودع لتسجيل حركة المخزون.');
      return;
    }

    if (calculatedStatusValue === 'paid' && !selectedTreasuryId) {
      alert('الرجاء اختيار الخزنة أو الحساب البنكي لتسجيل المعاملة المالية.');
      return;
    }

    const hasProductItems = items.some(item => item.productId);
    if (calculatedStatusValue === 'paid' && !hasProductItems) {
      alert('الرجاء اختيار منتجات من القائمة لتسجيل حركة المخزون.');
      return;
    }

    const customer = finalSelectedClient;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: invoiceDate,
      issueDate,
      clientName: customer.fullName,
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

    const { data: newInv, error: invError } = await supabase.from('invoices').insert({
      id: newInvoice.id,
      invoice_number: newInvoice.invoiceNumber,
      date: newInvoice.date,
      issue_date: newInvoice.issueDate,
      client_id: customer.id,
      client_name: customer.fullName,
      sales_agent: newInvoice.salesAgent,
      payment_terms: newInvoice.paymentTerms,
      items: newInvoice.items,
      status: newInvoice.status,
      discount_type: newInvoice.discountType,
      discount_value: newInvoice.discountValue,
      adjustment: newInvoice.adjustment,
      subtotal: newInvoice.subtotal,
      total: newInvoice.total,
      notes: newInvoice.notes,
      already_paid: newInvoice.alreadyPaid,
      currency: newInvoice.currency,
      warehouse_id: selectedWarehouseId || null,
      treasury_id: selectedTreasuryId || null,
      payment_method: calculatedStatusValue === 'paid' ? paymentMethod : ''
    }).select().single();

    if (invError) {
      alert('فشل حفظ الفاتورة: ' + invError.message);
      return;
    }

    if (calculatedStatusValue === 'paid' && newInv) {
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          await recordInventoryMovement(
            item.productId,
            selectedWarehouseId,
            'sale',
            'invoice',
            newInv.id,
            newInv.invoice_number,
            -item.quantity,
            salesAgent
          );
        }
      }

      const { data: treasury } = await supabase
        .from('safes_banks')
        .select('balance')
        .eq('id', selectedTreasuryId)
        .single();

      const currentBalance = treasury ? parseFloat(treasury.balance) : 0;
      const newBalance = currentBalance + grandTotal;

      const { error: treasuryUpdateErr } = await supabase
        .from('safes_banks')
        .update({ balance: newBalance })
        .eq('id', selectedTreasuryId);

      if (treasuryUpdateErr) {
        console.error('Error updating treasury balance:', treasuryUpdateErr);
      }

      const { error: treasuryTxErr } = await supabase.from('treasury_transactions').insert({
        treasury_id: selectedTreasuryId,
        transaction_type: 'sale_payment',
        reference_type: 'invoice',
        reference_id: newInv.id,
        reference_number: newInv.invoice_number,
        description: `تحصيل قيمة الفاتورة ${newInv.invoice_number} من ${customer.fullName}`,
        amount: grandTotal,
        balance_before: currentBalance,
        balance_after: newBalance,
        created_by: salesAgent
      });

      if (treasuryTxErr) {
        console.error('Error inserting treasury transaction:', treasuryTxErr);
      }

      const { error: balanceErr } = await supabase
        .from('clients')
        .update({ balance: (Number(customer.balance) || 0) + grandTotal })
        .eq('id', customer.id);

      if (balanceErr) {
        console.error('Error updating client balance:', balanceErr);
      }
    } else if (calculatedStatusValue !== 'draft' && newInv) {
      const { error: balanceErr } = await supabase
        .from('clients')
        .update({ balance: (Number(customer.balance) || 0) + grandTotal })
        .eq('id', customer.id);

      if (balanceErr) {
        console.error('Error updating client balance:', balanceErr);
      }
    }

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
          <button
            onClick={() => handleSaveDraft(alreadyPaid ? 'paid' : 'unpaid')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>حفظ وطباعة</span>
          </button>

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

          <button
            onClick={() => handleSaveDraft('draft')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-600 hover:bg-slate-700 hover:bg-opacity-85 rounded text-xs font-bold transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>حفظ كمسودة</span>
          </button>
        </div>
      </div>

      {/* 2. Top box: Invoice Template Styling selector + Warehouse */}
      <div className="bg-white rounded-lg border border-daftra-border shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">قالب الفاتورة وطريقة الإخراج</label>
            <select
              value={billingTemplate}
              onChange={(e) => setBillingTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded text-xs focus:ring-1 focus:ring-daftra-blue focus:outline-none"
            >
              <option value="التصميم الافتراضي للفاتورة">التصميم الافتراضي للفاتورة</option>
              <option value="شريط علوي احترافي كلاسيكي">شريط علوي احترافي كلاسيكي (بدون ضريبة)</option>
              <option value="قالب مبسط للعملاء الأفراد">قالب مبسط للعملاء الأفراد (مصر بوز)</option>
              <option value="تصميم فواتير الخدمات السحابية">تصميم فواتير الخدمات السحابية (باهي)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">المستودع <span className="text-rose-500">*</span></label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded text-xs focus:ring-1 focus:ring-daftra-blue focus:outline-none"
            >
              <option value="">(اختر المستودع)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Form Details Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Right Section in RTL (Customer & General Methods) */}
        <div className="bg-white rounded-lg border border-daftra-border shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1 bg-slate-50/50 -m-5 mb-0 p-3 rounded-t-lg">
            <span>العميل وطرق التحصيل</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">الطريقة:</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-daftra-border rounded text-xs focus:ring-1 focus:ring-daftra-blue focus:outline-none">
                <option>طباعة (دفع نقدي / إلكتروني)</option>
                <option>إرسال بالبريد الإلكتروني للعميل</option>
                <option>خصم تلقائي من رصيد المحفظة</option>
              </select>
            </div>

            <div className="space-y-1 relative">
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
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث باسم العميل أو رقم الموبايل..."
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setShowClientDropdown(true);
                    if (!e.target.value) setSelectedClientId('');
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  className="w-full px-3 py-2 bg-amber-50/20 border border-daftra-blue rounded text-xs font-bold text-daftra-dark-blue focus:ring-2 focus:ring-daftra-blue focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
                {showClientDropdown && (
                  <div className="absolute z-50 top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto">
                    {(clientSearchQuery.trim()
                      ? clients.filter(c => {
                          const q = clientSearchQuery.toLowerCase();
                          return c.fullName.toLowerCase().includes(q) || c.mobile.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
                        })
                      : clients
                    ).length === 0 ? (
                      <div className="p-2 text-xs text-slate-400 text-center">لا توجد نتائج</div>
                    ) : (
                      (clientSearchQuery.trim()
                        ? clients.filter(c => {
                            const q = clientSearchQuery.toLowerCase();
                            return c.fullName.toLowerCase().includes(q) || c.mobile.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
                          })
                        : clients
                      ).map(c => (
                        <div
                          key={c.id}
                          onMouseDown={() => {
                            setSelectedClientId(c.id);
                            setClientSearchQuery(c.fullName);
                            setShowClientDropdown(false);
                          }}
                          className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-slate-700">{c.fullName}</span>
                            <span className="text-[10px] text-slate-400 mr-1">[{c.codeNumber}]</span>
                          </div>
                          <span className="text-slate-400 text-[10px]">{c.mobile || c.phone}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedClientId && (() => {
            const client = getSelectedClientDetails();
            if (!client) return null;
            return (
              <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-200 rounded-lg p-3 space-y-2 text-xs animate-fadeIn">
                <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                  <span className="font-extrabold text-slate-800">{client.fullName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">#{client.codeNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                  {client.mobile && <div><span className="text-slate-400 ml-1">موبايل:</span><span dir="ltr" className="font-semibold">{client.mobile}</span></div>}
                  {client.phone && <div><span className="text-slate-400 ml-1">هاتف:</span><span dir="ltr" className="font-semibold">{client.phone}</span></div>}
                  {client.email && <div className="col-span-2"><span className="text-slate-400 ml-1">بريد:</span><span className="font-semibold">{client.email}</span></div>}
                  {client.address1 && <div className="col-span-2"><span className="text-slate-400 ml-1">العنوان:</span><span className="font-semibold">{client.address1}{client.city ? `، ${client.city}` : ''}</span></div>}
                  {client.notes && <div className="col-span-2"><span className="text-slate-400 ml-1">ملاحظات:</span><span className="font-semibold">{client.notes}</span></div>}
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-sky-100 text-[11px]">
                  <span className="text-slate-500 font-bold">الرصيد الحالي: <span className={`font-mono font-extrabold ${Number(client.balance) > 0 ? 'text-emerald-600' : Number(client.balance) < 0 ? 'text-rose-600' : 'text-slate-600'}`}>{Number(client.balance).toLocaleString('ar-EG')} {client.currency}</span></span>
                  <span className="text-slate-500 font-bold">العملة: <span className="font-mono text-daftra-blue">{client.currency}</span></span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Left Section in RTL (Invoice Codes & Dates details) */}
        <div className="bg-white rounded-lg border border-daftra-border shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1 bg-slate-50/50 -m-5 mb-0 p-3 rounded-t-lg">
            <span>بيانات الفاتورة والرموز</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">رقم الفاتورة:</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded font-mono text-center font-bold text-[#0d385a]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">تاريخ الفاتورة:</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded text-center font-mono"
              />
            </div>

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

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">تاريخ الاستحقاق:</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-daftra-border rounded text-center font-mono"
              />
            </div>

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

      {/* 4. Table Spreadsheet Grid */}
      <div className="bg-white rounded-lg border border-daftra-border shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-daftra-border px-4 py-3">
          <h3 className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
            <span>جدول البنود والمنتجات المدرجة</span>
            <span className="text-[10px] text-slate-400 font-bold font-mono">العملة: جنيه مصري (EGP)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs table-fixed min-w-[900px]">
            <thead className="bg-slate-50/75 text-slate-600 border-b border-daftra-border font-bold">
              <tr>
                <th className="p-3 text-right">البند / المنتج</th>
                <th className="p-3">الوصف</th>
                <th className="p-3">سعر الوحدة</th>
                <th className="p-3">الكمية</th>
                <th className="p-3">الخصم (ج.م)</th>
                <th className="p-3">الضريبة</th>
                <th className="p-3 text-left">المجموع</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/30 transition-colors">
                  {/* Item Name with Product Autocomplete */}
                  <td className="p-2 text-right relative" style={{ minWidth: 200 }}>
                    <input
                      type="text"
                      placeholder="اسم البند أو كود المنتج"
                      value={row.productId ? row.itemName : (productSearchText[row.id] || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateRow(row.id, 'itemName', val);
                        handleUpdateRow(row.id, 'productId', '');
                        setProductSearchText(prev => ({ ...prev, [row.id]: val }));
                        setShowProductDropdown(prev => ({ ...prev, [row.id]: true }));
                      }}
                      onFocus={() => setShowProductDropdown(prev => ({ ...prev, [row.id]: true }))}
                      onBlur={() => setTimeout(() => setShowProductDropdown(prev => ({ ...prev, [row.id]: false })), 200)}
                      className="w-full text-right p-2 border border-slate-200 rounded font-bold outline-none focus:border-[#0074b1]"
                    />
                    {showProductDropdown[row.id] && (
                      <div className="absolute z-50 top-full right-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                        {(productSearchText[row.id]?.trim()
                          ? getFilteredProducts(productSearchText[row.id])
                          : products
                        ).length === 0 ? (
                          <div className="p-2 text-slate-400 text-xs text-center">لا توجد نتائج</div>
                        ) : (
                          (productSearchText[row.id]?.trim()
                            ? getFilteredProducts(productSearchText[row.id])
                            : products
                          ).map((p: any) => (
                            <div
                              key={p.id}
                              onMouseDown={() => {
                                handleBatchUpdateRow(row.id, {
                                  productId: p.id,
                                  itemName: p.name,
                                  unitPrice: parseFloat(p.selling_price) || 0,
                                  taxValue: parseInt(p.tax1) || 14
                                });
                                setShowProductDropdown(prev => ({ ...prev, [row.id]: false }));
                                setProductSearchText(prev => ({ ...prev, [row.id]: '' }));
                              }}
                              className="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-bold text-xs">{p.name}</div>
                                {p.code && <div className="text-[10px] text-slate-400">كود: {p.code}</div>}
                              </div>
                              <div className="text-xs font-mono font-bold text-[#0074b1]">{parseFloat(p.selling_price || 0).toLocaleString('ar-EG')} ج.م</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </td>

                  {/* Description */}
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="وصف إضافي"
                      value={row.description}
                      onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                      className="w-full text-right p-2 border border-slate-200 rounded outline-none text-slate-500 focus:border-[#0074b1]"
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="p-2">
                    <input
                      type="number"
                      placeholder="0"
                      value={row.unitPrice || ''}
                      onChange={(e) => handleUpdateRow(row.id, 'unitPrice', Number(e.target.value))}
                      className="w-full text-center p-2 border border-slate-200 rounded font-bold font-mono outline-none focus:border-[#0074b1]"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="p-2 w-24">
                    <input
                      type="number"
                      placeholder="1"
                      min="1"
                      value={row.quantity || ''}
                      onChange={(e) => handleUpdateRow(row.id, 'quantity', Number(e.target.value))}
                      className="w-full text-center p-2 border border-slate-200 rounded font-bold font-mono outline-none focus:border-[#0074b1]"
                    />
                  </td>

                  {/* Line Discount */}
                  <td className="p-2 w-28">
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={row.discount || ''}
                      onChange={(e) => handleUpdateRow(row.id, 'discount', Number(e.target.value))}
                      className="w-full text-center p-2 border border-slate-200 rounded font-bold font-mono outline-none focus:border-[#0074b1]"
                    />
                  </td>

                  {/* Tax VAT selector */}
                  <td className="p-2 w-32">
                    <select
                      value={row.taxValue}
                      onChange={(e) => handleUpdateRow(row.id, 'taxValue', Number(e.target.value))}
                      className="w-full text-center p-2 border border-slate-200 rounded font-bold outline-none"
                    >
                      <option value={0}>بدون ضريبة (0%)</option>
                      <option value={14}>ضريبة مصرية (14%)</option>
                      <option value={5}>ضريبة مبيعات (5%)</option>
                    </select>
                  </td>

                  {/* Total per row */}
                  <td className="p-2 text-left font-mono font-black text-slate-800">
                    {(() => {
                      const raw = row.unitPrice * row.quantity;
                      const rowDisc = row.discount || 0;
                      const rowT = raw * (row.taxValue / 100);
                      const lineTotal = raw - rowDisc + rowT;
                      return lineTotal.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                    })()} ج.م
                  </td>

                  {/* Delete Row Action */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      disabled={items.length === 1}
                      className={`p-1.5 rounded transition-all cursor-pointer ${items.length === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50/50 p-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-4">
          <button
            type="button"
            onClick={handleAddRow}
            className="px-4 py-2 bg-white text-[#0074b1] border border-blue-200 hover:bg-blue-50/60 rounded-md font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بند</span>
          </button>

          <div className="w-full md:w-96 text-xs font-semibold text-slate-700 space-y-2 border border-slate-200 bg-white p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">الإجمالي قبل الخصم:</span>
              <span className="font-mono text-slate-800 font-extrabold">{subtotal.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
            </div>

            {globalDiscountValue > 0 && (
              <div className="flex justify-between items-center text-rose-500 font-bold">
                <span>خصم الفاتورة الكلي:</span>
                <span className="font-mono">
                  -{globalDiscountType === 'percentage'
                    ? `${(subtotal * (globalDiscountValue / 100)).toLocaleString('ar-EG')} ج.م (${globalDiscountValue}%)`
                    : `${globalDiscountValue.toLocaleString('ar-EG')} ج.م`
                  }
                </span>
              </div>
            )}

            {Number(adjustmentValue) !== 0 && (
              <div className="flex justify-between items-center text-blue-600 font-bold">
                <span>التسويات:</span>
                <span className="font-mono">{Number(adjustmentValue).toLocaleString('ar-EG')} ج.م</span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-slate-900 text-sm font-black">
              <span>الإجمالي المستحق:</span>
              <span className="font-mono text-[#0074b1] text-base">{grandTotal.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Tabs & Adjustment details & formatted Notes rich editor */}
      <div className="bg-white rounded-lg border border-daftra-border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-8 p-5 border-l border-slate-100 space-y-4">
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

          {activeTab === 'discount' && (
            <div className="bg-slate-50/50 p-4 rounded border border-slate-100 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">الملاحظات / الشروط والأحكام الخاصة بالفاتورة:</label>
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

              <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-800">
                <span>الصافي المستحق النهائي:</span>
                <span className="font-mono text-daftra-blue font-extrabold text-base">{grandTotal.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</span>
              </div>
            </div>
          </div>

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

          {alreadyPaid && (
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 space-y-3 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold"
                >
                  <option value="نقدا">نقدا</option>
                  <option value="بنك">بنك</option>
                  <option value="شيك">شيك</option>
                  <option value="تحويل">تحويل</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">الخزنة / الحساب البنكي</label>
                <select
                  value={selectedTreasuryId}
                  onChange={(e) => setSelectedTreasuryId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold"
                >
                  <option value="">(اختر الخزنة)</option>
                  {safesBanks.map(sb => (
                    <option key={sb.id} value={sb.id}>{sb.name} ({sb.type === 'safe' ? 'خزنة' : 'بنك'})</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Invoice Printable Preview Modal/Drawer Overlay */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col animate-scaleIn max-h-[90vh]">
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

            <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-[#f8fafc] text-slate-800 text-xs">
              <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 uppercase max-w-3xl mx-auto space-y-6 text-right">
                <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <h1 className="text-base sm:text-lg font-black text-daftra-dark-blue">Abdo Yaser</h1>
                    <p className="text-[10px] text-slate-400">Main Branch - القاهرة، مصر</p>
                    <p className="text-[10px] text-slate-400">سجل تجاري: 48593/ق | بطاقة ضريبية: 738-429-105</p>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-black tracking-widest text-[#0074b1]">DAFTRA ERP</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">حلول برمجية سحابية موثقة</div>
                  </div>
                </div>

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

            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                className="px-4 py-2 bg-[#0d385a] hover:bg-[#082236] text-white text-xs font-bold rounded shadow cursor-pointer transition-colors"
                onClick={() => window.print()}
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
