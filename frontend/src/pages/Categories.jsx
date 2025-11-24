import { useState, useEffect } from "react";
import { Container, Card, Button, Table, Modal, Badge } from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import CategoryForm from "../components/products/CategoryForm";
import api from "../services/api";
import { FiPlus, FiEdit, FiTrash2, FiGrid } from "react-icons/fi";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories");
      setCategories(response.data.data);
    } catch (error) {
      console.error("Load categories error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (
      !window.confirm(
        `Hapus kategori "${category.name}"?\n\nCatatan: Kategori dengan produk tidak dapat dihapus.`
      )
    )
      return;

    try {
      await api.delete(`/categories/${category.id}`);
      loadCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus kategori");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
      } else {
        await api.post("/categories", formData);
      }
      setShowModal(false);
      loadCategories();
    } catch (error) {
      console.error("Save category error:", error);
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
                <div>
                  <h2 className="mb-1">Manajemen Kategori</h2>
                  <p className="text-muted mb-0">
                    Kelola kategori produk untuk organisasi menu yang lebih baik
                  </p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                  <FiPlus className="me-2" />
                  Tambah Kategori
                </Button>
              </div>

              <Card>
                <Card.Header className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>
                      <FiGrid className="me-2" />
                      Daftar Kategori
                    </span>
                    <Badge bg="primary">{categories.length} Kategori</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  {categories.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <FiGrid size={48} className="mb-3 opacity-50" />
                      <p className="mb-0">Belum ada kategori</p>
                      <small>
                        Klik tombol "Tambah Kategori" untuk membuat kategori
                        baru
                      </small>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th style={{ width: "80px" }}>ID</th>
                          <th>Nama Kategori</th>
                          <th>Deskripsi</th>
                          <th
                            className="text-center"
                            style={{ width: "120px" }}
                          >
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => (
                          <tr key={category.id}>
                            <td className="align-middle">
                              <Badge bg="secondary">#{category.id}</Badge>
                            </td>
                            <td className="align-middle">
                              <div className="fw-bold">{category.name}</div>
                            </td>
                            <td className="align-middle">
                              {category.description || (
                                <span className="text-muted fst-italic">
                                  Tidak ada deskripsi
                                </span>
                              )}
                            </td>
                            <td className="align-middle text-center">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                className="me-1"
                                onClick={() => handleEdit(category)}
                                title="Edit"
                              >
                                <FiEdit />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDelete(category)}
                                title="Hapus"
                              >
                                <FiTrash2 />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Container>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FiGrid className="me-2" />
            {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CategoryForm
            category={editingCategory}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Categories;
