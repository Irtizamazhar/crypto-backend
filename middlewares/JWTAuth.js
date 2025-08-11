const jwt = require("jsonwebtoken");

// ✅ Middleware to check token (Required)
const verifyTokenRequired = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(403).json({ success: false, message: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id || !decoded.role) {
      return res.status(400).json({ success: false, message: "Invalid token structure" });
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ✅ Middleware to check token (Optional)
const verifyTokenOptional = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id && decoded.role ? { id: decoded.id, role: decoded.role } : null;
  } catch {
    req.user = null;
  }

  next();
};

// ✅ Role-checking middleware
const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
};

// ✅ Individual role middlewares (if needed)
const isSuperAdmin = roleCheck(["super_admin"]);
const isAdmin = roleCheck(["admin"]);
const isViewer = roleCheck(["viewer"]);
const isEmployee1 = roleCheck(["employee1"]);
const isEmployee2 = roleCheck(["employee2"]);
const isCustomer = roleCheck(["customer"]);

// ✅ Combined role checks
const isAdminOrCustomer = roleCheck(["admin", "customer"]);
const isSuperAdminAdminOrCustomer = roleCheck(["super_admin", "admin", "customer"]);
const isAllowedStaff = roleCheck(["super_admin", "admin", "employee1", "employee2", "viewer"]);

module.exports = {
  verifyTokenRequired,
  verifyTokenOptional,
  isAdmin,
  isSuperAdmin,
  isViewer,
  isEmployee1,
  isEmployee2,
  isCustomer,
  isAdminOrCustomer,
  isSuperAdminAdminOrCustomer,
  isAllowedStaff,
  isAdminOrSuperAdminOrCustomer: isSuperAdminAdminOrCustomer, // alias if still needed
};
