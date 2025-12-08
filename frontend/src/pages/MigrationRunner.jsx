import { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, ListGroup } from 'react-bootstrap';
import { FaDatabase, FaPlay, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../services/api';

function MigrationRunner() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [tableStatus, setTableStatus] = useState(null);

  const migrations = [
    {
      name: 'add_car_wash_payment_method',
      title: 'Add Car Wash Payment Method',
      description: 'Menambahkan metode pembayaran Car Wash ke tabel transactions'
    },
    {
      name: 'create_inventory_system',
      title: 'Create Inventory System',
      description: 'Membuat tabel ingredients, product_recipes, dan stock_movements'
    }
  ];

  const checkTables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/migration/check-tables');
      setTableStatus(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengecek tabel');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async (migrationName) => {
    if (!window.confirm(`Yakin ingin menjalankan migration: ${migrationName}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/migration/run', {
        migration_name: migrationName
      });
      
      setResults({
        migration: migrationName,
        ...response.data
      });
      setError(null);
      
      // Refresh table status
      await checkTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menjalankan migration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">
            <FaDatabase className="me-2" />
            Database Migration Runner
          </h2>
          <p className="text-muted">Jalankan migration untuk update struktur database</p>
        </Col>
        <Col xs="auto">
          <Button variant="outline-primary" onClick={checkTables} disabled={loading}>
            <FaDatabase className="me-2" />
            Cek Status Tabel
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {tableStatus && (
        <Card className="mb-4">
          <Card.Body>
            <h5 className="fw-bold mb-3">Status Tabel Database</h5>
            <Row>
              <Col md={6}>
                <h6 className="text-muted">Tabel Inventory:</h6>
                <ListGroup>
                  {tableStatus.inventory_tables.existing.map(table => (
                    <ListGroup.Item key={table} className="d-flex justify-content-between align-items-center">
                      {table}
                      <Badge bg="success">
                        <FaCheck /> Ada
                      </Badge>
                    </ListGroup.Item>
                  ))}
                  {tableStatus.inventory_tables.missing.map(table => (
                    <ListGroup.Item key={table} className="d-flex justify-content-between align-items-center">
                      {table}
                      <Badge bg="danger">
                        <FaTimes /> Belum Ada
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Col>
              <Col md={6}>
                <Alert variant={tableStatus.inventory_ready ? 'success' : 'warning'}>
                  {tableStatus.inventory_ready ? (
                    <>
                      <FaCheck className="me-2" />
                      <strong>Inventory system sudah siap!</strong>
                      <div className="small mt-2">
                        Semua tabel inventory sudah tersedia di database.
                      </div>
                    </>
                  ) : (
                    <>
                      <FaTimes className="me-2" />
                      <strong>Inventory system belum lengkap</strong>
                      <div className="small mt-2">
                        Jalankan migration di bawah untuk melengkapi tabel yang dibutuhkan.
                      </div>
                    </>
                  )}
                </Alert>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {results && (
        <Card className="mb-4 border-success">
          <Card.Body>
            <h5 className="fw-bold text-success mb-3">
              <FaCheck className="me-2" />
              Migration Berhasil: {results.migration}
            </h5>
            <p className="text-muted">{results.message}</p>
            
            {results.results && (
              <ListGroup className="mt-3">
                {results.results.map((result, index) => (
                  <ListGroup.Item 
                    key={index}
                    variant={result.success ? (result.warning ? 'warning' : 'success') : 'danger'}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <code className="small">{result.statement}</code>
                        {result.warning && (
                          <div className="small text-warning mt-1">⚠️ {result.warning}</div>
                        )}
                        {result.error && (
                          <div className="small text-danger mt-1">❌ {result.error}</div>
                        )}
                      </div>
                      <Badge bg={result.success ? 'success' : 'danger'}>
                        {result.success ? <FaCheck /> : <FaTimes />}
                      </Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      )}

      <Row>
        {migrations.map((migration) => (
          <Col md={6} key={migration.name} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="fw-bold">{migration.title}</h5>
                <p className="text-muted">{migration.description}</p>
                <p className="small">
                  <code>{migration.name}.sql</code>
                </p>
                <Button
                  variant="primary"
                  onClick={() => runMigration(migration.name)}
                  disabled={loading}
                >
                  <FaPlay className="me-2" />
                  {loading ? 'Running...' : 'Run Migration'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Alert variant="warning" className="mt-4">
        <strong>⚠️ Perhatian:</strong>
        <ul className="mb-0 mt-2">
          <li>Fitur ini hanya untuk development/testing</li>
          <li>Migration yang sudah dijalankan bisa error jika dijalankan lagi (table already exists)</li>
          <li>Untuk production, jalankan migration secara manual via MySQL Workbench</li>
          <li>Pastikan backup database sebelum menjalankan migration</li>
        </ul>
      </Alert>
    </Container>
  );
}

export default MigrationRunner;
