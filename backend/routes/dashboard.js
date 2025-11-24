const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/auth");

router.get("/stats", verifyToken, dashboardController.getStats);
router.get("/top-products", verifyToken, dashboardController.getTopProducts);
router.get("/category-stats", verifyToken, dashboardController.getCategoryStats);
router.get("/sales-trend", verifyToken, dashboardController.getSalesTrend);

module.exports = router;
