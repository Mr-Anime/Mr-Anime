import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

/**
 * TEMPORARY auth stub (Module 2 UI). Replaced by the Supabase-backed
 * AuthProvider in Module 4. Exposes the same `user` / `signOut` shape so
 * layout components do not need to change later.
 */
const AuthContext = createContext({
  user: null,
  loading: false,
  signOut: async () => {},
  setDemoUser: () => {},
});

export function AuthProvider({ children }) {
  const [demoUser, setDemoUser] = useLocalStorage('mranime:demo-user', null);

  const value = {
    user: demoUser,
    loading: false,
    isAdmin: demoUser?.role === 'admin',
    setDemoUser,
    signOut: async () => setDemoUser(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
