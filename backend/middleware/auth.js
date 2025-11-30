const jwt = require("jsonwebtoken");
const pool = require("../config/database");

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log("Auth failed: No token provided");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log("Auth failed: Invalid token -", jwtError.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const [users] = await pool.query(
      `SELECT u.*, r.name as role_name, r.permissions 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.is_active = 1`,
      [decoded.id]
    );

    if (users.length === 0) {
      console.log("Auth failed: User not found or inactive for id:", decoded.id);
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    req.user = users[0];
    // Normalize permissions on the user object to avoid JSON.parse errors later
    try {
      if (typeof req.user.permissions === 'string') {
        req.user.permissions = JSON.parse(req.user.permissions || '[]');
      } else if (!Array.isArray(req.user.permissions)) {
        req.user.permissions = [];
      }
    } catch (err) {
      req.user.permissions = [];
    }
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

exports.authorize = (...permissions) => {
  return (req, res, next) => {
    // Ensure permissions is an array. `authenticate` should normalize it,
    // but handle string or invalid values defensively here to avoid throwing.
    let userPermissions = [];
    try {
      if (Array.isArray(req.user.permissions)) {
        userPermissions = req.user.permissions;
      } else if (typeof req.user.permissions === 'string') {
        userPermissions = JSON.parse(req.user.permissions || '[]');
      } else {
        userPermissions = [];
      }
    } catch (err) {
      userPermissions = [];
    }

    if (userPermissions.includes('all')) {
      return next();
    }

    const hasPermission = permissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};
