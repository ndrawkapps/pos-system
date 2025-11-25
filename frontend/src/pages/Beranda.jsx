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
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [salesByUser, setSalesByUser] = useState([]);
  
  // Date range for top products
  const [topProductsStartDate, setTopProductsStartDate] = useState("");
  const [topProductsEndDate, setTopProductsEndDate] = useState("");

  useEffect(() => {
    loadDashboardData();
    loadAvailableMonths();
  }, [chartPeriod, topProductsStartDate, topProductsEndDate]);

  useEffect(() => {
    if (selectedMonth) {
      loadSalesByUser();
    }
  }, [selectedMonth]);

  const loadAvailableMonths = async () => {
    try {
      const res = await api.get("/dashboard/available-months");
      const months = res.data.data || [];
      setAvailableMonths(months);
      if (months.length > 0) {
        setSelectedMonth(months[0].month);
      }
    } catch (error) {
      console.error("Load available months error:", error);
    }
  };

  const loadSalesByUser = async () => {
    try {
      const res = await api.get(`/dashboard/sales-by-user?month=${selectedMonth}`);
      setSalesByUser(res.data.data || []);
    } catch (error) {
      console.error("Load sales by user error:", error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build query params for top products
      let topProductsQuery = "limit=5";
      if (topProductsStartDate && topProductsEndDate) {
        topProductsQuery += `&startDate=${topProductsStartDate}&endDate=${topProductsEndDate}`;
      }
      
      // Load all dashboard data
      const [statsRes, topProductsRes, categoryRes, trendRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get(`/dashboard/top-products?${topProductsQuery}`),
        api.get(`/dashboard/category-stats${topProductsStartDate && topProductsEndDate ? `?startDate=${topProductsStartDate}&endDate=${topProductsEndDate}` : ''}`),
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

              {/* Charts Row - Tren Penjualan & Perbandingan User */}
              <Row className="g-3 mb-4">
                <Col xs={12} lg={6}>
                  <Card className="h-100 border-0 shadow-sm">
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

                <Col xs={12} lg={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Perbandingan per User</h5>
                        <Form.Select
                          size="sm"
                          style={{ width: "160px" }}
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                          {availableMonths.map((month) => (
                            <option key={month.month} value={month.month}>
                              {month.label}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                      {salesByUser.length === 0 ? (
                        <div className="text-center text-muted py-5">
                          Tidak ada data
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart 
                            data={salesByUser} 
                            margin={{ bottom: 60, left: 20, right: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              style={{ fontSize: '11px' }}
                            />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === "Jumlah Order") return `${value} order`;
                                if (name === "Total Penjualan") return formatCurrency(value);
                                return value;
                              }}
                            />
                            <Legend />
                            <Bar dataKey="orders" fill="#00C49F" name="Jumlah Order" />
                            <Bar dataKey="totalSales" fill="#0088FE" name="Total Penjualan" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Top 5 Overall Products */}
              <Row className="g-3 mb-4">
                <Col xs={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <h5 className="mb-0">Top 5 Produk Terlaris (Keseluruhan)</h5>
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Control
                            type="date"
                            size="sm"
                            style={{ width: "150px" }}
                            value={topProductsStartDate}
                            onChange={(e) => setTopProductsStartDate(e.target.value)}
                          />
                          <span>s/d</span>
                          <Form.Control
                            type="date"
                            size="sm"
                            style={{ width: "150px" }}
                            value={topProductsEndDate}
                            onChange={(e) => setTopProductsEndDate(e.target.value)}
                          />
                          {(topProductsStartDate || topProductsEndDate) && (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setTopProductsStartDate("");
                                setTopProductsEndDate("");
                              }}
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                          data={topProducts}
                          layout="vertical"
                          margin={{ left: 150 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={150}
                            style={{ fontSize: '12px' }}
                          />
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
                          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                            <div>
                              <h5 className="mb-0">{category.name}</h5>
                              <span className="badge bg-primary mt-1">
                                {formatCurrency(category.total)}
                              </span>
                            </div>
                          </div>
                          {category.topProducts && category.topProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={category.topProducts}
                                layout="vertical"
                                margin={{ left: 120 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis 
                                  dataKey="name" 
                                  type="category" 
                                  width={120}
                                  style={{ fontSize: '11px' }}
                                />
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
