// routes/proxy.js
const router = require("express").Router();

// If you're on Node 18+, fetch is built-in. If on Node 16, see note at bottom.

// ----------------------
// Tiny in-memory cache
// ----------------------
const cache = new Map(); // key -> { ts, data }
const TTL_MS = 5000;     // cache 5s for hot endpoints

function getCache(key) {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() - v.ts > TTL_MS) { cache.delete(key); return null; }
  return v.data;
}
function setCache(key, data) {
  cache.set(key, { ts: Date.now(), data });
}

// ----------------------
// Helpers
// ----------------------
const BINANCE_HTTP = "https://api.binance.com";

async function passJson(res, url, { cacheKey = null, ttl = TTL_MS } = {}) {
  // serve from cache if present
  if (cacheKey) {
    const hit = getCache(cacheKey);
    if (hit) return res.json(hit);
  }

  // 12s timeout using AbortController
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);

  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return res.status(r.status).json({ message: `Proxy HTTP ${r.status}` });
    const j = await r.json();

    if (cacheKey) setCache(cacheKey, j);
    return res.json(j);
  } catch (e) {
    // AbortError -> timeout, or other error
    const msg = e?.name === "AbortError" ? "Proxy timeout" : (e?.message || "Proxy error");
    return res.status(500).json({ message: msg });
  } finally {
    clearTimeout(t);
  }
}

// ----------------------
// Health
// ----------------------
router.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ----------------------
// Binance pass-throughs
// ----------------------

// All 24h tickers (cached)
router.get("/binance/ticker24h", async (_req, res) => {
  return passJson(res, `${BINANCE_HTTP}/api/v3/ticker/24hr`, { cacheKey: "ticker24h" });
});

// Single 24h ticker
router.get("/binance/ticker24hr", async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ message: "symbol required" });
  return passJson(res, `${BINANCE_HTTP}/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`);
});

// klines
router.get("/binance/klines", async (req, res) => {
  const q = new URLSearchParams(req.query).toString();
  return passJson(res, `${BINANCE_HTTP}/api/v3/klines?${q}`);
});

// exchangeInfo (cached)
router.get("/binance/exchangeInfo", async (_req, res) => {
  return passJson(res, `${BINANCE_HTTP}/api/v3/exchangeInfo`, { cacheKey: "exchangeInfo" });
});

// price
router.get("/binance/price", async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ message: "symbol required" });
  return passJson(res, `${BINANCE_HTTP}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`);
});

module.exports = router;
