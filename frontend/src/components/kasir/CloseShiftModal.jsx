import { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { formatCurrency } from "../../utils/formatters";

const CloseShiftModal = ({ show, expectedCash, onHide, onConfirm }) => {
  const [actualCash, setActualCash] = useState("");
  const difference = actualCash ? parseFloat(actualCash) - expectedCash : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(actualCash);

    if (!amount || amount < 0) {
      alert("Total hitung manual harus diisi");
      return;
    }

    onConfirm(amount);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Tutup Shift</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="info">
            <h6>Total Uang Tunai Sistem:</h6>
            <h4 className="mb-0">{formatCurrency(expectedCash)}</h4>
          </Alert>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              Total Uang Tunai (Hitung Manual)
            </Form.Label>
            <Form.Control
              type="number"
              size="lg"
              placeholder="Masukkan hasil hitung manual"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              required
              autoFocus
            />
            <Form.Text className="text-muted">
              Hitung semua uang tunai di laci kasir
            </Form.Text>
          </Form.Group>

          {actualCash && (
            <Alert
              variant={
                difference === 0
                  ? "success"
                  : difference > 0
                  ? "warning"
                  : "danger"
              }
            >
              <div className="d-flex justify-content-between">
                <span>Selisih:</span>
                <strong>{formatCurrency(Math.abs(difference))}</strong>
              </div>
              <small>
                {difference === 0 && "✅ Pas! Tidak ada selisih"}
                {difference > 0 && "⚠️ Ada kelebihan uang"}
                {difference < 0 && "❌ Ada kekurangan uang"}
              </small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Batal
          </Button>
          <Button type="submit" variant="danger">
            Konfirmasi Tutup Shift
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CloseShiftModal;
