const pool = require("../config/database");

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Orders today
    const [ordersToday] = await pool.query(
      "SELECT COUNT(*) as count FROM transactions WHERE DATE(created_at) = CURDATE()"
    );

    // Orders this month
    const [ordersMonth] = await pool.query(
      "SELECT COUNT(*) as count FROM transactions WHERE created_at >= ?",
      [firstDayOfMonth]
    );

    // Sales today
    const [salesToday] = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE DATE(created_at) = CURDATE()"
    );

    // Sales this month
    const [salesMonth] = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE created_at >= ?",
      [firstDayOfMonth]
    );

    res.json({
      success: true,
      data: {
        ordersToday: ordersToday[0].count,
        ordersMonth: ordersMonth[0].count,
        salesToday: parseFloat(salesToday[0].total) || 0,
        salesMonth: parseFloat(salesMonth[0].total) || 0,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get statistics",
      error: error.message,
    });
  }
};

// Get top selling products
exports.getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [products] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        SUM(ti.quantity) as sold,
        SUM(ti.subtotal) as revenue
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id, p.name
      ORDER BY sold DESC
      LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      data: products.map(p => ({
        ...p,
        sold: parseInt(p.sold),
        revenue: parseFloat(p.revenue),
      })),
    });
  } catch (error) {
    console.error("Get top products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get top products",
      error: error.message,
    });
  }
};

// Get sales by category
exports.getCategoryStats = async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT 
        c.name,
        SUM(ti.subtotal) as total
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY c.id, c.name
      ORDER BY total DESC`
    );

    res.json({
      success: true,
      data: categories.map(c => ({
        ...c,
        total: parseFloat(c.total),
      })),
    });
  } catch (error) {
    console.error("Get category stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get category statistics",
      error: error.message,
    });
  }
};

// Get sales trend
exports.getSalesTrend = async (req, res) => {
  try {
    const period = req.query.period || "week"; // week, month, year
    let query, params;

    if (period === "week") {
      // Last 7 days
      query = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as date,
          COALESCE(SUM(total), 0) as sales
        FROM transactions
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
      `;
      params = [];
    } else if (period === "month") {
      // Last 30 days
      query = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as date,
          COALESCE(SUM(total), 0) as sales
        FROM transactions
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
      `;
      params = [];
    } else {
      // Last 12 months
      query = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as date,
          COALESCE(SUM(total), 0) as sales
        FROM transactions
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY date ASC
      `;
      params = [];
    }

    const [trends] = await pool.query(query, params);

    res.json({
      success: true,
      data: trends.map(t => ({
        date: t.date,
        sales: parseFloat(t.sales),
      })),
    });
  } catch (error) {
    console.error("Get sales trend error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sales trend",
      error: error.message,
    });
  }
};
