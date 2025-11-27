const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const runMigrations = require("./database/migrate");

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health
app.get("/", (req, res) => {
	res.json({ success: true, message: "POS API is running" });
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ success: false, message: "Server error" });
});

const PORT = process.env.PORT || 5000;

// Run database migrations before starting server
runMigrations()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server started on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.error("Failed to start server:", error);
		process.exit(1);
	});
