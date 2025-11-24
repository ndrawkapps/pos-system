import { useState, useEffect } from "react";
import { Container, Card, Table, Badge } from "react-bootstrap";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import api from "../services/api";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/roles");
      setRoles(response.data.data);
    } catch (error) {
      console.error("Load roles error:", error);
    } finally {
      setLoading(false);
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
              <h2 className="mb-4">Manajemen Role</h2>

              <Card>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nama Role</th>
                        <th>Permissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => {
                        // Normalize permissions safely. Backend sometimes stores
                        // permissions as JSON string (e.g. '["a","b"]'), or
                        // as a plain string like 'all'. Avoid throwing if value
                        // isn't valid JSON.
                        let permissions = [];
                        try {
                          if (Array.isArray(role.permissions)) {
                            permissions = role.permissions;
                          } else if (typeof role.permissions === 'string') {
                            // Try JSON parse first
                            try {
                              permissions = JSON.parse(role.permissions || '[]');
                            } catch (err) {
                              // Fallback: treat a bare string 'all' as single permission
                              if (role.permissions === 'all') {
                                permissions = ['all'];
                              } else if (role.permissions.includes(',')) {
                                permissions = role.permissions.split(',').map(s => s.trim());
                              } else if (role.permissions) {
                                permissions = [role.permissions];
                              } else {
                                permissions = [];
                              }
                            }
                          }
                          if (!Array.isArray(permissions)) permissions = [];
                        } catch (err) {
                          permissions = [];
                        }

                        return (
                          <tr key={role.id}>
                            <td>{role.id}</td>
                            <td className="fw-bold">{role.name}</td>
                            <td>
                              {permissions.map((perm, idx) => (
                                <Badge
                                  key={idx}
                                  bg="secondary"
                                  className="me-1"
                                >
                                  {perm}
                                </Badge>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <div className="alert alert-info mt-3">
                <strong>ℹ️ Info:</strong> Manajemen role saat ini read-only.
                Untuk menambah/edit role, silakan update langsung di database.
              </div>
            </Container>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roles;
