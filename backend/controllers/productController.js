const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.getAllProducts = async (req, res) => {
  try {
    const { category_id, search, is_active } = req.query;
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (search) {
      query += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }

    if (is_active !== undefined) {
      query += ' AND p.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY p.name ASC';

    const [products] = await pool.query(query, params);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, category_id, price, stock } = req.body;
    const image = req.file ? `/uploads/products/${req.file.filename}` : null;

    if (!name || !category_id || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, category, and price are required' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, category_id, price, image, stock) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, category_id, price, image, stock || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { 
        id: result.insertId, 
        name, 
        category_id, 
        price, 
        image, 
        stock 
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, price, stock, is_active } = req.body;

    // Get current product
    const [currentProduct] = await pool.query(
      'SELECT image FROM products WHERE id = ?',
      [id]
    );

    if (currentProduct.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    let image = currentProduct[0].image;

    // If new image uploaded, delete old one
    if (req.file) {
      if (image) {
        const oldImagePath = path.join(__dirname, '..', image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image = `/uploads/products/${req.file.filename}`;
    }

    const [result] = await pool.query(
      `UPDATE products 
       SET name = ?, category_id = ?, price = ?, image = ?, stock = ?, is_active = ? 
       WHERE id = ?`,
      [name, category_id, price, image, stock || 0, is_active ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [product] = await pool.query(
      'SELECT image FROM products WHERE id = ?',
      [id]
    );

    if (product.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Delete image file if exists
    if (product[0].image) {
      const imagePath = path.join(__dirname, '..', product[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};