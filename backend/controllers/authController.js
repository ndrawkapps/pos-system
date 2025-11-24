const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const [users] = await pool.query(
      `SELECT u.*, r.name as role_name, r.permissions 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ? AND u.is_active = 1`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    // Don't send password to client
    delete user.password;

    // Normalize permissions: handle JSON string or already-parsed value
    let permissions = [];
    try {
      if (typeof user.permissions === "string") {
        permissions = JSON.parse(user.permissions || "[]");
      } else if (Array.isArray(user.permissions)) {
        permissions = user.permissions;
      } else if (user.permissions == null) {
        permissions = [];
      } else {
        // fallback: try to coerce to array
        permissions = Array.isArray(user.permissions) ? user.permissions : [];
      }
    } catch (err) {
      permissions = [];
    }

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role_name,
        permissions,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = { ...req.user };
    delete user.password;
    // Normalize permissions: handle JSON string, plain string like 'all', or already-parsed array
    let permissions = [];
    try {
      if (typeof user.permissions === 'string') {
        // if it's a plain word like 'all', wrap into array
        if (/^[A-Za-z0-9_\- ]+$/.test(user.permissions)) {
          permissions = [user.permissions];
        } else {
          permissions = JSON.parse(user.permissions || '[]');
        }
      } else if (Array.isArray(user.permissions)) {
        permissions = user.permissions;
      } else if (user.permissions == null) {
        permissions = [];
      } else {
        permissions = Array.isArray(user.permissions) ? user.permissions : [];
      }
    } catch (err) {
      permissions = [];
    }
    user.permissions = permissions;

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new passwords are required",
      });
    }

    const [users] = await pool.query(
      "SELECT password FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      users[0].password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
