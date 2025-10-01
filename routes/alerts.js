// server/routes/alerts.js
const router = require("express").Router();
const { requireAuth } = require("../middlewares/JWTAuth");
const Alerts = require("../controllers/AlertsController");

router.use(requireAuth);

router.get("/limits", Alerts.limits);
router.get("/",       Alerts.list);
router.post("/",      Alerts.create);
router.patch("/:id",  Alerts.update);
router.delete("/:id", Alerts.remove);
router.post("/clear", Alerts.clear);

module.exports = router;
