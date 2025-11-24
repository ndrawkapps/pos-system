import { Container } from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

const Dashboard = () => {
  return (
    <div className="app-container">
      <div className="d-flex flex-column w-100">
        <Navbar />
        <div className="d-flex flex-1">
          <Sidebar />
          <div className="content-wrapper">
            <Container fluid>
              <h2 className="mb-4">Dashboard</h2>
              <div className="alert alert-info">
                <h5>Selamat Datang di POS System! 👋</h5>
                <p className="mb-0">
                  Gunakan menu di samping untuk mengakses fitur-fitur yang
                  tersedia. Untuk memulai transaksi, klik menu{" "}
                  <strong>Kasir</strong>.
                </p>
              </div>
            </Container>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
