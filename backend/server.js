const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow all origins in production or use specific frontend URL
    const allowedOrigins = [
      "https://pos-kedai99.zeabur.app",
      "http://localhost:3000",
      "http://localhost:5173",
    ];

    if (
      process.env.CORS_ORIGIN === "*" ||
      allowedOrigins.indexOf(origin) !== -1
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (untuk monitoring usage)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/products", require("./routes/products"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/shifts", require("./routes/shifts"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/diagnostics", require("./routes/diagnostics"));
app.use("/api/quickfix", require("./routes/quickfix"));

// Health check endpoints
app.get("/", (req, res) => {
  res.json({ success: true, message: "POS API is running" });
});

app.get("/health", async (req, res) => {
  try {
    const pool = require("./config/database");
    const [result] = await pool.query("SELECT 1");
    res.json({
      success: true,
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Server error" });
});

const PORT = process.env.PORT || 5000;

// Run database migrations before starting server
console.log("🚀 Starting POS Backend Server...");
console.log("📊 Database Config:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
});

app.listen(PORT, () => {
  console.log(`✅ Server started successfully on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
