import { Modal, ListGroup, Badge } from "react-bootstrap";
import { formatCurrency, formatTime } from "../../utils/formatters";

const HeldOrdersModal = ({ show, orders, onHide, onLoadOrder }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Pesanan Aktif (Tersimpan)
          <Badge bg="warning" className="ms-2">
            {orders.length}
          </Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {orders.length === 0 ? (
          <div className="text-center text-muted py-5">
            Tidak ada pesanan yang tersimpan
          </div>
        ) : (
          <ListGroup>
            {orders.map((order) => (
              <ListGroup.Item
                key={order.id}
                action
                onClick={() => onLoadOrder(order)}
                className="d-flex justify-content-between align-items-start"
              >
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Badge bg="primary">{order.order_type}</Badge>
                    {order.table_number && (
                      <Badge bg="secondary">Meja: {order.table_number}</Badge>
                    )}
                  </div>
                  <div className="small text-muted">
                    {formatTime(order.created_at)}
                  </div>
                  {order.transaction_note && (
                    <div className="small mt-1">
                      📝 {order.transaction_note}
                    </div>
                  )}
                  <div className="small mt-2">
                    <strong>{order.items.length} item</strong>
                  </div>
                </div>
                <div className="text-end">
                  <div className="h5 mb-0 text-primary fw-bold">
                    {formatCurrency(order.total)}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default HeldOrdersModal;
