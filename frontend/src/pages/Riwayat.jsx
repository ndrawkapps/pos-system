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
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
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

    // Filter by date
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

    // Filter by order type
    if (orderTypeFilter !== "all") {
      filtered = filtered.filter((t) => t.order_type === orderTypeFilter);
    }

    // Filter by payment method
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((t) => t.payment_method === paymentMethodFilter);
    }

    setFilteredTransactions(filtered);
  }, [filterType, transactions, startDate, endDate, orderTypeFilter, paymentMethodFilter]);

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
        alert(`Gagal mencetak: ${result.error}\n\nPastikan printer terhubung di halaman Settings.`);
      } else {
        alert("Berhasil mencetak ulang!");
      }
    } catch (error) {
      console.error("Reprint error:", error);
      alert(`Gagal mencetak ulang: ${error.message}\n\nPastikan printer terhubung di halaman Settings.`);
    }
  };

  const handleExportExcel = async () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    setLoading(true);
    try {
      // fetch full details for each transaction so we have items
      const detailsPromises = filteredTransactions.map(async (t) => {
        try {
          const res = await transactionService.getById(t.id);
          return res.data.data;
        } catch (err) {
          // fallback to summary object if detail call fails
          return { ...t, items: t.items || [] };
        }
      });

      const detailedTx = await Promise.all(detailsPromises);

      // Desired CSV format: one row per item with order-level fields repeated
      const headers = [
        "ID Pesanan",
        "Tanggal",
        "Waktu",
        "Tipe Pesanan",
        "No Meja/Order",
        "Metode Pembayaran",
        "Nama Menu",
        "QTY",
        "Harga Satuan",
        "Subtotal",
        "Total Pesanan",
      ];

      const csvLines = [];
      csvLines.push(headers.join(","));

      detailedTx.forEach((t) => {
        const date = new Date(t.created_at);
        const dateStr = date.toLocaleDateString("id-ID");
        const timeStr = date
          .toLocaleTimeString("id-ID", { hour12: false })
          .replace(/:/g, ".");

        const totalPesanan = Math.round(parseFloat(t.total) || 0);

        (t.items || []).forEach((item) => {
          const harga = Math.round(parseFloat(item.price) || 0);
          const subtotal = Math.round(parseFloat(item.subtotal) || 0);

          const row = [
            `${t.id}`,
            dateStr,
            timeStr,
            t.order_type,
            t.table_number || "",
            t.payment_method,
            item.product_name,
            `${item.quantity}`,
            `${harga}`,
            `${subtotal}`,
            `${totalPesanan}`,
          ];

          csvLines.push(row.map((c) => `"${c}"`).join(","));
        });
      });

      const csvContent = csvLines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `detail_penjualan_shift_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
      alert("Terjadi kesalahan saat mengekspor. Coba lagi.");
    } finally {
      setLoading(false);
    }
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
                  <Row className="g-2 align-items-center flex-wrap">
                    <Col xs={12} sm={6} md="auto" className="mb-2 mb-md-0">
                      <Form.Select
                        size="sm"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ minWidth: "150px" }}
                      >
                        <option value="today">Hari Ini</option>
                        <option value="this_month">Bulan Ini</option>
                        <option value="date_range">Pilih Tanggal</option>
                        <option value="all">Semua Periode</option>
                      </Form.Select>
                    </Col>

                    {filterType === "date_range" && (
                      <>
                        <Col xs={12} sm={6} md="auto" className="mb-2 mb-md-0">
                          <Form.Control
                            type="date"
                            size="sm"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="Dari"
                          />
                        </Col>

                        <Col xs={12} sm={6} md="auto" className="mb-2 mb-md-0">
                          <Form.Control
                            type="date"
                            size="sm"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="Sampai"
                          />
                        </Col>
                      </>
                    )}

                    <Col xs={12} sm={6} md="auto" className="mb-2 mb-md-0">
                      <Form.Select
                        size="sm"
                        value={orderTypeFilter}
                        onChange={(e) => setOrderTypeFilter(e.target.value)}
                        style={{ minWidth: "150px" }}
                      >
                        <option value="all">Semua Tipe</option>
                        <option value="Dine-In">Dine-In</option>
                        <option value="Take Away">Take Away</option>
                        <option value="GoFood">GoFood</option>
                        <option value="GrabFood">GrabFood</option>
                        <option value="ShopeeFood">ShopeeFood</option>
                      </Form.Select>
                    </Col>

                    <Col xs={12} sm={6} md="auto" className="mb-2 mb-md-0">
                      <Form.Select
                        size="sm"
                        value={paymentMethodFilter}
                        onChange={(e) => setPaymentMethodFilter(e.target.value)}
                        style={{ minWidth: "150px" }}
                      >
                        <option value="all">Semua Pembayaran</option>
                        <option value="Tunai">Tunai</option>
                        <option value="QRIS">QRIS</option>
                        <option value="Online Order">Online Order</option>
                        <option value="Pink99">Pink99</option>
                        <option value="Kedai">Kedai</option>
                        <option value="Bpk/Ibu">Bpk/Ibu</option>
                      </Form.Select>
                    </Col>

                    <Col xs="auto" className="text-end ms-auto">
                      <Button variant="success" onClick={handleExportExcel} size="sm">
                        <FiDownload className="me-2" /> Export Excel
                      </Button>
                    </Col>
                  </Row>
                  <Row className="mt-3">
                    <Col />
                    <Col className="text-end">
                      <h5>
                        Total: {" "}
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
                <Col md={12}>
                  <strong>ID Transaksi:</strong> #{selectedTransaction.id}
                </Col>
              </Row>
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
