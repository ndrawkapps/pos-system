import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaBoxes, FaExclamationTriangle } from 'react-icons/fa';
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  adjustStock
} from '../services/inventoryService';

function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    current_stock: 0,
    min_stock: 0,
    cost_per_unit: 0,
    is_active: true
  });
  
  const [stockFormData, setStockFormData] = useState({
    ingredient_id: null,
    movement_type: 'in',
    quantity: 0,
    notes: ''
  });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const response = await getIngredients();
      setIngredients(response.data);
      setError(null);
    } catch (err) {
      setError('Gagal memuat data bahan baku');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (ingredient = null) => {
    if (ingredient) {
      setSelectedIngredient(ingredient);
      setFormData({
        name: ingredient.name,
        unit: ingredient.unit,
        current_stock: ingredient.current_stock,
        min_stock: ingredient.min_stock,
        cost_per_unit: ingredient.cost_per_unit,
        is_active: ingredient.is_active === 1
      });
    } else {
      setSelectedIngredient(null);
      setFormData({
        name: '',
        unit: '',
        current_stock: 0,
        min_stock: 0,
        cost_per_unit: 0,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIngredient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedIngredient) {
        await updateIngredient(selectedIngredient.id, formData);
      } else {
        await createIngredient(formData);
      }
      await fetchIngredients();
      handleCloseModal();
      setError(null);
    } catch (err) {
      setError('Gagal menyimpan data bahan baku');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus bahan baku ini?')) return;
    
    try {
      setLoading(true);
      await deleteIngredient(id);
      await fetchIngredients();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus bahan baku');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowStockModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setStockFormData({
      ingredient_id: ingredient.id,
      movement_type: 'in',
      quantity: 0,
      notes: ''
    });
    setShowStockModal(true);
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adjustStock(stockFormData);
      await fetchIngredients();
      setShowStockModal(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyesuaikan stok');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLowStockCount = () => {
    return ingredients.filter(ing => 
      ing.is_active === 1 && 
      parseFloat(ing.current_stock) <= parseFloat(ing.min_stock)
    ).length;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">Manajemen Bahan Baku</h2>
          <p className="text-muted">Kelola stok bahan baku untuk resep produk</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            <FaPlus className="me-2" />
            Tambah Bahan Baku
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {getLowStockCount() > 0 && (
        <Alert variant="warning">
          <FaExclamationTriangle className="me-2" />
          <strong>{getLowStockCount()} bahan baku</strong> memiliki stok di bawah minimum!
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Nama Bahan</th>
                <th>Satuan</th>
                <th className="text-end">Stok Saat Ini</th>
                <th className="text-end">Min. Stok</th>
                <th className="text-end">Harga/Satuan</th>
                <th className="text-center">Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && ingredients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Belum ada data bahan baku
                  </td>
                </tr>
              ) : (
                ingredients.map((ingredient) => {
                  const currentStock = parseFloat(ingredient.current_stock);
                  const minStock = parseFloat(ingredient.min_stock);
                  const isLowStock = currentStock <= minStock;
                  
                  return (
                    <tr key={ingredient.id} className={isLowStock ? 'table-warning' : ''}>
                      <td>
                        {ingredient.name}
                        {isLowStock && (
                          <Badge bg="warning" text="dark" className="ms-2">
                            <FaExclamationTriangle /> Low Stock
                          </Badge>
                        )}
                      </td>
                      <td>{ingredient.unit}</td>
                      <td className="text-end">
                        <strong>{currentStock.toFixed(2)}</strong>
                      </td>
                      <td className="text-end">{minStock.toFixed(2)}</td>
                      <td className="text-end">
                        Rp {parseInt(ingredient.cost_per_unit).toLocaleString('id-ID')}
                      </td>
                      <td className="text-center">
                        <Badge bg={ingredient.is_active ? 'success' : 'secondary'}>
                          {ingredient.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowStockModal(ingredient)}
                        >
                          <FaBoxes />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowModal(ingredient)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(ingredient.id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Form Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nama Bahan *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Satuan *</Form.Label>
              <Form.Control
                type="text"
                placeholder="contoh: kg, liter, pcs"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stok Awal</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    disabled={!!selectedIngredient}
                  />
                  {selectedIngredient && (
                    <Form.Text className="text-muted">
                      Gunakan tombol "Sesuaikan Stok" untuk mengubah stok
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Stok</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Harga per Satuan</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Aktif"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Sesuaikan Stok - {selectedIngredient?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleStockAdjustment}>
          <Modal.Body>
            <Alert variant="info">
              Stok saat ini: <strong>{selectedIngredient?.current_stock} {selectedIngredient?.unit}</strong>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Tipe Pergerakan *</Form.Label>
              <Form.Select
                value={stockFormData.movement_type}
                onChange={(e) => setStockFormData({ ...stockFormData, movement_type: e.target.value })}
                required
              >
                <option value="in">Masuk (Pembelian)</option>
                <option value="out">Keluar (Pemakaian)</option>
                <option value="adjustment">Penyesuaian</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Jumlah *</Form.Label>
              <Form.Control
                type="number"
                step="0.001"
                value={stockFormData.quantity}
                onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                required
                min="0.001"
              />
              <Form.Text className="text-muted">
                {stockFormData.movement_type === 'in' ? 'Jumlah yang masuk' : 'Jumlah yang keluar'}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Catatan</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={stockFormData.notes}
                onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
                placeholder="Alasan penyesuaian stok..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStockModal(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Ingredients;
