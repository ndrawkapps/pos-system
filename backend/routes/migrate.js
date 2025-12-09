const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

// Migration SQL - Create Inventory System
const MIGRATION_SQL = `
-- Table: ingredients (Bahan Baku)
CREATE TABLE IF NOT EXISTS ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL COMMENT 'kg, liter, pcs, porsi, gram, ml',
  current_stock DECIMAL(10,3) NOT NULL DEFAULT 0 COMMENT 'Current stock quantity',
  min_stock DECIMAL(10,3) DEFAULT 0 COMMENT 'Minimum stock alert threshold',
  cost_per_unit DECIMAL(10,2) DEFAULT 0 COMMENT 'Cost per unit for calculation',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: product_recipes (Resep Produk)
CREATE TABLE IF NOT EXISTS product_recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  quantity_needed DECIMAL(10,3) NOT NULL COMMENT 'Quantity needed per serving',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_ingredient (product_id, ingredient_id)
);

-- Table: stock_movements (History Pergerakan Stok)
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ingredient_id INT NOT NULL,
  movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  stock_before DECIMAL(10,3) NOT NULL,
  stock_after DECIMAL(10,3) NOT NULL,
  reference_type ENUM('transaction', 'purchase', 'adjustment', 'waste') NULL,
  reference_id INT NULL,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_product ON product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON ingredients(is_active);
`;

// Admin-only endpoint to run migration
router.post('/run-inventory-migration', auth.authenticate, auth.adminOnly, async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    console.log('Starting inventory system migration...');
    
    // Split and execute statements one by one
    const statements = MIGRATION_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    const results = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await conn.query(statement);
          const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
          results.push({ status: 'success', statement: preview + '...' });
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (err) {
          results.push({ 
            status: 'error', 
            statement: statement.substring(0, 50),
            error: err.message 
          });
          console.error(`❌ Statement ${i + 1} failed:`, err.message);
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Migration completed',
      results
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  } finally {
    conn.release();
  }
});

module.exports = router;
