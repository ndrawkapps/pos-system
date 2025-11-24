import { useState, useEffect } from "react";
import { Form, Button, Row, Col, Image } from "react-bootstrap";

const ProductForm = ({ product, categories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    price: "",
    stock: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category_id: product.category_id,
        price: product.price,
        stock: product.stock,
        is_active: product.is_active,
      });
      if (product.image) {
        setImagePreview(`${API_URL}${product.image}`);
      }
    }
  }, [product, API_URL]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("category_id", formData.category_id);
      submitData.append("price", formData.price);
      submitData.append("stock", formData.stock);
      submitData.append("is_active", formData.is_active ? "1" : "0");

      if (imageFile) {
        submitData.append("image", imageFile);
      }

      await onSubmit(submitData);
    } catch (error) {
      alert(
        "Gagal menyimpan produk: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nama Produk *</Form.Label>
            <Form.Control
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Kategori *</Form.Label>
            <Form.Select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Harga *</Form.Label>
            <Form.Control
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Stok</Form.Label>
            <Form.Control
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Foto Produk</Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imagePreview && (
          <div className="mt-2">
            <Image src={imagePreview} thumbnail style={{ maxWidth: "200px" }} />
          </div>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          name="is_active"
          label="Produk Aktif"
          checked={formData.is_active}
          onChange={handleChange}
        />
      </Form.Group>

      <div className="d-flex gap-2 justify-content-end">
        <Button variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </Form>
  );
};

export default ProductForm;
