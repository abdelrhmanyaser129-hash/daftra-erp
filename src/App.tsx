import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import CreateInvoiceView from './components/CreateInvoiceView';
import AddClientView from './components/AddClientView';
import ManageInvoicesView from './components/ManageInvoicesView';
import ManageClientsView from './components/ManageClientsView';
import ReturnedInvoicesView from './components/ReturnedInvoicesView';
import CustomerPaymentsView from './components/CustomerPaymentsView';
import SalesSettingsView from './components/SalesSettingsView';
import ClientSettingsView from './components/ClientSettingsView';
import ProductsServicesView from './components/ProductsServicesView';
import CompositeProductsView from './components/CompositeProductsView';
import InventoryVouchersView from './components/InventoryVouchersView';
import WarehousesView from './components/WarehousesView';
import PurchaseInvoicesView from './components/PurchaseInvoicesView';
import PurchaseReturnsView from './components/PurchaseReturnsView';
import PurchaseVendorsView from './components/PurchaseVendorsView';
import PurchaseVendorPaymentsView from './components/PurchaseVendorPaymentsView';
import FinanceExpensesView from './components/FinanceExpensesView';
import FinanceReceiptVouchersView from './components/FinanceReceiptVouchersView';
import FinanceBankCashSafesView from './components/FinanceBankCashSafesView';
import AccountsChartView from './components/AccountsChartView';
import UnifiedReportsView from './components/UnifiedReportsView';
import SupplierStatementView from './components/SupplierStatementView';
import ClientDetailView from './components/ClientDetailView';
import UserManagementView from './components/UserManagementView';
import LoginView from './components/LoginView';

import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { currentUser, loading, signOut } = useAuth();
  const [currentView, setView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('');
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const initialLoginDone = useRef(false);

  useEffect(() => {
    if (currentUser && !initialLoginDone.current) {
      initialLoginDone.current = true;
      setView('dashboard');
    } else if (!currentUser) {
      initialLoginDone.current = false;
    }
  }, [currentUser]);

  const isViewAllowed = (role: string, view: string): boolean => {
    if (role === 'admin') return true;
    if (view === 'client-detail') return true;
    if (view === 'user-management') return false;
    if (role === 'accountant') {
      return [
        'dashboard', 'create-invoice', 'add-client', 'manage-invoices', 'manage-clients',
        'client-settings', 'returned-invoices', 'customer-payments', 'sales-settings',
        'finance-expenses', 'finance-receipt-vouchers', 'finance-bank-cash-safes',
        'accounts-chart', 'report-unified', 'supplier-statement'
      ].includes(view);
    }
    if (role === 'sales') {
      return [
        'dashboard', 'create-invoice', 'add-client', 'manage-invoices', 'manage-clients',
        'client-settings', 'returned-invoices', 'customer-payments', 'sales-settings'
      ].includes(view);
    }
    if (role === 'inventory') {
      return ['dashboard', 'products-services', 'composite-products', 'inventory-vouchers', 'warehouses'].includes(view);
    }
    return false;
  };

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleSetView = (view: string) => {
    if (currentUser && !isViewAllowed(currentUser.role, view)) {
      showToast('خطأ: ليس لديك صلاحية للوصول إلى هذه الصفحة.', 'error');
      return;
    }
    setView(view);
    if (view !== 'manage-invoices') setInvoiceSearchQuery('');
    if (view !== 'manage-clients') setClientSearchQuery('');
    if (view !== 'client-detail') setSelectedClientId(null);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setView('client-detail');
  };

  const handleLogout = () => {
    signOut();
    showToast('تم تسجيل الخروج بنجاح.');
  };

  if (loading) return null;

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex text-right font-sans antialiased text-[#2b3a4a] bg-[#f5f8fb]">
      <Sidebar
        currentView={currentView}
        setView={handleSetView}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        userRole={currentUser.role}
        onLogout={handleLogout}
      />

      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/45 lg:hidden animate-fadeIn" aria-hidden="true" />
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:mr-72 min-h-screen">
        <Header
          currentView={currentView}
          setView={handleSetView}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 pt-[90px] sm:pt-[95px] md:pt-[100px] lg:pt-[85px] pb-16 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {currentView === 'dashboard' && <DashboardView setView={handleSetView} />}
              {currentView === 'create-invoice' && <CreateInvoiceView setView={handleSetView} />}
              {currentView === 'add-client' && <AddClientView setView={handleSetView} />}
              {currentView === 'manage-invoices' && <ManageInvoicesView setView={handleSetView} searchQuery={invoiceSearchQuery} />}
              {currentView === 'manage-clients' && (
                <ManageClientsView setView={handleSetView} searchQuery={clientSearchQuery} onSelectClient={handleSelectClient} />
              )}
              {currentView === 'client-settings' && <ClientSettingsView setView={handleSetView} onSave={showToast} />}
              {currentView === 'returned-invoices' && <ReturnedInvoicesView setView={handleSetView} showToast={showToast} />}
              {currentView === 'customer-payments' && <CustomerPaymentsView setView={handleSetView} showToast={showToast} />}
              {currentView === 'sales-settings' && <SalesSettingsView setView={handleSetView} />}
              {currentView === 'products-services' && <ProductsServicesView setView={handleSetView} />}
              {currentView === 'composite-products' && <CompositeProductsView setView={handleSetView} />}
              {currentView === 'inventory-vouchers' && <InventoryVouchersView setView={handleSetView} />}
              {currentView === 'warehouses' && <WarehousesView setView={handleSetView} />}
              {currentView === 'purchase-invoices' && <PurchaseInvoicesView setView={handleSetView} />}
              {currentView === 'purchase-returns' && <PurchaseReturnsView setView={handleSetView} />}
              {currentView === 'purchase-vendors' && <PurchaseVendorsView setView={handleSetView} />}
              {currentView === 'purchase-vendor-payments' && <PurchaseVendorPaymentsView setView={handleSetView} />}
              {currentView === 'finance-expenses' && <FinanceExpensesView setView={handleSetView} />}
              {currentView === 'finance-receipt-vouchers' && <FinanceReceiptVouchersView setView={handleSetView} />}
              {currentView === 'finance-bank-cash-safes' && <FinanceBankCashSafesView setView={handleSetView} />}
              {currentView === 'accounts-chart' && <AccountsChartView setView={handleSetView} />}
              {currentView === 'report-unified' && <UnifiedReportsView setView={handleSetView} />}
              {currentView === 'client-detail' && selectedClientId && (
                <ClientDetailView clientId={selectedClientId} onBack={() => handleSetView('manage-clients')} />
              )}
              {currentView === 'supplier-statement' && <SupplierStatementView setView={handleSetView} />}
              {currentView === 'user-management' && <UserManagementView setView={handleSetView} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="fixed bottom-5 left-5 z-50 pointer-events-none space-y-2 max-w-sm w-full font-bold">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`p-4 rounded-lg shadow-xl border flex items-start gap-3 pointer-events-auto ${
                toastType === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : toastType === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toastType === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
              </div>
              <div className="flex-1 space-y-0.5 text-xs">
                <p className="leading-snug">{toastMessage}</p>
                <p className="text-[10px] text-slate-400 font-mono">تحديث فوري للنظام</p>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
