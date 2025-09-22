// server/index.js (or app.js)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("./middlewares/passport");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ allow auth header
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
// Handle preflight for all routes
app.options("*", cors({
  origin: CLIENT_URL,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

app.use(express.json());
app.use(passport.initialize());

app.use("/public/images", express.static("public/images"));

app.get("/", (_req, res) => res.json({ ok: true, name: "CRYPTO-BACKEND" }));

app.use("/auth", require("./routes/auth"));
app.use("/proxy", require("./routes/proxy"));
app.use("/paper", require("./routes/paper"));
app.use("/admin", require("./routes/admin"));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log("API on http://localhost:" + port));
