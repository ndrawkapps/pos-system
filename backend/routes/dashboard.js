const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const dashboardController = require("../controllers/dashboardController");

router.get("/stats", authenticate, dashboardController.getStats);
router.get("/top-products", authenticate, dashboardController.getTopProducts);
router.get("/category-stats", authenticate, dashboardController.getCategoryStats);
router.get("/sales-trend", authenticate, dashboardController.getSalesTrend);
router.get("/available-months", authenticate, dashboardController.getAvailableMonths);
router.get("/sales-by-user", authenticate, dashboardController.getSalesByUser);

module.exports = router;
