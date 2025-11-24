import { useState, useEffect } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";

const UserForm = ({ user, roles = [], onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    role_id: "",
    password: "",
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        full_name: user.full_name || "",
        email: user.email || "",
        role_id: user.role_id ? String(user.role_id) : "",
        password: "",
        is_active: user.is_active ?? true,
      });
    } else {
      setFormData({
        username: "",
        full_name: "",
        email: "",
        role_id: "",
        password: "",
        is_active: true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (user && !submitData.password) delete submitData.password;
    await onSubmit(submitData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Username *</Form.Label>
            <Form.Control
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nama Lengkap *</Form.Label>
            <Form.Control
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Role *</Form.Label>
            <Form.Select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              required
            >
              <option value="">Pilih Role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Password {user ? "(kosong = tidak diubah)" : "*"}</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              {...(!user && { required: true })}
            />
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-center">
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="is_active"
              label="Aktif"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex gap-2 justify-content-end">
        <Button variant="secondary" onClick={onCancel} type="button">
          Batal
        </Button>
        <Button type="submit" variant="primary">
          Simpan
        </Button>
      </div>
    </Form>
  );
};

export default UserForm;
