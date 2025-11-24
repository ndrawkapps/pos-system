import { Form, Button, Badge } from "react-bootstrap";
import {
  FiSave,
  FiPrinter,
  FiFileText,
  FiX,
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import { formatCurrency } from "../../utils/formatters";

const CartPanel = ({
  cart,
  total,
  orderType,
  tableNumber,
  transactionNote,
  heldOrdersCount,
  onOrderTypeChange,
  onTableNumberChange,
  onTransactionNoteChange,
  onUpdateQuantity,
  onUpdateNote,
  onSave,
  onPrintKitchen,
  onPrintCheck,
  onCancel,
  onPay,
  onShowHeld,
}) => {
  const isEmpty = cart.length === 0;

  const handleAddNote = (item) => {
    const note = prompt("Masukkan catatan:", item.note || "");
    if (note !== null) {
      onUpdateNote(item.cartItemId, note.trim());
    }
  };

  return (
    <div
      className="d-flex flex-column"
      style={{ 
        backgroundColor: "#fff",
        height: "100%",
        maxHeight: "100%",
        overflow: "hidden"
      }}
    >
      <div className="p-3 border-bottom" style={{ flexShrink: 0 }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Keranjang</h5>
          <Button variant="warning" size="sm" onClick={onShowHeld}>
            <FiClock /> Aktif
            {heldOrdersCount > 0 && (
              <Badge bg="danger" className="ms-1">
                {heldOrdersCount}
              </Badge>
            )}
          </Button>
        </div>

        <Form.Group className="mb-2">
          <div className="d-flex gap-2">
            <Form.Select
              size="sm"
              value={orderType}
              onChange={(e) => onOrderTypeChange(e.target.value)}
            >
              <option value="Dine-In">Dine-In</option>
              <option value="Take Away">Take Away</option>
              <option value="GoFood">GoFood</option>
              <option value="GrabFood">GrabFood</option>
              <option value="ShopeeFood">ShopeeFood</option>
            </Form.Select>
            <Form.Control
              size="sm"
              placeholder="No. Meja / Order"
              value={tableNumber}
              onChange={(e) => onTableNumberChange(e.target.value)}
            />
          </div>
        </Form.Group>

        <Form.Control
          size="sm"
          placeholder="Catatan Transaksi"
          value={transactionNote}
          onChange={(e) => onTransactionNoteChange(e.target.value)}
        />
      </div>

      <div 
        className="flex-grow-1" 
        style={{ 
          overflowY: "auto", 
          minHeight: 0,
          flex: "1 1 auto"
        }}
      >
        <div className="p-3">
          {isEmpty ? (
            <div className="text-center text-muted py-5">
              Keranjang masih kosong
            </div>
          ) : (
            cart.map((item) => (
            <div key={item.cartItemId} className="cart-item">
              <div className="cart-item-info">
                <div className="fw-bold">{item.name}</div>
                <div className="text-muted small">
                  {formatCurrency(item.price)}
                </div>
                {item.note ? (
                  <div
                    className="small text-primary mt-1 cursor-pointer"
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#f0f0f0",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                    onClick={() => handleAddNote(item)}
                  >
                    📝 {item.note}
                  </div>
                ) : (
                  <a
                    href="#"
                    className="small text-decoration-none"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddNote(item);
                    }}
                  >
                    + Catatan
                  </a>
                )}
              </div>

              <div className="cart-item-controls">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                >
                  -
                </Button>
                <span className="mx-2 fw-bold">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                >
                  +
                </Button>
              </div>

              <div className="fw-bold text-end" style={{ minWidth: "80px" }}>
                {formatCurrency(item.price * item.quantity)}
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      <div 
        className="border-top bg-white" 
        style={{ 
          position: "sticky",
          bottom: 0,
          padding: "8px",
          zIndex: 10
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-1 px-1">
          <span className="small fw-bold">Total</span>
          <span className="h6 mb-0 text-primary fw-bold">
            {formatCurrency(total)}
          </span>
        </div>

        <div className="row g-1 mb-1">
          <div className="col-4">
            <Button
              variant="warning"
              size="sm"
              className="w-100"
              disabled={isEmpty}
              onClick={onSave}
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            >
              Simpan
            </Button>
          </div>
          <div className="col-4">
            <Button
              variant="info"
              size="sm"
              className="w-100"
              disabled={isEmpty}
              onClick={onPrintKitchen}
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            >
              Dapur
            </Button>
          </div>
          <div className="col-4">
            <Button
              variant="secondary"
              size="sm"
              className="w-100"
              disabled={isEmpty}
              onClick={onPrintCheck}
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            >
              Cek
            </Button>
          </div>
        </div>

        <div className="row g-1">
          <div className="col-6">
            <Button
              variant="danger"
              size="sm"
              className="w-100"
              disabled={isEmpty}
              onClick={onCancel}
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            >
              <FiX /> Batal
            </Button>
          </div>
          <div className="col-6">
            <Button
              variant="success"
              size="sm"
              className="w-100 fw-bold"
              disabled={isEmpty}
              onClick={onPay}
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            >
              <FiDollarSign className="me-1" /> Bayar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;
