import { Page } from '@playwright/test';

export const SIDEBAR_SECTIONS = {
  sales: {
    label: 'المبيعات',
    items: [
      { label: 'إدارة الفواتير', view: 'manage-invoices' },
      { label: 'إنشاء فاتورة', view: 'create-invoice' },
      { label: 'الفواتير المرتجعة', view: 'returned-invoices' },
      { label: 'مدفوعات العملاء', view: 'customer-payments' },
      { label: 'إعدادات المبيعات', view: 'sales-settings' },
    ],
  },
  customers: {
    label: 'العملاء',
    items: [
      { label: 'إدارة العملاء', view: 'manage-clients' },
      { label: 'إضافة عميل جديد', view: 'add-client' },
      { label: 'إعدادات العملاء', view: 'client-settings' },
      { label: 'كشف حساب العميل', view: 'customer-statement' },
    ],
  },
  inventory: {
    label: 'المخزون',
    items: [
      { label: 'المنتجات والخدمات', view: 'products-services' },
      { label: 'التصنيفات', view: 'categories' },
      { label: 'الماركات', view: 'brands' },
      { label: 'إدارة الإذن المخزنية', view: 'inventory-vouchers' },
      { label: 'المستودعات', view: 'warehouses' },
      { label: 'الفروع', view: 'branches' },
      { label: 'المنتجات المركبة', view: 'composite-products' },
      { label: 'حركة المخزون', view: 'inventory-movements' },
    ],
  },
  purchases: {
    label: 'المشتريات',
    items: [
      { label: 'فواتير الشراء', view: 'purchase-invoices' },
      { label: 'مرتجعات المشتريات', view: 'purchase-returns' },
      { label: 'إدارة الموردين', view: 'purchase-vendors' },
      { label: 'مدفوعات الموردين', view: 'purchase-vendor-payments' },
      { label: 'كشف حساب المورد', view: 'supplier-statement' },
    ],
  },
  finance: {
    label: 'المالية',
    items: [
      { label: 'المصروفات', view: 'finance-expenses' },
      { label: 'سندات القبض', view: 'finance-receipt-vouchers' },
      { label: 'خزائن وحسابات بنكية', view: 'finance-bank-cash-safes' },
      { label: 'حركة الخزينة', view: 'treasury-transactions' },
    ],
  },
  accounts: {
    label: 'الحسابات العامة',
    items: [
      { label: 'دليل الحسابات', view: 'accounts-chart' },
      { label: 'الإعدادات', view: 'user-management' },
    ],
  },
  reports: {
    label: 'التقارير',
    items: [
      { label: 'التقرير الشامل الموحد والربحية', view: 'report-unified' },
    ],
  },
};

export async function expandSidebarSection(page: Page, sectionLabel: string) {
  const section = page.locator(`text="${sectionLabel}"`).first();
  if (await section.isVisible().catch(() => false)) {
    await section.click();
    await page.waitForTimeout(300);
  }
}

export function getViewTitle(view: string): string {
  const map: Record<string, string> = {
    'dashboard': 'لوحة التحكم السريعة',
    'manage-invoices': 'إدارة الفواتير',
    'create-invoice': 'إنشاء فاتورة جديدة',
    'returned-invoices': 'الفواتير المرتجعة',
    'customer-payments': 'مدفوعات العملاء',
    'sales-settings': 'إعدادات المبيعات',
    'manage-clients': 'إدارة العملاء',
    'add-client': 'أضف عميل',
    'client-settings': 'إعدادات العملاء',
    'customer-statement': 'كشف حساب العميل',
    'products-services': 'المنتجات والخدمات',
    'categories': 'التصنيفات',
    'brands': 'الماركات',
    'inventory-vouchers': 'الأذون المخزنية',
    'warehouses': 'المستودعات',
    'branches': 'الفروع',
    'composite-products': 'المنتجات المركبة',
    'inventory-movements': 'حركة المخزون',
    'purchase-invoices': 'فواتير الشراء',
    'purchase-returns': 'مرتجعات المشتريات',
    'purchase-vendors': 'إدارة الموردين',
    'purchase-vendor-payments': 'مدفوعات الموردين',
    'supplier-statement': 'كشف حساب المورد',
    'finance-expenses': 'المصروفات',
    'finance-receipt-vouchers': 'سندات القبض',
    'finance-bank-cash-safes': 'خزائن وحسابات بنكية',
    'treasury-transactions': 'حركة الخزينة',
    'accounts-chart': 'دليل الحسابات',
    'user-management': 'الإعدادات',
    'report-unified': 'التقرير الشامل',
  };
  return map[view] || view;
}
