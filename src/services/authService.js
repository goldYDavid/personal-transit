import { supabase } from '../lib/supabase';

export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error('התחברות נכשלה. בדוק אימייל וסיסמה.');
    }

    return data.user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error('יציאה נכשלה. נסה שוב.');
    }
  },

  async getCurrentUser() {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback) {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });

    return subscription;
  }
};
