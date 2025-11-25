import { useState, useEffect } from "react";
import { Card, Form, Spinner } from "react-bootstrap";
import api from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import "./SalesHeatMap.css";

const SalesHeatMap = () => {
  const [loading, setLoading] = useState(true);
  const [heatMapData, setHeatMapData] = useState([]);
  const [period, setPeriod] = useState("30");
  const [viewMode, setViewMode] = useState("transactions"); // transactions or sales

  useEffect(() => {
    loadHeatMapData();
  }, [period]);

  const loadHeatMapData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/sales-heatmap?period=${period}`);
      setHeatMapData(res.data.data || []);
    } catch (error) {
      console.error("Load heat map error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </Card.Body>
      </Card>
    );
  }

  // Find max value for color intensity
  const maxValue = Math.max(
    ...heatMapData.flatMap(day => 
      day.hours.map(h => viewMode === "transactions" ? h.transactions : h.totalSales)
    ),
    1
  );

  // Get color intensity based on value
  const getColor = (value) => {
    if (value === 0) return "rgba(209, 213, 219, 0.3)"; // gray-300 very light
    
    const intensity = value / maxValue;
    
    // Purple gradient from light to dark
    if (intensity < 0.2) return "rgba(139, 92, 246, 0.2)"; // violet-500 20%
    if (intensity < 0.4) return "rgba(139, 92, 246, 0.4)"; // violet-500 40%
    if (intensity < 0.6) return "rgba(139, 92, 246, 0.6)"; // violet-500 60%
    if (intensity < 0.8) return "rgba(139, 92, 246, 0.8)"; // violet-500 80%
    return "rgba(109, 40, 217, 1)"; // violet-700 100%
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Heat Map Penjualan</h5>
            <small className="text-muted">Pola aktivitas penjualan berdasarkan hari dan jam</small>
          </div>
          <div className="d-flex gap-2">
            <Form.Select
              size="sm"
              style={{ width: "120px" }}
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="transactions">Transaksi</option>
              <option value="sales">Pendapatan</option>
            </Form.Select>
            <Form.Select
              size="sm"
              style={{ width: "140px" }}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="7">7 Hari Terakhir</option>
              <option value="30">30 Hari Terakhir</option>
              <option value="90">90 Hari Terakhir</option>
            </Form.Select>
          </div>
        </div>

        <div className="heatmap-container">
          <div className="heatmap-wrapper">
            {/* Hour labels (top) */}
            <div className="heatmap-header">
              <div className="heatmap-corner"></div>
              {hours.map(hour => (
                <div key={hour} className="heatmap-hour-label">
                  {hour}
                </div>
              ))}
            </div>

            {/* Heat map rows */}
            {heatMapData.map((dayData, dayIndex) => (
              <div key={dayIndex} className="heatmap-row">
                {/* Day label */}
                <div className="heatmap-day-label">
                  {dayData.day}
                </div>
                
                {/* Hour cells */}
                {dayData.hours.map((hourData, hourIndex) => {
                  const value = viewMode === "transactions" 
                    ? hourData.transactions 
                    : hourData.totalSales;
                  
                  return (
                    <div
                      key={hourIndex}
                      className="heatmap-cell"
                      style={{ backgroundColor: getColor(value) }}
                      title={`${dayData.day}, ${hourData.hour}:00
${hourData.transactions} transaksi
${formatCurrency(hourData.totalSales)}`}
                    >
                      {value > 0 && (
                        <span className="cell-value">
                          {viewMode === "transactions" 
                            ? value 
                            : (value >= 1000 ? `${(value/1000).toFixed(0)}k` : value.toFixed(0))
                          }
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="heatmap-legend mt-3 d-flex align-items-center justify-content-center gap-2">
            <span className="text-muted small me-2">Rendah</span>
            <div className="legend-gradient"></div>
            <span className="text-muted small ms-2">Tinggi</span>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 pt-3 border-top">
          <small className="text-muted">
            💡 <strong>Tips:</strong> Gunakan data ini untuk scheduling staff, menentukan happy hour, 
            dan optimasi stock preparation di jam sibuk.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SalesHeatMap;
