const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

// Import controller functions individually to debug
const {
  getStats,
  getTopProducts,
  getCategoryStats,
  getSalesTrend,
} = require("../controllers/dashboardController");

router.get("/stats", verifyToken, getStats);
router.get("/top-products", verifyToken, getTopProducts);
router.get("/category-stats", verifyToken, getCategoryStats);
router.get("/sales-trend", verifyToken, getSalesTrend);

module.exports = router;
