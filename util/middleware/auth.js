"use strict";
const { requireAuth } = require("../../middlewares/JWTAuth");

/**
 * Ensure the authenticated user has admin role. This is
 * equivalent to requireAuth + requireRole('admin'). It is
 * separated here for convenience and to match the original API.
 */
function requireAdmin(req, res, next) {
    if (!req.user || String(req.user.role).toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Admin only" });
    }
    next();
}

/**
 * OTP verification stub. In a real production environment, this
 * middleware would verify a one-time password or 2FA token. For
 * demonstration purposes it simply calls next().
 */
function requireOtp(req, res, next) {
    // TODO: integrate real OTP/2FA validation here.
    return next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    requireOtp,
};