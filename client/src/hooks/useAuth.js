import { useState, useEffect } from "react";
import * as authApi from "../api/auth.js";

const TOKEN_KEY = "agribridge_token";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = async (phoneE164, password) => {
    const data = await authApi.login(phoneE164, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name, phoneE164, messagingConsent) =>
    authApi.signup(name, phoneE164, messagingConsent);

  const verifyStart = (phoneE164) => authApi.verifyStart(phoneE164);

  // On success for farmer/broker, response includes a token → treat as login.
  const verifyCheck = async (phoneE164, code) => {
    const data = await authApi.verifyCheck(phoneE164, code);
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    signup,
    verifyStart,
    verifyCheck,
  };
}
