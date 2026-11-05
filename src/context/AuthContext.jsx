import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);
const initial = { profile: null, user: null, loading: true, error: null };

export function AuthProvider({ children }) {
  const [state, setState] = useState(initial);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    let request = 0;
    let authEventSeen = false;
    const timers = new Set();

    async function load(session, ticket) {
      if (!active || ticket !== request) return;
      const user = session?.user || null;
      if (!user) {
        setState({ profile: null, user: null, loading: false, error: null });
        return;
      }
      setState({ profile: null, user, loading: true, error: null });
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (error) throw error;
        if (active && ticket === request) setState({ profile: data, user, loading: false, error: null });
      } catch {
        if (active && ticket === request) setState({ profile: null, user, loading: false, error: 'profile_unavailable' });
      }
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventSeen = true;
      const ticket = ++request;
      // Leave the auth callback before issuing another Supabase request.
      const timer = setTimeout(() => { timers.delete(timer); load(session, ticket); }, 0);
      timers.add(timer);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || authEventSeen) return;
      if (error) throw error;
      return load(data.session, ++request);
    }).catch(() => {
      if (active && !authEventSeen) setState({ ...initial, loading: false, error: 'session_unavailable' });
    });

    return () => {
      active = false;
      ++request;
      timers.forEach(clearTimeout);
      data.subscription.unsubscribe();
    };
  }, [revision]);

  function retryProfile() {
    setState(initial);
    setRevision(value => value + 1);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return <AuthContext.Provider value={{ ...state, retryProfile, logout }}>{children}</AuthContext.Provider>;
}

// Existing screens and hooks share this public context API.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
