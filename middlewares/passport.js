const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const AppleStrategy = require("passport-apple");

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, (accessToken, refreshToken, profile, done) => done(null, profile)));
}

if (process.env.FACEBOOK_CLIENT_ID) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ["id","displayName","photos","email"]
  }, (accessToken, refreshToken, profile, done) => done(null, profile)));
}

if (process.env.APPLE_CLIENT_ID) {
  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    callbackURL: "/auth/apple/callback",
    privateKeyString: Buffer.from(process.env.APPLE_PRIVATE_KEY_BASE64 || "", "base64").toString("utf8"),
    scope: ["name","email"]
  }, (accessToken, refreshToken, idToken, profile, done) => done(null, profile)));
}

module.exports = passport;
