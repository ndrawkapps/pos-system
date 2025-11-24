const pool = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.is_active, 
              u.created_at, u.updated_at, r.name as role_name, r.id as role_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, full_name, email, role_id } = req.body;

    if (!username || !password || !full_name || !role_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, password, full name, and role are required' 
      });
    }

    // Check if username exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (username, password, full_name, email, role_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, hashedPassword, full_name, email || null, role_id]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, full_name, email, role_id, is_active, password } = req.body;

    // Check if username exists for other users
    if (username) {
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already exists' 
        });
      }
    }

    let query = 'UPDATE users SET ';
    const params = [];
    const updates = [];

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (full_name) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email || null);
    }
    if (role_id) {
      updates.push('role_id = ?');
      params.push(role_id);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};