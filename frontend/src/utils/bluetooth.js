/**
 * Bluetooth Printer Manager
 * Menggunakan Web Bluetooth API untuk koneksi ke printer thermal
 */

class BluetoothPrinter {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.encoder = new TextEncoder();
    this._disconnectHandlers = new Set();
    this.autoReconnect = true; // try to reconnect automatically on disconnect
    this._reconnectAttempts = 3;
  }

  _attachDisconnectHandler() {
    if (!this.device) return;
    // attach only once
    try {
      if (!this._disconnectAttached) {
        this.device.addEventListener('gattserverdisconnected', this._onDisconnected.bind(this));
        this._disconnectAttached = true;
      }
    } catch (e) {
      // some browsers/devices may not support addEventListener; ignore
    }
  }

  _onDisconnected(ev) {
    console.warn('Bluetooth device disconnected', ev);
    this.characteristic = null;
    this._notifyDisconnect();

    if (this.autoReconnect) {
      // try to reconnect in background a few times
      (async () => {
        for (let i = 0; i < this._reconnectAttempts; i++) {
          try {
            const res = await this.connect({ retries: 2 });
            if (res.success) return;
          } catch (e) {
            // continue
          }
          await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        }
        // final notify still done above
      })();
    }
  }

  _notifyDisconnect() {
    for (const cb of Array.from(this._disconnectHandlers)) {
      try {
        cb(this.device);
      } catch (e) {
        // ignore handler errors
      }
    }
  }

  onDisconnected(cb) {
    if (typeof cb === 'function') this._disconnectHandlers.add(cb);
  }

  removeDisconnected(cb) {
    this._disconnectHandlers.delete(cb);
  }

  // ESC/POS Commands
  ESC = "\x1B";
  INIT = "\x1B\x40"; // Initialize printer
  ALIGN_CENTER = "\x1B\x61\x31";
  ALIGN_LEFT = "\x1B\x61\x30";
  ALIGN_RIGHT = "\x1B\x61\x32";
  BOLD_ON = "\x1B\x21\x08";
  BOLD_OFF = "\x1B\x21\x00";
  LINE_FEED = "\x0A";
  CUT_PAPER = "\x1D\x56\x41\x03";

  // Check if Web Bluetooth is supported
  isSupported() {
    return "bluetooth" in navigator;
  }

  // Connect to printer
  async connect({ retries = this._reconnectAttempts } = {}) {
    if (!this.isSupported()) {
      return { success: false, error: "Web Bluetooth tidak didukung di browser ini" };
    }

    try {
      // If we already have a device and it is connected, return
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        return { success: true, deviceName: this.device.name };
      }

      // If we have a device but it's disconnected, try to reconnect with retries
      if (this.device && this.device.gatt && !this.device.gatt.connected) {
        let lastErr = null;
        for (let i = 0; i <= retries; i++) {
          try {
            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
            this.characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
            this._attachDisconnectHandler();
            return { success: true, deviceName: this.device.name };
          } catch (err) {
            lastErr = err;
            // exponential backoff
            await new Promise((r) => setTimeout(r, 300 * Math.pow(2, i)));
          }
        }
        return { success: false, error: lastErr ? lastErr.message : 'Reconnect failed' };
      }

      // Otherwise request a device from the user
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }],
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
      });

      // Connect and setup
      const server = await this.device.gatt.connect();
      const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
      this.characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
      this._attachDisconnectHandler();

      console.log("Printer connected:", this.device.name);
      return { success: true, deviceName: this.device.name };
    } catch (error) {
      console.error("Bluetooth connection error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // Disconnect from printer
  async disconnect() {
    try {
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        await this.device.gatt.disconnect();
      }
    } finally {
      // keep device reference so user can reconnect, but clear characteristic
      this.characteristic = null;
      // notify handlers
      this._notifyDisconnect();
    }
  }

  // Check if connected
  isConnected() {
    return this.device && this.device.gatt && this.device.gatt.connected;
  }

  // Send data to printer
  async sendData(text) {
    if (!this.isConnected()) {
      throw new Error("Printer tidak terhubung");
    }

    const data = this.encoder.encode(text);

    // Split data into chunks if too large (max 512 bytes per write)
    const chunkSize = 512;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(chunk);
      await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay between chunks
    }
  }

  // Print receipt
  async printReceipt(orderData, settings = {}) {
    try {
      let receipt = this.INIT; // Initialize

      // Header
      receipt += this.ALIGN_CENTER;
      receipt += this.BOLD_ON;
      receipt += (settings.app_name || "Kedai Luwih99") + this.LINE_FEED;
      receipt += this.BOLD_OFF;
      receipt +=
        (settings.address_line1 || "Jl Tegal Luwih Blok SS No. 19") +
        this.LINE_FEED;
      receipt += (settings.address_line2 || "Dalung Permai") + this.LINE_FEED;
      receipt += "--------------------------------" + this.LINE_FEED;

      // Transaction info
      receipt += this.ALIGN_LEFT;
      receipt += "ID Transaksi: #" + orderData.id + this.LINE_FEED;
      receipt +=
        "Waktu: " +
        new Date(orderData.created_at).toLocaleString("id-ID") +
        this.LINE_FEED;

      if (orderData.transaction_note) {
        receipt += "Catatan: " + orderData.transaction_note + this.LINE_FEED;
      }

      receipt += "--------------------------------" + this.LINE_FEED;

      // Items
      orderData.items.forEach((item) => {
        const subtotal = Math.round(item.price * item.quantity);
        let itemName = item.product_name || item.name;
        if (itemName.length > 20) itemName = itemName.substring(0, 20);

        receipt += itemName + this.LINE_FEED;

        if (item.item_note) {
          receipt += "  >> " + item.item_note + this.LINE_FEED;
        }

        const priceLine = `${item.quantity} x ${Math.round(item.price).toLocaleString(
          "id-ID", { maximumFractionDigits: 0 }
        )}`;
        const subtotalStr = subtotal.toLocaleString("id-ID", { maximumFractionDigits: 0 });
        const padding = " ".repeat(
          Math.max(0, 32 - priceLine.length - subtotalStr.length)
        );
        receipt += priceLine + padding + subtotalStr + this.LINE_FEED;
      });

      receipt += "--------------------------------" + this.LINE_FEED;

      // Total
      const totalLabel = "TOTAL";
      const totalValue = Math.round(orderData.total).toLocaleString("id-ID", { maximumFractionDigits: 0 });
      const totalPadding = " ".repeat(
        Math.max(0, 32 - totalLabel.length - totalValue.length)
      );
      receipt += this.BOLD_ON;
      receipt += totalLabel + totalPadding + totalValue + this.LINE_FEED;
      receipt += this.BOLD_OFF;

      // Payment info
      const paymentLabel = "Bayar via";
      const paymentValue = orderData.payment_method;
      const paymentPadding = " ".repeat(
        Math.max(0, 32 - paymentLabel.length - paymentValue.length)
      );
      receipt += paymentLabel + paymentPadding + paymentValue + this.LINE_FEED;

      if (orderData.payment_method === "Tunai" && orderData.paid_amount) {
        const paidLabel = "Uang Diterima";
        const paidValue = Math.round(orderData.paid_amount).toLocaleString("id-ID", { maximumFractionDigits: 0 });
        const paidPadding = " ".repeat(
          Math.max(0, 32 - paidLabel.length - paidValue.length)
        );
        receipt += paidLabel + paidPadding + paidValue + this.LINE_FEED;

        const changeLabel = "Kembalian";
        const changeValue = Math.round(
          orderData.paid_amount - orderData.total
        ).toLocaleString("id-ID", { maximumFractionDigits: 0 });
        const changePadding = " ".repeat(
          Math.max(0, 32 - changeLabel.length - changeValue.length)
        );
        receipt += changeLabel + changePadding + changeValue + this.LINE_FEED;
      }

      receipt += "--------------------------------" + this.LINE_FEED;
      receipt += this.LINE_FEED;
      receipt += this.ALIGN_CENTER;
      receipt += "Terima kasih sudah berbelanja!" + this.LINE_FEED;
      receipt += this.LINE_FEED;
      receipt += this.LINE_FEED;
      receipt += this.CUT_PAPER;

      // ensure characteristic still exists
      if (!this.characteristic) throw new Error('Printer characteristic not available');
      await this.sendData(receipt);
      return { success: true };
    } catch (error) {
      console.error("Print error:", error);
      return { success: false, error: error.message };
    }
  }

  // Print kitchen slip
  async printKitchenSlip(orderData, settings = {}) {
    try {
      let slip = this.INIT;
      const appName = settings.app_name || "Kedai Luwih99";
      // Use appName in the print output
      slip += this.BOLD_ON + appName + this.BOLD_OFF + this.LINE_FEED;

      slip += this.ALIGN_CENTER;
      slip += this.BOLD_ON + "UNTUK DAPUR" + this.BOLD_OFF + this.LINE_FEED;
      slip += "--------------------------------" + this.LINE_FEED;
      slip +=
        this.BOLD_ON +
        orderData.order_type.toUpperCase() +
        this.BOLD_OFF +
        this.LINE_FEED;

      slip += "ID Transaksi: #" + orderData.id + this.LINE_FEED;

      if (orderData.table_number) {
        slip += "Meja/Order: " + orderData.table_number + this.LINE_FEED;
      }

      slip += new Date().toLocaleString("id-ID") + this.LINE_FEED;

      if (orderData.transaction_note) {
        slip += "--------------------------------" + this.LINE_FEED;
        slip += "CATATAN PESANAN:" + this.LINE_FEED;
        slip +=
          this.BOLD_ON +
          orderData.transaction_note +
          this.BOLD_OFF +
          this.LINE_FEED;
      }

      slip += "--------------------------------" + this.LINE_FEED;
      slip += this.LINE_FEED;
      slip += this.ALIGN_LEFT;

      // Items
      orderData.items.forEach((item) => {
        slip +=
          this.BOLD_ON +
          `${item.quantity}x ${item.name}` +
          this.BOLD_OFF +
          this.LINE_FEED;
        if (item.note) {
          slip += "   >> " + item.note + this.LINE_FEED;
        }
      });

      slip += this.LINE_FEED;
      slip += this.LINE_FEED;
      slip += this.LINE_FEED;
      slip += this.CUT_PAPER;

      await this.sendData(slip);
      return { success: true };
    } catch (error) {
      console.error("Print kitchen slip error:", error);
      return { success: false, error: error.message };
    }
  }

  // Print check bill
  async printCheckBill(orderData, settings = {}) {
    try {
      let bill = this.INIT;

      bill += this.ALIGN_CENTER;
      bill +=
        this.BOLD_ON + "--- BELUM DIBAYAR ---" + this.BOLD_OFF + this.LINE_FEED;
      bill +=
        this.BOLD_ON +
        "--- INI HANYA CEK BILL ---" +
        this.BOLD_OFF +
        this.LINE_FEED;
      bill += this.LINE_FEED;
      bill +=
        this.BOLD_ON +
        (settings.app_name || "Kedai Luwih99") +
        this.BOLD_OFF +
        this.LINE_FEED;
      bill +=
        (settings.address_line1 || "Jl Tegal Luwih Blok SS No. 19") +
        this.LINE_FEED;
      bill += (settings.address_line2 || "Dalung Permai") + this.LINE_FEED;
      bill += "--------------------------------" + this.LINE_FEED;
      bill += this.ALIGN_LEFT;
      bill += "ID Transaksi: #" + orderData.id + this.LINE_FEED;
      bill += "Waktu: " + new Date().toLocaleString("id-ID") + this.LINE_FEED;

      if (orderData.transaction_note) {
        bill += "Catatan: " + orderData.transaction_note + this.LINE_FEED;
      }

      bill += "--------------------------------" + this.LINE_FEED;

      // Items
      orderData.items.forEach((item) => {
        const subtotal = Math.round(item.price * item.quantity);
        let itemName = item.name;
        if (itemName.length > 20) itemName = itemName.substring(0, 20);

        bill += itemName + this.LINE_FEED;

        if (item.note) {
          bill += "  >> " + item.note + this.LINE_FEED;
        }

        const priceLine = `${item.quantity} x ${Math.round(item.price).toLocaleString(
          "id-ID", { maximumFractionDigits: 0 }
        )}`;
        const subtotalStr = subtotal.toLocaleString("id-ID", { maximumFractionDigits: 0 });
        const padding = " ".repeat(
          Math.max(0, 32 - priceLine.length - subtotalStr.length)
        );
        bill += priceLine + padding + subtotalStr + this.LINE_FEED;
      });

      bill += "--------------------------------" + this.LINE_FEED;

      const totalLabel = "TOTAL";
      const totalValue = Math.round(orderData.total).toLocaleString("id-ID", { maximumFractionDigits: 0 });
      const totalPadding = " ".repeat(
        Math.max(0, 32 - totalLabel.length - totalValue.length)
      );
      bill +=
        this.BOLD_ON +
        totalLabel +
        totalPadding +
        totalValue +
        this.BOLD_OFF +
        this.LINE_FEED;
      bill += "--------------------------------" + this.LINE_FEED;
      bill += this.LINE_FEED;
      bill += this.ALIGN_CENTER;
      bill += "Silakan lakukan pembayaran di kasir." + this.LINE_FEED;
      bill += this.LINE_FEED;
      bill += this.LINE_FEED;
      bill += this.CUT_PAPER;

      if (!this.characteristic) throw new Error('Printer characteristic not available');
      await this.sendData(bill);
      return { success: true };
    } catch (error) {
      console.error("Print check bill error:", error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const bluetoothPrinter = new BluetoothPrinter();
export default bluetoothPrinter;
