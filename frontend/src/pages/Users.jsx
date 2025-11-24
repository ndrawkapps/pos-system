import { useState, useEffect } from "react";
import { Container, Card, Button, Modal } from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import UserList from "../components/user/UserList";
import UserForm from "../components/user/UserForm";
import api from "../services/api";
import { FiPlus, FiUsers } from "react-icons/fi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
      ]);
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (error) {
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Hapus user "${user.username}"?\n\nUser yang dihapus tidak dapat dikembalikan.`
      )
    )
      return;

    try {
      await api.delete(`/users/${user.id}`);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus user");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const submitData = { ...formData };
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, submitData);
      } else {
        await api.post("/users", submitData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Save user error:", error);
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
                  <h2 className="mb-1">Manajemen User</h2>
                  <p className="text-muted mb-0">
                    Kelola akun pengguna sistem POS
                  </p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                  <FiPlus className="me-2" />
                  Tambah User
                </Button>
              </div>

              <Card>
                <Card.Header className="bg-white">
                  <FiUsers className="me-2" />
                  Daftar User
                </Card.Header>
                <Card.Body>
                  <UserList
                    users={users}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
            {editingUser ? "Edit User" : "Tambah User Baru"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UserForm
            user={editingUser}
            roles={roles}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Users;
