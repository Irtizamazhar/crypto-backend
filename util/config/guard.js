// util/config/guard.js
const bcrypt = require("bcryptjs");

module.exports = {
  async hashPass(plain) {
    if (typeof plain !== "string" || !plain) throw new Error("Password required");
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  },
  async verifyPass(plain, hash) {
    if (!hash) return false;
    return bcrypt.compare(plain || "", hash);
  },
};
