const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Simple migration endpoint - no auth needed (will be removed after use)
router.get('/run-now', async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    console.log('🚀 Starting inventory migration...');
    
    const migrations = [
      {
        name: 'Create ingredients table',
        sql: `CREATE TABLE IF NOT EXISTS ingredients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          unit VARCHAR(20) NOT NULL,
          current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
          min_stock DECIMAL(10,3) DEFAULT 0,
          cost_per_unit DECIMAL(10,2) DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'Create product_recipes table',
        sql: `CREATE TABLE IF NOT EXISTS product_recipes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          ingredient_id INT NOT NULL,
          quantity_needed DECIMAL(10,3) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
          UNIQUE KEY unique_product_ingredient (product_id, ingredient_id)
        )`
      },
      {
        name: 'Create stock_movements table',
        sql: `CREATE TABLE IF NOT EXISTS stock_movements (
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
        )`
      },
      {
        name: 'Create index on stock_movements (ingredient)',
        sql: `CREATE INDEX idx_stock_movements_ingredient ON stock_movements(ingredient_id, created_at)`
      },
      {
        name: 'Create index on stock_movements (reference)',
        sql: `CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id)`
      },
      {
        name: 'Create index on product_recipes',
        sql: `CREATE INDEX idx_product_recipes_product ON product_recipes(product_id)`
      },
      {
        name: 'Create index on ingredients',
        sql: `CREATE INDEX idx_ingredients_active ON ingredients(is_active)`
      }
    ];
    
    const results = [];
    
    for (const migration of migrations) {
      try {
        await conn.query(migration.sql);
        results.push({ 
          status: '✅', 
          name: migration.name,
          message: 'Success'
        });
        console.log(`✅ ${migration.name}`);
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
          results.push({ 
            status: '⚠️', 
            name: migration.name,
            message: 'Already exists (skipped)'
          });
          console.log(`⚠️  ${migration.name} - already exists`);
        } else {
          results.push({ 
            status: '❌', 
            name: migration.name,
            message: err.message
          });
          console.error(`❌ ${migration.name} - ${err.message}`);
        }
      }
    }
    
    const successCount = results.filter(r => r.status === '✅' || r.status === '⚠️').length;
    const failCount = results.filter(r => r.status === '❌').length;
    
    res.json({
      success: failCount === 0,
      message: `Migration completed: ${successCount} success, ${failCount} failed`,
      results: results,
      instructions: failCount === 0 ? 
        'Inventory system is now active! Refresh your app and check Ingredients, Recipes, and Stock Movements menu.' :
        'Some migrations failed. Please check the results.'
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
