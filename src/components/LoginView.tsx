import React, { useState } from 'react';
import { ShieldCheck, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setErrorMsg(null);
    const err = await signIn(username, password);
    setLoading(false);
    if (err) setErrorMsg(err);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7fa] p-4 sm:p-6 font-sans antialiased text-slate-800" dir="rtl">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
        <div className="md:col-span-5 bg-gradient-to-br from-[#0d385a] to-[#0074b1] text-white p-8 flex flex-col justify-between text-right">
          <div className="space-y-4">
            <div className="text-2xl font-black tracking-widest text-[#0074b1] bg-white px-3 py-1.5 rounded inline-block">
              DAFTRA ERP
            </div>
            <h1 className="text-xl font-extrabold mt-6 leading-tight">نظام دفتره المحاسبي لإدارة المؤسسات</h1>
            <p className="text-xs text-slate-200 leading-relaxed font-semibold">
              مرحباً بك في لوحة تحكم تخطيط موارد المؤسسات المتكاملة.
            </p>
          </div>
          <div className="pt-8 border-t border-white/10 text-[10px] text-slate-300 font-mono">
            <span>نظام دفتره © 2026</span>
          </div>
        </div>
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-6">
          <div className="space-y-1 text-right">
            <h2 className="text-lg font-black text-[#1c2e43]">تسجيل الدخول للنظام</h2>
            <p className="text-xs text-slate-400 font-semibold">أدخل بيانات الاعتماد الخاصة بك</p>
          </div>
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg leading-relaxed">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-slate-600">اسم المستخدم</label>
              <div className="relative">
                <input type="text" required value={username}
                  onChange={e => { setUsername(e.target.value); setErrorMsg(null); }}
                  placeholder="أدخل اسم المستخدم"
                  className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0074b1] text-right" />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-slate-600">كلمة المرور</label>
              <div className="relative">
                <input type="password" required value={password}
                  onChange={e => { setPassword(e.target.value); setErrorMsg(null); }}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0074b1] text-right" />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#0074b1] hover:bg-[#006296] disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-colors">
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
