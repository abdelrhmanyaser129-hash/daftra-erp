/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search,
  Plus,
  Users,
  FileText,
  Calendar,
  ChevronRight,
  TrendingUp,
  Heart,
  ChevronLeft,
  ExternalLink,
  Info,
  CalendarDays,
  FilePlus,
  ArrowRightLeft,
} from 'lucide-react';
import { Invoice, Client } from '../types';

interface DashboardViewProps {
  setView: (view: string) => void;
}

export default function DashboardView({
  setView
}: DashboardViewProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: invData } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (invData) setInvoices(invData);
    const { data: clData } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (clData) setClients(clData);
  };
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [clientQuery, setClientQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'invoices' | 'latest_invoices' | 'profit_loss' | 'overdue'>('invoices');

  const handleInvoiceSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setView('manage-invoices');
  };

  const handleClientSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setView('manage-clients');
  };

  // Compute stats for visualization
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
  const totalReceived = paidInvoices.reduce((acc, current) => acc + current.total, 0);
  const totalOverdue = overdueInvoices.reduce((acc, current) => acc + current.total, 0);

  // Today's formatted date matching screenshot "05/06/2026"
  const formattedToday = "05/06/2026";

  return (
    <div id="daftra-dashboard" className="max-w-6xl mx-auto space-y-6">
      
      {/* 1. Styled Header with centered greeting */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 bg-transparent pt-3 pb-1 select-none">
        {/* Centered aspects: Dates and personalized welcome banner */}
        <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
          <div className="text-[13px] text-slate-500 font-bold mb-1 tracking-wider">{formattedToday}</div>
          <h2 className="text-xl sm:text-[23px] font-extrabold text-[#2a3a4c] tracking-tight">
            أهلاً <span className="text-[#337ab7]">Abdo Yaser</span>، مرحباً بعودتك!
          </h2>
        </div>
      </div>

      {/* 2. Centered Welcome informational banner with blue heart */}
      <div className="bg-white rounded border border-[#dae3ec] shadow-xs p-6 sm:p-8 transition-all hover:shadow-md">
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          {/* Main big title */}
          <h3 className="text-[25px] font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2 font-sans">
            <span>مرحباً Abdo 💙</span>
          </h3>
          
          {/* Clean custom readable text containing high-contrast light blue blocks */}
          <p className="text-[13.5px] leading-[2.1] text-[#4a5568] font-medium text-center">
            يدعم برنامج دفترة العديد من الميزات والتطبيقات وإمكانية تخصيصه حسب مجال عملك وذلك من خلال تفعيل المزيد من التطبيقات في{' '}
            <span className="inline-block text-xs font-bold text-white bg-[#00b0f0] px-2.5 py-[1.5px] rounded-sm cursor-pointer hover:bg-[#009cd6] mx-0.5" onClick={() => alert('إدارة التطبيقات السحابية')}>
              إدارة التطبيقات
            </span>{' '}
            والتحكم في ألوان النظام ليناسب شعار علامتك التجارية في{' '}
            <span className="inline-block text-xs font-bold text-white bg-[#00b0f0] px-2.5 py-[1.5px] rounded-sm cursor-pointer hover:bg-[#009cd6] mx-0.5" onClick={() => alert('إعدادات ألوان المظهر')}>
              إعدادات شعار وألوان المظهر
            </span>{' '}
            بالإضافة إلى إمكانية التحكم في شكل وحجم المطبوعات والفواتير في{' '}
            <span className="inline-block text-xs font-bold text-white bg-[#00b0f0] px-2.5 py-[1.5px] rounded-sm cursor-pointer hover:bg-[#009cd6] mx-0.5" onClick={() => alert('تعديل قوالب الفواتير')}>
              إدارة القوالب
            </span>{' '}
            وإمكانية تعديل{' '}
            <span className="inline-block text-xs font-bold text-white bg-[#00b0f0] px-2.5 py-[1.5px] rounded-sm cursor-pointer hover:bg-[#009cd6] mx-0.5" onClick={() => alert('الإعدادات العامة لمؤسستك')}>
              الإعدادات العامة
            </span>{' '}
            وكذلك إعدادات التطبيق المطلوب عبر القائمة الخاصة به.
          </p>

          <div className="text-[13px] text-[#5b6e7f] flex flex-wrap items-center justify-center gap-1 bg-slate-50/50 py-3 rounded-md">
            <span>سعداء لتقديم المساعدة إليك في رفع مستوى إدارة أعمالك من خلال</span>
            <span 
              className="text-white bg-[#00b0f0] font-bold px-3 py-[2px] rounded cursor-pointer hover:bg-[#0092c7]"
              onClick={() => alert('محادثة حرة مع فريق الدعم المباشر لدفتره')}
            >
              فريق الدعم
            </span>
            <span>لدينا.</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Search Section - With high similarity to Daftra input cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search for Customers */}
        <form onSubmit={handleClientSearch} className="bg-white rounded border border-[#d3dfeb] h-[48px] px-4 flex items-center transition-all focus-within:border-sky-500">
          <button type="button" className="text-slate-400 font-extrabold text-[12.5px] hover:text-daftra-blue border-e border-slate-100 pe-3">
            بحث
          </button>
          <input
            type="text"
            placeholder="البحث عن العملاء"
            value={clientQuery}
            onChange={(e) => setClientQuery(e.target.value)}
            className="w-full bg-transparent text-sm border-none focus:outline-none placeholder-slate-400 text-right pr-4 pl-2"
          />
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
        </form>

        {/* Search for Invoices */}
        <form onSubmit={handleInvoiceSearch} className="bg-white rounded border border-[#d3dfeb] h-[48px] px-4 flex items-center transition-all focus-within:border-sky-500">
          <button type="button" className="text-slate-400 font-extrabold text-[12.5px] hover:text-daftra-blue border-e border-slate-100 pe-3">
            بحث
          </button>
          <input
            type="text"
            placeholder="البحث عن الفواتير"
            value={invoiceQuery}
            onChange={(e) => setInvoiceQuery(e.target.value)}
            className="w-full bg-transparent text-sm border-none focus:outline-none placeholder-slate-400 text-right pr-4 pl-2"
          />
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
        </form>
      </div>

      {/* 4. Quick Action Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Create Invoice */}
        <button
          onClick={() => setView('create-invoice')}
          className="bg-white hover:bg-slate-50 border border-[#dae4f0] rounded p-6 flex flex-col items-center justify-center text-center gap-3 transition-all hover:shadow cursor-pointer select-none group"
        >
          <FilePlus className="w-8 h-8 text-[#1d9cf9]" />
          <span className="text-[13px] font-extrabold text-slate-700 group-hover:text-daftra-blue">إنشاء فاتورة</span>
        </button>


        {/* Invoices List */}
        <button
          onClick={() => setView('manage-invoices')}
          className="bg-white hover:bg-slate-50 border border-[#dae4f0] rounded p-6 flex flex-col items-center justify-center text-center gap-3 transition-all hover:shadow cursor-pointer select-none"
        >
          <FileText className="w-8 h-8 text-[#13c2c2]" />
          <span className="text-[13px] font-extrabold text-slate-700">الفواتير</span>
        </button>

        {/* Clients list */}
        <button
          onClick={() => setView('manage-clients')}
          className="bg-white hover:bg-slate-50 border border-[#dae4f0] rounded p-6 flex flex-col items-center justify-center text-center gap-3 transition-all hover:shadow cursor-pointer select-none"
        >
          <Users className="w-8 h-8 text-[#52c41a]" />
          <span className="text-[13px] font-extrabold text-slate-700">العملاء</span>
        </button>

        {/* New Client */}
        <button
          onClick={() => setView('add-client')}
          className="bg-white hover:bg-slate-50 border border-[#dae4f0] rounded p-6 flex flex-col items-center justify-center text-center gap-3 transition-all hover:shadow cursor-pointer select-none group"
        >
          <Plus className="w-8 h-8 text-[#0074b1] hover:scale-105 transition-transform" />
          <span className="text-[13px] font-extrabold text-slate-700">عميل جديد</span>
        </button>
      </div>

      {/* 5. Sales Data Tabs & Charts Panel */}
      <div className="bg-white rounded border border-[#dae4f0] overflow-hidden shadow-xs">
        {/* Module Title & Tab List Alignment */}
        <div className="border-b border-[#dae3ec] px-5 py-3.5 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-daftra-blue" />
            <h4 className="text-[16px] font-extrabold text-slate-800">المبيعات</h4>
          </div>

          <div className="flex flex-wrap gap-1 items-center">
            <button
              onClick={() => setCurrentTab('invoices')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'invoices'
                  ? 'bg-daftra-light-blue text-daftra-blue border border-[#ccdbe8]'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>الفواتير</span>
            </button>
            
            <button
              onClick={() => setCurrentTab('profit_loss')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'profit_loss'
                  ? 'bg-daftra-light-blue text-daftra-blue border border-[#ccdbe8]'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>الربح والخسارة</span>
            </button>

            <button
              onClick={() => setCurrentTab('latest_invoices')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'latest_invoices'
                  ? 'bg-daftra-light-blue text-daftra-blue border border-[#ccdbe8]'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>أحدث الفواتير ({invoices.length})</span>
            </button>

            <button
              onClick={() => setCurrentTab('overdue')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'overdue'
                  ? 'bg-[#ffebee] text-[#c62828] border border-[#ffccd2]'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-rose-600" />
              <span>فواتير متأخرة عن الدفع ({overdueInvoices.length})</span>
            </button>
          </div>
        </div>

        {/* Calendar details bar under tabs */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>الفواتير من <span className="font-mono text-daftra-blue">05/06/2025</span> إلى <span className="font-mono text-daftra-blue">05/06/2026</span></span>
          </div>
          <button
            onClick={() => setView('manage-invoices')}
            className="text-xs text-white bg-daftra-blue hover:bg-[#006296] px-3 py-1.5 rounded font-bold transition-colors shadow-sm cursor-pointer"
          >
            التفاصيل
          </button>
        </div>

        {/* Charts area container - matching the screenshot exactly */}
        <div className="p-5 sm:p-6 bg-slate-50/20">
          {currentTab === 'invoices' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Visual Circular Classification Chart */}
              <div className="lg:col-span-4 bg-white border border-daftra-border rounded-lg p-4 flex flex-col justify-between shadow-sm min-h-[280px]">
                <div className="text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">تحليل الفواتير</div>
                
                {/* Simulated SVG Pie Chart conforming exactly to the pie visual and message */}
                <div className="relative flex-1 flex flex-col items-center justify-center my-4">
                  <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto transform rotate-90 antialiased">
                    {/* Ring background */}
                    <circle cx="100" cy="100" r="75" fill="none" stroke="#e9eff4" strokeWidth="18" />
                    
                    {/* Ring slices */}
                    <circle cx="100" cy="100" r="75" fill="none" stroke="#38bdf8" strokeWidth="18" strokeDasharray="471" strokeDashoffset="120" strokeLinecap="round" className="opacity-80" />
                    <circle cx="100" cy="100" r="75" fill="none" stroke="#f43f5e" strokeWidth="18" strokeDasharray="471" strokeDashoffset="420" strokeLinecap="round" className="opacity-90" />
                    <circle cx="100" cy="100" r="75" fill="none" stroke="#eab308" strokeWidth="18" strokeDasharray="471" strokeDashoffset="340" strokeLinecap="round" className="opacity-80" />
                    
                    {/* Heart centered detail circle overlay */}
                    <circle cx="100" cy="100" r="50" fill="#ffffff" />
                  </svg>
                  
                  {/* Central Text label overlay: "لا توجد بيانات متاحة" but elegantly styled */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center top-4">
                    <span className="text-xs font-bold text-slate-400 select-none">لا توجد بيانات متاحة</span>
                    <span className="text-[10px] text-slate-300 font-mono mt-1">EGP 0.00</span>
                  </div>
                </div>

                <div className="flex justify-around items-center text-[11px] font-bold text-slate-600 bg-slate-50 py-2 rounded">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>مدفوعة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>متأخرة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>مسودة</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Linear Area Graph */}
              <div className="lg:col-span-8 bg-white border border-daftra-border rounded-lg p-5 flex flex-col justify-between shadow-sm min-h-[280px]">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">توزيع المبيعات شهرياً</span>
                  <span className="text-[10px] font-bold text-sky-600 font-mono">جم</span>
                </div>

                {/* Simulated SVG Area Chart */}
                <div className="relative flex-1 flex flex-col justify-end mt-4 h-48 select-none">
                  {/* Grid background lines */}
                  <div className="absolute inset-x-0 top-0 h-40 border-b border-dashed border-slate-100" />
                  <div className="absolute inset-x-0 top-1/4 h-30 border-b border-dashed border-slate-100" />
                  <div className="absolute inset-x-0 top-2/4 h-20 border-b border-dashed border-slate-100" />
                  <div className="absolute inset-x-0 top-3/4 h-10 border-b border-dashed border-slate-100" />

                  {/* Gradient Area Polygon */}
                  <svg viewBox="0 0 500 150" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path d="M 0 150 L 50 130 L 100 120 L 150 140 L 200 90 L 250 110 L 300 80 L 350 40 L 400 95 L 450 125 L 500 150 Z" fill="url(#areaGrad)" />
                    {/* Border stroke path */}
                    <path d="M 0 150 L 50 130 L 100 120 L 150 140 L 200 90 L 250 110 L 300 80 L 350 40 L 400 95 L 450 125 L 500 150" fill="none" stroke="#0074b1" strokeWidth="2.5" />
                  </svg>

                  {/* Central Text label overlay matching "لا توجد بيانات متاحة" exactly */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/45 backdrop-blur-[1px] px-4 py-2 rounded-full border border-slate-100/40 shadow-xs">
                      <span className="text-xs font-bold text-slate-500">لا توجد بيانات متاحة</span>
                    </div>
                  </div>
                  
                  {/* Bottom Months Labels */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2 border-t border-slate-100 pt-1 font-mono">
                    <span>يونيو 25</span>
                    <span>سبتمبر 25</span>
                    <span>ديسمبر 25</span>
                    <span>مارس 26</span>
                    <span>يونيو 26</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'latest_invoices' && (
            <div className="bg-white border border-daftra-border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-daftra-border font-bold text-slate-600">
                    <tr>
                      <th className="p-3">رقم الفاتورة</th>
                      <th className="p-3">العميل</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">الإجمالي (ج.م)</th>
                      <th className="p-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-daftra-blue">#{inv.invoiceNumber}</td>
                        <td className="p-3 font-semibold">{inv.clientName}</td>
                        <td className="p-3 font-mono text-slate-500">{inv.date}</td>
                        <td className="p-3 font-mono font-bold">{inv.total.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                            inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'overdue' ? 'متأخرة' : 'مسودة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'profit_loss' && (
            <div className="bg-white border border-daftra-border rounded-lg p-6 shadow-sm flex flex-col justify-between items-center text-center min-h-[220px]">
              <div className="space-y-2 mt-4">
                <div className="text-xs font-bold text-slate-400">ملخص التدفق النقدي</div>
                <h5 className="text-lg font-bold text-slate-700">لا توجد بيانات كافية حالياً لإبداء تقرير الأرباح والخسائر</h5>
                <p className="text-xs text-slate-400 max-w-sm leading-normal">
                  يرجى توليد المزيد من الفواتير المعمرة وإصدار سندات صرف وتسجيل المصروفات في القائمة السحابية لتشغيل تقرير الأرباح.
                </p>
              </div>
              <div className="flex justify-center gap-6 text-sm font-bold mt-4 font-mono w-full max-w-md border-t border-slate-100 pt-4">
                <div>
                  <div className="text-[10px] text-slate-400">إجمالي المداخيل</div>
                  <div className="text-emerald-600 mt-0.5">{totalReceived.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <div className="text-[10px] text-slate-400">المصاريف المسجلة</div>
                  <div className="text-rose-500 mt-0.5">0 ج.م</div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <div className="text-[10px] text-slate-400">صافي الأرباح</div>
                  <div className="text-daftra-blue mt-0.5">{totalReceived.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'overdue' && (
            <div className="bg-white border border-daftra-border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-red-50/50 border-b border-red-100 font-bold text-rose-700">
                    <tr>
                      <th className="p-3">رقم الفاتورة</th>
                      <th className="p-3">العميل</th>
                      <th className="p-3">تاريخ الاستحقاق</th>
                      <th className="p-3">القيمة المطلوبة (ج.م)</th>
                      <th className="p-3">المتبقي للتحصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueInvoices.length > 0 ? (
                      overdueInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-rose-600">#{inv.invoiceNumber}</td>
                          <td className="p-3 font-semibold">{inv.clientName}</td>
                          <td className="p-3 font-mono text-rose-500">{inv.date}</td>
                          <td className="p-3 font-mono font-bold text-rose-700">{inv.total.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</td>
                          <td className="p-3 font-mono font-semibold text-rose-600">{inv.total.toLocaleString('ar-EG', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ج.م</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-bold text-sm">
                          ممتاز! لا توجد فواتير متأخرة عن البيع أو التحصيل حالياً.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
