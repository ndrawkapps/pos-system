const jwt = require("jsonwebtoken");
const pool = require("../config/database");

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth Header:", authHeader ? authHeader.substring(0, 20) + "..." : "MISSING");
    
    const token = authHeader?.split(" ")[1];

    if (!token) {
      console.log("❌ Auth failed: No token provided");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified for user ID:", decoded.id);
    } catch (jwtError) {
      console.log("❌ JWT verification failed:", jwtError.message);
      console.log("   Token (first 20 chars):", token.substring(0, 20));
      console.log("   JWT_SECRET exists:", !!process.env.JWT_SECRET);
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
      console.log("❌ User not found or inactive for ID:", decoded.id);
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    console.log("✅ Auth successful for user:", users[0].username);
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
    console.error("❌ Auth middleware error:", error);
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
