import { useState, useEffect } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { FiSave, FiHome } from "react-icons/fi";
import settingService from "../../services/settingService";

const ProfileSettings = () => {
  const [formData, setFormData] = useState({
    app_name: "",
    address_line1: "",
    address_line2: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingService.getAll();
      const data = response.data.data;
      setFormData({
        app_name: data.app_name || "",
        address_line1: data.address_line1 || "",
        address_line2: data.address_line2 || "",
      });
    } catch (error) {
      console.error("Load settings error:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Update each setting
      for (const [key, value] of Object.entries(formData)) {
        await settingService.update(key, value);
      }

      setMessage({
        type: "success",
        text: "Pengaturan profile berhasil disimpan!",
      });
    } catch (error) {
      console.error("Save settings error:", error);
      setMessage({
        type: "danger",
        text: "Gagal menyimpan pengaturan",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <FiHome className="me-2" />
          Profile Aplikasi
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

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>
              Nama Aplikasi / Toko <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="app_name"
              placeholder="Contoh: Kedai Luwih99"
              value={formData.app_name}
              onChange={handleChange}
              required
            />
            <Form.Text className="text-muted">
              Nama ini akan muncul di struk dan halaman aplikasi
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Alamat Baris 1 <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="address_line1"
              placeholder="Contoh: Jl. Tegal Luwih Blok SS No. 19"
              value={formData.address_line1}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Alamat Baris 2</Form.Label>
            <Form.Control
              type="text"
              name="address_line2"
              placeholder="Contoh: Dalung Permai, Kuta Utara"
              value={formData.address_line2}
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              Alamat akan dicetak di setiap struk pembayaran
            </Form.Text>
          </Form.Group>

          <div className="bg-light p-3 rounded mb-3">
            <h6 className="mb-2">Preview Struk:</h6>
            <div className="text-center font-monospace small">
              <div className="fw-bold">{formData.app_name || "Nama Toko"}</div>
              <div>{formData.address_line1 || "Alamat Baris 1"}</div>
              <div>{formData.address_line2 || "Alamat Baris 2"}</div>
              <div>--------------------------------</div>
            </div>
          </div>

          <Button
            type="submit"
            variant="success"
            className="w-100"
            disabled={loading}
          >
            <FiSave className="me-2" />
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ProfileSettings;
