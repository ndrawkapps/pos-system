const pool = require('../config/database');

exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name is required' 
      });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { id: result.insertId, name, description }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name is required' 
      });
    }

    const [result] = await pool.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const [products] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete category with products' 
      });
    }

    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
