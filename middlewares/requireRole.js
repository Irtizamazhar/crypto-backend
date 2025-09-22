// middlewares/requireRole.js
exports.requireRole = (role) => (req, res, next) => {
  const u = req.user;
  if (!u) return res.status(401).json({ message: "Unauthorized" });
  const r = String(u.role || "").toLowerCase();
  if (r !== String(role).toLowerCase()) return res.status(403).json({ message: "Forbidden" });
  return next();
};
