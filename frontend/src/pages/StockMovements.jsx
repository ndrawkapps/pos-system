import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Badge, Alert, Button } from 'react-bootstrap';
import { FaHistory, FaFilter, FaArrowUp, FaArrowDown, FaAdjust } from 'react-icons/fa';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { getStockMovements, getIngredients } from '../services/inventoryService';
import { formatDate } from '../utils/formatters';

function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    ingredient_id: '',
    start_date: '',
    end_date: '',
    movement_type: ''
  });

  useEffect(() => {
    fetchIngredients();
    fetchMovements();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await getIngredients();
      setIngredients(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setIngredients([]);
    }
  };

  const fetchMovements = async (appliedFilters = filters) => {
    try {
      setLoading(true);
      const cleanFilters = {};
      if (appliedFilters.ingredient_id) cleanFilters.ingredient_id = appliedFilters.ingredient_id;
      if (appliedFilters.start_date) cleanFilters.start_date = appliedFilters.start_date;
      if (appliedFilters.end_date) cleanFilters.end_date = appliedFilters.end_date;
      if (appliedFilters.movement_type) cleanFilters.movement_type = appliedFilters.movement_type;
      
      const response = await getStockMovements(cleanFilters);
      setMovements(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      setError('Gagal memuat riwayat pergerakan stok');
      console.error(err);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleApplyFilters = () => {
    fetchMovements(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      ingredient_id: '',
      start_date: '',
      end_date: '',
      movement_type: ''
    };
    setFilters(resetFilters);
    fetchMovements(resetFilters);
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case 'in':
        return <FaArrowDown className="text-success" />;
      case 'out':
        return <FaArrowUp className="text-danger" />;
      case 'adjustment':
        return <FaAdjust className="text-warning" />;
      default:
        return null;
    }
  };

  const getMovementLabel = (type) => {
    switch (type) {
      case 'in':
        return 'Masuk';
      case 'out':
        return 'Keluar';
      case 'adjustment':
        return 'Penyesuaian';
      default:
        return type;
    }
  };

  const getMovementBadge = (type) => {
    switch (type) {
      case 'in':
        return 'success';
      case 'out':
        return 'danger';
      case 'adjustment':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getReferenceTypeLabel = (type) => {
    switch (type) {
      case 'transaction':
        return 'Transaksi';
      case 'purchase':
        return 'Pembelian';
      case 'adjustment':
        return 'Penyesuaian';
      case 'waste':
        return 'Pembuangan';
      default:
        return type;
    }
  };

  return (
    <div className="app-container">
      <div className="d-flex flex-column w-100">
        <Navbar />
        <div className="d-flex flex-1">
          <Sidebar />
          <div className="content-wrapper">
            <Container fluid className="py-4">
              <Row className="mb-4">
                <Col>
                  <h2 className="fw-bold">
                    <FaHistory className="me-2" />
                    Riwayat Pergerakan Stok
                  </h2>
                  <p className="text-muted">Pantau semua perubahan stok bahan baku</p>
                </Col>
              </Row>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Filter Card */}
              <Card className="mb-3">
        <Card.Body>
          <h6 className="fw-bold mb-3">
            <FaFilter className="me-2" />
            Filter
          </h6>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Bahan Baku</Form.Label>
                <Form.Select
                  value={filters.ingredient_id}
                  onChange={(e) => handleFilterChange('ingredient_id', e.target.value)}
                >
                  <option value="">Semua Bahan</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Tanggal Mulai</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Tanggal Akhir</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Tipe Pergerakan</Form.Label>
                <Form.Select
                  value={filters.movement_type}
                  onChange={(e) => handleFilterChange('movement_type', e.target.value)}
                >
                  <option value="">Semua Tipe</option>
                  <option value="in">Masuk</option>
                  <option value="out">Keluar</option>
                  <option value="adjustment">Penyesuaian</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Form.Group className="mb-3 d-flex gap-2">
                <Button variant="primary" onClick={handleApplyFilters}>
                  Terapkan
                </Button>
                <Button variant="outline-secondary" onClick={handleResetFilters}>
                  Reset
                </Button>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Movements Table */}
      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Tanggal & Waktu</th>
                <th>Bahan Baku</th>
                <th className="text-center" style={{ width: '120px' }}>Tipe</th>
                <th className="text-end" style={{ width: '120px' }}>Jumlah</th>
                <th className="text-end" style={{ width: '120px' }}>Stok Sebelum</th>
                <th className="text-end" style={{ width: '120px' }}>Stok Sesudah</th>
                <th style={{ width: '120px' }}>Referensi</th>
                <th>Catatan</th>
                <th>Oleh</th>
              </tr>
            </thead>
            <tbody>
              {loading && movements.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Belum ada riwayat pergerakan stok
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="small">
                      {formatDate(movement.created_at)}
                    </td>
                    <td>
                      <strong>{movement.ingredient_name}</strong>
                      <div className="text-muted small">{movement.unit}</div>
                    </td>
                    <td className="text-center">
                      <Badge bg={getMovementBadge(movement.movement_type)}>
                        {getMovementIcon(movement.movement_type)} {getMovementLabel(movement.movement_type)}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <strong className={movement.movement_type === 'in' ? 'text-success' : 'text-danger'}>
                        {movement.movement_type === 'in' ? '+' : '-'}
                        {parseFloat(movement.quantity).toFixed(2)}
                      </strong>
                    </td>
                    <td className="text-end">
                      {parseFloat(movement.stock_before).toFixed(2)}
                    </td>
                    <td className="text-end">
                      <strong>{parseFloat(movement.stock_after).toFixed(2)}</strong>
                    </td>
                    <td>
                      <Badge bg="secondary" className="small">
                        {getReferenceTypeLabel(movement.reference_type)}
                        {movement.reference_id && ` #${movement.reference_id}`}
                      </Badge>
                    </td>
                    <td className="small">
                      {movement.notes || '-'}
                    </td>
                    <td className="small">
                      {movement.created_by_name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          
          {movements.length > 0 && (
            <div className="text-muted small text-end mt-2">
              Menampilkan {movements.length} riwayat pergerakan (maksimal 500)
            </div>
          )}
        </Card.Body>
      </Card>
            </Container>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockMovements;
