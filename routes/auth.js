// routes/auth.js
const router = require("express").Router();
const Auth = require("../controllers/AuthController");
const { requireAuth, requireRole } = require("../middlewares/JWTAuth");
const passport = require("passport");
const { handlePassportSuccess, handlePassportFailure } = require("../controllers/OAuthController");

router.post("/register", Auth.register);
router.post("/login", Auth.login);
router.get("/me", requireAuth, Auth.me);

// ✅ NEW
router.post("/forgot-password", Auth.forgotPassword);   // sends magic sign-in link
router.get("/magic-login", Auth.magicLogin);            // exchange magic token → normal JWT

// ✅ Profile operations
router.patch("/update-profile", requireAuth, Auth.updateProfile);
router.post("/change-password", requireAuth, Auth.changePassword);

// admin-only test route
router.get("/admin/ping", requireAuth, requireRole("admin"), (req, res) => res.json({ ok: true }));

router.post("/bootstrap-admin", Auth.bootstrapAdmin);

// OAuth (unchanged)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/fail", session: false }),
  (req, res) => { req.authProvider = "google"; handlePassportSuccess(req, res); }
);
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/auth/fail", session: false }),
  (req, res) => { req.authProvider = "facebook"; handlePassportSuccess(req, res); }
);
router.get("/apple", passport.authenticate("apple"));
router.post("/apple/callback",
  passport.authenticate("apple", { failureRedirect: "/auth/fail", session: false }),
  (req, res) => { req.authProvider = "apple"; handlePassportSuccess(req, res); }
);
router.get("/fail", handlePassportFailure);

module.exports = router;
