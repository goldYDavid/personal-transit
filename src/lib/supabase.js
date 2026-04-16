import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseConfig = Boolean(url && key);

export const supabase = hasSupabaseConfig
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export function getSupabaseConfigError() {
  if (!url || !key) {
    return 'חסרים פרטי התחברות של סופהבייס בהגדרות הפריסה.';
  }

  return '';
}
