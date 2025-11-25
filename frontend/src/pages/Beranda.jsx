import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Spinner,
} from "react-bootstrap";
import {
  FiShoppingCart,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import api from "../services/api";
import { formatCurrency } from "../utils/formatters";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const Beranda = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ordersToday: 0,
    ordersMonth: 0,
    salesToday: 0,
    salesMonth: 0,
  });
  const [topProducts, setTopProducts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("week"); // week, month, year

  useEffect(() => {
    loadDashboardData();
  }, [chartPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data
      const [statsRes, topProductsRes, categoryRes, trendRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/top-products?limit=5"),
        api.get("/dashboard/category-stats"),
        api.get(`/dashboard/sales-trend?period=${chartPeriod}`),
      ]);

      setStats(statsRes.data.data || {
        ordersToday: 0,
        ordersMonth: 0,
        salesToday: 0,
        salesMonth: 0,
      });
      
      setTopProducts(topProductsRes.data.data || []);
      setCategoryStats(categoryRes.data.data || []);
      setSalesTrend(trendRes.data.data || []);
      
    } catch (error) {
      console.error("Load dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="d-flex flex-column w-100">
          <Navbar />
          <div className="d-flex flex-1">
            <Sidebar />
            <div className="content-wrapper">
              <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
                <Spinner animation="border" variant="primary" />
              </Container>
            </div>
          </div>
        </div>
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
              <h2 className="mb-4">Beranda</h2>

              {/* Statistics Cards */}
              <Row className="g-3 mb-4">
                <Col xs={12} sm={6} lg={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="text-muted mb-1 small">Pesanan Hari Ini</p>
                          <h3 className="mb-0">{stats.ordersToday}</h3>
                        </div>
                        <div className="bg-primary bg-opacity-10 p-3 rounded">
                          <FiShoppingCart className="text-primary" size={24} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="text-muted mb-1 small">Pesanan Bulan Ini</p>
                          <h3 className="mb-0">{stats.ordersMonth}</h3>
                        </div>
                        <div className="bg-success bg-opacity-10 p-3 rounded">
                          <FiCalendar className="text-success" size={24} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="text-muted mb-1 small">Penjualan Hari Ini</p>
                          <h3 className="mb-0">{formatCurrency(stats.salesToday)}</h3>
                        </div>
                        <div className="bg-warning bg-opacity-10 p-3 rounded">
                          <FiDollarSign className="text-warning" size={24} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="text-muted mb-1 small">Penjualan Bulan Ini</p>
                          <h3 className="mb-0">{formatCurrency(stats.salesMonth)}</h3>
                        </div>
                        <div className="bg-info bg-opacity-10 p-3 rounded">
                          <FiTrendingUp className="text-info" size={24} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Charts Row */}
              <Row className="g-3 mb-4">
                <Col xs={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Tren Penjualan</h5>
                        <Form.Select
                          size="sm"
                          style={{ width: "auto" }}
                          value={chartPeriod}
                          onChange={(e) => setChartPeriod(e.target.value)}
                        >
                          <option value="week">7 Hari Terakhir</option>
                          <option value="month">30 Hari Terakhir</option>
                          <option value="year">12 Bulan Terakhir</option>
                        </Form.Select>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => formatCurrency(value)}
                            labelStyle={{ color: '#000' }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#0088FE"
                            strokeWidth={2}
                            name="Penjualan"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Top 5 Overall Products */}
              <Row className="g-3 mb-4">
                <Col xs={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h5 className="mb-3">Top 5 Produk Terlaris (Keseluruhan)</h5>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                          data={topProducts}
                          layout="vertical"
                          margin={{ left: 120 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === "Terjual") return `${value} item`;
                              if (name === "Total") return formatCurrency(value);
                              return value;
                            }}
                          />
                          <Legend />
                          <Bar dataKey="sold" fill="#00C49F" name="Terjual" />
                          <Bar dataKey="revenue" fill="#0088FE" name="Total" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Top Products by Category */}
              <Row className="g-3">
                {categoryStats.length === 0 ? (
                  <Col xs={12}>
                    <div className="text-center text-muted py-5">
                      Belum ada data penjualan
                    </div>
                  </Col>
                ) : (
                  categoryStats.map((category, index) => (
                    <Col xs={12} lg={6} key={index}>
                      <Card className="border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">{category.name}</h5>
                            <span className="badge bg-primary">
                              {formatCurrency(category.total)}
                            </span>
                          </div>
                          {category.topProducts && category.topProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={category.topProducts}
                                layout="vertical"
                                margin={{ left: 80 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip
                                  formatter={(value, name) => {
                                    if (name === "Terjual") return `${value} item`;
                                    if (name === "Total") return formatCurrency(value);
                                    return value;
                                  }}
                                />
                                <Legend />
                                <Bar dataKey="sold" fill={COLORS[index % COLORS.length]} name="Terjual" />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="text-center text-muted py-5">
                              Tidak ada data produk
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Container>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Beranda;
