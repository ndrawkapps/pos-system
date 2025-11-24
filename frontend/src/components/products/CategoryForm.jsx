import { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";

const CategoryForm = ({ category, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Submit error:", error);
      alert("Gagal menyimpan kategori");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>
          Nama Kategori <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          type="text"
          name="name"
          placeholder="Contoh: Makanan, Minuman, Snack"
          value={formData.name}
          onChange={handleChange}
          required
          autoFocus
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Deskripsi</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="description"
          placeholder="Deskripsi kategori (opsional)"
          value={formData.description}
          onChange={handleChange}
        />
      </Form.Group>

      <div className="d-flex gap-2 justify-content-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </Form>
  );
};

export default CategoryForm;
