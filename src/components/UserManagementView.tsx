import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Shield, UserPlus, User, Mail, Phone, Key,
  Check, X, Save, Edit3, Trash2, Power, PowerOff,
  ArrowRight, Eye, EyeOff, Plus, Search, UserCheck
} from 'lucide-react';
import { SystemUser, UserPermissions } from '../types';
import { supabase } from '../lib/supabase';

interface UserManagementViewProps {
  setView: (view: string) => void;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  manageClients: false, addClient: false, editClient: false, deleteClient: false,
  viewReports: false, exportReports: false, manageUsers: false, manageSettings: false,
  sendWhatsApp: false, viewAllClientData: false,
};

const ROLE_PRESETS: Record<string, UserPermissions> = {
  admin: { manageClients: true, addClient: true, editClient: true, deleteClient: true, viewReports: true, exportReports: true, manageUsers: true, manageSettings: true, sendWhatsApp: true, viewAllClientData: true },
  accountant: { manageClients: true, addClient: false, editClient: true, deleteClient: false, viewReports: true, exportReports: true, manageUsers: false, manageSettings: false, sendWhatsApp: false, viewAllClientData: true },
  sales: { manageClients: true, addClient: true, editClient: true, deleteClient: false, viewReports: false, exportReports: false, manageUsers: false, manageSettings: false, sendWhatsApp: true, viewAllClientData: false },
  inventory: { manageClients: false, addClient: false, editClient: false, deleteClient: false, viewReports: false, exportReports: false, manageUsers: false, manageSettings: false, sendWhatsApp: false, viewAllClientData: false },
};

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  manageClients: 'إدارة العملاء', addClient: 'إضافة عميل', editClient: 'تعديل عميل', deleteClient: 'حذف عميل',
  viewReports: 'عرض التقارير', exportReports: 'تصدير التقارير', manageUsers: 'إدارة المستخدمين',
  manageSettings: 'إدارة الإعدادات', sendWhatsApp: 'إرسال رسائل واتساب', viewAllClientData: 'الاطلاع على جميع بيانات العملاء',
};

function mapUser(row: any): SystemUser {
  return {
    id: row.id,
    name: row.name || '',
    username: row.username || '',
    email: row.email || '',
    phone: row.phone || '',
    password: '',
    role: row.role || 'sales',
    active: row.active !== false,
    permissions: row.permissions || { ...DEFAULT_PERMISSIONS },
  };
}

export default function UserManagementView({ setView }: UserManagementViewProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<SystemUser['role']>('sales');
  const [formPermissions, setFormPermissions] = useState<UserPermissions>({ ...DEFAULT_PERMISSIONS });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (data) setUsers(data.map(mapUser));
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const resetForm = () => {
    setFormName(''); setFormUsername(''); setFormEmail(''); setFormPhone('');
    setFormPassword(''); setFormRole('sales'); setFormPermissions({ ...DEFAULT_PERMISSIONS });
    setEditingId(null); setShowPassword(false);
  };

  const handleRoleChange = (role: SystemUser['role']) => {
    setFormRole(role);
    if (role !== 'custom' && ROLE_PRESETS[role]) setFormPermissions({ ...ROLE_PRESETS[role] });
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setFormPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdd = async () => {
    if (!formName || !formUsername || !formPassword) return;
    if (users.some(u => u.username === formUsername && u.id !== editingId)) {
      alert('اسم المستخدم موجود مسبقاً');
      return;
    }
    const email = formEmail || `${formUsername}@daftra.local`;

    const { data: authData, error: authError } = await supabase.rpc('create_auth_user', {
      p_email: email,
      p_password: formPassword,
    });

    if (authError || !authData) {
      alert('خطأ في إنشاء المستخدم: ' + (authError?.message || ''));
      return;
    }
    const { error } = await supabase.from('profiles').upsert({
      id: authData,
      name: formName,
      username: formUsername.toLowerCase(),
      email,
      phone: formPhone || null,
      role: formRole,
      active: true,
      permissions: formPermissions,
    }, { onConflict: 'id' });
    if (!error) {
      await loadUsers();
      setShowForm(false);
      resetForm();
    } else {
      alert('خطأ في حفظ بيانات المستخدم');
    }
  };

  const handleUpdate = async () => {
    if (!formName || !formUsername || !editingId) return;
    const updateObj: any = {
      name: formName, username: formUsername, email: formEmail || null, phone: formPhone || null,
      role: formRole, permissions: formPermissions,
    };
    const { error } = await supabase.from('profiles').update(updateObj).eq('id', editingId);
    if (!error) {
      await loadUsers();
      setShowForm(false);
      resetForm();
    }
  };

  const handleEdit = (user: SystemUser) => {
    setEditingId(user.id);
    setFormName(user.name); setFormUsername(user.username); setFormEmail(user.email);
    setFormPhone(user.phone); setFormPassword(''); setFormRole(user.role);
    setFormPermissions({ ...user.permissions });
    setShowForm(true);
  };

  const handleDelete = async (id: string, username: string) => {
    if (username === 'mohamed') { alert('لا يمكن حذف المستخدم الرئيسي'); return; }
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) await loadUsers();
  };

  const handleToggleActive = async (id: string, username: string, current: boolean) => {
    if (username === 'mohamed') { alert('لا يمكن تعطيل المستخدم الرئيسي'); return; }
    const { error } = await supabase.from('profiles').update({ active: !current }).eq('id', id);
    if (!error) await loadUsers();
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const permissionList = Object.keys(PERMISSION_LABELS) as (keyof UserPermissions)[];

  if (loading) {
    return (
      <div className="w-full mx-auto text-right font-sans select-none text-slate-800" dir="rtl">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="text-slate-400 font-bold">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6 text-right font-sans select-none pb-12 text-slate-800 antialiased animate-fadeIn leading-relaxed" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
            <Shield className="w-5.5 h-5.5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">إدارة المستخدمين والصلاحيات</h1>
            <p className="text-xs text-slate-400 font-semibold">إضافة وتعديل وحذف المستخدمين وتخصيص الصلاحيات</p>
          </div>
        </div>
        <button onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 transition-all font-bold text-sm cursor-pointer">
          <ArrowRight className="w-4 h-4 shrink-0" />
          <span>العودة للوحة التحكم</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="بحث عن مستخدم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" />
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-600/20 cursor-pointer">
            <UserPlus className="w-3.5 h-3.5" />
            إضافة مستخدم جديد
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                {editingId ? <Edit3 className="w-4.5 h-4.5 text-amber-500" /> : <Plus className="w-4.5 h-4.5 text-emerald-500" />}
                <h3 className="text-sm font-black text-slate-700">{editingId ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">الاسم <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="الاسم الكامل"
                      className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">اسم المستخدم <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <UserCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input type="text" value={formUsername} onChange={e => setFormUsername(e.target.value)} placeholder="username"
                      className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@example.com"
                      className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="01000000000"
                      className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">كلمة المرور {!editingId && <span className="text-red-400">*</span>}</label>
                  <div className="relative">
                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input type={showPassword ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder={editingId ? 'اتركه فارغاً دون تغيير' : '********'}
                      className="w-full pr-9 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                    <button onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">الدور الوظيفي</label>
                  <select value={formRole} onChange={e => handleRoleChange(e.target.value as SystemUser['role'])}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer">
                    <option value="admin">مدير (Admin)</option>
                    <option value="accountant">محاسب</option>
                    <option value="sales">مبيعات</option>
                    <option value="inventory">مخزون</option>
                    <option value="custom">مخصص</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <h4 className="text-sm font-black text-slate-700">الصلاحيات</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {permissionList.map(key => (
                    <button key={key} onClick={() => togglePermission(key)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formPermissions[key]
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}>
                      {formPermissions[key] ? <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                      {PERMISSION_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={editingId ? handleUpdate : handleAdd}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                  <Save className="w-3.5 h-3.5" />
                  {editingId ? 'تحديث' : 'حفظ المستخدم'}
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Users className="w-4.5 h-4.5 text-purple-500" />
            <h2 className="text-sm font-black text-slate-800">قائمة المستخدمين</h2>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{filteredUsers.length} مستخدم</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                <th className="p-3.5 pr-5">الحالة</th>
                <th className="p-3.5">الاسم</th>
                <th className="p-3.5">اسم المستخدم</th>
                <th className="p-3.5">البريد الإلكتروني</th>
                <th className="p-3.5">الدور</th>
                <th className="p-3.5 pl-5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">لا يوجد مستخدمين</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${!user.active ? 'opacity-60' : ''}`}>
                    <td className="p-3.5 pr-5">
                      <button onClick={() => handleToggleActive(user.id, user.username, user.active)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          user.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`} title={user.active ? 'تعطيل' : 'تفعيل'}>
                        {user.active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="p-3.5">
                      <span className="font-black text-slate-800">{user.name}</span>
                      {user.username === 'mohamed' && <span className="mr-1.5 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">رئيسي</span>}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{user.username}</td>
                    <td className="p-3.5 text-slate-500">{user.email || '-'}</td>
                    <td className="p-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        user.role === 'accountant' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        user.role === 'sales' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        user.role === 'inventory' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {user.role === 'admin' ? 'مدير' : user.role === 'accountant' ? 'محاسب' : user.role === 'sales' ? 'مبيعات' : user.role === 'inventory' ? 'مخزون' : 'مخصص'}
                      </span>
                    </td>
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEdit(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(user.id, user.username)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
