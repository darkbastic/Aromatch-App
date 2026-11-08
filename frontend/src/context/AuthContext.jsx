import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { clearAuthTokens, getAccessToken } from "../services/api";
import { authService } from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const loadUserProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoadingAuth(false);
      return null;
    }

    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch {
      clearAuthTokens();
      setUser(null);
      return null;
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener("aromatch:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("aromatch:auth-expired", handleAuthExpired);
    };
  }, []);

  const login = useCallback(async ({ username, password }) => {
    await authService.login({ username, password });
    const profile = await authService.getProfile();
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(async (registrationData) => {
    const createdUser = await authService.register(registrationData);
    return createdUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loadingAuth,
      login,
      register,
      logout,
      updateProfile,
      refreshUser: loadUserProfile,
    }),
    [user, loadingAuth, login, register, logout, updateProfile, loadUserProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

