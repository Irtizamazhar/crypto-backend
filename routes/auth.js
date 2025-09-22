const router = require("express").Router();
const Auth = require("../controllers/AuthController");
const { requireAuth, requireRole } = require("../middlewares/JWTAuth");
const passport = require("passport");
const { handlePassportSuccess, handlePassportFailure } = require("../controllers/OAuthController");

router.post("/register", Auth.register);
router.post("/login", Auth.login);
router.get("/me", requireAuth, Auth.me);

// admin-only test route (same site)
router.get("/admin/ping", requireAuth, requireRole("admin"), (req, res) => res.json({ ok: true }));

// bootstrap admin once if you prefer (remove/disable later)
router.post("/bootstrap-admin", Auth.bootstrapAdmin);

/* --------- OAuth flows ---------- */
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
