import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock } from "react-icons/fi";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/kasir");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Username dan password harus diisi");
      setLoading(false);
      return;
    }

    const result = await login(username, password);

    if (!result.success) {
      setError(result.message || "Login gagal");
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex align-items-center justify-content-center bg-light"
    >
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h1 className="display-4 mb-2">🏪</h1>
                <h3 className="fw-bold">POS System</h3>
                <p className="text-muted">Silakan login untuk melanjutkan</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <FiUser />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Masukkan username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <FiLock />
                    </span>
                    <Form.Control
                      type="password"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Loading...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <small className="text-muted">
                  Demo: admin / admin123 atau kasir / kasir123
                </small>
              </div>
            </Card.Body>
          </Card>

          <div className="text-center mt-3">
            <small className="text-muted">
              © 2024 POS System. All rights reserved.
            </small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
