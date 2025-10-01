// routes/auth.js
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Auth = require("../controllers/AuthController");
const { requireAuth, requireRole } = require("../middlewares/JWTAuth");
const passport = require("passport");
const { handlePassportSuccess, handlePassportFailure } = require("../controllers/OAuthController");

// Ensure folder exists
const AVATAR_DIR = path.join(__dirname, "..", "uploads", "avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
    const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) {
      return cb(new Error("Only PNG/JPG/WEBP images are allowed"));
    }
    cb(null, true);
  },
});

router.post("/register", Auth.register);
router.post("/login", Auth.login);
router.get("/me", requireAuth, Auth.me);

// NEW: upload avatar -> returns { url }
router.post("/upload-avatar", requireAuth, upload.single("avatar"), Auth.uploadAvatar);

// Profile
router.patch("/update-profile", requireAuth, Auth.updateProfile);
router.post("/change-password", requireAuth, Auth.changePassword);

// Passwordless
router.post("/forgot-password", Auth.forgotPassword);
router.get("/magic-login", Auth.magicLogin);

// Admin test + bootstrap
router.get("/admin/ping", requireAuth, requireRole("admin"), (req, res) => res.json({ ok: true }));
router.post("/bootstrap-admin", Auth.bootstrapAdmin);

// OAuth
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
