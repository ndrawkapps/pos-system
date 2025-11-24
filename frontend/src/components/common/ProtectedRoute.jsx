import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, permissions = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check permissions if required
  if (permissions.length > 0) {
    const hasAccess =
      user.permissions?.includes("all") ||
      permissions.some((p) => user.permissions?.includes(p));

    if (!hasAccess) {
      return <Navigate to="/kasir" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
