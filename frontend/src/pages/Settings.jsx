import { Container, Row, Col, Card, Alert } from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import PrinterSettings from "../components/settings/PrinterSettings";
import ProfileSettings from "../components/settings/ProfileSettings";
import bluetoothPrinter from "../utils/bluetooth";
import { useAuth } from "../context/AuthContext";
import { FiInfo } from "react-icons/fi";

const Settings = () => {
  const { hasPermission } = useAuth();
  const canAccessAllSettings = hasPermission('all');
  const canAccessPrinter = hasPermission('settings_printer') || canAccessAllSettings;

  return (
    <div className="app-container">
      <div className="d-flex flex-column w-100">
        <Navbar />
        <div className="d-flex flex-1">
          <Sidebar />
          <div className="content-wrapper">
            <Container fluid>
              <div className="mb-4">
                <h2 className="mb-1">Pengaturan Aplikasi</h2>
                <p className="text-muted mb-0">
                  {canAccessAllSettings 
                    ? 'Konfigurasi printer, profile toko, dan pengaturan sistem'
                    : 'Konfigurasi printer untuk cetak struk'}
                </p>
              </div>

              <Row className="g-4">
                {canAccessPrinter && (
                  <Col lg={canAccessAllSettings ? 6 : 12}>
                    <PrinterSettings />
                  </Col>
                )}

                {canAccessAllSettings && (
                  <Col lg={6}>
                    <ProfileSettings />
                  </Col>
                )}
              </Row>

              {canAccessAllSettings && (
                <Row className="mt-4">
                  <Col>
                    <Card>
                      <Card.Header className="bg-white">
                        <FiInfo className="me-2" />
                        Informasi Sistem
                      </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <strong className="d-block text-muted mb-1">
                              Browser
                            </strong>
                            <span className="badge bg-primary">
                              {navigator.userAgent.includes("Chrome") &&
                              !navigator.userAgent.includes("Edge")
                                ? "Google Chrome"
                                : navigator.userAgent.includes("Edge")
                                ? "Microsoft Edge"
                                : navigator.userAgent.includes("Firefox")
                                ? "Mozilla Firefox"
                                : navigator.userAgent.includes("Safari")
                                ? "Safari"
                                : "Unknown"}
                            </span>
                          </div>

                          <div className="mb-3">
                            <strong className="d-block text-muted mb-1">
                              Web Bluetooth Support
                            </strong>
                            {bluetoothPrinter.isSupported() ? (
                              <span className="badge bg-success">
                                ✅ Supported
                              </span>
                            ) : (
                              <span className="badge bg-danger">
                                ❌ Not Supported
                              </span>
                            )}
                          </div>

                          <div className="mb-3">
                            <strong className="d-block text-muted mb-1">
                              Platform
                            </strong>
                            <span className="badge bg-secondary">
                              {navigator.platform}
                            </span>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className="mb-3">
                            <strong className="d-block text-muted mb-1">
                              API URL
                            </strong>
                            <code className="small bg-light p-2 rounded d-block">
                              {import.meta.env.VITE_API_URL ||
                                "http://localhost:5000/api"}
                            </code>
                          </div>

                          <div className="mb-3">
                            <strong className="d-block text-muted mb-1">
                              Environment
                            </strong>
                            <span
                              className={`badge ${
                                import.meta.env.MODE === "production"
                                  ? "bg-success"
                                  : "bg-warning"
                              }`}
                            >
                              {import.meta.env.MODE.toUpperCase()}
                            </span>
                          </div>

                          <div className="mb-3">
                            <strong className="d-block text-muted mb-1">
                              Version
                            </strong>
                            <span className="badge bg-info">v1.0.0</span>
                          </div>
                        </Col>
                      </Row>

                      <Alert variant="light" className="mb-0 mt-3 border">
                        <div className="small">
                          <strong>Catatan Penting:</strong>
                          <ul className="mb-0 mt-2">
                            <li>
                              Untuk penggunaan optimal, gunakan browser{" "}
                              <strong>Chrome</strong> atau <strong>Edge</strong>
                            </li>
                            <li>
                              Fitur Bluetooth printing memerlukan{" "}
                              <strong>HTTPS</strong> di production (atau
                              localhost untuk development)
                            </li>
                            <li>
                              Pastikan thermal printer mendukung{" "}
                              <strong>ESC/POS</strong> commands
                            </li>
                            <li>
                              Simpan pengaturan secara berkala untuk menghindari
                              kehilangan data
                            </li>
                          </ul>
                        </div>
                      </Alert>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              )}

              {canAccessAllSettings && (
              <Row className="mt-4">
                <Col>
                  <Card className="border-primary">
                    <Card.Body>
                      <h6 className="text-primary mb-3">💡 Tips Penggunaan</h6>
                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <div className="fw-bold mb-1">🖨️ Setup Printer</div>
                            <small className="text-muted">
                              Hubungkan printer Bluetooth sekali saja. Koneksi
                              akan tersimpan untuk transaksi berikutnya.
                            </small>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <div className="fw-bold mb-1">📝 Profile Toko</div>
                            <small className="text-muted">
                              Update nama dan alamat toko untuk tampil di setiap
                              struk pembayaran customer.
                            </small>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <div className="fw-bold mb-1">🔄 Backup Data</div>
                            <small className="text-muted">
                              Export riwayat transaksi secara berkala dari menu
                              Riwayat untuk backup data.
                            </small>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              )}
            </Container>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
