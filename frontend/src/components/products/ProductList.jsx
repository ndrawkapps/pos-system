import { Table, Button, Badge, Image } from "react-bootstrap";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "../../utils/formatters";

const ProductList = ({ products, onEdit, onDelete, canEdit }) => {
  if (products.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        Tidak ada produk ditemukan
      </div>
    );
  }

  return (
    <Table responsive hover>
      <thead>
        <tr>
          <th style={{ width: "80px" }}>Foto</th>
          <th>Nama Produk</th>
          <th>Kategori</th>
          <th className="text-end">Harga</th>
          <th className="text-center" style={{ width: "80px" }}>
            Stok
          </th>
          <th className="text-center" style={{ width: "100px" }}>
            Status
          </th>
          {canEdit && (
            <th className="text-center" style={{ width: "120px" }}>
              Aksi
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  thumbnail
                  style={{ width: "60px", height: "60px", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent && !parent.querySelector('.no-image-placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'no-image-placeholder d-flex align-items-center justify-content-center bg-light rounded';
                      placeholder.style.cssText = 'width: 60px; height: 60px;';
                      placeholder.innerHTML = '<span style="font-size: 24px;">📦</span>';
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center bg-light rounded"
                  style={{ width: "60px", height: "60px" }}
                >
                  <span style={{ fontSize: "24px" }}>📦</span>
                </div>
              )}
            </td>
            <td className="align-middle">
              <div className="fw-bold">{product.name}</div>
              <small className="text-muted">ID: {product.id}</small>
            </td>
            <td className="align-middle">
              <Badge bg="info">{product.category_name}</Badge>
            </td>
            <td className="align-middle text-end">
              <span className="fw-bold">{formatCurrency(product.price)}</span>
            </td>
            <td className="align-middle text-center">
              <Badge
                bg={
                  product.stock > 10
                    ? "success"
                    : product.stock > 0
                    ? "warning"
                    : "danger"
                }
              >
                {product.stock}
              </Badge>
            </td>
            <td className="align-middle text-center">
              <Badge bg={product.is_active ? "success" : "secondary"}>
                {product.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </td>
            {canEdit && (
              <td className="align-middle text-center">
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-1"
                  onClick={() => onEdit(product)}
                  title="Edit"
                >
                  <FiEdit />
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onDelete(product)}
                  title="Hapus"
                >
                  <FiTrash2 />
                </Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ProductList;
