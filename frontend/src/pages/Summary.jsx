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
  Alert,
} from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import CloseShiftModal from "../components/kasir/CloseShiftModal";
import api from "../services/api";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiTrash2, FiCalendar } from "react-icons/fi";

const Summary = () => {
  const [shift, setShift] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCashFlowModal, setShowCashFlowModal] = useState(false);
  const [cashFlowType, setCashFlowType] = useState("in");
  const [cashFlowName, setCashFlowName] = useState("");
  const [cashFlowAmount, setCashFlowAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [shiftHistory, setShiftHistory] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [viewMode, setViewMode] = useState("current"); // 'current' or 'history'

  useEffect(() => {
    if (viewMode === "current") {
      loadCurrentShift();
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === "history" && selectedDate) {
      loadShiftHistory();
    }
  }, [selectedDate, viewMode]);

  useEffect(() => {
    if (selectedShiftId) {
      loadShiftSummary(selectedShiftId);
    }
  }, [selectedShiftId]);

  const loadCurrentShift = async () => {
    try {
      setLoading(true);
      const shiftRes = await api.get("/shifts/current");

      if (!shiftRes.data.data) {
        setShift(null);
        setSummary(null);
        return;
      }

      const shiftData = shiftRes.data.data;
      setShift(shiftData);
      setSelectedShiftId(shiftData.id);

      const summaryRes = await api.get(`/shifts/${shiftData.id}/summary`);
      setSummary(summaryRes.data.data);
    } catch (error) {
      console.error("Load summary error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadShiftHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get("/shifts/history", {
        params: { date: selectedDate }
      });
      setShiftHistory(response.data.data);
      
      // Auto-select first shift if available
      if (response.data.data.length > 0) {
        setSelectedShiftId(response.data.data[0].id);
      } else {
        setSelectedShiftId(null);
        setSummary(null);
      }
    } catch (error) {
      console.error("Load shift history error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadShiftSummary = async (shiftId) => {
    try {
      const summaryRes = await api.get(`/shifts/${shiftId}/summary`);
      setSummary(summaryRes.data.data);
      setShift(summaryRes.data.data.shift);
    } catch (error) {
      console.error("Load shift summary error:", error);
    }
  };

  const handleAddCashFlow = (type) => {
    if (shift?.status === 'closed') {
      alert('Tidak bisa menambah cash flow pada shift yang sudah ditutup');
      return;
    }
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
      loadShiftSummary(shift.id);
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
    if (shift?.status === 'closed') {
      alert('Tidak bisa menghapus cash flow pada shift yang sudah ditutup');
      return;
    }
    if (!confirm('Hapus cash flow ini? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      await api.delete(`/shifts/cash-flow/${id}`);
      loadShiftSummary(shift.id);
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

  const isCurrentShift = viewMode === "current" && shift?.status === 'open';
  const totalLaci = summary?.shift.expected_cash || 0;
  // Compute total omzet safely
  const totalOmzet = (() => {
    if (!summary) return 0;
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
                <div className="d-flex gap-2 align-items-center">
                  <Button
                    variant={viewMode === "current" ? "primary" : "outline-primary"}
                    onClick={() => setViewMode("current")}
                  >
                    Shift Aktif
                  </Button>
                  <Button
                    variant={viewMode === "history" ? "primary" : "outline-primary"}
                    onClick={() => setViewMode("history")}
                  >
                    <FiCalendar className="me-2" />
                    History
                  </Button>
                  {isCurrentShift && (
                    <Button
                      variant="danger"
                      onClick={() => setShowCloseModal(true)}
                    >
                      Tutup Shift
                    </Button>
                  )}
                </div>
              </div>

              {viewMode === "history" && (
                <Row className="mb-4">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Pilih Tanggal</Form.Label>
                      <Form.Control
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  {shiftHistory.length > 0 && (
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label>Pilih Shift</Form.Label>
                        <Form.Select
                          value={selectedShiftId || ""}
                          onChange={(e) => setSelectedShiftId(Number(e.target.value))}
                        >
                          {shiftHistory.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.kasir_name} - {formatDateTime(s.start_time)}
                              {s.end_time && ` s/d ${formatDateTime(s.end_time)}`}
                              {s.status === 'open' && ' (Masih Buka)'}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              )}

              {viewMode === "current" && !shift && (
                <Alert variant="warning">
                  Tidak ada shift aktif. Silakan buka shift terlebih dahulu.
                </Alert>
              )}

              {viewMode === "history" && shiftHistory.length === 0 && selectedDate && (
                <Alert variant="info">
                  Tidak ada shift di tanggal {selectedDate}
                </Alert>
              )}

              {summary && (
                <Row className="g-4">
                  <Col lg={4}>
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0">Total Uang di Laci</h5>
                          {shift?.status === 'closed' && (
                            <span className="badge bg-secondary">Tutup</span>
                          )}
                        </div>
                        <div className="bg-primary text-white p-4 rounded text-center">
                          <p className="mb-2">
                            {shift?.status === 'closed' ? 'Total Akhir' : 'Perkiraan Total di Laci'}
                          </p>
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
                          {shift?.status === 'closed' && (
                            <>
                              <div className="d-flex justify-content-between py-2 border-bottom">
                                <span>Uang Aktual</span>
                                <strong>
                                  {formatCurrency(summary.shift.actual_cash || 0)}
                                </strong>
                              </div>
                              <div className={`d-flex justify-content-between py-2 ${(summary.shift.difference || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                <span>Selisih</span>
                                <strong>
                                  {formatCurrency(summary.shift.difference || 0)}
                                </strong>
                              </div>
                            </>
                          )}
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
                      {isCurrentShift && (
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
                      )}

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
                                  {isCurrentShift && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-danger"
                                      onClick={() => handleDeleteCashFlow(cf.id)}
                                    >
                                      <FiTrash2 />
                                    </Button>
                                  )}
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
              )}
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
