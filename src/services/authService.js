import { supabase, getSupabaseConfigError } from '../lib/supabase';

function ensureSupabase() {
  if (!supabase) {
    throw new Error(getSupabaseConfigError() || 'סופהבייס לא הוגדר.');
  }
}

export const authService = {
  async signIn(email, password) {
    ensureSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error('התחברות נכשלה. בדוק אימייל וסיסמה.');
    }

    return data.user;
  },

  async signOut() {
    ensureSupabase();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error('יציאה נכשלה. נסה שוב.');
    }
  },

  async getCurrentUser() {
    ensureSupabase();

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      if (error.message?.includes('Auth session missing')) {
        return null;
      }

      throw error;
    }

    return user;
  },

  onAuthStateChange(callback) {
    if (!supabase) {
      return {
        unsubscribe() {}
      };
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });

    return subscription;
  }
};
    return user;
  },

  onAuthStateChange(callback) {
    if (!supabase) {
      return {
        unsubscribe() {}
      };
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });

    return subscription;
  }
};
