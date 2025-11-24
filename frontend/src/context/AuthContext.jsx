import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Gunakan useCallback untuk semua functions yang jadi dependencies
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await authService.getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (username, password) => {
      try {
        const response = await authService.login(username, password);
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user);
        navigate("/kasir");
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Login failed",
        };
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const hasPermission = useCallback(
    (permission) => {
      if (!user || !user.permissions) return false;
      return (
        user.permissions.includes("all") ||
        user.permissions.includes(permission)
      );
    },
    [user]
  );

  const value = {
    user,
    login,
    logout,
    loading,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export useAuth sebagai named export
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
