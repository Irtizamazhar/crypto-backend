"use strict";

const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const cookie = require("cookie");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const AppleStrategy = require("passport-apple");

const { User } = require("../models");

// ---------------------------------------------------------------------------
// Sessions (used by social OAuth; JWT auth itself is stateless)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ---------------------------------------------------------------------------
// JWT STRATEGY (this is what your protected APIs use)
const fromCookie = (req) => {
  if (!req?.headers?.cookie) return null;
  try {
    const parsed = cookie.parse(req.headers.cookie);
    return parsed.token || null; // if you store token in cookie named "token"
  } catch {
    return null;
  }
};

const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(), // "Authorization: Bearer <token>"
    fromCookie,                               // or cookie fallback
  ]),
  secretOrKey: process.env.JWT_SECRET,
  algorithms: ["HS256"],
};

passport.use(
  "jwt",
  new JwtStrategy(jwtOpts, async (payload, done) => {
    try {
      const userId = payload.id ?? payload.userId ?? payload.sub;
      if (!userId) return done(null, false);

      const user = await User.findByPk(userId, {
        attributes: [
          "id", "name", "email", "role",
          "fiatUsd",
          "paper", "paperStreak", "paperLastClaimAt",
          "tapCount", "userLevel", "paperHistory",
          "freeAlertsLimit", "freeAlertsUsed",
        ],
      });
      if (!user) return done(null, false);

      // Attach a light user object to req.user
      return done(null, user.toJSON());
    } catch (err) {
      return done(err, false);
    }
  })
);

// ---------------------------------------------------------------------------
// Social strategies (keep your existing ones)
// Only register if env vars are present.
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      (accessToken, refreshToken, profile, done) => done(null, profile)
    )
  );
}

if (process.env.FACEBOOK_CLIENT_ID) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "/auth/facebook/callback",
        profileFields: ["id", "displayName", "photos", "email"],
      },
      (accessToken, refreshToken, profile, done) => done(null, profile)
    )
  );
}

if (process.env.APPLE_CLIENT_ID) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        callbackURL: "/auth/apple/callback",
        privateKeyString: Buffer.from(
          process.env.APPLE_PRIVATE_KEY_BASE64 || "",
          "base64"
        ).toString("utf8"),
        scope: ["name", "email"],
      },
      (accessToken, refreshToken, idToken, profile, done) => done(null, profile)
    )
  );
}

module.exports = passport;
