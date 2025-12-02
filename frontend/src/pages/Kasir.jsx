import { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Alert, Modal, Button } from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import MenuPanel from "../components/kasir/MenuPanel";
import CartPanel from "../components/kasir/CartPanel";
import { formatCurrency } from "../utils/formatters";
import PaymentModal from "../components/kasir/PaymentModal";
import CashPaymentModal from "../components/kasir/CashPaymentModal";
import HeldOrdersModal from "../components/kasir/HeldOrdersModal";
import ShiftModal from "../components/kasir/ShiftModal";
import api from "../services/api";
import transactionService from "../services/transactionService";
import settingService from "../services/settingService";
import bluetoothPrinter from "../utils/bluetooth";

const Kasir = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderType, setOrderType] = useState("Dine-In");
  const [tableNumber, setTableNumber] = useState("");
  const [transactionNote, setTransactionNote] = useState("");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [shift, setShift] = useState(null);
  const [heldOrders, setHeldOrders] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCart, setShowCart] = useState(false); // For mobile toggle

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftModalRequired, setShiftModalRequired] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const response = await api.get("/products", {
        params: { is_active: true },
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error("Load products error:", error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data.data);
    } catch (error) {
      console.error("Load categories error:", error);
    }
  }, []);

  const loadHeldOrders = useCallback(async (shiftId) => {
    try {
      const response = await transactionService.getHeldOrders(shiftId);
      setHeldOrders(response.data.data);
    } catch (error) {
      console.error("Load held orders error:", error);
    }
  }, []);

  const loadCurrentShift = useCallback(async () => {
    try {
      const response = await api.get("/shifts/current");
      if (response.data.data) {
        setShift(response.data.data);
        loadHeldOrders(response.data.data.id);
      } else {
        // Show shift modal on initial load, but not required
        setShowShiftModal(true);
        setShiftModalRequired(false);
      }
    } catch (error) {
      console.error("Load shift error:", error);
    }
  }, [loadHeldOrders]);

  const loadSettings = useCallback(async () => {
    try {
      const response = await settingService.getAll();
      setSettings(response.data.data);
    } catch (error) {
      console.error("Load settings error:", error);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadCurrentShift(),
        loadSettings(),
      ]);
    } catch (error) {
      console.error("Load initial data error:", error);
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [loadProducts, loadCategories, loadCurrentShift, loadSettings]);

  useEffect(() => {
    loadInitialData();
    
    // Auto-reconnect to printer if previously paired
    (async () => {
      try {
        await bluetoothPrinter.autoReconnect();
      } catch (error) {
        // Silently fail - user can manually connect from settings if needed
        console.debug('Auto-reconnect skipped:', error.message);
      }
    })();
  }, [loadInitialData]);

  const handleOpenShift = async (modalAwal) => {
    try {
      await api.post("/shifts/open", { modal_awal: modalAwal });
      await loadCurrentShift();
      setShowShiftModal(false);
      setShiftModalRequired(false);
    } catch (error) {
      console.error("Open shift error:", error);
      alert(error.response?.data?.message || "Gagal membuka shift");
    }
  };

  const handleCloseShiftModal = () => {
    setShowShiftModal(false);
    setShiftModalRequired(false);
  };

  const checkShiftRequired = () => {
    if (!shift) {
      setShowShiftModal(true);
      setShiftModalRequired(true);
      return false;
    }
    return true;
  };

  const addToCart = (product) => {
    // Check if shift is required before adding to cart
    if (!checkShiftRequired()) return;

    const existingItem = cart.find(
      (item) => item.id === product.id && !item.note
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.cartItemId === existingItem.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          cartItemId: Date.now(),
          quantity: 1,
          note: "",
        },
      ]);
    }
  };

  const updateQuantity = (cartItemId, change) => {
    setCart(
      cart
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) {
              return null;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const updateNote = (cartItemId, note) => {
    const item = cart.find((i) => i.cartItemId === cartItemId);
    if (!item) return;

    if (item.quantity > 1 && !item.note) {
      setCart([
        ...cart.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity: i.quantity - 1 } : i
        ),
        { ...item, cartItemId: Date.now(), quantity: 1, note },
      ]);
    } else {
      setCart(
        cart.map((i) => (i.cartItemId === cartItemId ? { ...i, note } : i))
      );
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSaveOrder = async () => {
    if (cart.length === 0) return;
    
    if (!checkShiftRequired()) return;

    try {
      await transactionService.saveHeldOrder({
        shift_id: shift.id,
        items: cart,
        order_type: orderType,
        table_number: tableNumber,
        total: calculateTotal(),
        transaction_note: transactionNote,
      });

      await loadHeldOrders(shift.id);
      resetOrder();
      alert("Pesanan berhasil disimpan");
    } catch (error) {
      console.error("Save order error:", error);
      alert("Gagal menyimpan pesanan");
    }
  };

  const handleLoadHeldOrder = async (order) => {
    try {
      setCart(order.items);
      setOrderType(order.order_type);
      setTableNumber(order.table_number || "");
      setTransactionNote(order.transaction_note || "");

      await transactionService.deleteHeldOrder(order.id);
      await loadHeldOrders(shift.id);
      setShowHeldModal(false);
    } catch (error) {
      console.error("Load held order error:", error);
      alert("Gagal memuat pesanan");
    }
  };

  const handlePrintKitchen = async () => {
    if (cart.length === 0) return;
    
    if (!checkShiftRequired()) return;

    // Check printer connection
    if (!bluetoothPrinter.isConnected()) {
      const connectPrinter = window.confirm(
        "Printer tidak terhubung.\n\nApakah Anda ingin menghubungkan printer sekarang?"
      );

      if (connectPrinter) {
        try {
          const connectResult = await bluetoothPrinter.connect();
          if (!connectResult.success) {
            alert(`Gagal menghubungkan printer: ${connectResult.error}`);
            return;
          }
          alert(`Printer "${connectResult.deviceName}" berhasil terhubung!`);
        } catch (connectError) {
          alert(`Error saat menghubungkan printer: ${connectError.message}`);
          return;
        }
      } else {
        return;
      }
    }

    const orderData = {
      items: cart,
      order_type: orderType,
      table_number: tableNumber,
      transaction_note: transactionNote,
      id: Date.now(), // temporary ID for kitchen slip
    };

    try {
      const result = await bluetoothPrinter.printKitchenSlip(orderData, settings);
      if (!result.success) {
        alert("Gagal mencetak: " + result.error);
      }
    } catch (error) {
      console.debug("Print kitchen slip error:", error);
      alert(`Gagal mencetak: ${error.message}\n\nPastikan printer terhubung di halaman Settings.`);
    }
  };

  const handlePrintCheck = async () => {
    if (cart.length === 0) return;
    
    if (!checkShiftRequired()) return;

    // Check printer connection
    if (!bluetoothPrinter.isConnected()) {
      const connectPrinter = window.confirm(
        "Printer tidak terhubung.\n\nApakah Anda ingin menghubungkan printer sekarang?"
      );

      if (connectPrinter) {
        try {
          const connectResult = await bluetoothPrinter.connect();
          if (!connectResult.success) {
            alert(`Gagal menghubungkan printer: ${connectResult.error}`);
            return;
          }
          alert(`Printer "${connectResult.deviceName}" berhasil terhubung!`);
        } catch (connectError) {
          alert(`Error saat menghubungkan printer: ${connectError.message}`);
          return;
        }
      } else {
        return;
      }
    }

    const orderData = {
      items: cart,
      total: calculateTotal(),
      transaction_note: transactionNote,
      id: Date.now(), // temporary ID for check bill
    };

    try {
      const result = await bluetoothPrinter.printCheckBill(orderData, settings);
      if (!result.success) {
        alert("Gagal mencetak: " + result.error);
      }
    } catch (error) {
      console.debug("Print check bill error:", error);
      alert(`Gagal mencetak: ${error.message}\n\nPastikan printer terhubung di halaman Settings.`);
    }
  };

  const handleCancelOrder = () => {
    if (cart.length === 0) return;

    const reason = prompt("Masukkan alasan pembatalan (WAJIB):");
    if (reason && reason.trim()) {
      resetOrder();
      alert("Pesanan dibatalkan. Alasan: " + reason);
    } else if (reason !== null) {
      alert("Alasan tidak boleh kosong");
    }
  };

  const handlePayment = (paymentMethod) => {
    if (!checkShiftRequired()) return;
    
    setShowPaymentModal(false);

    if (paymentMethod === "Tunai") {
      setShowCashModal(true);
    } else {
      processPayment(paymentMethod, calculateTotal());
    }
  };

  const handleCashPayment = (paidAmount) => {
    setShowCashModal(false);
    processPayment("Tunai", paidAmount);
  };

  const processPayment = async (paymentMethod, paidAmount) => {
    if (!checkShiftRequired()) return;

    // Check printer connection before payment
    if (!bluetoothPrinter.isConnected()) {
      const connectPrinter = window.confirm(
        "Printer tidak terhubung.\n\nApakah Anda ingin menghubungkan printer sekarang?\n\n" +
        "- Klik OK untuk menghubungkan printer\n" +
        "- Klik Cancel untuk lanjut tanpa print (bisa print ulang dari Riwayat)"
      );

      if (connectPrinter) {
        try {
          const connectResult = await bluetoothPrinter.connect();
          if (!connectResult.success) {
            const proceed = window.confirm(
              `Gagal menghubungkan printer: ${connectResult.error}\n\n` +
              "Apakah Anda ingin melanjutkan pembayaran tanpa print?\n" +
              "(Anda bisa print ulang dari menu Riwayat)"
            );
            if (!proceed) return;
          } else {
            alert(`Printer "${connectResult.deviceName}" berhasil terhubung!`);
          }
        } catch (connectError) {
          const proceed = window.confirm(
            `Error saat menghubungkan printer: ${connectError.message}\n\n` +
            "Apakah Anda ingin melanjutkan pembayaran tanpa print?\n" +
            "(Anda bisa print ulang dari menu Riwayat)"
          );
          if (!proceed) return;
        }
      }
    }

    try {
      const response = await transactionService.create({
        shift_id: shift.id,
        items: cart,
        order_type: orderType,
        table_number: tableNumber,
        payment_method: paymentMethod,
        paid_amount: paidAmount,
        transaction_note: transactionNote,
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
      });

      const transactionData = {
        ...response.data.data,
        id: response.data.data.transaction_id || response.data.data.id,
        items: cart,
        payment_method: paymentMethod,
        transaction_note: transactionNote,
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        discount_amount: response.data.data.discount_amount || 0,
        created_at: new Date(),
      };

      // Try to print receipt, but don't fail transaction if print fails
      try {
        const printResult = await bluetoothPrinter.printReceipt(transactionData, settings);
        if (!printResult.success) {
          console.warn("Print failed:", printResult.error);
          alert(`Transaksi berhasil, tapi gagal print: ${printResult.error}\n\nSilakan print ulang dari Riwayat.`);
        }
      } catch (printError) {
        console.debug("Print error:", printError);
        alert(`Transaksi berhasil, tapi gagal print: ${printError.message}\n\nSilakan print ulang dari Riwayat.`);
      }

      const finalTotal = response.data.data.total || calculateTotal();
      const changeAmount = paidAmount - finalTotal;
      if (paymentMethod === "Tunai") {
        alert(`Pembayaran Tunai berhasil!\nID Transaksi: #${transactionData.id}\nKembalian: ${formatCurrency(changeAmount)}`);
      } else {
        alert(`Pembayaran ${paymentMethod} berhasil!\nID Transaksi: #${transactionData.id}`);
      }

      resetOrder();
    } catch (error) {
      console.error("Payment error:", error);
      alert(
        "Gagal memproses pembayaran: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const resetOrder = () => {
    setCart([]);
    setTableNumber("");
    setOrderType("Dine-In");
    setTransactionNote("");
    setDiscountType("none");
    setDiscountValue("");
  };

  const filteredProducts = products.filter((product) => {
    const matchCategory =
      selectedCategory === "Semua" || product.category_id === selectedCategory;
    const matchSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

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
        <div className="d-flex flex-1" style={{ height: "calc(100vh - 56px)" }}>
          <Sidebar />
          <Container fluid className="p-0" style={{ overflow: "hidden" }}>
            {error && (
              <Alert
                variant="danger"
                className="m-3"
                dismissible
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            {/* Mobile Toggle Button */}
            <div className="d-lg-none p-2 border-bottom bg-light">
              <Button
                variant={showCart ? "primary" : "outline-primary"}
                size="sm"
                className="me-2"
                onClick={() => setShowCart(true)}
              >
                Keranjang ({cart.length})
              </Button>
              <Button
                variant={!showCart ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setShowCart(false)}
              >
                Menu
              </Button>
            </div>

            <Row className="g-0 h-100">
              <Col
                xs={12}
                lg={7}
                className={`border-end ${showCart ? 'd-none d-lg-block' : 'd-block'}`}
                style={{ 
                  height: "100%", 
                  overflowY: "auto"
                }}
              >
                <MenuPanel
                  products={filteredProducts}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onProductClick={addToCart}
                />
              </Col>

              <Col
                xs={12}
                lg={5}
                className={`${!showCart ? 'd-none d-lg-flex' : 'd-flex'}`}
                style={{
                  height: "100%",
                  flexDirection: "column",
                  overflow: "hidden"
                }}
              >
                <CartPanel
                  cart={cart}
                  total={calculateTotal()}
                  orderType={orderType}
                  tableNumber={tableNumber}
                  transactionNote={transactionNote}
                  heldOrdersCount={heldOrders.length}
                  discountType={discountType}
                  discountValue={discountValue}
                  onOrderTypeChange={setOrderType}
                  onTableNumberChange={setTableNumber}
                  onTransactionNoteChange={setTransactionNote}
                  onDiscountTypeChange={setDiscountType}
                  onDiscountValueChange={setDiscountValue}
                  onUpdateQuantity={updateQuantity}
                  onUpdateNote={updateNote}
                  onSave={handleSaveOrder}
                  onPrintKitchen={handlePrintKitchen}
                  onPrintCheck={handlePrintCheck}
                  onCancel={handleCancelOrder}
                  onPay={() => setShowPaymentModal(true)}
                  onShowHeld={() => setShowHeldModal(true)}
                />
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      <PaymentModal
        show={showPaymentModal}
        total={calculateTotal()}
        onHide={() => setShowPaymentModal(false)}
        onSelectMethod={handlePayment}
      />

      <CashPaymentModal
        show={showCashModal}
        total={calculateTotal()}
        onHide={() => setShowCashModal(false)}
        onConfirm={handleCashPayment}
      />

      <HeldOrdersModal
        show={showHeldModal}
        orders={heldOrders}
        onHide={() => setShowHeldModal(false)}
        onLoadOrder={handleLoadHeldOrder}
      />

      <ShiftModal 
        show={showShiftModal} 
        onOpenShift={handleOpenShift}
        onClose={handleCloseShiftModal}
        required={shiftModalRequired}
      />
    </div>
  );
};

export default Kasir;
