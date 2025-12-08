const pool = require('../config/database');

// Hardcoded migrations for production reliability
const MIGRATIONS = {
  'add_car_wash_payment_method': `
    -- First, check and update any invalid payment methods
    UPDATE transactions 
    SET payment_method = 'Tunai' 
    WHERE payment_method NOT IN ('Tunai', 'Kedai', 'Pink99');
    
    -- Then modify the column to add Car Wash
    ALTER TABLE transactions 
    MODIFY COLUMN payment_method ENUM('Tunai', 'Kedai', 'Pink99', 'Car Wash') NOT NULL;
  `,
  
  'create_inventory_system': `
    CREATE TABLE IF NOT EXISTS ingredients (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      current_stock DECIMAL(10,3) DEFAULT 0,
      min_stock DECIMAL(10,3) DEFAULT 0,
      cost_per_unit DECIMAL(10,2) DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ingredient_stock (id, current_stock),
      INDEX idx_active_ingredients (is_active, name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    CREATE TABLE IF NOT EXISTS product_recipes (
      product_id INT NOT NULL,
      ingredient_id INT NOT NULL,
      quantity_needed DECIMAL(10,3) NOT NULL,
      PRIMARY KEY (product_id, ingredient_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
      INDEX idx_product_recipes (product_id),
      INDEX idx_ingredient_usage (ingredient_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INT PRIMARY KEY AUTO_INCREMENT,
      ingredient_id INT NOT NULL,
      movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
      quantity DECIMAL(10,3) NOT NULL,
      stock_before DECIMAL(10,3) NOT NULL,
      stock_after DECIMAL(10,3) NOT NULL,
      reference_type ENUM('transaction', 'purchase', 'adjustment', 'waste') NOT NULL,
      reference_id INT NULL,
      notes TEXT NULL,
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id),
      INDEX idx_ingredient_movements (ingredient_id, created_at),
      INDEX idx_reference (reference_type, reference_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `
};

exports.runMigration = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { migration_name } = req.body;
    
    if (!migration_name) {
      return res.status(400).json({
        success: false,
        message: 'Migration name is required'
      });
    }

    const sql = MIGRATIONS[migration_name];
    
    if (!sql) {
      return res.status(404).json({
        success: false,
        message: `Migration not found: ${migration_name}`,
        available: Object.keys(MIGRATIONS)
      });
    }
    
    console.log(`Running migration: ${migration_name}`);
    
    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    const results = [];
    
    for (const statement of statements) {
      try {
        await conn.query(statement);
        results.push({
          success: true,
          statement: statement.substring(0, 50) + '...'
        });
      } catch (err) {
        // If table already exists, just warn
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          results.push({
            success: true,
            warning: 'Table already exists',
            statement: statement.substring(0, 50) + '...'
          });
        } else {
          results.push({
            success: false,
            error: err.message,
            statement: statement.substring(0, 50) + '...'
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: `Migration ${migration_name} completed`,
      results: results
    });
    
  } catch (error) {
    console.error('Run migration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    conn.release();
  }
};

exports.checkTables = async (req, res) => {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    const requiredTables = ['ingredients', 'product_recipes', 'stock_movements'];
    const existingTables = requiredTables.filter(t => tableNames.includes(t));
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    
    res.json({
      success: true,
      data: {
        all_tables: tableNames,
        inventory_tables: {
          existing: existingTables,
          missing: missingTables
        },
        inventory_ready: missingTables.length === 0
      }
    });
  } catch (error) {
    console.error('Check tables error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
