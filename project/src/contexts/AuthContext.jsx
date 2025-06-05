import { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(Cookies.get("token") || null);
  const [loading, setLoading] = useState(true);

  // Memoize API instance
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: "http://localhost:5000/api",
      headers: {
        "Content-Type": "application/json",
      },
    });
    // Add token to every request if it exists
    instance.interceptors.request.use(
      (config) => {
        const t = Cookies.get("token");
        if (t) {
          config.headers.Authorization = `Bearer ${t}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    return instance;
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        setCurrentUser(null);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setCurrentUser(res.data);
      } catch (error) {
        console.error("Error loading user:", error);
        Cookies.remove("token");
        setToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
    // Only run when token changes
    // eslint-disable-next-line
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      const res = await api.post("/auth/register", userData);
      const { token: newToken, ...user } = res.data;
      setToken(newToken);
      setCurrentUser(user);
      Cookies.set("token", newToken, { expires: 30 });
      return { success: true, data: user };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      const res = await api.post("/auth/login", userData);
      const { token: newToken, ...user } = res.data;
      setToken(newToken);
      setCurrentUser(user);
      Cookies.set("token", newToken, { expires: 30 });
      return { success: true, data: user };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setToken(null);
      setCurrentUser(null);
      Cookies.remove("token");
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const res = await api.put("/users/profile", userData);
      setCurrentUser(res.data);
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Profile update failed",
      };
    }
  };

  const value = {
    currentUser,
    token,
    loading,
    isAuthenticated: !!currentUser,
    register,
    login,
    logout,
    updateProfile,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
