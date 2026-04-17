import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);
const storedToken = localStorage.getItem("donutrain-token");

export function AuthProvider({ children }) {
  const [token, setToken] = useState(storedToken || "");
  const [user, setUser] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(Boolean(storedToken));
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      localStorage.setItem("donutrain-token", token);
      refreshBalance(token).finally(() => setLoading(false));
    } else {
      localStorage.removeItem("donutrain-token");
      setUser(null);
      setRecentGames([]);
      setLoading(false);
    }
  }, [token]);

  async function refreshBalance(activeToken = token) {
    if (!activeToken) {
      return null;
    }

    try {
      const data = await api.getBalance(activeToken);
      setUser(data.user);
      setRecentGames(data.recentGames);
      setError("");
      return data;
    } catch (requestError) {
      // Clear stale/expired sessions quietly so the login form only shows
      // real login errors rather than background token refresh failures.
      setError("");
      setToken("");
      throw requestError;
    }
  }

  async function register(payload) {
    const data = await api.register(payload);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function login(payload) {
    const data = await api.login(payload);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    setToken("");
    setUser(null);
    setRecentGames([]);
  }

  async function saveClientSeed(clientSeed) {
    const data = await api.updateClientSeed(token, clientSeed);
    setUser((currentUser) => ({ ...currentUser, ...data.user }));
    return data.user;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        recentGames,
        loading,
        error,
        setError,
        setUser,
        setRecentGames,
        register,
        login,
        logout,
        refreshBalance,
        saveClientSeed
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
