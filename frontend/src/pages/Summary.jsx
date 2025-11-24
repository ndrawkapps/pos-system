import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  ListGroup,
  Modal,
} from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import CloseShiftModal from "../components/kasir/CloseShiftModal";
import api from "../services/api";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiTrash2 } from "react-icons/fi";

const Summary = () => {
  const [shift, setShift] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCashFlowModal, setShowCashFlowModal] = useState(false);
  const [cashFlowType, setCashFlowType] = useState("in");
  const [cashFlowName, setCashFlowName] = useState("");
  const [cashFlowAmount, setCashFlowAmount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const shiftRes = await api.get("/shifts/current");

      if (!shiftRes.data.data) {
        alert("Tidak ada shift aktif");
        return;
      }

      const shiftData = shiftRes.data.data;
      setShift(shiftData);

      const summaryRes = await api.get(`/shifts/${shiftData.id}/summary`);
      setSummary(summaryRes.data.data);
    } catch (error) {
      console.error("Load summary error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCashFlow = (type) => {
    setCashFlowType(type);
    setCashFlowName("");
    setCashFlowAmount("");
    setShowCashFlowModal(true);
  };

  const handleSubmitCashFlow = async () => {
    if (!cashFlowName || !cashFlowAmount) {
      alert("Nama dan jumlah harus diisi");
      return;
    }

    try {
      await api.post("/shifts/cash-flow", {
        shift_id: shift.id,
        type: cashFlowType,
        name: cashFlowName,
        amount: parseFloat(cashFlowAmount),
      });

      setShowCashFlowModal(false);
      loadData();
    } catch (error) {
      console.error("Add cash flow error:", error);
      alert("Gagal menambahkan cash flow");
    }
  };

  const handleCloseShift = async (actualCash) => {
    try {
      await api.post("/shifts/close", {
        shift_id: shift.id,
        actual_cash: actualCash,
      });

      alert("Shift berhasil ditutup");
      window.location.href = "/kasir";
    } catch (error) {
      console.error("Close shift error:", error);
      alert(
        "Gagal menutup shift: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDeleteCashFlow = async (id) => {
    if (!confirm('Hapus cash flow ini? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      await api.delete(`/shifts/cash-flow/${id}`);
      loadData();
    } catch (error) {
      console.error('Delete cash flow error:', error);
      alert('Gagal menghapus cash flow');
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!shift || !summary) {
    return (
      <div className="app-container">
        <div className="d-flex flex-column w-100">
          <Navbar />
          <div className="d-flex flex-1">
            <Sidebar />
            <div className="content-wrapper">
              <Container>
                <div className="alert alert-warning mt-5">
                  Tidak ada shift aktif. Silakan buka shift terlebih dahulu.
                </div>
              </Container>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalLaci = summary.shift.expected_cash;
  // Compute total omzet safely: prefer summing the payments array,
  // fallback to numeric fields on the shift object if present.
  const totalOmzet = (() => {
    if (Array.isArray(summary.payments) && summary.payments.length > 0) {
      return summary.payments.reduce((sum, p) => {
        const val = Number(p.total);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
    }
    const cash = Number(summary.shift.total_cash) || 0;
    const nonCash = Number(summary.shift.total_non_cash) || 0;
    return cash + nonCash;
  })();

  return (
    <div className="app-container">
      <div className="d-flex flex-column w-100">
        <Navbar />
        <div className="d-flex flex-1">
          <Sidebar />
          <div className="content-wrapper">
            <Container fluid>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Summary Shift</h2>
                <Button
                  variant="danger"
                  onClick={() => setShowCloseModal(true)}
                >
                  Tutup Shift
                </Button>
              </div>

              <Row className="g-4">
                <Col lg={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <h5 className="mb-3">Total Uang di Laci</h5>
                      <div className="bg-primary text-white p-4 rounded text-center">
                        <p className="mb-2">Perkiraan Total di Laci</p>
                        <h2 className="mb-0">{formatCurrency(totalLaci)}</h2>
                      </div>

                      <div className="mt-4">
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <span>Uang Modal</span>
                          <strong>
                            {formatCurrency(summary.shift.modal_awal)}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <span>Omzet Tunai</span>
                          <strong>
                            {formatCurrency(summary.shift.total_cash)}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom text-success">
                          <span>(+) Pemasukan</span>
                          <strong>
                            {formatCurrency(summary.shift.cash_in)}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom text-danger">
                          <span>(-) Pengeluaran</span>
                          <strong>
                            {formatCurrency(summary.shift.cash_out)}
                          </strong>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <h5 className="mb-3">Rincian Pembayaran</h5>
                      {summary.payments.length === 0 ? (
                        <div className="text-center text-muted py-5">
                          Belum ada transaksi
                        </div>
                      ) : (
                        <ListGroup variant="flush">
                          {summary.payments.map((payment, idx) => (
                            <ListGroup.Item
                              key={idx}
                              className="d-flex justify-content-between"
                            >
                              <span>{payment.payment_method}</span>
                              <strong>{formatCurrency(payment.total)}</strong>
                            </ListGroup.Item>
                          ))}
                          <ListGroup.Item className="d-flex justify-content-between bg-light">
                            <span className="fw-bold">Total Omzet</span>
                            <strong className="text-primary">
                              {formatCurrency(totalOmzet)}
                            </strong>
                          </ListGroup.Item>
                        </ListGroup>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <h5 className="mb-3">Pemasukan / Pengeluaran</h5>
                      <div className="d-grid gap-2 mb-3">
                        <Button
                          variant="success"
                          onClick={() => handleAddCashFlow("in")}
                        >
                          <FiTrendingUp className="me-2" />
                          Tambah Pemasukan
                        </Button>
                        <Button
                          variant="warning"
                          onClick={() => handleAddCashFlow("out")}
                        >
                          <FiTrendingDown className="me-2" />
                          Tambah Pengeluaran
                        </Button>
                      </div>

                      <ListGroup
                        variant="flush"
                        style={{ maxHeight: "400px", overflowY: "auto" }}
                      >
                        {summary.cashFlows.length === 0 ? (
                          <div className="text-center text-muted py-3">
                            Belum ada cash flow
                          </div>
                        ) : (
                          summary.cashFlows.map((cf, idx) => (
                            <ListGroup.Item key={idx}>
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <div className="fw-bold">{cf.name}</div>
                                  <small className="text-muted">
                                    {formatDateTime(cf.created_at)}
                                  </small>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <strong
                                    className={
                                      cf.type === "in"
                                        ? "text-success"
                                        : "text-danger"
                                    }
                                  >
                                    {cf.type === "in" ? "+" : "-"} {" "}
                                    {formatCurrency(cf.amount)}
                                  </strong>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger"
                                    onClick={() => handleDeleteCashFlow(cf.id)}
                                  >
                                    <FiTrash2 />
                                  </Button>
                                </div>
                              </div>
                            </ListGroup.Item>
                          ))
                        )}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </div>
        </div>
      </div>

      <CloseShiftModal
        show={showCloseModal}
        expectedCash={totalLaci}
        onHide={() => setShowCloseModal(false)}
        onConfirm={handleCloseShift}
      />

      <Modal
        show={showCashFlowModal}
        onHide={() => setShowCashFlowModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {cashFlowType === "in" ? "+ Pemasukan" : "- Pengeluaran"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nama Transaksi</Form.Label>
            <Form.Control
              placeholder="Misal: Beli Galon"
              value={cashFlowName}
              onChange={(e) => setCashFlowName(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Jumlah (Rp)</Form.Label>
            <Form.Control
              type="number"
              placeholder="0"
              value={cashFlowAmount}
              onChange={(e) => setCashFlowAmount(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCashFlowModal(false)}
          >
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmitCashFlow}>
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Summary;
