const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

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

    const migrationPath = path.join(__dirname, '../..', 'database', 'migrations', `${migration_name}.sql`);
    
    // Read SQL file
    const sql = await fs.readFile(migrationPath, 'utf8');
    
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
