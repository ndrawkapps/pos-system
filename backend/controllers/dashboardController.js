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
    const limit = parseInt(req.query.limit) || 5;
    const { startDate, endDate } = req.query;

    let dateFilter = "t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    const queryParams = [];

    if (startDate && endDate) {
      dateFilter = "DATE(t.created_at) BETWEEN ? AND ?";
      queryParams.push(startDate, endDate);
    }

    const query = `SELECT 
        p.id,
        p.name,
        SUM(ti.quantity) as sold,
        SUM(ti.subtotal) as revenue
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE ${dateFilter}
      GROUP BY p.id, p.name
      ORDER BY sold DESC
      LIMIT ?`;

    queryParams.push(limit);
    const [products] = await pool.query(query, queryParams);

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
    const { startDate, endDate } = req.query;

    let dateFilter = "t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    const queryParams = [];

    if (startDate && endDate) {
      dateFilter = "DATE(t.created_at) BETWEEN ? AND ?";
      queryParams.push(startDate, endDate);
    }

    // Get all categories with active products
    const [categories] = await pool.query(
      `SELECT 
        c.id,
        c.name,
        COALESCE(SUM(ti.subtotal), 0) as total
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      LEFT JOIN transactions t ON ti.transaction_id = t.id 
        AND ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY total DESC`,
      queryParams
    );

    // Get top 5 products for each category
    const categoriesWithTopProducts = await Promise.all(
      categories.map(async (category) => {
        const topProductsParams = [category.id];
        if (startDate && endDate) {
          topProductsParams.push(startDate, endDate);
        }

        const [topProducts] = await pool.query(
          `SELECT 
            p.name,
            COALESCE(SUM(ti.quantity), 0) as sold,
            COALESCE(SUM(ti.subtotal), 0) as revenue
          FROM products p
          LEFT JOIN transaction_items ti ON p.id = ti.product_id
          LEFT JOIN transactions t ON ti.transaction_id = t.id 
            AND ${dateFilter}
          WHERE p.category_id = ? AND p.is_active = 1
          GROUP BY p.id, p.name
          ORDER BY sold DESC
          LIMIT 5`,
          topProductsParams
        );

        return {
          name: category.name,
          total: parseFloat(category.total),
          topProducts: topProducts.map(p => ({
            name: p.name,
            sold: parseInt(p.sold),
            revenue: parseFloat(p.revenue),
          })),
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithTopProducts,
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

// Get available months with sales data
exports.getAvailableMonths = async (req, res) => {
  try {
    const [months] = await pool.query(
      `SELECT DISTINCT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        DATE_FORMAT(created_at, '%M %Y') as label
      FROM transactions
      ORDER BY month DESC
      LIMIT 12`
    );

    res.json({
      success: true,
      data: months,
    });
  } catch (error) {
    console.error("Get available months error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get available months",
      error: error.message,
    });
  }
};

// Get sales comparison by user
exports.getSalesByUser = async (req, res) => {
  try {
    const { month } = req.query; // Format: YYYY-MM
    
    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month parameter is required (format: YYYY-MM)",
      });
    }

    const [salesByUser] = await pool.query(
      `SELECT 
        u.full_name as name,
        COUNT(t.id) as orders,
        COALESCE(SUM(t.total), 0) as totalSales
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id 
        AND DATE_FORMAT(t.created_at, '%Y-%m') = ?
      WHERE u.is_active = 1
      GROUP BY u.id, u.full_name
      ORDER BY totalSales DESC`,
      [month]
    );

    res.json({
      success: true,
      data: salesByUser.map(u => ({
        name: u.name,
        orders: parseInt(u.orders),
        totalSales: parseFloat(u.totalSales),
      })),
    });
  } catch (error) {
    console.error("Get sales by user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sales by user",
      error: error.message,
    });
  }
};
