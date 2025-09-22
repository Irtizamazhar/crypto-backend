// controllers/OAuthController.js
const { User } = require("../models");
const jwt = require("jsonwebtoken");

const sign = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );

async function upsertSocial({ provider, profile }) {
  const providerId = profile?.id;
  const email = (profile?.emails?.[0]?.value || "").toLowerCase() || null;
  const name =
    profile?.displayName ||
    profile?.name?.givenName ||
    profile?.username ||
    (email ? email.split("@")[0] : "User");
  const avatar = profile?.photos?.[0]?.value || null;

  // Prefer exact provider match; then fallback to email if it exists
  let user = await User.findOne({ where: { provider, providerId } });
  if (!user && email) user = await User.findOne({ where: { email } });

  if (!user) {
    user = await User.create({
      name,
      email,
      provider,
      providerId,
      avatar,
      role: "user",

      // defaults expected elsewhere
      fiatUsd: 0,
      paper: 0,
      paperStreak: 0,
      paperLastClaimAt: null,
      tapCount: 0,
      userLevel: 0,
      paperHistory: [],
    });
  } else {
    await user.update({
      provider,
      providerId,
      avatar,
      name: user.name || name,
    });
  }
  return user;
}

function redirectWithToken(res, token, error) {
  const base = process.env.CLIENT_URL || "http://localhost:3000";
  // Your SPA should read /auth/callback?token=... or ?error=...
  const url = new URL("/auth/callback", base);
  if (token) url.searchParams.set("token", token);
  if (error) url.searchParams.set("error", error);
  return res.redirect(url.toString());
}

module.exports = {
  async handlePassportSuccess(req, res) {
    try {
      const user = await upsertSocial({ provider: req.authProvider, profile: req.user });
      const token = sign(user);
      return redirectWithToken(res, token);
    } catch (_e) {
      return redirectWithToken(res, null, "oauth_failed");
    }
  },
  handlePassportFailure(_req, res) {
    return redirectWithToken(res, null, "oauth_denied");
  },
};
