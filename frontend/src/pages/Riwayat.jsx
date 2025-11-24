import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  Badge,
  Modal,
} from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import transactionService from "../services/transactionService";
import settingService from "../services/settingService";
import bluetoothPrinter from "../utils/bluetooth";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import { FiDownload, FiPrinter, FiEye } from "react-icons/fi";

const Riwayat = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filterType, setFilterType] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Load data dari API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [transactionsRes, settingsRes] = await Promise.all([
        transactionService.getAll(),
        settingService.getAll(),
      ]);
      setTransactions(transactionsRes.data.data);
      setSettings(settingsRes.data.data);
    } catch (error) {
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filter dengan useCallback
  const applyFilter = useCallback(() => {
    const now = new Date();
    let filtered = [...transactions];

    switch (filterType) {
      case "today":
        filtered = transactions.filter((t) => {
          const date = new Date(t.created_at);
          return date.toDateString() === now.toDateString();
        });
        break;
      case "this_month":
        filtered = transactions.filter((t) => {
          const date = new Date(t.created_at);
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        });
        break;
      case "date_range":
        if (startDate && endDate) {
          filtered = transactions.filter((t) => {
            const date = new Date(t.created_at).toISOString().split("T")[0];
            return date >= startDate && date <= endDate;
          });
        }
        break;
      case "all":
      default:
        break;
    }

    setFilteredTransactions(filtered);
  }, [filterType, transactions, startDate, endDate]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filter when dependencies change
  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const handleShowDetail = async (transaction) => {
    try {
      const response = await transactionService.getById(transaction.id);
      setSelectedTransaction(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Get transaction detail error:", error);
      alert("Gagal memuat detail transaksi");
    }
  };

  const handleReprint = async (transaction) => {
    try {
      const response = await transactionService.getById(transaction.id);
      const result = await bluetoothPrinter.printReceipt(
        response.data.data,
        settings
      );
      if (!result.success) {
        alert("Gagal mencetak: " + result.error);
      }
    } catch (error) {
      console.error("Reprint error:", error);
      alert("Gagal mencetak ulang");
    }
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "ID",
      "Tanggal",
      "Waktu",
      "Tipe",
      "No Meja",
      "Metode Bayar",
      "Total",
      "Kasir",
    ];
    const rows = filteredTransactions.map((t) => {
      const date = new Date(t.created_at);
      return [
        t.id,
        date.toLocaleDateString("id-ID"),
        date.toLocaleTimeString("id-ID"),
        t.order_type,
        t.table_number || "-",
        t.payment_method,
        t.total,
        t.kasir_name,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `riwayat_transaksi_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + parseFloat(t.total),
    0
  );

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

  return (
    <div className="app-container">
      <div className="d-flex flex-column w-100">
        <Navbar />
        <div className="d-flex flex-1">
          <Sidebar />
          <div className="content-wrapper">
            <Container fluid>
              <h2 className="mb-4">Riwayat Penjualan</h2>

              <Card className="mb-4">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={2}>
                      <Button
                        variant={
                          filterType === "today" ? "primary" : "outline-primary"
                        }
                        className="w-100"
                        onClick={() => setFilterType("today")}
                      >
                        Hari Ini
                      </Button>
                    </Col>
                    <Col md={2}>
                      <Button
                        variant={
                          filterType === "this_month"
                            ? "primary"
                            : "outline-primary"
                        }
                        className="w-100"
                        onClick={() => setFilterType("this_month")}
                      >
                        Bulan Ini
                      </Button>
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setFilterType("date_range");
                        }}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setFilterType("date_range");
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Button
                        variant={
                          filterType === "all" ? "primary" : "outline-primary"
                        }
                        className="w-100"
                        onClick={() => setFilterType("all")}
                      >
                        Semua
                      </Button>
                    </Col>
                  </Row>
                  <Row className="mt-3">
                    <Col>
                      <Button variant="success" onClick={handleExportExcel}>
                        <FiDownload className="me-2" />
                        Export Excel
                      </Button>
                    </Col>
                    <Col className="text-end">
                      <h5>
                        Total:{" "}
                        <span className="text-primary">
                          {formatCurrency(totalAmount)}
                        </span>
                      </h5>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      Tidak ada transaksi untuk filter ini
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Tanggal & Waktu</th>
                          <th>Tipe</th>
                          <th>Meja/Order</th>
                          <th>Pembayaran</th>
                          <th className="text-end">Total</th>
                          <th>Kasir</th>
                          <th className="text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td>#{transaction.id}</td>
                            <td>{formatDateTime(transaction.created_at)}</td>
                            <td>
                              <Badge bg="info">{transaction.order_type}</Badge>
                            </td>
                            <td>{transaction.table_number || "-"}</td>
                            <td>
                              <Badge
                                bg={
                                  transaction.payment_method === "Tunai"
                                    ? "success"
                                    : "primary"
                                }
                              >
                                {transaction.payment_method}
                              </Badge>
                            </td>
                            <td className="text-end fw-bold">
                              {formatCurrency(transaction.total)}
                            </td>
                            <td>{transaction.kasir_name}</td>
                            <td className="text-center">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                className="me-1"
                                onClick={() => handleShowDetail(transaction)}
                              >
                                <FiEye />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => handleReprint(transaction)}
                              >
                                <FiPrinter />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Container>
          </div>
        </div>
      </div>

      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detail Transaksi #{selectedTransaction?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Tanggal:</strong>{" "}
                  {formatDateTime(selectedTransaction.created_at)}
                </Col>
                <Col md={6}>
                  <strong>Kasir:</strong> {selectedTransaction.kasir_name}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Tipe:</strong>{" "}
                  <Badge bg="info">{selectedTransaction.order_type}</Badge>
                </Col>
                <Col md={6}>
                  <strong>Meja/Order:</strong>{" "}
                  {selectedTransaction.table_number || "-"}
                </Col>
              </Row>
              {selectedTransaction.transaction_note && (
                <Row className="mb-3">
                  <Col>
                    <strong>Catatan:</strong>{" "}
                    {selectedTransaction.transaction_note}
                  </Col>
                </Row>
              )}

              <Table bordered className="mt-3">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Harga</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransaction.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        {item.product_name}
                        {item.item_note && (
                          <div className="small text-muted">
                            📝 {item.item_note}
                          </div>
                        )}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">{formatCurrency(item.price)}</td>
                      <td className="text-end">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  <tr className="table-active">
                    <td colSpan={3} className="text-end fw-bold">
                      Total:
                    </td>
                    <td className="text-end fw-bold">
                      {formatCurrency(selectedTransaction.total)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-end">
                      Bayar via {selectedTransaction.payment_method}:
                    </td>
                    <td className="text-end">
                      {formatCurrency(selectedTransaction.paid_amount)}
                    </td>
                  </tr>
                  {selectedTransaction.payment_method === "Tunai" && (
                    <tr>
                      <td colSpan={3} className="text-end">
                        Kembalian:
                      </td>
                      <td className="text-end">
                        {formatCurrency(selectedTransaction.change_amount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Tutup
          </Button>
          <Button
            variant="primary"
            onClick={() => handleReprint(selectedTransaction)}
          >
            <FiPrinter className="me-2" />
            Cetak Ulang
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Riwayat;
