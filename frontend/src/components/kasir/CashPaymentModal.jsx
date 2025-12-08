import { useState, useMemo } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { formatCurrency } from "../../utils/formatters";

const CashPaymentModal = ({ show, total, onHide, onConfirm, paymentMethod = "Tunai" }) => {
  const [paidAmount, setPaidAmount] = useState("");

  const NOMINALS = [
    2000, 5000, 10000, 12000, 15000, 20000, 25000, 50000, 75000, 100000,
  ];

  // Calculate change using useMemo (tidak pakai useEffect)
  const change = useMemo(() => {
    const paid = parseFloat(paidAmount) || 0;
    return paid - total;
  }, [paidAmount, total]);

  // Generate suggested nominals
  const suggestedNominals = useMemo(() => {
    const suggestions = new Set();

    // Tambah total exact
    suggestions.add(total);

    // Pembulatan ke 5000
    const round5k = Math.ceil(total / 5000) * 5000;
    if (round5k > total) suggestions.add(round5k);

    // Pembulatan ke 10000
    const round10k = Math.ceil(total / 10000) * 10000;
    if (round10k > total) suggestions.add(round10k);

    // Tambah nominals yang lebih besar dari total
    NOMINALS.forEach((nominal) => {
      if (nominal >= total) suggestions.add(nominal);
    });

    // Sort dan ambil 8 pertama
    return Array.from(suggestions)
      .filter((s) => s >= total)
      .sort((a, b) => a - b)
      .slice(0, 8);
  }, [total]);

  const handleNominalClick = (nominal) => {
    setPaidAmount(nominal.toString());
  };

  const handleConfirm = () => {
    const paid = parseFloat(paidAmount) || 0;
    if (paid < total) {
      alert("Uang yang dibayarkan tidak mencukupi!");
      return;
    }
    onConfirm(paid);
  };

  // Reset form ketika modal ditutup
  const handleHide = () => {
    setPaidAmount("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Pembayaran {paymentMethod}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="bg-primary text-white p-3 rounded mb-3">
          <div className="text-center">
            <small>Total Tagihan</small>
            <h3 className="mb-0">{formatCurrency(total)}</h3>
          </div>
        </div>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">
            Uang Diterima dari Customer
          </Form.Label>
          <Form.Control
            type="number"
            size="lg"
            placeholder="Masukkan jumlah uang"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            autoFocus
          />
        </Form.Group>

        <div className="mb-3">
          <small className="text-muted fw-bold">Rekomendasi Nominal:</small>
          <Row className="g-2 mt-2">
            {suggestedNominals.map((nominal) => (
              <Col key={nominal} xs={4}>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={() => handleNominalClick(nominal)}
                >
                  {formatCurrency(nominal)}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        <div
          className={`p-3 rounded ${
            change >= 0 ? "bg-success" : "bg-danger"
          } text-white`}
        >
          <div className="d-flex justify-content-between align-items-center">
            <span>Kembalian:</span>
            <h4 className="mb-0 fw-bold">
              {formatCurrency(change >= 0 ? change : 0)}
            </h4>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleHide}>
          Batal
        </Button>
        <Button variant="success" onClick={handleConfirm} disabled={change < 0}>
          Konfirmasi Pembayaran
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CashPaymentModal;
