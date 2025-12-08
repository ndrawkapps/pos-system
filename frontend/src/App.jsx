import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/Login";
import Beranda from "./pages/Beranda";
import Dashboard from "./pages/Dashboard";
import Kasir from "./pages/Kasir";
import Riwayat from "./pages/Riwayat";
import Summary from "./pages/Summary";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Settings from "./pages/Settings";
import Ingredients from "./pages/Ingredients";
import Recipes from "./pages/Recipes";
import StockMovements from "./pages/StockMovements";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Beranda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kasir"
            element={
              <ProtectedRoute>
                <Kasir />
              </ProtectedRoute>
            }
          />
          <Route
            path="/riwayat"
            element={
              <ProtectedRoute>
                <Riwayat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/summary"
            element={
              <ProtectedRoute permissions={["kasir", "all"]}>
                <Summary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute permissions={["all"]}>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute permissions={["all"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute permissions={["all"]}>
                <Roles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute permissions={["all"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ingredients"
            element={
              <ProtectedRoute permissions={["all"]}>
                <Ingredients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute permissions={["all"]}>
                <Recipes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-movements"
            element={
              <ProtectedRoute permissions={["all"]}>
                <StockMovements />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
