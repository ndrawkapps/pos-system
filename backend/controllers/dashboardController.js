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
      data: products.map((p) => ({
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

    let dateCondition = "t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    const queryParams = [];

    if (startDate && endDate) {
      dateCondition = "DATE(t.created_at) BETWEEN ? AND ?";
      queryParams.push(startDate, endDate);
    }

    // Get all categories with their total sales
    const [categories] = await pool.query(
      `SELECT 
        c.id,
        c.name,
        COALESCE(SUM(ti.subtotal), 0) as total
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      LEFT JOIN transactions t ON ti.transaction_id = t.id
      WHERE (t.id IS NULL OR (t.status = 'completed' AND ${dateCondition}))
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
          WHERE p.category_id = ? 
            AND p.is_active = 1
            AND (t.id IS NULL OR (t.status = 'completed' AND ${dateCondition}))
          GROUP BY p.id, p.name
          HAVING sold > 0
          ORDER BY sold DESC
          LIMIT 5`,
          topProductsParams
        );

        return {
          name: category.name,
          total: parseFloat(category.total),
          topProducts: topProducts.map((p) => ({
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
      data: trends.map((t) => ({
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
      data: salesByUser.map((u) => ({
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

// Get sales heat map (day x hour)
exports.getSalesHeatMap = async (req, res) => {
  try {
    const { period = "30" } = req.query; // 7, 30, 90 days

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sales data grouped by day of week and hour
    const [heatMapData] = await pool.query(
      `SELECT 
        DAYOFWEEK(created_at) as dayOfWeek,
        HOUR(created_at) as hour,
        COUNT(*) as transactions,
        COALESCE(SUM(total), 0) as totalSales
      FROM transactions
      WHERE created_at >= ?
      GROUP BY DAYOFWEEK(created_at), HOUR(created_at)
      ORDER BY dayOfWeek, hour`,
      [startDate]
    );

    // Transform to matrix format [day][hour]
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const heatMap = [];

    // Initialize matrix
    for (let day = 0; day < 7; day++) {
      heatMap[day] = {
        day: dayNames[day],
        hours: Array(24)
          .fill(0)
          .map((_, hour) => ({
            hour,
            transactions: 0,
            totalSales: 0,
          })),
      };
    }

    // Fill with data
    heatMapData.forEach((row) => {
      const dayIndex = row.dayOfWeek - 1; // MySQL DAYOFWEEK is 1-7 (Sunday=1)
      const hourIndex = row.hour;
      heatMap[dayIndex].hours[hourIndex] = {
        hour: hourIndex,
        transactions: parseInt(row.transactions),
        totalSales: parseFloat(row.totalSales),
      };
    });

    res.json({
      success: true,
      data: heatMap,
    });
  } catch (error) {
    console.error("Get sales heat map error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sales heat map",
      error: error.message,
    });
  }
};

// Get sales heat map (day x hour)
exports.getSalesHeatMap = async (req, res) => {
  try {
    const { period = "30" } = req.query; // days to analyze, default 30
    const days = parseInt(period);

    // Get sales data grouped by day of week and hour
    const [heatmapData] = await pool.query(
      `SELECT 
        DAYOFWEEK(created_at) as dayOfWeek,
        HOUR(created_at) as hour,
        COUNT(id) as transactionCount,
        COALESCE(SUM(total), 0) as totalSales
      FROM transactions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DAYOFWEEK(created_at), HOUR(created_at)
      ORDER BY dayOfWeek, hour`,
      [days]
    );

    // Transform data into matrix format for heatmap
    // Days: 1=Minggu, 2=Senin, ..., 7=Sabtu
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    // Initialize matrix with zeros
    const matrix = Array(7)
      .fill(null)
      .map(() => Array(24).fill(0));
    const countMatrix = Array(7)
      .fill(null)
      .map(() => Array(24).fill(0));

    // Fill matrix with actual data
    heatmapData.forEach((row) => {
      const dayIndex = row.dayOfWeek - 1; // Convert to 0-indexed
      const hour = row.hour;
      matrix[dayIndex][hour] = parseFloat(row.totalSales);
      countMatrix[dayIndex][hour] = parseInt(row.transactionCount);
    });

    // Format for frontend consumption
    const formattedData = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        formattedData.push({
          day: dayNames[day],
          dayIndex: day,
          hour: hour,
          hourLabel: `${hour.toString().padStart(2, "0")}:00`,
          sales: matrix[day][hour],
          transactionCount: countMatrix[day][hour],
        });
      }
    }

    // Calculate summary statistics
    const totalSales = heatmapData.reduce(
      (sum, row) => sum + parseFloat(row.totalSales),
      0
    );
    const totalTransactions = heatmapData.reduce(
      (sum, row) => sum + parseInt(row.transactionCount),
      0
    );

    // Find peak hour
    let peakHour = null;
    let maxSales = 0;
    heatmapData.forEach((row) => {
      if (parseFloat(row.totalSales) > maxSales) {
        maxSales = parseFloat(row.totalSales);
        peakHour = {
          day: dayNames[row.dayOfWeek - 1],
          hour: row.hour,
          sales: maxSales,
          transactionCount: parseInt(row.transactionCount),
        };
      }
    });

    res.json({
      success: true,
      data: {
        heatmap: formattedData,
        summary: {
          totalSales,
          totalTransactions,
          peakHour,
          period: days,
        },
      },
    });
  } catch (error) {
    console.error("Get sales heatmap error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sales heatmap",
      error: error.message,
    });
  }
};
