const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/JWTAuth");
const W = require("../controllers/WithdrawalAdminController");

// Admin only
router.get("/", requireAuth, requireRole("admin"), W.list);
router.post("/:id/approve", requireAuth, requireRole("admin"), W.approve);
router.post("/:id/reject", requireAuth, requireRole("admin"), W.reject);

module.exports = router;
