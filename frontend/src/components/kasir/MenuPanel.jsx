import { Form, InputGroup, Button } from "react-bootstrap";
import { formatCurrency } from "../../utils/formatters";
import { FiSearch } from "react-icons/fi";

const MenuPanel = ({
  products,
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  onProductClick,
}) => {
  const API_URL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  return (
    <div className="p-3">
      <h5 className="mb-3">Menu Produk</h5>

      <InputGroup className="mb-3">
        <InputGroup.Text>
          <FiSearch />
        </InputGroup.Text>
        <Form.Control
          placeholder="Cari menu..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Button
          size="sm"
          variant={selectedCategory === "Semua" ? "primary" : "outline-primary"}
          onClick={() => onCategoryChange("Semua")}
        >
          Semua
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={
              selectedCategory === cat.id ? "primary" : "outline-primary"
            }
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      <div className="menu-grid">
        {products.length === 0 ? (
          <div className="text-center py-5 text-muted">Tidak ada produk</div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="menu-item"
              onClick={() => onProductClick(product)}
            >
              {product.image && (
                <img
                  src={`${API_URL}${product.image}`}
                  alt={product.name}
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
              <div className="menu-item-name">{product.name}</div>
              <div className="menu-item-price">{formatCurrency(product.price)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MenuPanel;
