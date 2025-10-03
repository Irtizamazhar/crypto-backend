// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");                // ✅ add this
const passport = require("./middlewares/passport");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const app = express();

/* ---------- CORS ---------- */
const corsOpts = {
  origin: CLIENT_URL,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};
app.use(cors(corsOpts));
app.options("*", cors(corsOpts));

/* ---------- Core ---------- */
app.use(express.json({ limit: "2mb" }));     // ✅ safe JSON limit
app.use(passport.initialize());
app.use("/public/images", express.static("public/images"));

// serve uploaded avatars & other assets if used
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ ensure path import

/* ---------- Health ---------- */
app.get("/", (_req, res) => res.json({ ok: true, name: "CRYPTO-BACKEND" }));

/* ---------- Existing routes ---------- */
app.use("/auth", require("./routes/auth"));
app.use("/proxy", require("./routes/proxy"));
app.use("/paper", require("./routes/paper"));
app.use("/referral", require("./routes/referral"));
app.use("/admin", require("./routes/admin"));
app.use("/api/lottery", require("./routes/lottery"));
app.use("/wallet", require("./routes/wallet"));
app.use("/usdt", require("./routes/usdt"));
app.use("/withdrawals", require("./routes/withdrawals"));
app.use("/api/feed", require("./routes/feed.routes"));

/* ---------- NEW: Alerts routes ---------- */
app.use("/api/alerts", require("./routes/alerts")); // ✅ mount alerts API
app.use("/api/payments", require("./routes/payments"));

/* ---------- Error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

/* ---------- Boot ---------- */
const port = process.env.PORT || 4000;
app.listen(port, () => console.log("API on http://localhost:" + port));
