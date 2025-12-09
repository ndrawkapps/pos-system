const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Check inventory system status
router.get('/inventory-status', async (req, res) => {
  try {
    const results = {
      tables: {},
      counts: {},
      issues: []
    };

    // Check if tables exist
    const tables = ['ingredients', 'product_recipes', 'stock_movements'];
    for (const table of tables) {
      const [check] = await pool.query(`SHOW TABLES LIKE ?`, [table]);
      results.tables[table] = check.length > 0;
      
      if (check.length > 0) {
        const [count] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        results.counts[table] = count[0].count;
      }
    }

    // Check for products with recipes
    if (results.tables.product_recipes) {
      const [productsWithRecipes] = await pool.query(`
        SELECT COUNT(DISTINCT product_id) as count 
        FROM product_recipes
      `);
      results.productsWithRecipes = productsWithRecipes[0].count;

      // Check for invalid references
      const [invalidProducts] = await pool.query(`
        SELECT pr.product_id 
        FROM product_recipes pr 
        LEFT JOIN products p ON pr.product_id = p.id 
        WHERE p.id IS NULL
      `);
      if (invalidProducts.length > 0) {
        results.issues.push(`Found ${invalidProducts.length} product_recipes with invalid product_id`);
      }

      const [invalidIngredients] = await pool.query(`
        SELECT pr.ingredient_id 
        FROM product_recipes pr 
        LEFT JOIN ingredients i ON pr.ingredient_id = i.id 
        WHERE i.id IS NULL
      `);
      if (invalidIngredients.length > 0) {
        results.issues.push(`Found ${invalidIngredients.length} product_recipes with invalid ingredient_id`);
      }
    }

    // Check for ingredients with negative stock
    if (results.tables.ingredients) {
      const [negativeStock] = await pool.query(`
        SELECT id, name, current_stock 
        FROM ingredients 
        WHERE current_stock < 0
      `);
      if (negativeStock.length > 0) {
        results.issues.push(`Found ${negativeStock.length} ingredients with negative stock`);
        results.negativeStock = negativeStock;
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
});

// Test transaction creation with dummy data
router.post('/test-transaction', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get first active shift
    const [shifts] = await conn.query(`
      SELECT id FROM shifts 
      WHERE status = 'open' 
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (shifts.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'No open shift found. Please open a shift first.'
      });
    }

    const shift_id = shifts[0].id;

    // Get first active product
    const [products] = await conn.query(`
      SELECT id, name, price 
      FROM products 
      WHERE is_active = 1 
      LIMIT 1
    `);

    if (products.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'No active products found'
      });
    }

    const product = products[0];
    const user_id = 1; // Admin user

    // Create test transaction
    const subtotal = product.price * 1;
    const total = subtotal;

    const [transactionResult] = await conn.query(
      `INSERT INTO transactions 
       (shift_id, user_id, order_type, payment_method, 
        subtotal, discount_type, discount_value, discount_amount, total, 
        paid_amount, change_amount, transaction_note, status) 
       VALUES (?, ?, 'Test', 'Tunai', ?, 'none', 0, 0, ?, ?, 0, 'Test transaction', 'completed')`,
      [shift_id, user_id, subtotal, total, total]
    );

    const transaction_id = transactionResult.insertId;

    // Insert transaction item
    await conn.query(
      `INSERT INTO transaction_items 
       (transaction_id, product_id, product_name, price, quantity, subtotal, 
        discount_type, discount_value, discount_amount, total) 
       VALUES (?, ?, ?, ?, 1, ?, 'none', 0, 0, ?)`,
      [transaction_id, product.id, product.name, product.price, subtotal, subtotal]
    );

    // Check if product has recipes
    const [recipes] = await conn.query(
      `SELECT pr.ingredient_id, pr.quantity_needed, i.name as ingredient_name, 
              i.current_stock, i.unit
       FROM product_recipes pr
       JOIN ingredients i ON pr.ingredient_id = i.id
       WHERE pr.product_id = ? AND i.is_active = 1`,
      [product.id]
    );

    let stockDeducted = false;
    if (recipes.length > 0) {
      for (const recipe of recipes) {
        const needed = recipe.quantity_needed * 1;
        const stock_before = parseFloat(recipe.current_stock);
        const stock_after = stock_before - needed;

        // Update stock
        await conn.query(
          'UPDATE ingredients SET current_stock = ? WHERE id = ?',
          [stock_after, recipe.ingredient_id]
        );

        // Log movement
        await conn.query(
          `INSERT INTO stock_movements 
           (ingredient_id, movement_type, quantity, stock_before, stock_after, 
            reference_type, reference_id, notes, created_by)
           VALUES (?, 'out', ?, ?, ?, 'transaction', ?, ?, ?)`,
          [
            recipe.ingredient_id,
            needed,
            stock_before,
            stock_after,
            transaction_id,
            `Test transaction #${transaction_id}`,
            user_id
          ]
        );
      }
      stockDeducted = true;
    }

    // Update shift totals
    await conn.query(
      `UPDATE shifts 
       SET total_cash = total_cash + ?, expected_cash = expected_cash + ? 
       WHERE id = ?`,
      [total, total, shift_id]
    );

    await conn.commit();

    res.json({
      success: true,
      message: 'Test transaction created successfully',
      data: {
        transaction_id,
        product: product.name,
        had_recipe: recipes.length > 0,
        stock_deducted: stockDeducted,
        recipes_count: recipes.length
      }
    });

  } catch (error) {
    await conn.rollback();
    console.error('Test transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
  } finally {
    conn.release();
  }
});

module.exports = router;
