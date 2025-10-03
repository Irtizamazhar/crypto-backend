// server/controllers/ReferralController.js
"use strict";
const { User } = require("../models");

function clientBase() {
  return process.env.CLIENT_URL || "http://localhost:3000";
}

exports.myReferral = async (req, res) => {
  const u = await User.findByPk(req.user.id);
  if (!u) return res.status(404).json({ message: "Not found" });
  const code = u.referralCode || "";
  const link = `${clientBase()}/register?ref=${encodeURIComponent(code)}`;
  return res.json({
    code,
    link,
    referredBy: u.referredBy || null,
    referralCount: Number(u.referralCount || 0),
  });
};
