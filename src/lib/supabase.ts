/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eiazhoenrxdvroolvluf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_D9NH6cqtLyiDtE6uyMGWMQ_PJ0BFjrv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
