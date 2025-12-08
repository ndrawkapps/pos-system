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
        // Save user data to localStorage as backup
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } catch (error) {
        console.log("Auth check error:", error.response?.status, error.message);
        
        // If 401, token is genuinely invalid - clear everything and force re-login
        if (error.response?.status === 401) {
          console.log("Token invalid (401), clearing auth data");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setLoading(false);
          return; // Exit early, let ProtectedRoute handle redirect
        }
        
        // For network errors or cold starts, try to use cached user data
        console.log("Network/cold start error, attempting to use cached user data");
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            console.log("Using cached user:", parsedUser.username);
            setUser(parsedUser);
          } catch (e) {
            console.error("Failed to parse cached user", e);
            // If cache is corrupted, clear everything
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
          }
        }
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
        const token = response.data.token;
        const userData = response.data.user;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        // Small delay to ensure state is updated before navigation
        await new Promise((resolve) => setTimeout(resolve, 100));

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
    localStorage.removeItem("user");
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

  const isAdmin = useCallback(() => {
    return user && user.role_id === 1;
  }, [user]);

  const value = {
    user,
    login,
    logout,
    loading,
    hasPermission,
    isAdmin,
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
