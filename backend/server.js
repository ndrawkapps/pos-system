const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
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

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});
