// middlewares/JWTAuth.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");

exports.requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, {
      attributes: [
        "id", "name", "email", "role",
        "fiatUsd",
        "paper", "paperStreak", "paperLastClaimAt",
        "tapCount", "userLevel", "paperHistory",
      ],
    });
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user.toJSON();
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || String(req.user.role) !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
