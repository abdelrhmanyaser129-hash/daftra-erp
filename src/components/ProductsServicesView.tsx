/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, ChevronLeft, ChevronRight, SlidersHorizontal, Trash2, AlertCircle,
  Table, ArrowLeft, X, Check, ChevronDown, HelpCircle, RefreshCw,
  Settings, Upload, Globe, Tag
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Product interface to support creating and visualizing products
interface Product {
  id: string;
  name: string;
  code: string;
  barcode: string;
  category: string;
  brand: string;
  status: 'نشط' | 'غير نشط';
  itemType: string;
  supplierId: string;
  createdAt: string;
  description?: string;
  isOnline?: boolean;
  isFeatured?: boolean;
  purchasePrice?: string;
  sellingPrice?: string;
  tax1?: string;
  tax2?: string;
  discount?: string;
  discountType?: string;
  minSellingPrice?: string;
  profitMargin?: string;
  trackInventory?: boolean;
  alertQuantity?: string;
  internalNotes?: string;
  tags?: string;
}

interface ProductsServicesViewProps {
  setView: (view: string) => void;
}

export default function ProductsServicesView({ setView }: ProductsServicesViewProps) {
  // --- Search / Filters state ---
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('[جميع التصنيفات]');
  const [selectedBrand, setSelectedBrand] = useState<string>('[جميع الماركات]');
  const [selectedStatus, setSelectedStatus] = useState<string>('الكل');
  const [barcode, setBarcode] = useState<string>('');

  // Advanced search fields
  const [itemCodeInput, setItemCodeInput] = useState<string>('');
  const [itemTypeInput, setItemTypeInput] = useState<string>('[Any Item Type Input]');
  const [creationPeriod, setCreationPeriod] = useState<string>('تخصيص');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('[Any Supplier Id]');
  const [productCode, setProductCode] = useState<string>('');

  // --- Products list state ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);

  // --- New Product Form state ---
  const [newName, setNewName] = useState<string>('');
  const [newCode, setNewCode] = useState<string>('');
  const [newBarcode, setNewBarcode] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('عام');
  const [newBrand, setNewBrand] = useState<string>('بدون ماركة');
  const [newStatus, setNewStatus] = useState<'نشط' | 'غير نشط'>('نشط');
  const [newItemType, setNewItemType] = useState<string>('منتج مخزني');
  const [newSupplier, setNewSupplier] = useState<string>('مورد عام');

  // Exact fields from image 3
  const [newSku, setNewSku] = useState<string>('000001');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newIsOnline, setNewIsOnline] = useState<boolean>(true);
  const [newIsFeatured, setNewIsFeatured] = useState<boolean>(false);
  
  const [newPurchasePrice, setNewPurchasePrice] = useState<string>('');
  const [newSellingPrice, setNewSellingPrice] = useState<string>('');
  const [newTax1, setNewTax1] = useState<string>('القيمة المضافة');
  const [newTax2, setNewTax2] = useState<string>('[اختر ضريبة]');
  const [newMinSellingPrice, setNewMinSellingPrice] = useState<string>('');
  const [newDiscount, setNewDiscount] = useState<string>('');
  const [newDiscountType, setNewDiscountType] = useState<string>('%');
  const [newProfitMargin, setNewProfitMargin] = useState<string>('');

  const [newTrackInventory, setNewTrackInventory] = useState<boolean>(true);
  const [newAlertQuantity, setNewAlertQuantity] = useState<string>('0');

  const [newInternalNotes, setNewInternalNotes] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  // Load Products from Supabase
  useEffect(() => {
    supabase.from('products').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setProducts(data.map(mapProductRow));
      else setProducts([]);
    });
  }, []);

  const mapProductRow = (row: any): Product => ({
    id: row.id,
    name: row.name || '',
    code: row.code || '',
    barcode: row.barcode || '',
    category: row.category || '',
    brand: row.brand || '',
    status: row.status || 'نشط',
    itemType: row.item_type || '',
    supplierId: row.supplier_id || '',
    createdAt: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    description: row.description || '',
    isOnline: row.is_online || false,
    isFeatured: row.is_featured || false,
    purchasePrice: row.purchase_price?.toString() || '',
    sellingPrice: row.selling_price?.toString() || '',
    tax1: row.tax1?.toString() || '',
    tax2: row.tax2?.toString() || '',
    discount: row.discount?.toString() || '',
    discountType: row.discount_type || '',
    minSellingPrice: row.min_selling_price?.toString() || '',
    profitMargin: row.profit_margin?.toString() || '',
    trackInventory: row.track_inventory !== false,
    alertQuantity: row.alert_quantity?.toString() || '0',
    internalNotes: row.internal_notes || '',
    tags: row.tags || '',
  });

  // Filter logic
  const filteredProducts = products.filter(prod => {
    // Keyword match (name or code or barcode)
    if (keyword && !prod.name.includes(keyword) && !prod.code.includes(keyword) && !prod.barcode.includes(keyword)) {
      return false;
    }
    // Category match
    if (selectedCategory !== '[جميع التصنيفات]' && prod.category !== selectedCategory) {
      return false;
    }
    // Brand match
    if (selectedBrand !== '[جميع الماركات]' && prod.brand !== selectedBrand) {
      return false;
    }
    // Status match
    if (selectedStatus !== 'الكل') {
      const matchStatus = selectedStatus === 'نشط' ? 'نشط' : 'غير نشط';
      if (prod.status !== matchStatus) return false;
    }
    // Barcode match
    if (barcode && !prod.barcode.includes(barcode)) {
      return false;
    }

    if (isAdvancedSearch) {
      // Item code
      if (itemCodeInput && !prod.code.includes(itemCodeInput)) {
        return false;
      }
      // Item Type Input
      if (itemTypeInput !== '[Any Item Type Input]' && prod.itemType !== itemTypeInput) {
        return false;
      }
      // Supplier Id
      if (supplierId !== '[Any Supplier Id]' && prod.supplierId !== supplierId) {
        return false;
      }
      // Product code
      if (productCode && !prod.code.includes(productCode)) {
        return false;
      }
    }
    return true;
  });

  // Action handlers
  const handleOpenAddForm = () => {
    const nextSkuNum = products.length + 1;
    const paddedSku = String(nextSkuNum).padStart(6, '0');
    
    setNewName('');
    setNewSku(paddedSku);
    setNewCode(`PRD-${paddedSku}`);
    setNewDescription('');
    setNewCategory('عام');
    setNewBrand('بدون ماركة');
    setNewBarcode(`${Math.floor(Math.random() * 900000000) + 100000000}`);
    setNewIsOnline(true);
    setNewIsFeatured(false);
    setNewPurchasePrice('');
    setNewSellingPrice('');
    setNewTax1('القيمة المضافة');
    setNewTax2('[اختر ضريبة]');
    setNewMinSellingPrice('');
    setNewDiscount('');
    setNewDiscountType('%');
    setNewProfitMargin('');
    setNewTrackInventory(true);
    setNewAlertQuantity('0');
    setNewInternalNotes('');
    setNewTags('');
    setNewStatus('نشط');
    setNewItemType('منتج مخزني');
    setNewSupplier('مورد عام');
    setImgPreview(null);
    
    setIsAddingProduct(true);
  };

  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('الرجاء إدخال اسم المنتج أو الخدمة');
      return;
    }

    const row = {
      name: newName,
      code: newSku.trim() || newCode.trim() || `PRD-${Math.floor(Math.random() * 90000) + 10000}`,
      barcode: newBarcode.trim() || `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      category: newCategory,
      brand: newBrand,
      status: newStatus,
      item_type: newItemType,
      supplier_id: newSupplier,
      description: newDescription || null,
      is_online: newIsOnline || false,
      is_featured: newIsFeatured || false,
      purchase_price: parseFloat(newPurchasePrice) || 0,
      selling_price: parseFloat(newSellingPrice) || 0,
      tax1: parseFloat(newTax1) || 0,
      tax2: parseFloat(newTax2) || 0,
      discount: parseFloat(newDiscount) || 0,
      discount_type: newDiscountType || '',
      min_selling_price: parseFloat(newMinSellingPrice) || 0,
      profit_margin: parseFloat(newProfitMargin) || 0,
      track_inventory: newTrackInventory !== false,
      alert_quantity: parseFloat(newAlertQuantity) || 0,
      internal_notes: newInternalNotes || null,
      tags: newTags || null,
    };

    const { error } = await supabase.from('products').insert(row);
    if (!error) {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setProducts(data.map(mapProductRow));
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setProducts(data.map(mapProductRow));
    }
  };

  const handleClearFilters = () => {
    setKeyword('');
    setSelectedCategory('[جميع التصنيفات]');
    setSelectedBrand('[جميع الماركات]');
    setSelectedStatus('الكل');
    setBarcode('');
    setItemCodeInput('');
    setItemTypeInput('[Any Item Type Input]');
    setSupplierId('[Any Supplier Id]');
    setProductCode('');
    setDateFrom('');
    setDateTo('');
  };

  // Mock barcode generation
  const handleRegenerateBarcode = () => {
    setNewBarcode(`${Math.floor(Math.random() * 9000000000) + 1000000000}`);
  };

  // Drag & drop file upload mocking
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Pagination totals
  const totalPages = Math.ceil(filteredProducts.length / 10) || 0;
  const currentPage = totalPages > 0 ? 1 : 0;

  // Render addition form if isAddingProduct is true
  if (isAddingProduct) {
    return (
      <div id="daftra-add-product-fullscreen" className="w-full mx-auto space-y-4 text-right font-sans select-none pb-12">
        
        {/* State/Form Breadcrumbs and Top Buttons bar exact to screen */}
        <div className="flex justify-between items-center bg-white p-3 rounded-md border border-[#d4e1ed] shadow-3xs flex-row-reverse">
          {/* Breadcrumbs (المنتجات < إضافة) */}
          <div className="flex items-center gap-1.5 flex-row-reverse text-sm font-sans tracking-tight text-[#1a252f]">
            <span className="text-[#0074b1] font-bold cursor-pointer hover:underline" onClick={() => setIsAddingProduct(false)}>المنتجات</span>
            <span className="text-slate-400 font-bold">&gt;</span>
            <span className="text-slate-800 font-bold">إضافة</span>
          </div>

          {/* Top Actions: Green Save Split & Cancel */}
          <div className="flex items-center gap-2 flex-row-reverse">
            {/* Split Green Save Button */}
            <div className="flex items-center rounded overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={handleAddNewProduct}
                className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-5 h-8 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border-l border-[#008d4c]"
              >
                <span>حفظ</span>
              </button>
              <button
                type="button"
                onClick={() => alert('إجراءات الحفظ السريعة: حفظ وإضافة آخر / حفظ والرجوع للقائمة الرئيسية')}
                className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-2.5 h-8 flex items-center justify-center cursor-pointer transition-all"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setIsAddingProduct(false)}
              className="bg-white border border-[#ccc] text-slate-700 hover:bg-slate-50 font-bold h-8 px-4 text-xs rounded transition-all flex items-center gap-1.5 flex-row-reverse cursor-pointer shadow-3xs"
            >
              <X className="w-3.5 h-3.5 text-slate-500 font-bold" />
              <span>إلغاء</span>
            </button>
          </div>
        </div>

        {/* The Form Content Layout Grid matching image 3 */}
        <form onSubmit={handleAddNewProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs text-right select-text font-sans">
          
          {/* Right Column: Item details card (تفاصيل البند) - spans 7 grid spaces */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Card: تفاصيل البند */}
            <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden shadow-3xs">
              <div className="bg-[#fcfdfe] px-4 py-2.5 border-b border-[#e9eff4] flex justify-between items-center flex-row-reverse">
                <span className="text-slate-800 font-bold">تفاصيل البند</span>
              </div>
              
              <div className="p-4 space-y-4">
                
                {/* Row 1: Name and SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field (الاسم *) */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">الاسم <span className="text-rose-500 font-black">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#0074b1] transition-all text-right"
                    />
                  </div>

                  {/* SKU Serial Sku (الرقم التسلسلي SKU) */}
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">الرقم التسلسلي SKU</label>
                    <input
                      type="text"
                      placeholder="000001"
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#0074b1] transition-all text-left font-mono"
                    />
                  </div>
                </div>

                {/* Row 2: Description (الوصف) */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">الوصف</label>
                  <textarea
                    rows={4}
                    placeholder=""
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#0074b1] transition-all text-right"
                  />
                </div>

                {/* Row 3: Images Drag Box */}
                <div className="space-y-1">
                  <span className="block text-slate-500 font-bold">الصور</span>
                  
                  <div className="relative border-2 border-dashed border-[#cbd8e3] rounded-md p-4 bg-slate-50/50 hover:bg-slate-50/80 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    
                    {imgPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={imgPreview} alt="معاينة" className="h-16 w-16 object-cover rounded border" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setImgPreview(null); }}
                          className="bg-red-50 text-red-600 hover:bg-red-100 text-[10px] px-2 py-0.5 rounded"
                        >
                          إزالة الصورة
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-1" />
                        <div className="text-xs text-[#0074b1] hover:underline font-semibold">
                          أفلت الملف هنا أو اختر من جهازك
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Row 4: Classification & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">التصنيف</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-600 bg-white text-right focus:outline-none focus:border-[#0074b1]"
                    >
                      <option value="عام">عام</option>
                      <option value="إلكترونيات">إلكترونيات</option>
                      <option value="خدمات سحابية">خدمات سحابية</option>
                      <option value="برمجيات ورخص">برمجيات ورخص</option>
                      <option value="أجهزة ومعدات">أجهزة ومعدات</option>
                    </select>
                  </div>

                  {/* Brand */}
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">الماركة</label>
                    <select
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-600 bg-white text-right focus:outline-none focus:border-[#0074b1]"
                    >
                      <option value="بدون ماركة">بدون ماركة</option>
                      <option value="Apple">Apple</option>
                      <option value="Samsung">Samsung</option>
                      <option value="HP">HP</option>
                      <option value="Dell">Dell</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Barcode Input */}
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">باركود</label>
                  <div className="flex items-center gap-1.5">
                    
                    {/* Regenerate Trigger */}
                    <button
                      type="button"
                      onClick={handleRegenerateBarcode}
                      className="h-8 w-8 shrink-0 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-center text-slate-500 hover:text-[#0074b1] transition-all cursor-pointer"
                      title="توليد باركود تلقائي"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="text"
                      value={newBarcode}
                      onChange={(e) => setNewBarcode(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 h-8 text-xs text-slate-700 font-mono focus:outline-none focus:border-[#0074b1] transition-all text-left"
                    />

                  </div>
                </div>

                {/* Row 6: Checkbox Switches */}
                <div className="flex items-center gap-6 pt-1 flex-row-reverse text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIsOnline}
                      onChange={(e) => setNewIsOnline(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#0d5fc2] focus:ring-[#0d5fc2]"
                    />
                    <span className="font-bold">متاحة أونلاين</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIsFeatured}
                      onChange={(e) => setNewIsFeatured(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#0d5fc2] focus:ring-[#0d5fc2]"
                    />
                    <span className="font-bold">منتج مميز</span>
                  </label>
                </div>

              </div>
            </div>

          </div>

          {/* Left Column: Pricing card (تفاصيل التسعير) - spans 5 grid spaces */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Card: تفاصيل التسعير */}
            <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden shadow-3xs">
              <div className="bg-[#fcfdfe] px-4 py-2.5 border-b border-[#e9eff4]">
                <span className="text-slate-800 font-bold block">تفاصيل التسعير</span>
              </div>
              
              <div className="p-4 space-y-3.5">
                
                {/* Purchase Price & Selling Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">سعر الشراء</label>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={newPurchasePrice}
                      onChange={(e) => setNewPurchasePrice(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 font-mono text-left focus:outline-none focus:border-[#0074b1]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center justify-between flex-row-reverse text-slate-600 font-bold">
                      <div className="flex items-center gap-1 flex-row-reverse">
                        <span>سعر البيع</span>
                        <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" title="سعر البيع الأساسي شاملاً أو مستثنياً الضريبة" />
                      </div>
                    </label>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={newSellingPrice}
                      onChange={(e) => setNewSellingPrice(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 font-mono text-left focus:outline-none focus:border-[#0074b1]"
                    />
                  </div>
                </div>

                {/* Tax 1 & Tax 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">الضريبة 1</label>
                    <select
                      value={newTax1}
                      onChange={(e) => setNewTax1(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-600 bg-white text-right focus:outline-none focus:border-[#0074b1]"
                    >
                      <option value="القيمة المضافة">القيمة المضافة</option>
                      <option value="الضريبة المبسطة">الضريبة المبسطة</option>
                      <option value="لا توجد">بدون ضريبة</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center flex-row-reverse mb-0.5">
                      <label className="text-slate-500 font-bold">الضريبة 2</label>
                      <button
                        type="button"
                        onClick={() => alert('إعدادات الضرائب المتقدمة')}
                        className="text-[#0074b1] hover:underline text-[10px] font-bold"
                      >
                        متقدم
                      </button>
                    </div>
                    <select
                      value={newTax2}
                      onChange={(e) => setNewTax2(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-600 bg-white text-right focus:outline-none focus:border-[#0074b1]"
                    >
                      <option value="[اختر ضريبة]">[اختر ضريبة]</option>
                      <option value="القيمة المضافة">القيمة المضافة</option>
                      <option value="ضريبة الرفاهية">ضريبة الرفاهية</option>
                    </select>
                  </div>
                </div>

                {/* Discount & Discount Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">نوع الخصم</label>
                    <select
                      value={newDiscountType}
                      onChange={(e) => setNewDiscountType(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-600 bg-white text-right focus:outline-none"
                    >
                      <option value="%">% نسبة مئوية</option>
                      <option value="ثابت">مبلغ ثابت</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">الخصم</label>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={newDiscount}
                      onChange={(e) => setNewDiscount(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 font-mono text-left focus:outline-none focus:border-[#0074b1]"
                    />
                  </div>
                </div>

                {/* Minimum selling price */}
                <div className="space-y-1 col-span-2">
                  <label className="block text-slate-500 font-bold">أقل سعر بيع</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={newMinSellingPrice}
                    onChange={(e) => setNewMinSellingPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 font-mono text-left focus:outline-none focus:border-[#0074b1]"
                  />
                </div>

                {/* Margin margin percentage */}
                <div className="space-y-1 col-span-2">
                  <label className="block text-slate-500 font-bold">هامش الربح نسبة مئوية</label>
                  <input
                    type="text"
                    value={newProfitMargin}
                    onChange={(e) => setNewProfitMargin(e.target.value)}
                    className="w-full border border-slate-300 bg-slate-50 rounded px-2 py-1.5 text-xs text-slate-500 font-mono text-left focus:outline-none cursor-not-allowed"
                    placeholder="تلقائي بناءً على الفرق"
                  />
                </div>

              </div>
            </div>

          </div>

          {/* Underneath: Inventory tracking card spanning full-width */}
          <div className="lg:col-span-12 space-y-4">
            
            {/* Card: إدارة المخزون */}
            <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden shadow-3xs">
              <div className="bg-[#fcfdfe] px-4 py-2.5 border-b border-[#e9eff4]">
                <span className="text-slate-800 font-bold">إدارة المخزون</span>
              </div>
              
              <div className="p-4 space-y-4">
                
                {/* Styled Highlight Box with Checkbox */}
                <div className="bg-[#f0f4f8] border border-slate-200 p-3 rounded-md flex items-center justify-start flex-row-reverse gap-3">
                  <input
                    id="track-inventory-checkbox"
                    type="checkbox"
                    checked={newTrackInventory}
                    onChange={(e) => setNewTrackInventory(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0d5fc2] focus:ring-[#0d5fc2] cursor-pointer"
                  />
                  <label htmlFor="track-inventory-checkbox" className="text-slate-800 font-black text-xs cursor-pointer select-none text-right">
                    تتبع المخزون
                  </label>
                </div>

                {/* Sub row inside Inventory */}
                <div className="space-y-1.5 max-w-sm">
                  <div className="flex items-center gap-1 flex-row-reverse text-slate-500 font-bold">
                    <span>نبهني عند وصول الكمية إلى أقل من</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" title="يرسل النظام تنبيهات للمخزن عند تناقص الكمية" />
                  </div>
                  <input
                    type="number"
                    value={newAlertQuantity}
                    onChange={(e) => setNewAlertQuantity(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 font-mono text-right focus:outline-none focus:border-[#0074b1]"
                  />
                </div>

              </div>
            </div>

            {/* Card: خيارات أكثر */}
            <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden shadow-3xs">
              <div className="bg-[#fcfdfe] px-4 py-2.5 border-b border-[#e9eff4]">
                <span className="text-slate-800 font-bold">خيارات أكثر</span>
              </div>
              
              <div className="p-4 space-y-4">
                
                {/* Row 1: Notes & Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Internal notes */}
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">ملاحظات داخلية</label>
                    <textarea
                      rows={3}
                      value={newInternalNotes}
                      onChange={(e) => setNewInternalNotes(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#0074b1]"
                      placeholder=""
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">وسوم</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 pr-8 text-xs text-slate-600 bg-white text-right focus:outline-none"
                        placeholder="اختر وسوم أو اكتب واضغط Enter"
                      />
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                  </div>

                </div>

                {/* Row 2: Status Status Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold">الحالة</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as 'نشط' | 'غير نشط')}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-600 bg-white text-right focus:outline-none"
                    >
                      <option value="نشط">نشط</option>
                      <option value="غير نشط">غير نشط</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Form Footer Meta info exactly matching Image 3 structure */}
            <div className="pt-2 flex flex-col sm:flex-row justify-between items-center border-t border-slate-200 select-none text-slate-500 text-[10px] gap-2 pt-4">
              {/* Settings Trigger Link with Cog */}
              <button
                type="button"
                onClick={() => alert('إعدادات الحقول المخصصة لصفحة المنتجات والبنود')}
                className="flex items-center gap-1 flex-row-reverse text-[#0074b1] hover:underline font-bold"
              >
                <Settings className="w-3 h-3 text-[#0074b1]" />
                <span>إعدادات الحقول المخصصة</span>
              </button>

              <div className="flex gap-4 font-mono text-[9px] text-slate-400">
                <span>Products More Information</span>
                <span>Type: {newItemType}</span>
                <span>Supplier: {newSupplier}</span>
              </div>
            </div>

          </div>

          {/* Form Actions bottom duplicate bar */}
          <div className="lg:col-span-12 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddingProduct(false)}
              className="px-5 py-2 border border-[#ccc] text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              إلغاء الحفظ
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              حفظ المنتج الجديد
            </button>
          </div>

        </form>

      </div>
    );
  }

  // ELSE: Display the index list view and search panel
  return (
    <div id="daftra-products-and-services-panel" className="w-full mx-auto space-y-4 text-right font-sans select-none pb-12">
      
      {/* 1. Header Navigation & Breadcrumbs Bar mimicking top app layer */}
      <div className="flex justify-between items-center bg-[#eceff1]/60 px-4 py-2 text-xs text-slate-500 rounded-md border border-slate-200/50">
        <div className="flex items-center gap-1.5 flex-row-reverse">
          <span className="text-slate-400">المخزون</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 font-bold">المنتجات والخدمات</span>
        </div>
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-1 text-[#0074b1] hover:underline font-bold"
        >
          <span>العودة للوحة التحكم</span>
          <ArrowLeft className="w-3 h-3 text-[#0074b1]" />
        </button>
      </div>

      {/* 2. Standard Daftra System Toolbar showing ONLY Green Add button and Pagination */}
      <div className="bg-white p-2.5 rounded-md border border-[#d4e1ed] flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left Side: Adding & Managing Items buttons - ONLY Add Button remains! */}
        <div className="flex items-center gap-2 flex-row-reverse">
          <button
            onClick={handleOpenAddForm}
            className="bg-[#2ecc71] hover:bg-[#27ae60] text-white px-4 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة</span>
          </button>
        </div>

        {/* Right Side: Exact Pagination design from the screenshot */}
        <div className="flex items-center gap-2 flex-row-reverse text-slate-600 font-sans">
          
          {/* Table display mode square */}
          <button className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-500">
            <Table className="w-4 h-4 text-[#0074b1]" />
          </button>

          {/* Counts Dropdown */}
          <div className="px-2 py-1.5 border border-slate-200 rounded bg-white text-[11px] h-8 flex items-center font-bold">
            {filteredProducts.length > 0 ? `1 - ${filteredProducts.length} من ${filteredProducts.length}` : '0 - 0 من 0'}
          </div>

          {/* Page Display Input */}
          <div className="flex items-center border border-slate-200 rounded bg-white h-8 overflow-hidden">
            <button 
              className="px-2 hover:bg-slate-50 h-full border-l border-slate-150 flex items-center justify-center text-slate-400"
              disabled={currentPage <= 1}
              onClick={() => alert('الصفحة الأولى')}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            
            <span className="px-3 text-slate-500 text-[11px] h-full flex items-center select-none bg-slate-50/50">
              صفحة {currentPage} من {totalPages}
            </span>

            <button 
              className="px-2 hover:bg-slate-50 h-full border-r border-slate-150 flex items-center justify-center text-slate-400"
              disabled={currentPage >= totalPages}
              onClick={() => alert('الصفحة الأخيرة')}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 3. The Interactive Search Panel matching Image 1 & Image 2 */}
      <div className="bg-white rounded-md border border-[#d4e1ed] overflow-hidden">
        
        {/* Card Header tab */}
        <div className="bg-[#fcfdfe] px-4 py-2 border-b border-[#e9eff4]">
          <h3 className="text-[13px] font-bold text-[#0074b1]">بحث</h3>
        </div>

        {/* Form fields body */}
        <div className="p-4 space-y-4">
          
          {/* Basic Row 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
            
            {/* keyword search */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold font-sans">
                البحث بكلمة مفتاحية
              </label>
              <input
                type="text"
                placeholder="ادخل الإسم أو الكود"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white placeholder-slate-300 focus:outline-none focus:border-[#0074b1] transition-all text-right mx-auto shadow-2xs"
              />
            </div>

            {/* Classification (التصنيف) */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold font-sans">
                التصنيف
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right shadow-2xs"
              >
                <option value="[جميع التصنيفات]">[جميع التصنيفات]</option>
                <option value="عام">عام</option>
                <option value="إلكترونيات">إلكترونيات</option>
                <option value="خدمات سحابية">خدمات سحابية</option>
                <option value="برمجيات ورخص">برمجيات ورخص</option>
                <option value="أجهزة ومعدات">أجهزة ومعدات</option>
              </select>
            </div>

            {/* Brand (الماركة) */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold font-sans">
                الماركة
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right shadow-2xs"
              >
                <option value="[جميع الماركات]">[جميع الماركات]</option>
                <option value="بدون ماركة">بدون ماركة</option>
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="HP">HP</option>
                <option value="Dell">Dell</option>
              </select>
            </div>

            {/* Status (الحالة) */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold font-sans">
                الحالة
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right shadow-2xs"
              >
                <option value="الكل">الكل</option>
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
            </div>

            {/* Barcode (باركود) */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold font-sans">
                باركود
              </label>
              <input
                type="text"
                placeholder=""
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right font-mono shadow-2xs"
              />
            </div>

            {/* Advanced Search Toggle Switch Box */}
            <div className="flex items-end justify-start h-full">
              <button
                type="button"
                onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
                className={`p-2 rounded border focus:outline-none cursor-pointer transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
                  isAdvancedSearch
                    ? 'border-[#0074b1] bg-[#eef7fc] text-[#0074b1]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>بحث متقدم</span>
              </button>
            </div>

          </div>

          {/* 4. Advanced Fields Expansion Drawer (Matching Image 2) */}
          <AnimatePresence>
            {isAdvancedSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-t border-dashed border-[#e4edf5] pt-4 grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4 shadow-3xs"
              >
                
                {/* Item Code Input */}
                <div className="space-y-1.5">
                  <label className="block text-slate-500 text-xs font-bold font-sans">
                    Item Code Input
                  </label>
                  <input
                    type="text"
                    value={itemCodeInput}
                    onChange={(e) => setItemCodeInput(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right font-mono"
                  />
                </div>

                {/* Item Type Input */}
                <div className="space-y-1.5">
                  <label className="block text-slate-500 text-xs font-bold font-sans">
                    Item Type Input
                  </label>
                  <select
                    value={itemTypeInput}
                    onChange={(e) => setItemTypeInput(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right"
                  >
                    <option value="[Any Item Type Input]">[Any Item Type Input]</option>
                    <option value="منتج مخزني">منتج مخزني</option>
                    <option value="خدمة">خدمة</option>
                    <option value="منتج مجمع">منتج مجمع</option>
                  </select>
                </div>

                {/* Created At (أنشأت) */}
                <div className="space-y-1.5">
                  <label className="block text-slate-500 text-xs font-bold font-sans">
                    أُنشأت
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={creationPeriod}
                      onChange={(e) => setCreationPeriod(e.target.value)}
                      className="border border-slate-200 rounded px-1.5 py-1.5 text-xs text-slate-600 bg-white focus:outline-none text-right w-1/3 shrink-0"
                    >
                      <option value="تخصيص">تخصيص</option>
                      <option value="اليوم">اليوم</option>
                      <option value="أمس">أمس</option>
                      <option value="هذا الشهر">هذا الشهر</option>
                    </select>
                    
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="border border-slate-200 rounded p-1 text-[10px] text-slate-700 bg-white focus:outline-none text-center w-1/3"
                      placeholder="من"
                      title="تاريخ البداية"
                    />

                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="border border-slate-200 rounded p-1 text-[10px] text-slate-700 bg-white focus:outline-none text-center w-1/3"
                      placeholder="إلى"
                      title="تاريخ النهاية"
                    />
                  </div>
                </div>

                {/* Supplier Id */}
                <div className="space-y-1.5">
                  <label className="block text-slate-500 text-xs font-bold font-sans">
                    Supplier Id
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right"
                  >
                    <option value="[Any Supplier Id]">[Any Supplier Id]</option>
                    <option value="مورد عام">مورد عام</option>
                    <option value="شركة الفا لتوريد المنتجات">شركة الفا لتوريد المنتجات</option>
                    <option value="مجموعة الرواد الصناعية">مجموعة الرواد الصناعية</option>
                  </select>
                </div>

                {/* Product Code (كود المنتج) */}
                <div className="space-y-1.5">
                  <label className="block text-slate-500 text-xs font-bold font-sans">
                    كود المنتج
                  </label>
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#0074b1] transition-all text-right font-mono"
                  />
                </div>

                {/* Blank spacer for alignment */}
                <div className="hidden md:block"></div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Controls inside the Search card: "بحث" on the left, clear filter link next to it */}
          <div className="pt-2 border-t border-[#f4f7f9] flex justify-between items-center bg-slate-50/50 p-2 rounded">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => alert(`جاري تصفية الجدول بناءً على خيارات الفرز والبحث المحددة`)}
                className="bg-[#eff3f6] hover:bg-slate-200 border border-slate-300 text-[#212f3d] font-bold px-5 py-1.5 rounded text-xs transition-colors cursor-pointer"
              >
                بحث
              </button>
              
              <div className="h-4 w-px bg-slate-200" />
              
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[#0074b1] hover:underline text-xs font-bold cursor-pointer underline-offset-2"
              >
                إلغاء الفلتر
              </button>
            </div>
            
            <span className="text-[10px] text-slate-400 font-medium">دفتره يقترح استخدام الفلاتر لتسريع عمليات جرد المخزون</span>
          </div>

        </div>
      </div>

      {/* 4. Results Section Title block */}
      <div className="pt-2">
        <h4 className="text-slate-600 font-black text-xs border-r-4 border-[#0d5fc2] pr-2 mb-3">النتائج</h4>
      </div>

      {/* 5. Product List Board (Renders Alert state from the screenshot when list matches zero items) */}
      {filteredProducts.length === 0 ? (
        
        /* EXACT ALERT STATE SHOWN IN THE SCREENSHOTS */
        <div className="bg-[#fff7e6] border border-[#fcebc2] p-4 rounded text-center text-xs text-amber-800 flex items-center justify-center gap-2 flex-row-reverse select-text font-medium leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            لم يتم العثور على المنتجات. <button onClick={handleClearFilters} className="underline text-amber-900 font-bold hover:text-amber-950 cursor-pointer">حاول إزالة عملية البحث</button>
          </span>
        </div>

      ) : (
        
        /* Responsive list showing added products if any */
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-3xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-[#eff3f6] text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">باركود</th>
                  <th className="p-3">كود المنتج (SKU)</th>
                  <th className="p-3">اسم المنتج / الخدمة</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">الماركة</th>
                  <th className="p-3">سعر البيع</th>
                  <th className="p-3">نوع البند</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="p-3 font-mono text-slate-600">{prod.barcode}</td>
                    <td className="p-3 font-mono text-slate-500 font-semibold">{prod.code}</td>
                    <td className="p-3 text-[#0d5fc2] font-extrabold">{prod.name}</td>
                    <td className="p-3 text-slate-600">{prod.category}</td>
                    <td className="p-3 text-slate-600">{prod.brand}</td>
                    <td className="p-3 font-mono text-slate-700 font-bold">{prod.sellingPrice ? `${prod.sellingPrice} ج.م` : 'غير محدد'}</td>
                    <td className="p-3 text-slate-500">{prod.itemType}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        prod.status === 'نشط' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {prod.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded cursor-pointer inline-block transition-all"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 text-[10px] text-slate-400 font-bold flex items-center justify-between flex-row-reverse border-t border-slate-100">
            <span>عدد البنود المطابقة: {filteredProducts.length} بند</span>
            <span>بإمكانك إضافة وحذف المنتجات بسهولة، وستظل محفوظة بالكامل في المتصفح!</span>
          </div>
        </div>
      )}

    </div>
  );
}
