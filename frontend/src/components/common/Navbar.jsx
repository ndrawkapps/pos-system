import {
  Navbar as BSNavbar,
  Container,
  Nav,
  NavDropdown,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { FiUser, FiLogOut, FiLock } from "react-icons/fi";
import { FiMenu, FiSidebar } from "react-icons/fi";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <BSNavbar bg="white" expand="lg" className="shadow-sm">
      <Container fluid>
        <div className="d-flex align-items-center">
          <ButtonSidebar />
          <BSNavbar.Brand href="/kasir" className="fw-bold text-primary ms-2">
            🏪 POS System
          </BSNavbar.Brand>
        </div>

        <Nav className="ms-auto d-flex align-items-center flex-row">
          <span className="text-muted me-3">
            <small>{user?.role === "admin" ? "👑 Admin" : "👤 Kasir"}</small>
          </span>

          <NavDropdown
            title={
              <>
                <FiUser className="me-2" />
                {user?.full_name}
              </>
            }
            id="user-dropdown"
            align="end"
          >
            <NavDropdown.Item disabled>
              <small className="text-muted">{user?.username}</small>
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Open change password modal
                alert("Fitur ganti password akan segera hadir");
              }}
            >
              <FiLock className="me-2" />
              Ganti Password
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={logout} className="text-danger">
              <FiLogOut className="me-2" />
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;

function ButtonSidebar() {
  // Hamburger for mobile to open sidebar and a small button to toggle collapse
  const openSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };

  const toggleCollapse = () => {
    // dispatch a custom event for Sidebar to toggle collapsed state
    window.dispatchEvent(new Event('sidebar-toggle-collapse'));
  };

  return (
    <div className="d-flex align-items-center">
      <button className="btn btn-light btn-sm me-2 d-md-none" onClick={openSidebar} title="Toggle sidebar">
        <FiMenu />
      </button>
      <button className="btn btn-light btn-sm d-none d-md-inline" onClick={toggleCollapse} title="Toggle labels">
        <FiSidebar />
      </button>
    </div>
  );
}
