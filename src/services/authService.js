import { getSupabaseClient, hasSupabaseConfig } from '../lib/supabase';

function requireSupabaseClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('חסרים משתני Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }
  return client;
}

export const authService = {
  async signIn(email, password) {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error('התחברות נכשלה. בדוק אימייל וסיסמה.');
    }

    return data.user;
  },

  async signOut() {
    const supabase = requireSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error('יציאה נכשלה. נסה שוב.');
    }
  },

  async getCurrentUser() {
    if (!hasSupabaseConfig()) {
      return null;
    }

    const supabase = requireSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback) {
    if (!hasSupabaseConfig()) {
      return { unsubscribe: () => {} };
    }

    const supabase = requireSupabaseClient();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });

    return subscription;
  }
};
