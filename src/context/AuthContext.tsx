import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'accountant' | 'sales' | 'inventory' | 'custom';
  permissions: Record<string, boolean>;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<string | null>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signIn: async () => null,
  signOut: () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const buildUser = (profile: any): CurrentUser => ({
  id: profile.id,
  username: profile.username,
  name: profile.name,
  role: profile.role,
  permissions: profile.permissions || {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) {
      const user = buildUser(data);
      setCurrentUser(user);
      localStorage.setItem('daftra_session_user', JSON.stringify(user));
    } else {
      setCurrentUser(null);
      localStorage.removeItem('daftra_session_user');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        localStorage.removeItem('daftra_session_user');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (username: string, password: string): Promise<string | null> => {
    const { data: profile, error: profileError } = await supabase
      .rpc('get_profile_for_login', { p_username: username.trim().toLowerCase() });

    if (profileError || !profile || profile.length === 0) {
      return 'اسم المستخدم أو كلمة المرور غير صحيحة';
    }

    const userProfile = profile[0];
    const email = userProfile.email || `${userProfile.username}@daftra.local`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message?.includes('Invalid login')) {
        return 'اسم المستخدم أو كلمة المرور غير صحيحة';
      }
      return 'خطأ في الاتصال بقاعدة البيانات';
    }

    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('daftra_session_user');
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!currentUser) return;
    await fetchProfile(currentUser.id);
  }, [currentUser, fetchProfile]);

  return (
    <AuthContext.Provider value={{ currentUser, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
