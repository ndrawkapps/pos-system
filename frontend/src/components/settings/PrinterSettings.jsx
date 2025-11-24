import { useState, useEffect } from "react";
import { Card, Button, Alert, ListGroup } from "react-bootstrap";
import { FiBluetooth, FiPrinter, FiCheck, FiX } from "react-icons/fi";
import bluetoothPrinter from "../../utils/bluetooth";
import settingService from "../../services/settingService";

const PrinterSettings = () => {
  const [printerStatus, setPrinterStatus] = useState({
    connected: false,
    deviceName: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    checkConnection();
    
    // Try to auto-reconnect to previously paired device
    (async () => {
      const result = await bluetoothPrinter.autoReconnect();
      if (result.success) {
        setPrinterStatus({ connected: true, deviceName: result.deviceName });
        setMessage({ type: 'success', text: `Auto-connected: ${result.deviceName}` });
      }
    })();

    // subscribe to device disconnects
    const onDisc = async (device) => {
      console.warn('Printer disconnected (UI):', device);
      setPrinterStatus({ connected: false, deviceName: device?.name || '' });
      setMessage({ type: 'warning', text: 'Printer terputus. Mencoba menyambung kembali...' });
      setReconnecting(true);
      try {
        const res = await bluetoothPrinter.connect({ retries: 2 });
        if (res.success) {
          setPrinterStatus({ connected: true, deviceName: res.deviceName });
          setMessage({ type: 'success', text: `Kembali terhubung: ${res.deviceName}` });
        } else {
          setMessage({ type: 'danger', text: `Gagal reconnect: ${res.error}` });
        }
      } catch (e) {
        console.error('Auto reconnect failed', e);
        setMessage({ type: 'danger', text: 'Gagal menyambung kembali secara otomatis' });
      } finally {
        setReconnecting(false);
      }
    };

    bluetoothPrinter.onDisconnected(onDisc);
    return () => {
      bluetoothPrinter.removeDisconnected(onDisc);
    };
  }, []);

  const checkConnection = () => {
    const connected = bluetoothPrinter.isConnected();
    setPrinterStatus({
      connected,
      deviceName: connected ? bluetoothPrinter.device?.name || "" : "",
    });
  };

  const handleConnect = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!bluetoothPrinter.isSupported()) {
      setMessage({
        type: "danger",
        text: "Web Bluetooth tidak didukung di browser ini. Gunakan Chrome atau Edge.",
      });
      setLoading(false);
      return;
    }

    try {
      const result = await bluetoothPrinter.connect();

      if (result.success) {
        setPrinterStatus({
          connected: true,
          deviceName: result.deviceName,
        });
        setMessage({
          type: "success",
          text: `Berhasil terhubung dengan printer: ${result.deviceName}`,
        });

        // Save printer name to settings
        await settingService.update("printer_name", result.deviceName);
      } else {
        setMessage({
          type: "danger",
          text: `Gagal terhubung: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Connect error:", error);
      setMessage({
        type: "danger",
        text: "Terjadi kesalahan saat menghubungkan printer",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothPrinter.disconnect();
    setPrinterStatus({ connected: false, deviceName: "" });
    setMessage({
      type: "info",
      text: "Printer berhasil diputus",
    });
  };

  const handleTestPrint = async () => {
    if (!printerStatus.connected) {
      setMessage({
        type: "warning",
        text: "Printer belum terhubung",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const testData = {
        items: [
          { product_name: "Test Item 1", quantity: 2, price: 10000 },
          { product_name: "Test Item 2", quantity: 1, price: 15000 },
        ],
        total: 35000,
        payment_method: "Tunai",
        paid_amount: 50000,
        created_at: new Date(),
        transaction_note: "Test Print - Ignore this receipt",
      };

      // Get settings for print
      const settingsRes = await settingService.getAll();
      const result = await bluetoothPrinter.printReceipt(
        testData,
        settingsRes.data.data
      );

      if (result.success) {
        setMessage({
          type: "success",
          text: "Test print berhasil! Periksa printer Anda.",
        });
      } else {
        setMessage({
          type: "danger",
          text: `Test print gagal: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Test print error:", error);
      setMessage({
        type: "danger",
        text: "Terjadi kesalahan saat mencetak",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <FiBluetooth className="me-2" />
          Pengaturan Printer
        </h5>
      </Card.Header>
      <Card.Body>
        {message.text && (
          <Alert
            variant={message.type}
            dismissible
            onClose={() => setMessage({ type: "", text: "" })}
            className="mb-3"
          >
            {message.text}
          </Alert>
        )}

        {reconnecting && (
          <Alert variant="warning" className="mb-3">
            Mencoba menyambung kembali ke printer... Jika koneksi tidak kembali,
            silakan tekan tombol "Hubungkan Printer Bluetooth".
          </Alert>
        )}

        <div className="mb-4">
          <h6 className="mb-3">Status Printer</h6>
          <div className="d-flex align-items-center p-3 bg-light rounded">
            {printerStatus.connected ? (
              <>
                <FiCheck className="text-success fs-3 me-3" />
                <div>
                  <div className="fw-bold text-success">Terhubung</div>
                  <small className="text-muted">
                    {printerStatus.deviceName}
                  </small>
                </div>
              </>
            ) : (
              <>
                <FiX className="text-danger fs-3 me-3" />
                <div>
                  <div className="fw-bold text-danger">Tidak Terhubung</div>
                  <small className="text-muted">
                    Belum ada printer yang terhubung
                  </small>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="d-grid gap-2">
          {!printerStatus.connected ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleConnect}
              disabled={loading}
            >
              <FiBluetooth className="me-2" />
              {loading ? "Menghubungkan..." : "Hubungkan Printer Bluetooth"}
            </Button>
          ) : (
            <>
              <Button
                variant="success"
                onClick={handleTestPrint}
                disabled={loading}
              >
                <FiPrinter className="me-2" />
                {loading ? "Mencetak..." : "Test Print"}
              </Button>
              <Button
                variant="danger"
                onClick={handleDisconnect}
                disabled={loading}
              >
                <FiX className="me-2" />
                Putuskan Koneksi
              </Button>
            </>
          )}
        </div>

        <Alert variant="info" className="mt-4 mb-0">
          <h6 className="alert-heading">
            <FiBluetooth className="me-2" />
            Panduan Koneksi Printer
          </h6>
          <ListGroup variant="flush" className="small">
            <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
              ✅ Gunakan browser <strong>Chrome</strong> atau{" "}
              <strong>Edge</strong>
            </ListGroup.Item>
            <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
              ✅ Pastikan printer Bluetooth sudah <strong>paired</strong> di
              sistem
            </ListGroup.Item>
            <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
              ✅ Pastikan printer dalam kondisi <strong>ON</strong> dan siap
            </ListGroup.Item>
            <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
              ✅ Printer harus mendukung <strong>ESC/POS</strong> commands
            </ListGroup.Item>
          </ListGroup>
        </Alert>
      </Card.Body>
    </Card>
  );
};

export default PrinterSettings;
