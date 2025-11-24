import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { formatDate } from "../../utils/formatters";

const ShiftModal = ({ show, onOpenShift }) => {
  const [modalAwal, setModalAwal] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(modalAwal);

    if (!amount || amount < 0) {
      alert("Modal awal harus diisi dengan nilai yang valid");
      return;
    }

    onOpenShift(amount);
  };

  return (
    <Modal show={show} backdrop="static" keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>Selamat Datang! 👋</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <h5>Silakan buka shift untuk memulai penjualan</h5>
          <p className="text-muted mb-0">{formatDate(new Date())}</p>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Uang Modal Awal (Rp)</Form.Label>
            <Form.Control
              type="number"
              size="lg"
              placeholder="Contoh: 100000"
              value={modalAwal}
              onChange={(e) => setModalAwal(e.target.value)}
              required
              autoFocus
            />
            <Form.Text className="text-muted">
              Masukkan jumlah uang tunai di laci kasir
            </Form.Text>
          </Form.Group>

          <Button type="submit" variant="success" size="lg" className="w-100">
            🚀 Buka Shift
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ShiftModal;
