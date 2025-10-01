"use strict";
const bcrypt = require("bcryptjs");

/**
 * Guard utility for hashing and verifying passwords. It wraps
 * bcryptjs and exposes promise-based methods.
 */
module.exports = {
  async hashPass(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },
  async verifyPass(password, hash) {
    return await bcrypt.compare(password, hash);
  },
};