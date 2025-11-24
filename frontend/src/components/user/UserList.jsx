import { Table, Button, Badge } from "react-bootstrap";
import { FiEdit, FiTrash2, FiShield, FiUser } from "react-icons/fi";
import { formatDateTime } from "../../utils/formatters";

const UserList = ({ users, onEdit, onDelete }) => {
  if (users.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        Belum ada user terdaftar
      </div>
    );
  }

  return (
    <Table responsive hover>
      <thead>
        <tr>
          <th>Username</th>
          <th>Nama Lengkap</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Dibuat</th>
          <th className="text-center" style={{ width: "120px" }}>
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td className="align-middle">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                  style={{
                    width: "36px",
                    height: "36px",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="fw-bold">{user.username}</div>
                  <small className="text-muted">ID: {user.id}</small>
                </div>
              </div>
            </td>
            <td className="align-middle">{user.full_name}</td>
            <td className="align-middle">
              {user.email || <span className="text-muted">-</span>}
            </td>
            <td className="align-middle">
              <Badge bg={user.role_name === "admin" ? "danger" : "primary"}>
                {user.role_name === "admin" ? (
                  <>
                    <FiShield className="me-1" />
                    Admin
                  </>
                ) : (
                  <>
                    <FiUser className="me-1" />
                    Kasir
                  </>
                )}
              </Badge>
            </td>
            <td className="align-middle">
              <Badge bg={user.is_active ? "success" : "secondary"}>
                {user.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </td>
            <td className="align-middle">
              <small>{formatDateTime(user.created_at)}</small>
            </td>
            <td className="align-middle text-center">
              <Button
                size="sm"
                variant="outline-primary"
                className="me-1"
                onClick={() => onEdit(user)}
                title="Edit"
              >
                <FiEdit />
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => onDelete(user)}
                title="Hapus"
              >
                <FiTrash2 />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default UserList;
