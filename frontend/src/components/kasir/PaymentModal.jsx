import { Modal, Button, Row, Col } from "react-bootstrap";
import { formatCurrency } from "../../utils/formatters";

const PaymentModal = ({ show, total, onHide, onSelectMethod }) => {
  const paymentMethods = [
    { value: "Tunai", label: "💵 Tunai", variant: "success" },
    { value: "QRIS", label: "📱 QRIS", variant: "primary" },
    { value: "Online Order", label: "🛒 Online Order", variant: "info" },
    { value: "Pink99", label: "🎀 Pink99", variant: "danger" },
    { value: "Car Wash", label: "🚗 Car Wash", variant: "dark" },
    { value: "Kedai", label: "🏪 Kedai", variant: "warning" },
    { value: "Bpk/Ibu", label: "👔 Bpk/Ibu", variant: "secondary" },
  ];

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Pilih Metode Pembayaran</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <h6 className="text-muted">Total Tagihan</h6>
          <h2 className="text-primary fw-bold">{formatCurrency(total)}</h2>
        </div>

        <Row className="g-2">
          {paymentMethods.map((method) => (
            <Col key={method.value} xs={6}>
              <Button
                variant={method.variant}
                className="w-100 py-3"
                onClick={() => onSelectMethod(method.value)}
              >
                {method.label}
              </Button>
            </Col>
          ))}
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default PaymentModal;
