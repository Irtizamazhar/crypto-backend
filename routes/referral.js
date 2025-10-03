// server/routes/referral.js
const router = require("express").Router();
const { requireAuth } = require("../middlewares/JWTAuth");
const Ref = require("../controllers/ReferralController");

router.use(requireAuth);
router.get("/mine", Ref.myReferral);

module.exports = router;
