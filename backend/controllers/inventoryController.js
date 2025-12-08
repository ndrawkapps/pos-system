const pool = require('../config/database');

// ==================== INGREDIENTS ====================

exports.getIngredients = async (req, res) => {
  try {
    const { is_active } = req.query;
    
    let query = 'SELECT * FROM ingredients WHERE 1=1';
    const params = [];
    
    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY name ASC';
    
    const [ingredients] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: ingredients
    });
  } catch (error) {
    console.error('Get ingredients error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getIngredientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [ingredients] = await pool.query(
      'SELECT * FROM ingredients WHERE id = ?',
      [id]
    );
    
    if (ingredients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    res.json({
      success: true,
      data: ingredients[0]
    });
  } catch (error) {
    console.error('Get ingredient error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createIngredient = async (req, res) => {
  try {
    const { name, unit, current_stock, min_stock, cost_per_unit, is_active } = req.body;
    
    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Name and unit are required'
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO ingredients 
       (name, unit, current_stock, min_stock, cost_per_unit, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        unit,
        current_stock || 0,
        min_stock || 0,
        cost_per_unit || 0,
        is_active !== false ? 1 : 0
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Ingredient created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create ingredient error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, min_stock, cost_per_unit, is_active } = req.body;
    
    const [result] = await pool.query(
      `UPDATE ingredients 
       SET name = ?, unit = ?, min_stock = ?, cost_per_unit = ?, is_active = ?
       WHERE id = ?`,
      [name, unit, min_stock || 0, cost_per_unit || 0, is_active ? 1 : 0, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Ingredient updated successfully'
    });
  } catch (error) {
    console.error('Update ingredient error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ingredient is used in recipes
    const [recipes] = await pool.query(
      'SELECT COUNT(*) as count FROM product_recipes WHERE ingredient_id = ?',
      [id]
    );
    
    if (recipes[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete ingredient that is used in product recipes'
      });
    }
    
    const [result] = await pool.query('DELETE FROM ingredients WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Ingredient deleted successfully'
    });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== STOCK MOVEMENTS ====================

exports.adjustStock = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const { ingredient_id, movement_type, quantity, notes } = req.body;
    const user_id = req.user.id;
    
    if (!ingredient_id || !movement_type || !quantity) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Get current stock
    const [ingredients] = await conn.query(
      'SELECT current_stock FROM ingredients WHERE id = ? FOR UPDATE',
      [ingredient_id]
    );
    
    if (ingredients.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    const stock_before = parseFloat(ingredients[0].current_stock);
    let stock_after;
    
    if (movement_type === 'in') {
      stock_after = stock_before + parseFloat(quantity);
    } else if (movement_type === 'out' || movement_type === 'adjustment') {
      stock_after = stock_before - parseFloat(quantity);
      if (stock_after < 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
    } else {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid movement type'
      });
    }
    
    // Update stock
    await conn.query(
      'UPDATE ingredients SET current_stock = ? WHERE id = ?',
      [stock_after, ingredient_id]
    );
    
    // Log movement
    await conn.query(
      `INSERT INTO stock_movements 
       (ingredient_id, movement_type, quantity, stock_before, stock_after, 
        reference_type, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ingredient_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        movement_type === 'in' ? 'purchase' : 'adjustment',
        notes,
        user_id
      ]
    );
    
    await conn.commit();
    
    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        stock_before,
        stock_after
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error('Adjust stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getStockMovements = async (req, res) => {
  try {
    const { ingredient_id, start_date, end_date, movement_type } = req.query;
    
    let query = `
      SELECT sm.*, i.name as ingredient_name, i.unit, u.full_name as created_by_name
      FROM stock_movements sm
      JOIN ingredients i ON sm.ingredient_id = i.id
      JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (ingredient_id) {
      query += ' AND sm.ingredient_id = ?';
      params.push(ingredient_id);
    }
    
    if (start_date) {
      query += ' AND DATE(sm.created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND DATE(sm.created_at) <= ?';
      params.push(end_date);
    }
    
    if (movement_type) {
      query += ' AND sm.movement_type = ?';
      params.push(movement_type);
    }
    
    query += ' ORDER BY sm.created_at DESC LIMIT 500';
    
    const [movements] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PRODUCT RECIPES ====================

exports.getProductRecipe = async (req, res) => {
  try {
    const { product_id } = req.params;
    
    const [recipes] = await pool.query(
      `SELECT pr.*, i.name as ingredient_name, i.unit, i.current_stock
       FROM product_recipes pr
       JOIN ingredients i ON pr.ingredient_id = i.id
       WHERE pr.product_id = ?
       ORDER BY i.name ASC`,
      [product_id]
    );
    
    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Get product recipe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.setProductRecipe = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const { product_id } = req.params;
    const { recipes } = req.body; // Array of {ingredient_id, quantity_needed}
    
    if (!Array.isArray(recipes)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Recipes must be an array'
      });
    }
    
    // Delete existing recipes
    await conn.query('DELETE FROM product_recipes WHERE product_id = ?', [product_id]);
    
    // Insert new recipes
    if (recipes.length > 0) {
      for (const recipe of recipes) {
        await conn.query(
          `INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed)
           VALUES (?, ?, ?)`,
          [product_id, recipe.ingredient_id, recipe.quantity_needed]
        );
      }
    }
    
    await conn.commit();
    
    res.json({
      success: true,
      message: 'Product recipe updated successfully'
    });
  } catch (error) {
    await conn.rollback();
    console.error('Set product recipe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

// Check stock availability for products (used before transaction)
exports.checkProductsStock = async (req, res) => {
  try {
    const { items } = req.body; // Array of {product_id, quantity}
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }
    
    const stockStatus = [];
    
    for (const item of items) {
      // Get recipe
      const [recipes] = await pool.query(
        `SELECT pr.ingredient_id, pr.quantity_needed, i.name, i.current_stock, i.unit
         FROM product_recipes pr
         JOIN ingredients i ON pr.ingredient_id = i.id
         WHERE pr.product_id = ?`,
        [item.product_id]
      );
      
      if (recipes.length === 0) {
        // No recipe = unlimited stock (old products)
        continue;
      }
      
      for (const recipe of recipes) {
        const needed = recipe.quantity_needed * item.quantity;
        const available = parseFloat(recipe.current_stock);
        
        if (available < needed) {
          stockStatus.push({
            product_id: item.product_id,
            ingredient_name: recipe.name,
            needed: needed,
            available: available,
            unit: recipe.unit,
            sufficient: false
          });
        }
      }
    }
    
    res.json({
      success: true,
      sufficient: stockStatus.length === 0,
      issues: stockStatus
    });
  } catch (error) {
    console.error('Check products stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = exports;
