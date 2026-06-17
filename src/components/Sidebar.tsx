/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Users,
  Compass,
  Home,
  FileText,
  Package,
  Truck,
  Landmark,
  BookOpen,
  BarChart3,
  Search
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  userRole: 'admin' | 'accountant' | 'sales' | 'inventory';
  onLogout: () => void;
}

export default function Sidebar({ currentView, setView, isOpen, toggleSidebar, userRole, onLogout }: SidebarProps) {
  // Role-based section visibility helper
  const isSectionVisible = (section: string): boolean => {
    if (userRole === 'admin') return true;
    const rolePermissions: Record<string, string[]> = {
      accountant: ['dashboard', 'sales', 'customers', 'finance', 'generalAccounts', 'reports'],
      sales: ['dashboard', 'sales', 'customers'],
      inventory: ['dashboard', 'inventory'],
    };
    return rolePermissions[userRole]?.includes(section) ?? false;
  };
  // Local state to manage expanded accordion menu categories
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    sales: true, // sales is expanded by default as in screenshot
    customers: false,
    pos: false,
    inventory: false,
    purchases: false,
    finance: false,
    generalAccounts: false,
    reports: false,
  });

  const toggleSubMenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const handleMenuClick = (view: string) => {
    setView(view);
    // On small screens, auto-close sidebar when clicking link
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  // Check if a view is active
  const isViewActive = (viewName: string) => currentView === viewName;

  return (
    <aside
      id="daftra-sidebar"
      className={`fixed top-0 right-0 z-50 h-screen w-72 bg-white text-[#2a3a4c] border-l border-daftra-border shadow-md flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top Brand Block - Matching Screenshot White Header */}
      <div className="h-[60px] bg-white text-slate-800 flex items-center justify-between px-6 border-b border-[#e9eff4] select-none">
        <h2 className="text-lg font-extrabold text-[#2a3a4c] tracking-tight">عبدالرحمن</h2>
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-md"
          aria-label="إغلاق القائمة"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Scrollable Area */}
      <div className="flex-1 overflow-y-auto text-[13px]">
        {/* Core Items */}
        <div className="divide-y divide-slate-100">
          
          {/* Dashboard (لوحة التحكم) */}
          <button
            onClick={() => handleMenuClick('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
              isViewActive('dashboard')
                ? 'bg-daftra-light-blue text-daftra-blue font-bold border-r-[4px] border-daftra-blue'
                : 'hover:bg-slate-50/50 text-[#3b5166]'
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
            <span className="flex-1 text-right pr-3 font-semibold">لوحة التحكم</span>
            <Home className="w-4.5 h-4.5 text-slate-400" />
          </button>

          {/* Sales (المبيعات) - Expandable */}
          {isSectionVisible('sales') && <div>
            <button
              onClick={() => toggleSubMenu('sales')}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                expandedMenus.sales ? 'bg-slate-50/50 text-daftra-blue font-bold' : 'text-[#3b5166] hover:bg-slate-50/50'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  expandedMenus.sales ? 'rotate-180 text-daftra-blue' : ''
                }`}
              />
              <span className="flex-1 text-right pr-3 font-semibold">المبيعات</span>
              <FileText className="w-4.5 h-4.5 text-slate-400" />
            </button>

            {/* Sales Sub-menu */}
            <div
              className={`bg-slate-50/40 border-r border-slate-200 overflow-hidden transition-all duration-300 space-y-0.5 ${
                expandedMenus.sales ? 'max-h-96 py-1 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={() => handleMenuClick('manage-invoices')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('manage-invoices') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                إدارة الفواتير
              </button>
              <button
                onClick={() => handleMenuClick('create-invoice')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('create-invoice') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                إنشاء فاتورة
              </button>
              <button
                onClick={() => handleMenuClick('returned-invoices')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('returned-invoices') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                الفواتير المرتجعة
              </button>
              <button
                onClick={() => handleMenuClick('customer-payments')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('customer-payments') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                مدفوعات العملاء
              </button>
              <button
                onClick={() => handleMenuClick('sales-settings')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('sales-settings') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                إعدادات المبيعات
              </button>
            </div>
          </div>}
          {/* Customers (العملاء) */}
          {isSectionVisible('customers') && <div>
            <button
              onClick={() => toggleSubMenu('customers')}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                expandedMenus.customers ? 'bg-slate-50/50 text-daftra-blue font-bold' : 'text-[#3b5166] hover:bg-slate-50/50'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  expandedMenus.customers ? 'rotate-180 text-daftra-blue' : ''
                }`}
              />
              <span className="flex-1 text-right pr-3 font-semibold">العملاء</span>
              <Users className="w-4.5 h-4.5 text-slate-400" />
            </button>

            {/* Customers Submenu */}
            <div
              className={`bg-slate-50/40 border-r border-slate-200 overflow-hidden transition-all duration-300 space-y-0.5 ${
                expandedMenus.customers ? 'max-h-96 py-1 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={() => handleMenuClick('manage-clients')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('manage-clients') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                إدارة العملاء
              </button>
              <button
                onClick={() => handleMenuClick('add-client')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('add-client') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                إضافة عميل جديد
              </button>
              <button
                onClick={() => handleMenuClick('client-settings')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('client-settings') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                إعدادات العملاء
              </button>
            </div>
          </div>}

          {/* Inventory (المخزون) */}
          {isSectionVisible('inventory') && <div>
            <button
              onClick={() => toggleSubMenu('inventory')}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                expandedMenus.inventory ? 'bg-slate-50/50 text-daftra-blue font-bold' : 'text-[#3b5166] hover:bg-slate-50/50'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  expandedMenus.inventory ? 'rotate-180 text-daftra-blue' : ''
                }`}
              />
              <span className="flex-1 text-right pr-3 font-semibold">المخزون</span>
              <Package className="w-4.5 h-4.5 text-slate-400" />
            </button>

            {/* Inventory Submenu */}
            <div
              className={`bg-slate-50/40 border-r border-[#e9eff4] overflow-hidden transition-all duration-300 space-y-0.5 ${
                expandedMenus.inventory ? 'max-h-[350px] py-1 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={() => handleMenuClick('products-services')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('products-services') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                المنتجات والخدمات
              </button>
              <button
                onClick={() => handleMenuClick('inventory-vouchers')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('inventory-vouchers') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                إدارة الإذن المخزنية
              </button>
              <button
                onClick={() => handleMenuClick('warehouses')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('warehouses') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                المستودعات
              </button>
              <button
                onClick={() => handleMenuClick('composite-products')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('composite-products') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                المنتجات المركبة
              </button>

            </div>
          </div>}

          {/* Purchases (المشتريات) */}
          {isSectionVisible('purchases') && <div>
            <button
              onClick={() => toggleSubMenu('purchases')}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                expandedMenus.purchases ? 'bg-slate-50/50 text-daftra-blue font-bold' : 'text-[#3b5166] hover:bg-slate-50/50'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  expandedMenus.purchases ? 'rotate-180 text-daftra-blue' : ''
                }`}
              />
              <span className="flex-1 text-right pr-3 font-semibold">المشتريات</span>
              <Truck className="w-4.5 h-4.5 text-slate-400" />
            </button>

            {/* Purchases Submenu */}
            <div
              className={`bg-slate-50/40 border-r border-[#e9eff4] overflow-hidden transition-all duration-300 space-y-0.5 ${
                expandedMenus.purchases ? 'max-h-[450px] py-1 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={() => handleMenuClick('purchase-invoices')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('purchase-invoices') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                فواتير الشراء
              </button>
              <button
                onClick={() => handleMenuClick('purchase-returns')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('purchase-returns') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                مرتجعات المشتريات
              </button>
              <button
                onClick={() => handleMenuClick('purchase-vendors')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('purchase-vendors') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                إدارة الموردين
              </button>
              <button
                onClick={() => handleMenuClick('purchase-vendor-payments')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('purchase-vendor-payments') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                مدفوعات الموردين
              </button>
              <button
                onClick={() => handleMenuClick('supplier-statement')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('supplier-statement') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                كشف حساب المورد
              </button>
            </div>
          </div>}

          {/* Finance (المالية) */}
          {isSectionVisible('finance') && <div>
            <button
              onClick={() => toggleSubMenu('finance')}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                expandedMenus.finance ? 'bg-slate-50/50 text-daftra-blue font-bold' : 'text-[#3b5166] hover:bg-slate-50/50'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  expandedMenus.finance ? 'rotate-180 text-daftra-blue' : ''
                }`}
              />
              <span className="flex-1 text-right pr-3 font-semibold">المالية</span>
              <Landmark className="w-4.5 h-4.5 text-slate-400" />
            </button>

            {/* Finance Submenu */}
            <div
              className={`bg-slate-50/40 border-r border-[#e9eff4] overflow-hidden transition-all duration-300 space-y-0.5 ${
                expandedMenus.finance ? 'max-h-[350px] py-1 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={() => handleMenuClick('finance-expenses')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('finance-expenses') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                المصروفات
              </button>
              <button
                onClick={() => handleMenuClick('finance-receipt-vouchers')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('finance-receipt-vouchers') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                سندات القبض
              </button>
              <button
                onClick={() => handleMenuClick('finance-bank-cash-safes')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('finance-bank-cash-safes') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                خزائن وحسابات بنكية
              </button>

            </div>
          </div>}

          {/* General Accounts (الحسابات العامة) */}
          {isSectionVisible('generalAccounts') && <div>
            <button
              onClick={() => toggleSubMenu('generalAccounts')}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                expandedMenus.generalAccounts ? 'bg-slate-50/50 text-daftra-blue font-bold' : 'text-[#3b5166] hover:bg-slate-50/50'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  expandedMenus.generalAccounts ? 'rotate-180 text-daftra-blue' : ''
                }`}
              />
              <span className="flex-1 text-right pr-3 font-semibold">الحسابات العامة</span>
              <BookOpen className="w-4.5 h-4.5 text-slate-400" />
            </button>

            {/* General Accounts Submenu */}
            <div
              className={`bg-slate-50/40 border-r border-[#e9eff4] overflow-hidden transition-all duration-300 space-y-0.5 ${
                expandedMenus.generalAccounts ? 'max-h-[150px] py-1 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={() => handleMenuClick('accounts-chart')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('accounts-chart') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                دليل الحسابات
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => handleMenuClick('user-management')}
                  className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                    isViewActive('user-management') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                  }`}
                >
                  الإعدادات
                </button>
              )}
            </div>
          </div>}

          {/* Reports (التقارير) */}
          {isSectionVisible('reports') && <div>
            <button
              onClick={() => toggleSubMenu('reports')}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                expandedMenus.reports ? 'bg-slate-50/50 text-daftra-blue font-bold' : 'text-[#3b5166] hover:bg-slate-50/50'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  expandedMenus.reports ? 'rotate-180 text-daftra-blue' : ''
                }`}
              />
              <span className="flex-1 text-right pr-3 font-semibold">التقارير</span>
              <BarChart3 className="w-4.5 h-4.5 text-slate-400" />
            </button>

            {/* Reports Submenu */}
            <div
              className={`bg-slate-50/40 border-r border-[#e9eff4] overflow-hidden transition-all duration-300 space-y-0.5 ${
                expandedMenus.reports ? 'max-h-[150px] py-1 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={() => handleMenuClick('report-unified')}
                className={`w-full text-right pr-12 pl-4 py-2 text-xs transition-all ${
                  isViewActive('report-unified') ? 'text-daftra-blue font-bold bg-daftra-light-blue/60 border-r-2 border-daftra-blue' : 'text-slate-600 hover:text-daftra-blue hover:bg-slate-50'
                }`}
              >
                التقرير الشامل الموحد والربحية 📊
              </button>
            </div>
          </div>}
        </div>
      </div>

      {/* Footer Logout Block */}
      <div className="p-3 border-t border-daftra-border bg-slate-50 flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>تسجيل الخروج</span>
        </button>
        <span className="font-mono text-[10px]">V3.82.0</span>
      </div>
    </aside>
  );
}
