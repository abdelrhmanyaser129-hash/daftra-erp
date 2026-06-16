/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  Briefcase,
  HelpCircle,
  Clock,
  Coins,
  Globe,
  UploadCloud,
  FileCheck,
  CheckCircle,
  X,
  CreditCard,
  Building,
  UserPlus,
  Eye,
  PlusCircle,
  ArrowRight
} from 'lucide-react';

// Interfaces for vendor, matching the structure in Returns as well as the complete screenshot layout
interface VendorContact {
  name: string;
  position: string;
  phone: string;
}

export interface Vendor {
  id: string; // compatibility format
  name: string; // tradeName compatibility
  company: string; // company / enterprise compatibility
  phone: string;
  email: string;
  currency: string;
  
  // screenshot extra fields
  vendorNumber: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  address1?: string;
  address2?: string;
  city?: string;
  region?: string;
  zipCode?: string;
  country: string;
  commercialRegistry?: string;
  taxCard?: string;
  openingBalance?: number;
  openingBalanceDate?: string;
  notes?: string;
  contacts: VendorContact[];
  secondaryAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    region?: string;
    zipCode?: string;
    country?: string;
  };
  attachments?: string[];
}

interface PurchaseVendorsViewProps {
  setView: (view: string) => void;
}

export default function PurchaseVendorsView({ setView }: PurchaseVendorsViewProps) {
  // Modes: 'list' | 'add' | 'edit'
  const [currentMode, setCurrentMode] = useState<'list' | 'add' | 'edit'>('list');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  // Search and Filter State
  const [searchText, setSearchText] = useState('');
  const [activeCurrencyFilter, setActiveCurrencyFilter] = useState('all');

  // Form State - Right Column (بيانات المورد)
  const [tradeName, setTradeName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorMobile, setVendorMobile] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('مصر (EG)');
  const [commercialRegistry, setCommercialRegistry] = useState('');
  const [taxCard, setTaxCard] = useState('');
  const [showSecondaryAddress, setShowSecondaryAddress] = useState(false);
  const [contacts, setContacts] = useState<VendorContact[]>([]);

  // Secondary Address fields if checked
  const [secAddress1, setSecAddress1] = useState('');
  const [secAddress2, setSecAddress2] = useState('');
  const [secCity, setSecCity] = useState('');
  const [secRegion, setSecRegion] = useState('');
  const [secZipCode, setSecZipCode] = useState('');
  const [secCountry, setSecCountry] = useState('مصر (EG)');

  // Form State - Left Column (بيانات الحساب)
  const [vendorNumber, setVendorNumber] = useState('');
  const [currency, setCurrency] = useState('EGP جنيه مصري');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [openingBalanceDate, setOpeningBalanceDate] = useState('2026-06-14');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  // Selected Vendor Detail Viewer
  const [viewingDetailVendor, setViewingDetailVendor] = useState<Vendor | null>(null);

  // Load vendors from Supabase
  useEffect(() => {
    const loadVendors = async () => {
      const { data, error } = await supabase.from('purchase_vendors').select('*');
      if (error) {
        console.error("Failed to load vendors", error);
        return;
      }
      const mapped: Vendor[] = (data || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        company: v.company || '',
        phone: v.phone || '',
        email: v.email || '',
        currency: v.currency || 'EGP',
        vendorNumber: v.vendor_number || '',
        firstName: v.first_name || '',
        lastName: v.last_name || '',
        mobile: v.mobile || '',
        address1: v.address1 || '',
        address2: v.address2 || '',
        city: v.city || '',
        region: v.region || '',
        zipCode: v.zip_code || '',
        country: v.country || 'مصر (EG)',
        commercialRegistry: v.commercial_registry || '',
        taxCard: v.tax_card || '',
        openingBalance: Number(v.opening_balance) || 0,
        openingBalanceDate: v.opening_balance_date || '',
        notes: v.notes || '',
        contacts: v.contacts || [],
        secondaryAddress: v.secondary_address || undefined,
        attachments: v.attachments || []
      }));
      setVendors(mapped);
    };
    loadVendors();
  }, [currentMode]);

  const generateNextVendorNumber = () => {
    if (vendors.length === 0) return '000001';
    const lastNum = vendors.reduce((max, v) => {
      const num = parseInt(v.vendorNumber, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return String(lastNum + 1).padStart(6, '0');
  };

  // Turn on "Add" Mode and default values
  const handleOpenAddMode = () => {
    setTradeName('');
    setFirstName('');
    setLastName('');
    setVendorPhone('');
    setVendorMobile('');
    setAddress1('');
    setAddress2('');
    setCity('');
    setRegion('');
    setZipCode('');
    setCountry('مصر (EG)');
    setCommercialRegistry('');
    setTaxCard('');
    setShowSecondaryAddress(false);
    setContacts([]);
    
    // Left side states
    setVendorNumber(generateNextVendorNumber());
    setCurrency('EGP جنيه مصري');
    setOpeningBalance(0);
    setOpeningBalanceDate('2026-06-14');
    setEmail('');
    setNotes('');
    setAttachedFiles([]);
    
    setSelectedVendor(null);
    setCurrentMode('add');
    setViewingDetailVendor(null);
  };

  // Turn on "Edit" Mode
  const handleOpenEditMode = (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVendor(vendor);
    setTradeName(vendor.name);
    setFirstName(vendor.firstName || '');
    setLastName(vendor.lastName || '');
    setVendorPhone(vendor.phone || '');
    setVendorMobile(vendor.mobile || '');
    setAddress1(vendor.address1 || '');
    setAddress2(vendor.address2 || '');
    setCity(vendor.city || '');
    setRegion(vendor.region || '');
    setZipCode(vendor.zipCode || '');
    setCountry(vendor.country || 'مصر (EG)');
    setCommercialRegistry(vendor.commercialRegistry || '');
    setTaxCard(vendor.taxCard || '');
    
    if (vendor.secondaryAddress) {
      setShowSecondaryAddress(true);
      setSecAddress1(vendor.secondaryAddress.address1 || '');
      setSecAddress2(vendor.secondaryAddress.address2 || '');
      setSecCity(vendor.secondaryAddress.city || '');
      setSecRegion(vendor.secondaryAddress.region || '');
      setSecZipCode(vendor.secondaryAddress.zipCode || '');
      setSecCountry(vendor.secondaryAddress.country || 'مصر (EG)');
    } else {
      setShowSecondaryAddress(false);
      setSecAddress1('');
      setSecAddress2('');
      setSecCity('');
      setSecRegion('');
      setSecZipCode('');
      setSecCountry('مصر (EG)');
    }

    setContacts(vendor.contacts || []);
    setVendorNumber(vendor.vendorNumber || generateNextVendorNumber());
    setCurrency(vendor.currency || 'EGP جنيه مصري');
    setOpeningBalance(vendor.openingBalance || 0);
    setOpeningBalanceDate(vendor.openingBalanceDate || '2026-06-14');
    setEmail(vendor.email || '');
    setNotes(vendor.notes || '');
    setAttachedFiles(vendor.attachments || []);

    setCurrentMode('edit');
    setViewingDetailVendor(null);
  };

  // Delete vendor
  const handleDeleteVendor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المورد من السجلات نهائياً؟')) return;
    const { error } = await supabase.from('purchase_vendors').delete().eq('id', id);
    if (error) {
      console.error("Failed to delete vendor", error);
      return;
    }
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  // Save changes via Supabase
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeName.trim()) {
      alert('الرجاء إدخال الاسم التجاري للمورد أولاً.');
      return;
    }

    const secondaryAddrObj = showSecondaryAddress ? {
      address1: secAddress1,
      address2: secAddress2,
      city: secCity,
      region: secRegion,
      zipCode: secZipCode,
      country: secCountry
    } : null;

    const dbPayload: Record<string, any> = {
      name: tradeName.trim(),
      company: firstName || lastName ? `${firstName} ${lastName}`.trim() : tradeName.trim(),
      phone: vendorPhone.trim() || vendorMobile.trim(),
      email: email.trim(),
      currency,
      vendor_number: vendorNumber || generateNextVendorNumber(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      mobile: vendorMobile.trim(),
      address1: address1.trim(),
      address2: address2.trim(),
      city: city.trim(),
      region: region.trim(),
      zip_code: zipCode.trim(),
      country,
      commercial_registry: commercialRegistry.trim(),
      tax_card: taxCard.trim(),
      opening_balance: Number(openingBalance) || 0,
      opening_balance_date: openingBalanceDate,
      notes: notes.trim(),
      contacts: contacts.length ? contacts : null,
      secondary_address: secondaryAddrObj,
      attachments: attachedFiles.length ? attachedFiles : null
    };

    if (currentMode === 'edit' && selectedVendor) {
      const { error } = await supabase.from('purchase_vendors').update(dbPayload).eq('id', selectedVendor.id);
      if (error) {
        console.error("Failed to update vendor", error);
        return;
      }
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, ...dbPayload, id: selectedVendor.id, vendorNumber: dbPayload.vendor_number, firstName: dbPayload.first_name, lastName: dbPayload.last_name, zipCode: dbPayload.zip_code, commercialRegistry: dbPayload.commercial_registry, taxCard: dbPayload.tax_card, openingBalance: dbPayload.opening_balance, openingBalanceDate: dbPayload.opening_balance_date, contacts: contacts, secondaryAddress: secondaryAddrObj || undefined, attachments: attachedFiles } as Vendor : v));
    } else {
      const { data, error } = await supabase.from('purchase_vendors').insert(dbPayload).select().single();
      if (error) {
        console.error("Failed to insert vendor", error);
        return;
      }
      const newVendor: Vendor = {
        id: data.id,
        name: data.name,
        company: data.company || '',
        phone: data.phone || '',
        email: data.email || '',
        currency: data.currency || 'EGP',
        vendorNumber: data.vendor_number || '',
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        mobile: data.mobile || '',
        address1: data.address1 || '',
        address2: data.address2 || '',
        city: data.city || '',
        region: data.region || '',
        zipCode: data.zip_code || '',
        country: data.country || 'مصر (EG)',
        commercialRegistry: data.commercial_registry || '',
        taxCard: data.tax_card || '',
        openingBalance: Number(data.opening_balance) || 0,
        openingBalanceDate: data.opening_balance_date || '',
        notes: data.notes || '',
        contacts: data.contacts || [],
        secondaryAddress: data.secondary_address || undefined,
        attachments: data.attachments || []
      };
      setVendors(prev => [newVendor, ...prev]);
    }

    setCurrentMode('list');
    setSelectedVendor(null);
  };

  const handleAddContactRow = () => {
    setContacts([...contacts, { name: '', position: '', phone: '' }]);
  };

  const handleRemoveContactRow = (index: number) => {
    setContacts(contacts.filter((_, idx) => idx !== index));
  };

  const handleUpdateContactRow = (index: number, field: keyof VendorContact, value: string) => {
    const updated = contacts.map((c, idx) => {
      if (idx === index) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setContacts(updated);
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
      setAttachedFiles([...attachedFiles, ...fileNames]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        fileNames.push(e.target.files[i].name);
      }
      setAttachedFiles([...attachedFiles, ...fileNames]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, idx) => idx !== index));
  };

  // Filters calculation
  const filteredVendors = vendors.filter(v => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchText.toLowerCase()) ||
      v.company.toLowerCase().includes(searchText.toLowerCase()) ||
      v.vendorNumber.includes(searchText) ||
      (v.email && v.email.toLowerCase().includes(searchText.toLowerCase())) ||
      (v.phone && v.phone.includes(searchText));

    const matchesCurrency = activeCurrencyFilter === 'all' || v.currency.includes(activeCurrencyFilter);

    return matchesSearch && matchesCurrency;
  });

  return (
    <div id="purchase-vendors-module" className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 antialiased">
      
      {/* ----------------- MODE: LIST VIEW ----------------- */}
      {currentMode === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Action Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-bold">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setView('dashboard')}>المشتريات</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-extrabold text-[13px]">إدارة الموردين</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:bg-slate-150 px-4 py-2 rounded-lg border border-slate-200 transition-all font-bold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>لوحة التحكم</span>
              </button>
              
              <button
                onClick={handleOpenAddMode}
                className="flex items-center gap-2 bg-[#0074b1] hover:bg-[#005f90] text-white px-4 py-2 rounded-lg transition-all font-bold cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مورد جديد</span>
              </button>
            </div>
          </div>

          {/* Quick stats and intro banner */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 flex-row-reverse text-right">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-800">🏢 دليل شركاء التوريد والموردين</h2>
              <p className="text-xs text-slate-450 font-semibold">تتبع حسابات الموردين، الأرصدة الافتتاحية والمدفوعات الآجلة والعملات المفضلة لتبسيط العمليات الشرائية والتوريدية.</p>
            </div>
            
            {/* Quick search input */}
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="البحث برقم المورد، الاسم والمبيعات..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full text-xs text-right pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#0074b1] focus:border-[#0074b1] rounded-lg transition-all font-semibold outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
            </div>
          </div>

          {/* Table / Layout body */}
          {filteredVendors.length === 0 ? (
            <div className="bg-white p-12 sm:p-20 rounded-xl border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-rose-50 border border-rose-100 text-[#0074b1] rounded-full flex items-center justify-center">
                <Building className="w-12 h-12 text-[#0074b1]/80" />
              </div>
              
              <div className="space-y-2 max-w-lg">
                <h3 className="text-lg font-bold text-slate-705">لا يوجد موردين مضافين بعد</h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  سجل قائمتك الكاملة بشركات التوريد، جهات الاتصال الخاصة بهم، العملات المتداولة للتجارة والتعاقد معهم بسهولة عبر إشعارات المشتريات المستدامة.
                </p>
              </div>

              <button
                onClick={handleOpenAddMode}
                className="px-6 py-2.5 bg-[#0074b1] hover:bg-[#005f90] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-2 flex-row-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مورد الآن</span>
              </button>
            </div>
          ) : (
            /* Suppliers Data Table */
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-550 font-bold border-b border-slate-100 select-none">
                      <th className="p-4 text-right">رقم المورد</th>
                      <th className="p-4">الاسم التجاري للمورد / جهة الاتصال</th>
                      <th className="p-4">الهاتف / المحمول</th>
                      <th className="p-4">البريد الإلكتروني</th>
                      <th className="p-4">العملة المفضلة</th>
                      <th className="p-4 text-left">الرصيد الافتتاحي</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {filteredVendors.map((vendor) => (
                      <tr 
                        key={vendor.id} 
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setViewingDetailVendor(vendor)}
                      >
                        <td className="p-4 font-bold text-[#0074b1] font-mono">#{vendor.vendorNumber}</td>
                        <td className="p-4">
                          <div className="flex flex-col text-right">
                            <span className="font-black text-slate-850 text-[13px]">{vendor.name}</span>
                            {vendor.company && vendor.company !== vendor.name && (
                              <span className="text-[10px] text-slate-400 font-normal">{vendor.company}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-500">{vendor.phone || vendor.mobile || 'غير مسجل'}</td>
                        <td className="p-4 text-slate-500 font-mono text-[11px] select-all">{vendor.email || '—'}</td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-[#0074b1] border border-blue-105 px-2 py-0.5 rounded text-[10px] font-black">
                            {vendor.currency.split(' ')[0]}
                          </span>
                        </td>
                        <td className="p-4 text-left font-mono font-black text-slate-800">
                          {(vendor.openingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setViewingDetailVendor(vendor)}
                            className="p-1 px-2.5 hover:bg-slate-100 text-[#0074b1] border border-slate-150 rounded transition-all font-bold cursor-pointer text-[10px]"
                          >
                            عرض الملف
                          </button>
                          
                          <button
                            onClick={(e) => handleOpenEditMode(vendor, e)}
                            className="p-1 text-slate-500 hover:text-daftra-blue hover:bg-slate-100 border border-transparent hover:border-slate-205 rounded transition-all cursor-pointer"
                            title="تعديل المورد"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteVendor(vendor.id, e)}
                            className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer border border-transparent hover:border-rose-150"
                            title="حذف المورد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ----------------- MODE: VIEW DETAIL PORTRAIT PANEL ----------------- */}
      {viewingDetailVendor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-100 max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Header Details Dialog */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center flex-row-reverse">
              <span className="text-[#0074b1] text-base font-black">الملف الشامل للمورد #{viewingDetailVendor.vendorNumber}</span>
              <button 
                onClick={() => setViewingDetailVendor(null)}
                className="p-1 hover:bg-slate-200 text-slate-400 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile contents */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              
              <div className="flex items-center gap-4 border-b border-slate-105 pb-5 flex-row-reverse">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-[#0074b1] shrink-0">
                  <Building className="w-8 h-8 text-[#0074b1]" />
                </div>
                <div className="space-y-1 block pr-1 leading-normal">
                  <h3 className="text-base font-black text-slate-800">{viewingDetailVendor.name}</h3>
                  <p className="text-slate-400 font-bold">{viewingDetailVendor.company}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-2">
                  <span className="font-extrabold text-slate-500 block border-b border-slate-200/60 pb-1">📞 الاتصال والتراسل</span>
                  <div className="space-y-1 font-semibold text-slate-700">
                    <p className="flex items-center gap-1.5 flex-row-reverse">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>الهاتف الأساسي: <span className="font-mono">{viewingDetailVendor.phone || 'غير مسجل'}</span></span>
                    </p>
                    <p className="flex items-center gap-1.5 flex-row-reverse">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>الجوال / محمول: <span className="font-mono">{viewingDetailVendor.mobile || 'غير مسجل'}</span></span>
                    </p>
                    <p className="flex items-center gap-1.5 flex-row-reverse">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>البريد الإلكتروني: <span className="font-mono">{viewingDetailVendor.email || 'غير مسجل'}</span></span>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-2">
                  <span className="font-extrabold text-slate-500 block border-b border-slate-200/60 pb-1">🪙 الرصيد والماليات</span>
                  <div className="space-y-1 font-semibold text-slate-700">
                    <p>العملة الافتراضية: <span className="font-black text-[#0074b1]">{viewingDetailVendor.currency}</span></p>
                    <p>الرصيد الافتتاحي: <span className="font-black font-mono text-slate-800">{viewingDetailVendor.openingBalance?.toLocaleString()}</span></p>
                    <p>تاريخ قيد الرصيد: <span className="font-mono text-slate-500">{viewingDetailVendor.openingBalanceDate}</span></p>
                  </div>
                </div>

              </div>

              {/* Addresses section */}
              <div className="p-3 bg-slate-50 border border-slate-155 rounded-lg space-y-2">
                <span className="font-extrabold text-slate-500 block border-b border-slate-250 pb-1">📍 العناوين وتفاصيل الشحن</span>
                <div className="grid grid-cols-2 gap-4 text-slate-700 font-semibold">
                  <div>
                    <span className="text-slate-400 block pb-1">العنوان الأساسي:</span>
                    <p>{viewingDetailVendor.address1} {viewingDetailVendor.address2 ? ` - ${viewingDetailVendor.address2}` : ''}</p>
                    <p>{viewingDetailVendor.city} {viewingDetailVendor.region ? `، ${viewingDetailVendor.region}` : ''} {viewingDetailVendor.zipCode ? `، ${viewingDetailVendor.zipCode}` : ''}</p>
                    <p className="font-bold text-slate-500">{viewingDetailVendor.country}</p>
                  </div>
                  
                  {viewingDetailVendor.secondaryAddress && (
                    <div>
                      <span className="text-slate-400 block pb-1">العنوان الثانوي:</span>
                      <p>{viewingDetailVendor.secondaryAddress.address1} {viewingDetailVendor.secondaryAddress.address2 ? ` - ${viewingDetailVendor.secondaryAddress.address2}` : ''}</p>
                      <p>{viewingDetailVendor.secondaryAddress.city} {viewingDetailVendor.secondaryAddress.region ? `، ${viewingDetailVendor.secondaryAddress.region}` : ''}</p>
                      <p className="font-bold text-slate-500">{viewingDetailVendor.secondaryAddress.country}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal identity */}
              {(viewingDetailVendor.commercialRegistry || viewingDetailVendor.taxCard) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded">
                    <span className="text-slate-450 block font-bold">رقم السجل التجاري:</span>
                    <span className="font-mono text-slate-805 font-bold">{viewingDetailVendor.commercialRegistry || 'غير مضاف'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded">
                    <span className="text-slate-450 block font-bold">رقم البطاقة الضريبية:</span>
                    <span className="font-mono text-slate-805 font-bold">{viewingDetailVendor.taxCard || 'غير مضاف'}</span>
                  </div>
                </div>
              )}

              {/* Extra contacts list */}
              {viewingDetailVendor.contacts && viewingDetailVendor.contacts.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-2">
                  <span className="font-extrabold text-slate-500 block border-b border-slate-200 pb-1">👥 جهات الاتصال التفصيلية</span>
                  <div className="divide-y divide-slate-200/75">
                    {viewingDetailVendor.contacts.map((c, index) => (
                      <div key={index} className="py-2 flex justify-between items-center text-[11px] font-bold">
                        <span className="text-slate-800">{c.name} ({c.position})</span>
                        <span className="font-mono text-slate-500">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments list count */}
              {viewingDetailVendor.attachments && viewingDetailVendor.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-slate-450 block font-bold">المستندات والمرفقات الرسمية:</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingDetailVendor.attachments.map((file, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600 font-mono text-[10px]">
                        📄 {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewingDetailVendor.notes && (
                <div className="p-3 bg-orange-50/40 border border-orange-100 rounded text-slate-650">
                  <span className="block font-bold text-orange-800 pb-1">📝 ملاحظات المورد المعمول بها:</span>
                  <p className="leading-relaxed">{viewingDetailVendor.notes}</p>
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between">
              <button
                onClick={() => setViewingDetailVendor(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded cursor-pointer transition-colors"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ----------------- MODE: ADD OR EDIT VENDOR FORM ----------------- */}
      {(currentMode === 'add' || currentMode === 'edit') && (
        <form onSubmit={handleSaveVendor} className="space-y-6 animate-fadeIn">
          
          {/* Form Breadcrumbs Header styled exactly as described */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-205 shadow-xs flex-row-reverse text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-row-reverse text-slate-500 font-extrabold text-[13px]">
              <span className="text-[#0074b1] hover:underline cursor-pointer" onClick={() => setCurrentMode('list')}>الموردين</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-black">
                {currentMode === 'edit' ? 'تعديل بيانات مورد' : 'إضافة'}
              </span>
            </div>

            {/* Actions exactly as Daftra Style: حفظ / إلغاء */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('list');
                  setSelectedVendor(null);
                }}
                className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-row-reverse"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5 flex-row-reverse"
              >
                <CheckCircle className="w-4 h-4" />
                <span>حفظ البيانات</span>
              </button>
            </div>
          </div>

          {/* Form Title banner */}
          <div className="bg-white px-6 py-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between flex-row-reverse">
            <h1 className="text-lg font-black text-[#1a2e40] flex items-center gap-2 flex-row-reverse">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span>إضافة مورد</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-bold hidden sm:block">يرجى ملء البيانات المطلوبة لتوثيق فواتير المشتريات والتوريد بكفاءة.</p>
          </div>

          <div id="vendor-form-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right text-xs">
            
            {/* ====== RIGHT COLUMN: بيانات المورد (7 columns) ====== */}
            <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
              
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-row-reverse">
                <h3 className="font-extrabold text-[#0d385a] text-[13px] flex items-center gap-1 flex-row-reverse">
                  <span>بيانات المورد</span>
                </h3>
                <span className="text-slate-400 text-[10px]">* تعني حقل إلزامي</span>
              </div>

              {/* Trade Name */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-600 block text-right">
                  الاسم التجاري <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="الاسم التجاري للشركة أو مورد السلع"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  required
                  className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] transition-all rounded text-xs font-bold outline-none ring-1 ring-transparent focus:ring-1 focus:ring-[#0074b1]"
                />
              </div>

              {/* First Name & Last Name side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">الاسم الأول</label>
                  <input
                    type="text"
                    placeholder="الاسم الأول للمخول بالاتصال"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">الاسم الأخير</label>
                  <input
                    type="text"
                    placeholder="العائلة"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Phone & Mobile side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">الهاتف</label>
                  <input
                    type="text"
                    placeholder="هاتف المؤسسة الأرضي"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">جوال</label>
                  <input
                    type="text"
                    placeholder="رقم المحمول الشخصي"
                    value={vendorMobile}
                    onChange={(e) => setVendorMobile(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none font-mono"
                  />
                </div>
              </div>

              {/* Address 1 & Address 2 side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">عنوان الشارع 1</label>
                  <input
                    type="text"
                    placeholder="المقر الرئيسي للتوريدات"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">عنوان الشارع 2</label>
                  <input
                    type="text"
                    placeholder="المستودعات أو الفرع البديل"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* City, Region & ZipCode (3 columns) */}
              <div className="grid grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">المدينة</label>
                  <input
                    type="text"
                    placeholder="المدينة"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">المنطقة</label>
                  <input
                    type="text"
                    placeholder="المحافظة"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">الرمز البريدي</label>
                  <input
                    type="text"
                    placeholder="الرمز البريدي"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none font-mono"
                  />
                </div>

              </div>

              {/* Country Picker */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-600 block text-right">البلد</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:bg-white"
                >
                  <option value="مصر (EG)">مصر (EG)</option>
                  <option value="المملكة العربية السعودية (SA)">المملكة العربية السعودية (SA)</option>
                  <option value="الإمارات العربية المتحدة (AE)">الإمارات العربية المتحدة (AE)</option>
                  <option value="الكويت (KW)">الكويت (KW)</option>
                  <option value="قطر (QA)">قطر (QA)</option>
                  <option value="عمان (OM)">عمان (OM)</option>
                </select>
              </div>

              {/* Commercial registry & Tax card side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">سجل تجاري (اختياري)</label>
                  <input
                    type="text"
                    placeholder="رقم السجل التجاري"
                    value={commercialRegistry}
                    onChange={(e) => setCommercialRegistry(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-black text-slate-600 block text-right">بطاقة ضريبية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="الرقم الضريبي الموحد"
                    value={taxCard}
                    onChange={(e) => setTaxCard(e.target.value)}
                    className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold outline-none font-mono"
                  />
                </div>
              </div>

              {/* Checkbox: إضافة عنوان ثانوي */}
              <div className="flex items-center gap-2 flex-row-reverse pt-2">
                <input
                  type="checkbox"
                  id="sec-address-check"
                  checked={showSecondaryAddress}
                  onChange={(e) => setShowSecondaryAddress(e.target.checked)}
                  className="w-4 h-4 text-[#0074b1] rounded border-slate-300 focus:ring-[#0074b1]"
                />
                <label htmlFor="sec-address-check" className="font-bold text-slate-700 cursor-pointer select-none">
                  إضافة عنوان ثانوي للشحن والتسليم
                </label>
              </div>

              {/* Secondary address form fields */}
              {showSecondaryAddress && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 animate-fadeIn">
                  <span className="text-[#0d385a] font-extrabold block">العنوان الثانوي الشحن البديل</span>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="عنوان الشارع البديل 1"
                      value={secAddress1}
                      onChange={(e) => setSecAddress1(e.target.value)}
                      className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="عنوان الشارع البديل 2"
                      value={secAddress2}
                      onChange={(e) => setSecAddress2(e.target.value)}
                      className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="المدينة البديلة"
                      value={secCity}
                      onChange={(e) => setSecCity(e.target.value)}
                      className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="المنطقة / المحافظة"
                      value={secRegion}
                      onChange={(e) => setSecRegion(e.target.value)}
                      className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="الرمز البريدي"
                      value={secZipCode}
                      onChange={(e) => setSecZipCode(e.target.value)}
                      className="w-full text-right p-2 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Add contact person section */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center flex-row-reverse pb-1">
                  <span className="font-extrabold text-[#0d385a]">المخولون بالاتصال والتوريد</span>
                  <button
                    type="button"
                    onClick={handleAddContactRow}
                    className="px-3 py-1.5 bg-blue-50 text-[#0074b1] border border-blue-150 rounded hover:bg-blue-100 flex items-center gap-1 font-bold text-[10px] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة جهة اتصال</span>
                  </button>
                </div>

                {contacts.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold block bg-slate-50 p-2.5 rounded text-center border">
                    لا يوجد جهات اتصال مضافة بعد. اضغط فوق "إضافة جهة اتصال" لإرفاق مندوبين المبيعات والتوريد الخاصين بالمورد.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50/50 p-2.5 rounded border border-slate-200 animate-fadeIn">
                        
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="الاسم الثلاثي"
                            value={contact.name}
                            onChange={(e) => handleUpdateContactRow(idx, 'name', e.target.value)}
                            className="w-full text-right p-2 bg-white border border-slate-200 rounded text-[11px] font-bold"
                          />
                        </div>

                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="المسمى الوظيفي"
                            value={contact.position}
                            onChange={(e) => handleUpdateContactRow(idx, 'position', e.target.value)}
                            className="w-full text-right p-2 bg-white border border-slate-200 rounded text-[11px] font-medium"
                          />
                        </div>

                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="رقم الهاتف"
                            value={contact.phone}
                            onChange={(e) => handleUpdateContactRow(idx, 'phone', e.target.value)}
                            className="w-full text-right p-2 bg-white border border-slate-200 rounded text-[11px] font-mono"
                          />
                        </div>

                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveContactRow(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* ====== LEFT COLUMN: بيانات الحساب (5 columns) ====== */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
              
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-[#0d385a] text-[13px] text-right">بيانات الحساب المالي</h3>
              </div>

              {/* Vendor Number */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-600 block text-right">
                  رقم المورد <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={vendorNumber}
                  onChange={(e) => setVendorNumber(e.target.value)}
                  className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-black font-mono outline-none"
                />
              </div>

              {/* Currency Selector */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-600 block text-right">العملة المفضلة للتسوية</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:bg-white"
                >
                  <option value="EGP جنيه مصري">EGP جنيه مصري</option>
                  <option value="USD دولار أمريكي">USD دولار أمريكي</option>
                  <option value="EUR yoro">EUR يورو</option>
                  <option value="SAR ريال سعودي">SAR ريال سعودي</option>
                  <option value="KWD دينار كويتي">KWD دينار كويتي</option>
                </select>
              </div>

              {/* Opening Balance and Date in single line */}
              <div className="grid grid-cols-2 gap-3 items-center">
                
                <div className="space-y-1.5">
                  <label className="font-black text-[#1a2e40] block">رصيد افتتاحي (ج.م)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={openingBalance || ''}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    className="w-full text-center p-2.5 bg-white border border-slate-200 rounded text-xs font-bold font-mono outline-none focus:border-[#0074b1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-black text-[#1a2e40] block">تاريخ رصيد الافتتاحي</label>
                  <input
                    type="date"
                    value={openingBalanceDate}
                    onChange={(e) => setOpeningBalanceDate(e.target.value)}
                    className="w-full text-center p-2.5 bg-white border border-slate-200 rounded text-xs font-bold font-mono outline-none"
                  />
                </div>

              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-600 block text-right">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="name@supplier-company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-left p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-bold font-mono outline-none"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-600 block text-right">الملاحظات</label>
                <textarea
                  rows={4}
                  placeholder="ملاحظات تنظيمية، شروط السداد المبرمة والآجلة التسهيلية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-right p-2.5 bg-white border border-slate-200 focus:border-[#0074b1] rounded text-xs font-semibold outline-none resize-none leading-relaxed"
                />
              </div>

              {/* File Attachment Drag & Drop Area matching exact visual of the screenshot */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-600 block text-right">المرفقات الرسمية</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 select-none ${isDragging ? 'border-[#0074b1] bg-sky-50/45' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}
                  onClick={() => document.getElementById('vendor-attachments-input')?.click()}
                >
                  <input
                    type="file"
                    id="vendor-attachments-input"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  {/* Attachment Icon */}
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-150 flex items-center justify-center text-slate-400">
                    <UploadCloud className="w-6 h-6 text-[#0074b1]" />
                  </div>

                  <p className="text-xs font-bold text-[#1c2e43]">
                    أفلت الملف هنا أو <span className="text-[#0074b1] underline">اختر من جهازك</span>
                  </p>
                  
                  <span className="text-[10px] text-slate-400 font-semibold block leading-none">مسموح بكافة المستندات حتى 10 ميجابايت</span>
                </div>

                {/* Show attached files list */}
                {attachedFiles.length > 0 && (
                  <div className="mt-3 bg-slate-50 border border-slate-150 rounded p-2 divide-y divide-slate-200">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between items-center text-[11px] font-semibold text-slate-700">
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[10px] text-slate-600 max-w-[80%] truncate select-all">{file}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </form>
      )}

    </div>
  );
}
