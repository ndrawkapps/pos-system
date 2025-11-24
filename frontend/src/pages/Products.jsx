import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Badge,
  InputGroup,
} from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import ProductList from "../components/products/ProductList";
import ProductForm from "../components/products/ProductsForm";
import { useAuth } from "../context/AuthContext";
import productService from "../services/productService";
import api from "../services/api";
import { FiPlus, FiSearch } from "react-icons/fi";

const Products = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const canEdit = hasPermission("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, selectedCategory, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getAll(),
        api.get("/categories"),
      ]);
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
    } catch (error) {
      console.error("Load products error:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    if (selectedCategory) {
      filtered = filtered.filter(
        (p) => p.category_id === parseInt(selectedCategory)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleAdd = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;

    try {
      await productService.delete(product.id);
      loadData();
    } catch (error) {
      console.error("Delete product error:", error);
      alert("Gagal menghapus produk");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, formData);
      } else {
        await productService.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Save product error:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="d-flex flex-column w-100">
        <Navbar />
        <div className="d-flex flex-1">
          <Sidebar />
          <div className="content-wrapper">
            <Container fluid>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Manajemen Produk</h2>
                {canEdit && (
                  <Button variant="primary" onClick={handleAdd}>
                    <FiPlus className="me-2" />
                    Tambah Produk
                  </Button>
                )}
              </div>

              <Card className="mb-4">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label>Cari Produk</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FiSearch />
                          </InputGroup.Text>
                          <Form.Control
                            placeholder="Nama produk..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Filter Kategori</Form.Label>
                        <Form.Select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="">Semua Kategori</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <div className="w-100">
                        <div className="text-end">
                          <strong>Total Produk: </strong>
                          <Badge bg="primary" className="fs-6">
                            {filteredProducts.length}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <ProductList
                    products={filteredProducts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    canEdit={canEdit}
                  />
                </Card.Body>
              </Card>
            </Container>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProduct ? "Edit Produk" : "Tambah Produk"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Products;
