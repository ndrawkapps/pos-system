const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.get("/stats", dashboardController.getStats);
router.get("/top-products", dashboardController.getTopProducts);
router.get("/category-stats", dashboardController.getCategoryStats);
router.get("/sales-trend", dashboardController.getSalesTrend);

module.exports = router;
