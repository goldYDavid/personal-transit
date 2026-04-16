import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    authService
      .getCurrentUser()
      .then((currentUser) => setUser(currentUser))
      .finally(() => setLoading(false));

    const subscription = authService.onAuthStateChange((nextUser) => {
      setUser(nextUser);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
    setLoginError('');
    try {
      const loggedUser = await authService.signIn(email, password);
      setUser(loggedUser);
    } catch (error) {
      setLoginError(error.message || 'התחברות נכשלה. נסה שוב.');
    }
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
  };

  return { user, loading, login, logout, loginError };
}
