import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("syncdoc_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("syncdoc_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem("syncdoc_user", JSON.stringify(res.user));
          } else {
            logout();
          }
        } catch (err) {
          console.warn("Session expired or invalid token:", err.message);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.auth.login(email, password);
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("syncdoc_token", data.token);
        localStorage.setItem("syncdoc_user", JSON.stringify(data.user));
        return data.user;
      }
      throw new Error(data.message || "Login failed");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const data = await api.auth.register(name, email, password);
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("syncdoc_token", data.token);
        localStorage.setItem("syncdoc_user", JSON.stringify(data.user));
        return data.user;
      }
      throw new Error(data.message || "Registration failed");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("syncdoc_token");
    localStorage.removeItem("syncdoc_user");
  };

  const loginDemo = async (role = "alice") => {
    if (role === "alice") {
      return login("alice@syncdoc.dev", "password123");
    } else {
      return login("bob@syncdoc.dev", "password123");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        error,
        login,
        register,
        logout,
        loginDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
