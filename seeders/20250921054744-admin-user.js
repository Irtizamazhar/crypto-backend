"use strict";
const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Use env if present, else defaults
    const email = process.env.ADMIN_EMAIL || "admin@site.com";
    const pass = process.env.ADMIN_PASS || "admin123";
    const hash = await bcrypt.hash(pass, 10);

    // Ensure no duplicate (idempotent-ish)
    // Some MySQLs don’t support "ON DUPLICATE KEY" in bulkInsert; we just try insert.
    return queryInterface.bulkInsert("users", [{
      name: "Admin",
      email,
      password: hash,
      role: "admin",
      provider: "local",
      providerId: null,
      avatar: null,
      isActive: 1,
      createdAt: now,
      updatedAt: now
    }], {});
  },

  async down(queryInterface) {
    const email = process.env.ADMIN_EMAIL || "admin@site.com";
    return queryInterface.bulkDelete("users", { email });
  }
};
