import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { formatDate } from "../../utils/formatters";

const ShiftModal = ({ show, onOpenShift, onClose, required = false }) => {
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

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal 
      show={show} 
      backdrop={required ? "static" : true}
      keyboard={!required} 
      onHide={!required ? handleClose : undefined}
      centered
    >
      <Modal.Header closeButton={!required}>
        <Modal.Title>
          {required ? "Buka Shift Diperlukan 🚀" : "Selamat Datang! 👋"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <h5>
            {required 
              ? "Shift harus dibuka untuk melakukan transaksi"
              : "Silakan buka shift untuk memulai penjualan"
            }
          </h5>
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

          <div className="d-grid gap-2">
            <Button type="submit" variant="success" size="lg">
              🚀 Buka Shift
            </Button>
            
            {!required && (
              <Button 
                variant="outline-secondary" 
                size="lg" 
                onClick={handleClose}
              >
                Nanti Saja
              </Button>
            )}
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ShiftModal;
