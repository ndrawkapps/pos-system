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
  discountType,
  discountValue,
  onOrderTypeChange,
  onTableNumberChange,
  onTransactionNoteChange,
  onDiscountTypeChange,
  onDiscountValueChange,
  onUpdateQuantity,
  onUpdateNote,
  onUpdateItemDiscount,
  onSave,
  onPrintKitchen,
  onPrintCheck,
  onCancel,
  onPay,
  onShowHeld,
}) => {
  const isEmpty = cart.length === 0;

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (discountType === 'percentage' && discountValue > 0) {
      return (total * discountValue) / 100;
    } else if (discountType === 'nominal' && discountValue > 0) {
      return parseFloat(discountValue) || 0;
    }
    return 0;
  };

  const discountAmount = calculateDiscountAmount();
  const finalTotal = total - discountAmount;

  const handleAddNote = (item) => {
    const note = prompt("Masukkan catatan:", item.note || "");
    if (note !== null) {
      onUpdateNote(item.cartItemId, note.trim());
    }
  };

  const handleItemDiscountTypeChange = (cartItemId, type) => {
    onUpdateItemDiscount(cartItemId, type, type === 'none' ? '' : '0');
  };

  const handleItemDiscountValueChange = (cartItemId, value) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (item) {
      onUpdateItemDiscount(cartItemId, item.discount_type || 'none', value);
    }
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.price * item.quantity;
    let discountAmount = 0;
    
    if (item.discount_type === 'percentage' && item.discount_value > 0) {
      discountAmount = (subtotal * item.discount_value) / 100;
    } else if (item.discount_type === 'nominal' && item.discount_value > 0) {
      discountAmount = parseFloat(item.discount_value) || 0;
    }
    
    return subtotal - discountAmount;
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
            cart.map((item) => {
              const itemSubtotal = item.price * item.quantity;
              const itemTotal = calculateItemTotal(item);
              const itemDiscountAmount = itemSubtotal - itemTotal;

              return (
            <div key={item.cartItemId} className="cart-item mb-3 border-bottom pb-2">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="cart-item-info flex-grow-1">
                  <div className="fw-bold">{item.name}</div>
                  <div className="text-muted small">
                    {formatCurrency(item.price)} x {item.quantity}
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

                <div className="cart-item-controls d-flex align-items-center">
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
              </div>

              {/* Per-item discount controls */}
              <div className="row g-1 mb-1">
                <div className="col-5">
                  <Form.Select
                    size="sm"
                    value={item.discount_type || 'none'}
                    onChange={(e) => handleItemDiscountTypeChange(item.cartItemId, e.target.value)}
                    style={{ fontSize: '0.65rem' }}
                  >
                    <option value="none">Tanpa Diskon</option>
                    <option value="percentage">Diskon %</option>
                    <option value="nominal">Diskon Rp</option>
                  </Form.Select>
                </div>
                <div className="col-7">
                  <Form.Control
                    size="sm"
                    type="number"
                    placeholder="0"
                    value={item.discount_value || ''}
                    onChange={(e) => handleItemDiscountValueChange(item.cartItemId, e.target.value)}
                    disabled={!item.discount_type || item.discount_type === 'none'}
                    style={{ fontSize: '0.65rem' }}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {itemDiscountAmount > 0 && (
                    <div className="small text-danger">
                      Diskon: - {formatCurrency(itemDiscountAmount)}
                      {item.discount_type === 'percentage' && ` (${item.discount_value}%)`}
                    </div>
                  )}
                </div>
                <div className="fw-bold text-end" style={{ minWidth: "80px" }}>
                  {formatCurrency(itemTotal)}
                </div>
              </div>
            </div>
          );
        })
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
        <div className="mb-2 px-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="small">Subtotal</span>
            <span className="small">{formatCurrency(total)}</span>
          </div>
          
          {/* Discount Input */}
          <div className="row g-1 mb-1">
            <div className="col-5">
              <Form.Select
                size="sm"
                value={discountType}
                onChange={(e) => onDiscountTypeChange(e.target.value)}
                disabled={isEmpty}
                style={{ fontSize: '0.7rem' }}
              >
                <option value="none">Tanpa Diskon</option>
                <option value="percentage">Diskon %</option>
                <option value="nominal">Diskon Rp</option>
              </Form.Select>
            </div>
            <div className="col-7">
              <Form.Control
                size="sm"
                type="number"
                placeholder="0"
                value={discountValue}
                onChange={(e) => onDiscountValueChange(e.target.value)}
                disabled={isEmpty || discountType === 'none'}
                style={{ fontSize: '0.7rem' }}
              />
            </div>
          </div>

          {discountAmount > 0 && (
            <div className="d-flex justify-content-between align-items-center mb-1 text-danger">
              <span className="small">Diskon {discountType === 'percentage' ? `(${discountValue}%)` : ''}</span>
              <span className="small">- {formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center mb-1 border-top pt-1">
            <span className="fw-bold">Total</span>
            <span className="h6 mb-0 text-primary fw-bold">
              {formatCurrency(finalTotal)}
            </span>
          </div>
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
