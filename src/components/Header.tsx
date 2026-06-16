/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Bell,
  HelpCircle,
  ExternalLink,
  Menu,
  ChevronRight,
  Store,
  User,
  Activity,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  setView: (view: string) => void;
  toggleSidebar: () => void;
  currentUser: { username: string; name: string; role: 'admin' | 'accountant' | 'sales' | 'inventory' };
  onLogout: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'المدير العام',
  accountant: 'المحاسب',
  sales: 'مسؤول المبيعات',
  inventory: 'أمين المخزن',
};

export default function Header({ currentView, setView, toggleSidebar, currentUser, onLogout }: HeaderProps) {
  // Turn view keys into beautiful Arabic breadcrumbs corresponding to Daftra UI
  const getBreadcrumbs = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span className="font-bold">لوحة التحكم السريعة</span>
          </div>
        );
      case 'create-invoice':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span className="opacity-80 hover:underline cursor-pointer" onClick={() => setView('manage-invoices')}>الفواتير</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-white text-[13px]">إنشاء فاتورة جديدة</span>
          </div>
        );
      case 'manage-invoices':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المبيعات</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">إدارة الفواتير</span>
          </div>
        );
      case 'add-client':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span className="opacity-80 hover:underline cursor-pointer" onClick={() => setView('manage-clients')}>العملاء</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-white text-[13px]">أضف عميل</span>
          </div>
        );
      case 'manage-clients':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>العملاء</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">إدارة العملاء</span>
          </div>
        );
      case 'products-services':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المخزون</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">المنتجات والخدمات</span>
          </div>
        );
      case 'inventory-vouchers':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المخزون</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">الأذون المخزنية</span>
          </div>
        );
      case 'client-settings':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>العملاء</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">إعدادات العملاء</span>
          </div>
        );
      case 'returned-invoices':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المبيعات</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">الفواتير المرتجعة</span>
          </div>
        );
      case 'customer-payments':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المبيعات</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">مدفوعات العملاء</span>
          </div>
        );
      case 'sales-settings':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المبيعات</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">إعدادات المبيعات</span>
          </div>
        );
      case 'purchase-invoices':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المشتريات</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">فواتير الشراء</span>
          </div>
        );
      case 'purchase-returns':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المشتريات</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">مرتجعات المشتريات</span>
          </div>
        );
      case 'purchase-vendors':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المشتريات</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">إدارة الموردين</span>
          </div>
        );
      case 'purchase-vendor-payments':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المشتريات</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">مدفوعات الموردين</span>
          </div>
        );
      case 'finance-expenses':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المالية</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">المصروفات</span>
          </div>
        );
      case 'finance-receipt-vouchers':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المالية</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">سندات القبض</span>
          </div>
        );
      case 'finance-bank-cash-safes':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المالية</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">خزائن وحسابات بنكية</span>
          </div>
        );
      case 'accounts-chart':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>الحسابات العامة</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">دليل الحسابات</span>
          </div>
        );
      case 'report-unified':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>التقارير</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">التقرير الشامل</span>
          </div>
        );
      case 'warehouses':
        return (
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/95">
            <span>المخزون</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="font-bold">المستودعات</span>
          </div>
        );
      default:
        return <span className="font-bold text-white">دفتره ERP</span>;
    }
  };

  return (
    <header
      id="daftra-header"
      className="bg-daftra-blue text-white h-[60px] fixed top-0 left-0 right-0 lg:right-72 z-30 flex items-center justify-between px-0 shadow-md select-none"
    >
      {/* 1. Right portion: Sidebar Collapse Toggle & breadcrumbs (rendered first, aligns to the right next to the white sidebar) */}
      <div className="flex h-full items-center">
        <button
          onClick={toggleSidebar}
          className="lg:hidden h-[60px] w-[60px] hover:bg-white/10 flex items-center justify-center text-white cursor-pointer transition-colors shrink-0"
          aria-label="تبديل القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs - only show for sub-pages, hide on mobile/tablet to save space */}
        {currentView !== 'dashboard' && (
          <div className="hidden sm:flex items-center px-4 select-none">
            {getBreadcrumbs()}
          </div>
        )}
      </div>

      {/* 2. Left portion: Shortcuts, Assistance, and Profile (rendered second, aligns to the left corner) */}
      <div className="flex items-center gap-1 sm:gap-4 h-full pl-4 text-xs font-semibold">
        {/* Notification bell */}
        <button
          onClick={() => alert('إشعارات النظام: تم تفعيل باقة دفتره السحابية بنجاح لمؤسستكم.')}
          className="relative p-2 rounded hover:bg-white/10 cursor-pointer transition-colors text-white"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 left-1.5 w-4 h-4 bg-rose-500 rounded-full text-[9px] grid place-items-center font-bold text-white ring-2 ring-[#0074b1]">
            1
          </span>
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-white/20 hidden md:block" />

        {/* Profile Card Block */}
        <div className="flex items-center gap-2 pr-2 select-none">
          {/* Letter Pink badge */}
          <div className="w-[34px] h-[34px] rounded bg-[#e81954] text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:bg-[#d61047] transition-colors text-sm font-sans shrink-0">
            {currentUser.name.charAt(0)}
          </div>

          {/* Text labels - hidden on mobile/tablet to avoid overflow and wrapping */}
          <div className="hidden md:flex flex-col text-right items-end whitespace-nowrap">
            <span className="font-extrabold text-[#ffffff] text-[13px] leading-tight cursor-pointer hover:underline">{currentUser.name}</span>
            <span className="text-[10px] text-white/70">{roleLabels[currentUser.role] || 'Main Branch'}</span>
          </div>

          {/* Down Chevron triangle */}
          <span className="hidden md:inline text-[8px] text-white/80 select-none cursor-pointer pl-1">▼</span>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="p-2 rounded hover:bg-white/10 cursor-pointer transition-colors text-white"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
