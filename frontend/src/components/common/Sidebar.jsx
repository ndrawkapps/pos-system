import { Nav, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FiHome,
  FiShoppingCart,
  FiClock,
  FiBarChart2,
  FiBox,
  FiGrid,
  FiUsers,
  FiShield,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const { hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', collapsed ? 'true' : 'false');
    } catch (e) {}
  }, [collapsed]);

  // Listen for global collapse toggle (from Navbar)
  useEffect(() => {
    const handler = () => setCollapsed(c => !c);
    window.addEventListener('sidebar-toggle-collapse', handler);
    return () => window.removeEventListener('sidebar-toggle-collapse', handler);
  }, []);

  const menuItems = [
    {
      path: "/",
      label: "Beranda",
      icon: <FiHome />,
      permission: "all",
    },
    {
      path: "/kasir",
      label: "Kasir",
      icon: <FiShoppingCart />,
      permission: "kasir",
    },
    {
      path: "/riwayat",
      label: "Riwayat",
      icon: <FiClock />,
      permission: "riwayat",
    },
    {
      path: "/summary",
      label: "Summary",
      icon: <FiBarChart2 />,
      permission: "all",
    },
    {
      path: "/products",
      label: "Produk",
      icon: <FiBox />,
      permission: "products_view",
    },
    {
      path: "/categories",
      label: "Kategori",
      icon: <FiGrid />,
      permission: "all",
    },
    { path: "/users", label: "User", icon: <FiUsers />, permission: "all" },
    { path: "/roles", label: "Role", icon: <FiShield />, permission: "all" },
    {
      path: "/settings",
      label: "Pengaturan",
      icon: <FiSettings />,
      permission: "all",
    },
  ];

  return (
    <div
      className={`sidebar bg-white border-end ${collapsed ? 'collapsed' : ''}`}
      style={{ minHeight: '100vh' }}
    >
      <div className="sidebar-top d-flex align-items-center justify-content-between p-2 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <strong className="ms-2 d-none d-md-inline">POS</strong>
        </div>
        <div className="d-flex align-items-center">
          <Button
            size="sm"
            variant="light"
            className="me-2 d-none d-md-inline"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Show labels' : 'Hide labels'}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </Button>
          <Button
            size="sm"
            variant="light"
            className="d-md-none"
            onClick={() => document.body.classList.remove('sidebar-open')}
            title="Close"
          >
            <FiX />
          </Button>
        </div>
      </div>

      <Nav className="flex-column p-3">
        {menuItems.map(
          (item) =>
            hasPermission(item.permission) && (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center py-3 ${
                    isActive ? 'bg-primary text-white' : 'text-dark'
                  }`
                }
                style={({ isActive }) => ({
                  borderRadius: '8px',
                  marginBottom: '5px',
                  fontWeight: isActive ? 'bold' : 'normal',
                })}
              >
                <span className="me-3 fs-5">{item.icon}</span>
                <span className="label">{item.label}</span>
              </NavLink>
            )
        )}
      </Nav>
    </div>
  );
};

export default Sidebar;
