/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InvoiceItem {
  id: string;
  itemName: string;
  description: string;
  unitPrice: number;
  quantity: number;
  discount: number; // custom Discount value
  taxValue: number; // e.g., 0, 14 ( Egyptian Tax or custom )
  total: number;
}

export type InvoiceStatus = 'draft' | 'paid' | 'unpaid' | 'overdue' | 'partial' | 'returned' | 'partially_returned';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  issueDate: string;
  clientName: string;
  salesAgent: string;
  paymentTerms: string; // in days
  items: InvoiceItem[];
  status: InvoiceStatus;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  adjustment: number;
  subtotal: number;
  total: number;
  notes: string;
  alreadyPaid: boolean;
  currency: string;
  depositAmount: number;
  remainingAmount: number;
  shippingCompany: string;
  trackingNumber: string;
}

export interface Client {
  id: string;
  type: 'individual' | 'commercial';
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  zipCode: string;
  country: string;
  commercialRegistry: string;
  taxCard: string;
  nationalId: string;
  codeNumber: string;
  currency: string;
  notes: string;
  category: string;
  billingMethod: string;
  startDate?: string;
  targetWeight?: number;
  lastWeight?: number;
  followUpCount?: number;
  nextFollowUp?: string;
}

export interface ProductService {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  taxRate: number;
}

export interface WeightRecord {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  notes: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
  status: string;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface UserPermissions {
  manageClients: boolean;
  addClient: boolean;
  editClient: boolean;
  deleteClient: boolean;
  viewReports: boolean;
  exportReports: boolean;
  manageUsers: boolean;
  manageSettings: boolean;
  sendWhatsApp: boolean;
  viewAllClientData: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'accountant' | 'sales' | 'inventory' | 'custom';
  active: boolean;
  permissions: UserPermissions;
}
