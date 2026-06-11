import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

// Global auth state: which user is logged in, plus login/register/logout actions.
// Any component can read it with: const { user } = useAuth();
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check the cookie on first load

  // On app start, ask the server "who am I?".
  // We can't read the HTTP-only cookie from JS (that's the point),
  // so the server checks it for us.
  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const register = async (username, email, password) => {
    // Send the browser's timezone so the server counts days/streaks
    // at the user's real midnight (important for non-UTC users).
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await api.post('/auth/register', { username, email, password, timezone });
    setUser(res.data.user);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
