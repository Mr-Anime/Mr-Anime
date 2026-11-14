import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase/client.js';
import { setAccessToken } from '../api/client.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

/**
 * Auth state for the whole app.
 *
 * Real mode (Supabase keys present): session + profile row.
 * Demo mode (no keys, or `setDemoUser` used): a localStorage user so the UI
 * stays fully usable without a backend.
 *
 * `user` shape: { id, email, username, avatar_url, role, verified }.
 */
const AuthContext = createContext({
  user: null,
  loading: true,
  session: null,
  isAdmin: false,
  isDemoMode: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  refreshProfile: async () => {},
  setDemoUser: () => {},
});

const PROFILE_COLUMNS = 'id, username, avatar_url, role, verified';

async function fetchProfile(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
  if (error) {
    console.warn('[auth] profile fetch failed:', error.message);
    return null;
  }
  return data;
}

function composeUser(sessionUser, profile) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    username: profile?.username || sessionUser.user_metadata?.username || sessionUser.email?.split('@')[0] || 'Anime fan',
    avatar_url: profile?.avatar_url || sessionUser.user_metadata?.avatar_url || null,
    role: profile?.role || 'user',
    verified: profile?.role === 'admin' ? true : Boolean(profile?.verified),
  };
}

export function AuthProvider({ children }) {
  const [demoUser, setDemoUserStorage] = useLocalStorage('mranime:demo-user', null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const sessionRef = useRef(null);
  sessionRef.current = session;

  // Attach the Supabase access token to /api requests (admin endpoints).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    setAccessToken(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    const loadProfile = async (sessionUser) => {
      const row = sessionUser ? await fetchProfile(sessionUser.id) : null;
      if (active) setProfile(row);
    };

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        await loadProfile(data.session?.user);
        if (active) setLoading(false);
      })
      .catch(() => active && setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null);
      loadProfile(nextSession?.user);
      if (event === 'SIGNED_OUT') setProfile(null);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const user = sessionRef.current?.user;
    if (!user) return;
    setProfile(await fetchProfile(user.id));
  }, []);

  const requireClient = () => {
    if (!supabase) throw new Error('Accounts are not configured on this deployment.');
    return supabase;
  };

  const signIn = useCallback(async (email, password) => {
    const { error } = await requireClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email, password, username) => {
    const { data, error } = await requireClient().auth.signUp({
      email,
      password,
      options: { data: { username }, emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) throw error;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await requireClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setDemoUserStorage(null);
      return;
    }
    setDemoUserStorage(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [setDemoUserStorage]);

  const resetPassword = useCallback(async (email) => {
    const { error } = await requireClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await requireClient().auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const setDemoUser = useCallback(
    (next) => {
      setDemoUserStorage(next);
    },
    [setDemoUserStorage],
  );

  const realUser = useMemo(() => (isSupabaseConfigured ? composeUser(session?.user, profile) : null), [session, profile]);
  const user = isSupabaseConfigured ? realUser : demoUser;

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAdmin: user?.role === 'admin',
      isDemoMode: !isSupabaseConfigured,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      setDemoUser,
    }),
    [user, session, loading, signIn, signUp, signInWithGoogle, signOut, resetPassword, updatePassword, refreshProfile, setDemoUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
