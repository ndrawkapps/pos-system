import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Alert, InputGroup } from 'react-bootstrap';
import { FaUtensils, FaPlus, FaTrash, FaSave } from 'react-icons/fa';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import productService from '../services/productService';
import { getIngredients, getProductRecipe, setProductRecipe } from '../services/inventoryService';

function Recipes() {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchIngredients();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      console.log('Products API response:', response);
      console.log('Products data:', response.data);
      console.log('Is array:', Array.isArray(response.data));
      
      // Handle both response formats: direct array or nested in data property
      let productsData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
        }
      }
      
      setProducts(productsData);
      console.log('Products set:', productsData.length, 'items');
    } catch (err) {
      console.error('Error fetching products:', err);
      console.error('Error details:', err.response);
      setError('Gagal memuat data produk');
      setProducts([]);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await getIngredients(true); // Only active ingredients
      setIngredients(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setIngredients([]);
    }
  };

  const handleShowModal = async (product) => {
    setSelectedProduct(product);
    setLoading(true);
    try {
      const response = await getProductRecipe(product.id);
      const recipeData = Array.isArray(response.data) ? response.data : [];
      
      if (recipeData.length > 0) {
        setRecipes(recipeData.map(r => ({
          ingredient_id: r.ingredient_id,
          ingredient_name: r.ingredient_name,
          unit: r.unit,
          quantity_needed: r.quantity_needed,
          current_stock: r.current_stock
        })));
      } else {
        // Start with one empty row
        setRecipes([{ ingredient_id: '', quantity_needed: 0 }]);
      }
      setShowModal(true);
      setError(null);
    } catch (err) {
      setError('Gagal memuat resep produk');
      console.error(err);
      setRecipes([{ ingredient_id: '', quantity_needed: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setRecipes([]);
    setError(null);
    setSuccess(null);
  };

  const handleAddRecipeRow = () => {
    setRecipes([...recipes, { ingredient_id: '', quantity_needed: 0 }]);
  };

  const handleRemoveRecipeRow = (index) => {
    const newRecipes = recipes.filter((_, i) => i !== index);
    setRecipes(newRecipes);
  };

  const handleRecipeChange = (index, field, value) => {
    const newRecipes = [...recipes];
    newRecipes[index][field] = value;
    
    // If ingredient changed, update ingredient details
    if (field === 'ingredient_id') {
      const ingredient = ingredients.find(ing => ing.id === parseInt(value));
      if (ingredient) {
        newRecipes[index].ingredient_name = ingredient.name;
        newRecipes[index].unit = ingredient.unit;
        newRecipes[index].current_stock = ingredient.current_stock;
      }
    }
    
    setRecipes(newRecipes);
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    
    // Validate
    const validRecipes = recipes.filter(r => r.ingredient_id && parseFloat(r.quantity_needed) > 0);
    
    if (validRecipes.length === 0) {
      setError('Minimal satu bahan harus ditambahkan dengan jumlah > 0');
      return;
    }

    // Check for duplicate ingredients
    const ingredientIds = validRecipes.map(r => r.ingredient_id);
    const hasDuplicate = ingredientIds.length !== new Set(ingredientIds).size;
    
    if (hasDuplicate) {
      setError('Tidak boleh ada bahan yang sama dalam satu resep');
      return;
    }

    try {
      setLoading(true);
      await setProductRecipe(selectedProduct.id, validRecipes);
      setSuccess('Resep berhasil disimpan');
      setError(null);
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan resep');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProductWithRecipeCount = () => {
    // This would ideally come from backend, but for now we'll just show all products
    return products.length;
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
                  <h2 className="fw-bold">Manajemen Resep Produk</h2>
                  <p className="text-muted">Atur komposisi bahan baku untuk setiap produk</p>
                </Col>
              </Row>

              {error && !showModal && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {loading && !showModal && (
                <Alert variant="info">
                  Memuat data produk...
                </Alert>
              )}

              <Card>
                <Card.Header className="bg-white">
                  <h5 className="mb-1">Daftar Produk</h5>
                  <small className="text-muted">
                    Total {products.length} produk
                    {products.length === 0 && ' - Silakan tambah produk terlebih dahulu di menu Produk'}
                  </small>
                </Card.Header>
                <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th className="text-end">Harga</th>
                <th className="text-center">Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Belum ada produk
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.image_url ? (
                        <img
                          src={`https://pos-kedai99-backend.zeabur.app${product.image_url}`}
                          alt={product.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaUtensils className="text-muted" />
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{product.name}</strong>
                      {product.description && (
                        <div className="text-muted small">{product.description}</div>
                      )}
                    </td>
                    <td>{product.category_name}</td>
                    <td className="text-end">Rp {parseInt(product.price).toLocaleString('id-ID')}</td>
                    <td className="text-center">
                      <Badge bg={product.is_available ? 'success' : 'secondary'}>
                        {product.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowModal(product)}
                      >
                        <FaUtensils className="me-2" />
                        Atur Resep
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Recipe Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Resep Produk: {selectedProduct?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveRecipe}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert variant="success">
                {success}
              </Alert>
            )}

            <Alert variant="info">
              <small>
                <strong>Catatan:</strong> Tentukan bahan baku yang dibutuhkan untuk membuat 1 porsi produk ini.
                Stok akan otomatis berkurang saat produk terjual.
              </small>
            </Alert>

            <Table responsive>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Bahan Baku</th>
                  <th style={{ width: '20%' }} className="text-end">Jumlah</th>
                  <th style={{ width: '15%' }}>Satuan</th>
                  <th style={{ width: '20%' }} className="text-end">Stok Tersedia</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((recipe, index) => {
                  const ingredient = ingredients.find(ing => ing.id === parseInt(recipe.ingredient_id));
                  return (
                    <tr key={index}>
                      <td>
                        <Form.Select
                          value={recipe.ingredient_id}
                          onChange={(e) => handleRecipeChange(index, 'ingredient_id', e.target.value)}
                          required
                        >
                          <option value="">Pilih Bahan...</option>
                          {ingredients.map(ing => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          step="1"
                          min="1"
                          value={recipe.quantity_needed}
                          onChange={(e) => handleRecipeChange(index, 'quantity_needed', e.target.value)}
                          required
                          className="text-end"
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={ingredient?.unit || '-'}
                          disabled
                          plaintext
                        />
                      </td>
                      <td className="text-end">
                        {ingredient ? (
                          <Badge bg={parseFloat(ingredient.current_stock) > parseFloat(ingredient.min_stock) ? 'success' : 'warning'}>
                            {parseFloat(ingredient.current_stock).toFixed(2)} {ingredient.unit}
                          </Badge>
                        ) : '-'}
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveRecipeRow(index)}
                          disabled={recipes.length === 1}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleAddRecipeRow}
            >
              <FaPlus className="me-2" />
              Tambah Bahan
            </Button>

            {recipes.length > 0 && recipes[0].ingredient_id && (
              <Alert variant="secondary" className="mt-3 mb-0">
                <small>
                  <strong>Contoh:</strong> Jika BBQ Chicken dan Mushroom Chicken sama-sama menggunakan "Daging Ayam",
                  maka saat 1 BBQ Chicken terjual, stok Daging Ayam akan berkurang dan mempengaruhi ketersediaan
                  Mushroom Chicken juga.
                </small>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : (
                <>
                  <FaSave className="me-2" />
                  Simpan Resep
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
            </Container>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Recipes;
