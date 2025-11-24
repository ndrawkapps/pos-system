const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, async (req, res) => {
  try {
    const [roles] = await pool.query("SELECT * FROM roles ORDER BY name ASC");
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
