/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderTree, 
  Search, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  MoreHorizontal, 
  FileText, 
  Folder, 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  X,
  PlusCircle,
  Settings,
  HelpCircle
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  parentId: string | null;  // null means root
  type: 'debit' | 'credit';  // مدين | دائن
  accountType: 'main' | 'sub'; // حساب رئيسي | حساب فرعي
  balance: number;
}

interface AccountsChartViewProps {
  setView: (view: string) => void;
}

const DEFAULT_ACCOUNTS: Account[] = [
  // Level 1: Root accounts
  { id: '1', code: '1', name: 'الأصول', parentId: null, type: 'debit', accountType: 'main', balance: 0 },
  { id: '2', code: '2', name: 'الخصوم', parentId: null, type: 'credit', accountType: 'main', balance: 0 },
  { id: '3', code: '3', name: 'رأس المال وحقوق الملكية', parentId: null, type: 'credit', accountType: 'main', balance: 0 },
  { id: '4', code: '4', name: 'الدخل', parentId: null, type: 'credit', accountType: 'main', balance: 0 },
  { id: '5', code: '5', name: 'المصروفات', parentId: null, type: 'debit', accountType: 'main', balance: 0 },

  // Level 2
  // Under 1: الأصول
  { id: '11', code: '11', name: 'الأصول الثابتة', parentId: '1', type: 'debit', accountType: 'main', balance: 0 },
  { id: '12', code: '12', name: 'الأصول المتداولة', parentId: '1', type: 'debit', accountType: 'main', balance: 0 },

  // Under 2: الخصوم
  { id: '21', code: '21', name: 'الخصوم المتداولة', parentId: '2', type: 'credit', accountType: 'main', balance: 0 },
  { id: '22', code: '22', name: 'التزامات طويلة الأجل', parentId: '2', type: 'credit', accountType: 'main', balance: 0 },

  // Under 3: مجمع حقوق الملكية
  { id: '31', code: '311', name: 'رأس المال', parentId: '3', type: 'credit', accountType: 'sub', balance: 0 },
  { id: '32', code: '321', name: 'أرباح وخسائر مرحلة', parentId: '3', type: 'credit', accountType: 'sub', balance: 0 },

  // Under 4: الدخل
  { id: '41', code: '41', name: 'المبيعات وإيرادات النشاط', parentId: '4', type: 'credit', accountType: 'main', balance: 0 },
  { id: '42', code: '42', name: 'إيرادات أخرى', parentId: '4', type: 'credit', accountType: 'main', balance: 0 },

  // Under 5: المصروفات
  { id: '51', code: '51', name: 'تكاليف النشاط المباشرة', parentId: '5', type: 'debit', accountType: 'main', balance: 0 },
  { id: '52', code: '52', name: 'مصروفات إدارية وعمومية', parentId: '5', type: 'debit', accountType: 'main', balance: 0 },

  // Level 3 (Under 11: الأصول الثابتة)
  { id: '111', code: '111', name: 'أثاث', parentId: '11', type: 'debit', accountType: 'sub', balance: 0 },
  { id: '112', code: '112', name: 'الأجهزة والمعدات', parentId: '11', type: 'debit', accountType: 'sub', balance: 0 },
  { id: '113', code: '113', name: 'وسائل النقل', parentId: '11', type: 'debit', accountType: 'sub', balance: 0 },
  { id: '114', code: '114', name: 'مباني', parentId: '11', type: 'debit', accountType: 'sub', balance: 0 },
  { id: '115', code: '115', name: 'أراضي', parentId: '11', type: 'debit', accountType: 'sub', balance: 0 },
];

export default function AccountsChartView({ setView }: AccountsChartViewProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Current active parent node we are drilling into (null means we're looking at root level)
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState('Main Branch');

  // Modal State for adding/editing account
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [modalAccountType, setModalAccountType] = useState<'main' | 'sub'>('sub');
  const [modalCode, setModalCode] = useState('');
  const [modalName, setModalName] = useState('');
  const [modalParentId, setModalParentId] = useState<string>('');
  const [modalType, setModalType] = useState<'debit' | 'credit'>('debit');

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1': true,
    '2': false,
    '3': false,
    '4': false,
    '5': false,
    '11': true,
  });

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);

  const addToast = (text: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    initializeAccounts();
  }, []);

  const mapRowToAccount = (row: any): Account => ({
    id: row.id,
    code: row.code,
    name: row.name,
    parentId: row.parent_id,
    type: row.type,
    accountType: row.account_type,
    balance: row.balance,
  });

  const seedDefaultAccounts = async () => {
    const idMap: Record<string, string> = {};

    for (const acc of DEFAULT_ACCOUNTS) {
      if (acc.parentId === null) {
        const { data, error } = await supabase
          .from('chart_of_accounts')
          .insert({
            code: acc.code,
            name: acc.name,
            parent_id: null,
            type: acc.type,
            account_type: acc.accountType,
            balance: acc.balance,
          })
          .select('id')
          .single();

        if (!error && data) {
          idMap[acc.id] = data.id;
        }
      }
    }

    for (const acc of DEFAULT_ACCOUNTS) {
      if (acc.parentId !== null && idMap[acc.parentId]) {
        await supabase
          .from('chart_of_accounts')
          .insert({
            code: acc.code,
            name: acc.name,
            parent_id: idMap[acc.parentId],
            type: acc.type,
            account_type: acc.accountType,
            balance: acc.balance,
          })
          .select('id')
          .single();
      }
    }
  };

  const initializeAccounts = async () => {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .order('code');

    if (error) {
      console.error('Error loading accounts:', error);
      return;
    }

    if (data && data.length > 0) {
      setAccounts(data.map(mapRowToAccount));
    } else {
      await seedDefaultAccounts();
      const { data: seededData } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .order('code');
      if (seededData) {
        setAccounts(seededData.map(mapRowToAccount));
      }
    }
  };

  // Expand parent node toggle
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build breedcrumbs path
  const getBreadcrumbs = () => {
    const path: Account[] = [];
    let currentId = activeParentId;
    while (currentId) {
      const found = accounts.find((a) => a.id === currentId);
      if (found) {
        path.unshift(found);
        currentId = found.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const activeAccount = activeParentId ? accounts.find((a) => a.id === activeParentId) : null;
  const currentLevelItems = accounts.filter((a) => a.parentId === activeParentId);

  // Check if an account has sub-accounts (children)
  const hasChildren = (id: string) => {
    return accounts.some((a) => a.parentId === id);
  };

  // Recursively delete account and all of its sub-accounts
  const deleteAccountCascade = async (id: string) => {
    const collectIds = async (parentId: string): Promise<string[]> => {
      const { data: children } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('parent_id', parentId);

      let list = [parentId];
      if (children) {
        for (const child of children) {
          list = [...list, ...(await collectIds(child.id))];
        }
      }
      return list;
    };

    const idsToDelete = await collectIds(id);

    const { error } = await supabase
      .from('chart_of_accounts')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      console.error('Error deleting accounts:', error);
      return;
    }

    setAccounts((prev) => prev.filter((a) => !idsToDelete.includes(a.id)));
    if (activeParentId && idsToDelete.includes(activeParentId)) {
      const parentNode = accounts.find((a) => a.id === activeParentId);
      setActiveParentId(parentNode ? parentNode.parentId : null);
    }
    addToast('تم حذف الحساب وملحقاته بنجاح');
  };

  // Open modal to add account
  const openAddModal = (proposedParentId: string | null = null) => {
    setModalMode('add');
    const parentId = proposedParentId || activeParentId || '1'; // Fallback to 'الأصول' if none
    const parentNode = accounts.find((a) => a.id === parentId);

    // Look for children of this parent to propose next code
    const childCount = accounts.filter((a) => a.parentId === parentId).length;
    const parentCodeValue = parentNode ? parentNode.code : '1';
    const nextCode = `${parentCodeValue}${childCount + 1}`;

    setModalAccountType('sub');
    setModalCode(nextCode);
    setModalName('');
    setModalParentId(parentId);
    setModalType(parentNode ? parentNode.type : 'debit');
    setIsModalOpen(true);
  };

  // Open modal to edit account
  const openEditModal = (account: Account) => {
    setModalMode('edit');
    setEditingAccountId(account.id);
    setModalAccountType(account.accountType);
    setModalCode(account.code);
    setModalName(account.name);
    setModalParentId(account.parentId || '');
    setModalType(account.type);
    setIsModalOpen(true);
  };

  // Save changes
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim() || !modalCode.trim()) {
      addToast('رجاء ملء حقول الاسم والكود بالكامل');
      return;
    }

    if (modalMode === 'add') {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          code: modalCode.trim(),
          name: modalName.trim(),
          parent_id: modalParentId ? modalParentId : null,
          type: modalType,
          account_type: modalAccountType,
          balance: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding account:', error);
        return;
      }

      if (data) {
        setAccounts((prev) => [...prev, mapRowToAccount(data)]);
      }
      addToast('تمت إضافة الحساب الجديد إلى الدليل بنجاح');
    } else if (modalMode === 'edit' && editingAccountId) {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .update({
          code: modalCode.trim(),
          name: modalName.trim(),
          parent_id: modalParentId ? modalParentId : null,
          type: modalType,
          account_type: modalAccountType,
        })
        .eq('id', editingAccountId)
        .select()
        .single();

      if (error) {
        console.error('Error updating account:', error);
        return;
      }

      if (data) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === editingAccountId ? mapRowToAccount(data) : a))
        );
      }
      addToast('تم تعديل بيانات الحساب بنجاح');
    }

    setIsModalOpen(false);
  };

  // Auto-fill dynamic fields based on parent change
  useEffect(() => {
    if (modalMode === 'add' && modalParentId) {
      const parentNode = accounts.find((a) => a.id === modalParentId);
      if (parentNode) {
        setModalType(parentNode.type);
        const children = accounts.filter((a) => a.parentId === modalParentId);
        setModalCode(`${parentNode.code}${children.length + 1}`);
      }
    }
  }, [modalParentId, modalMode]);

  // Recursively render tree node for the sidebar
  const renderTreeNodes = (parentId: string | null) => {
    const nodes = accounts.filter((a) => a.parentId === parentId);
    return (
      <ul className="space-y-1 pr-3 border-r border-[#0074b1]/15 mr-1.5 font-sans">
        {nodes.map((node) => {
          const isExpandable = hasChildren(node.id);
          const isExpanded = expandedNodes[node.id];
          const isCurrentActive = activeParentId === node.id;

          return (
            <li key={node.id} className="space-y-1">
              <div 
                className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-all cursor-pointer select-none group flex-row-reverse text-right ${
                  isCurrentActive 
                    ? 'bg-[#0074b1]/10 text-[#0074b1] font-bold' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => {
                  setActiveParentId(node.id);
                  if (isExpandable && !isExpanded) {
                    setExpandedNodes(prev => ({ ...prev, [node.id]: true }));
                  }
                }}
              >
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  {/* Folder/File Icon */}
                  {node.accountType === 'main' ? (
                    <Folder className={`w-3.5 h-3.5 ${isCurrentActive ? 'text-[#0074b1]' : 'text-slate-400'}`} />
                  ) : (
                    <FileText className={`w-3.5 h-3.5 ${isCurrentActive ? 'text-[#0074b1]' : 'text-slate-400'}`} />
                  )}
                  
                  <span className="text-[12px] font-medium leading-none block">
                    {node.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 flex-row-reverse">
                  <span className="text-[10px] font-mono text-slate-400 leading-none">
                    #{node.code}
                  </span>

                  {isExpandable ? (
                    <button 
                      type="button"
                      onClick={(e) => toggleExpand(node.id, e)}
                      className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700"
                    >
                      {isExpanded ? (
                        <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-3.5" />
                  )}
                </div>
              </div>

              {isExpandable && isExpanded && renderTreeNodes(node.id)}
            </li>
          );
        })}
      </ul>
    );
  };

  // Global filtered list if search query is present
  const isSearching = searchQuery.trim().length > 0;
  const filteredAccounts = isSearching 
    ? accounts.filter(a => a.name.includes(searchQuery) || a.code.includes(searchQuery))
    : currentLevelItems;

  return (
    <div id="accounts-chart-main" className="max-w-7xl mx-auto space-y-5 text-right font-sans select-none pb-12">
      {/* Toast notifications */}
      <div className="fixed bottom-5 left-5 z-50 pointer-events-none space-y-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="p-3 bg-slate-800 text-white rounded-lg shadow-lg text-xs font-bold text-center border-r-4 border-emerald-500 flex items-center justify-between flex-row-reverse pointer-events-auto"
          >
            <span>{toast.text}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="p-2 bg-[#0074b1]/10 border border-[#0074b1]/20 rounded-lg">
            <FolderTree className="w-6 h-6 text-[#0074b1]" />
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-slate-800 leading-none">دليل الحسابات</h1>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">شجرة الحسابات العامة وحسابات الميزانية وقائمة الدخل بنظام دفتره</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Back Button */}
          <button
            onClick={() => setView('dashboard')}
            className="px-4 py-2 bg-[#1c2e43] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 flex-row-reverse"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </div>

      {/* Layout Grid (Tree index on right, content lists on left inside real-time responsive flex container) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Right Sidebar: Index Tree & Search Component */}
        <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-[#1c2e43] flex items-center justify-between flex-row-reverse">
              <span>الفهرس الهيكلي للدليل</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-500 font-mono">
                {accounts.length} حساب
              </span>
            </h3>
          </div>

          {/* Quick Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="البحث بالاسم أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#0074b1] text-right"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Tree list hierarchy representation */}
          <div className="overflow-y-auto max-h-[500px] py-1">
            {renderTreeNodes(null)}
          </div>
        </div>

        {/* Left Side: Drilldown Accounts Table */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          
          {/* Top Options & Current Node Information */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-3 bg-[#fdfdfd] p-3 rounded-xl border border-slate-100">
            
            {/* Breadcrumb path navigation */}
            <div className="flex items-center flex-wrap gap-1 text-[11px] font-bold text-slate-400 flex-row-reverse">
              <button 
                onClick={() => setActiveParentId(null)}
                className="hover:text-[#0074b1] transition-colors"
              >
                دليل الحسابات
              </button>
              
              {getBreadcrumbs().map((bNode, idx) => (
                <div key={bNode.id} className="flex items-center gap-1 flex-row-reverse">
                  <ChevronLeft className="w-3 h-3 text-slate-300" />
                  <button 
                    onClick={() => setActiveParentId(bNode.id)}
                    className="hover:text-[#0074b1] font-semibold text-slate-500 whitespace-nowrap"
                  >
                    {bNode.name} (#{bNode.code})
                  </button>
                </div>
              ))}
            </div>

            {/* Branch option picker */}
            <div className="flex items-center gap-2 flex-row-reverse self-stretch sm:self-auto text-xs text-slate-500 font-bold">
              <span>فرع القيود:</span>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="border border-slate-200 bg-white px-2 py-1 rounded text-xs focus:ring-0 focus:outline-hidden"
              >
                <option value="Main Branch">Main Branch</option>
                <option value="Alex Branch">فرع الاسكندرية</option>
                <option value="Cairo Branch">فرع القاهرة الرئيسي</option>
              </select>
            </div>

          </div>

          {/* Active Level Meta Box */}
          <div className="bg-[#f4faff] border border-[#0074b1]/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-right space-y-1">
              <div className="text-[10px] text-slate-400 font-bold block">الحساب المحدد المستهدف</div>
              <h2 className="text-base font-extrabold text-[#1a2e40] flex items-center gap-2 flex-row-reverse">
                <span>{activeAccount ? activeAccount.name : 'الدليل الرئيسي للشركة'}</span>
                <span className="text-xs text-slate-400 font-mono">
                  (الكود: {activeAccount ? activeAccount.code : 'ROOT'})
                </span>
              </h2>
            </div>

            {/* Balance Card displaying with zero fractions of EGP */}
            <div className="text-center sm:text-left">
              <div className="text-[10px] text-slate-400 font-bold block">إجمالي الرصيد المقدر</div>
              <p className="text-xl font-bold font-mono text-[#0074b1] leading-none mt-1">
                {activeAccount 
                  ? activeAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
                  : accounts.filter(a => a.parentId === null).reduce((sum, item) => sum + item.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                } EGP
              </p>
            </div>
          </div>

          {/* List Toolbar containing search or additions */}
          <div className="flex items-center justify-between flex-row-reverse border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500">
              {isSearching 
                ? `نتائج البحث عن (${searchQuery}): ${filteredAccounts.length} حساب` 
                : `الحسابات المندرجة تحت هذا التصنيف: ${filteredAccounts.length} حساب`
              }
            </span>

            {/* Add account button to open modal */}
            <button
              onClick={() => openAddModal(activeParentId)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-row-reverse cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حساب</span>
            </button>
          </div>

          {/* Table representing Accounts Grid */}
          <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-bold">
                  <th className="p-3 text-right">الكود</th>
                  <th className="p-3 text-right">اسم الحساب</th>
                  <th className="p-3 text-center">نوع الحساب</th>
                  <th className="p-3 text-center">طبيعة الحساب (القيد)</th>
                  <th className="p-3 text-left">الرصيد الجاري</th>
                  <th className="p-3 text-center w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((item) => (
                    <tr 
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer group transition-colors"
                      onDoubleClick={() => {
                        if (item.accountType === 'main') {
                          setActiveParentId(item.id);
                        } else {
                          addToast(`حساب "${item.name}" هو حساب فرعي نهائي لا يحتوي على تفريعات.`);
                        }
                      }}
                    >
                      {/* Code */}
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {item.code}
                      </td>

                      {/* Name with specific folder/file style representation */}
                      <td className="p-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2 flex-row-reverse text-right">
                          {item.accountType === 'main' ? (
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                          <span className="text-slate-800 hover:text-[#0074b1] transition-all">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Account hierarchy classification */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.accountType === 'main' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {item.accountType === 'main' ? 'حساب رئيسي' : 'حساب فرعي'}
                        </span>
                      </td>

                      {/* Financial Nature (Debit or Credit) */}
                      <td className="p-3 text-center font-bold">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                          item.type === 'debit' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {item.type === 'debit' ? 'مدين' : 'دائن'}
                        </span>
                      </td>

                      {/* Current Account Balance (no fractions parsed) */}
                      <td className="p-3 text-left font-mono font-black text-slate-800 text-sm">
                        {item.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EGP
                      </td>

                      {/* Row contextual action controls */}
                      <td className="p-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            title="تعديل بيانات الحساب"
                            className="p-1 text-slate-400 hover:text-[#0074b1] hover:bg-slate-100 rounded transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Cannot delete the absolute hard-coded template root elements directly for structural safety */}
                          {['1', '2', '3', '4', '5'].includes(item.id) ? (
                            <span className="w-3.5 h-3.5" />
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من رغبتك بحذف الحساب "${item.name}"؟ سيؤدي ذلك أيضاً لحذف كافة الحسابات المندرجة تحته.`)) {
                                  deleteAccountCascade(item.id);
                                }
                              }}
                              title="حذف الحساب"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                      لا توجد حسابات مسجلة هنا حتى الآن. انقر على "إضافة حساب" للأعلى للبدء ببناء الدليل.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Informational Tip Card */}
          <div className="p-4 bg-slate-50 border border-slate-250 rounded-xl flex items-start gap-3 flex-row-reverse text-right">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <HelpCircle className="w-4 h-4 font-bold" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#1a2e40]">إرشادات التعامل المحاسبي المزدوج في دفترة:</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                يمكنك التفرع اللانهائي من شجرة الحسابات الرئيسية (أصول، خصوم، ميزانيات).
                تأكد دوماً من تعيين "حساب فرعي" في حال رغبتك بالتمكين من استخدام هذا الحساب في تسجيل فواتير المبيعات والمشتريات وإيصالات المقبوضات/المصروفات مباشرة. الحسابات الرئيسية المفتوحة تعمل كمجمع حسابي فقط للتنظيم.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Modal dialog box for adding or editing account exactly as shown in screenshot # 12 */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-right font-sans"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50 flex-row-reverse">
                <h3 className="text-sm font-bold text-slate-800">
                  {modalMode === 'add' ? 'أضف حساب' : 'تعديل بيانات الحساب'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form implementation according to layout style screen 12 */}
              <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
                
                {/* 1. Account type dropdown + Code input field */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">
                      نوع الحساب
                    </label>
                    <select
                      value={modalAccountType}
                      onChange={(e) => setModalAccountType(e.target.value as 'main' | 'sub')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-right focus:outline-hidden focus:border-[#0074b1]"
                    >
                      <option value="sub">حساب فرعي</option>
                      <option value="main">حساب رئيسي</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">
                      الكود
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={modalCode}
                      onChange={(e) => setModalCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-center font-mono focus:outline-hidden focus:border-[#0074b1]"
                    />
                  </div>
                </div>

                {/* 2. Parent selection dropdown + Name input field */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">
                      حساب رئيسي
                    </label>
                    <select
                      value={modalParentId}
                      onChange={(e) => setModalParentId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-right focus:outline-hidden focus:border-[#0074b1]"
                    >
                      <option value="">- دليل الحسابات الرئيسي -</option>
                      {accounts
                        .filter((a) => a.accountType === 'main' && a.id !== editingAccountId)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} (#{acc.code})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">
                      الاسم
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أثاث أو وسيلة نقل..."
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-right focus:outline-hidden focus:border-[#0074b1]"
                    />
                  </div>
                </div>

                {/* 3. Debit / Credit toggle fields as inline radios in screenshot 12 */}
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center flex-row-reverse">
                  <span className="text-[11px] font-bold text-slate-500">
                    النوع
                  </span>
                  
                  <div className="flex items-center gap-6 flex-row-reverse text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer flex-row-reverse">
                      <input
                        type="radio"
                        name="natureType"
                        checked={modalType === 'debit'}
                        onChange={() => setModalType('debit')}
                        className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-0 cursor-pointer"
                      />
                      <span>مدين</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer flex-row-reverse">
                      <input
                        type="radio"
                        name="natureType"
                        checked={modalType === 'credit'}
                        onChange={() => setModalType('credit')}
                        className="w-4 h-4 text-[#0074b1] border-slate-300 focus:ring-0 cursor-pointer"
                      />
                      <span>دائن</span>
                    </label>
                  </div>
                </div>

                {/* Footer buttons representation with green Save "حفظ" button */}
                <div className="border-t border-slate-100 pt-4 flex gap-3 flex-row-reverse justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-all shadow-sm cursor-pointer"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold border border-slate-200 rounded text-xs transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
