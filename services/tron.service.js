// server/services/tron.service.js
"use strict";

const TronWeb = require("tronweb");

/** ---------- helpers (no floating-point drift) ---------- */
function amountToUnits(amount, decimals = 6) {
  // Accept number or string, return BigInt of token's smallest units
  const s = String(amount).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error("Invalid amount");
  const [intPart, fracPart = ""] = s.split(".");
  const frac = (fracPart + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(intPart + frac);
}
function unitsToDecimalString(unitsBigInt, decimals = 6) {
  const neg = unitsBigInt < 0n ? "-" : "";
  const abs = unitsBigInt < 0n ? -unitsBigInt : unitsBigInt;
  const s = abs.toString().padStart(decimals + 1, "0");
  const i = s.slice(0, -decimals);
  const f = s.slice(-decimals).replace(/0+$/, "");
  return neg + (f ? `${i}.${f}` : i);
}
function parseHexToBigInt(hexLike) {
  if (hexLike == null) return 0n;
  const s = String(hexLike);
  if (s.startsWith("0x")) return BigInt(s);
  // tronweb sometimes returns plain decimal string
  if (/^\d+$/.test(s)) return BigInt(s);
  // object with toString
  return BigInt(s.toString());
}

class TronService {
  constructor() {
    this.initialized = false;
    this.tronWeb = null;
    this.hotPrivateKey = null;
    this.hotAddress = null;
    this.usdtContractAddress = null;
    this.usdtDecimals = 6;
    this.initialize(); // fire & forget; safe if awaited elsewhere too
  }

  /** Initialize once; verify env and connection */
  async initialize() {
    try {
      const {
        TRON_FULLHOST = "https://api.trongrid.io",
        TRONGRID_API_KEY,
        TRON_HOT_ADDRESS,
        TRON_HOT_WALLET_PRIVATE_KEY,
        USDT_TRON_CONTRACT,
        USDT_TRON_DECIMALS = "6",
      } = process.env;

      if (!TRONGRID_API_KEY) {
        console.error("❌ TRONGRID_API_KEY not configured in .env");
        this.initialized = false;
        return false;
      }
      if (!TRON_HOT_ADDRESS) {
        console.error("❌ TRON_HOT_ADDRESS not configured in .env");
        this.initialized = false;
        return false;
      }
      if (!USDT_TRON_CONTRACT) {
        console.error("❌ USDT_TRON_CONTRACT not configured in .env");
        this.initialized = false;
        return false;
      }

      this.tronWeb = new TronWeb({
        fullHost: TRON_FULLHOST,
        headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY },
      });

      this.usdtContractAddress = USDT_TRON_CONTRACT;
      this.usdtDecimals = parseInt(USDT_TRON_DECIMALS) || 6;

      if (TRON_HOT_WALLET_PRIVATE_KEY) {
        this.hotPrivateKey = TRON_HOT_WALLET_PRIVATE_KEY;
        // derive address and warn if mismatch
        const derived = this.tronWeb.address.fromPrivateKey(this.hotPrivateKey);
        this.hotAddress = derived;
        if (TRON_HOT_ADDRESS && TRON_HOT_ADDRESS !== derived) {
          console.warn(
            `⚠️ TRON_HOT_ADDRESS (${TRON_HOT_ADDRESS}) != derived from private key (${derived}). Using derived address to sign.`
          );
        }
        // set private key so contract .send() can sign
        this.tronWeb.setPrivateKey(this.hotPrivateKey);
      } else {
        console.warn("⚠️ TRON_HOT_WALLET_PRIVATE_KEY missing — balance calls ok, transfers will fail.");
      }

      // quick connectivity test
      const block = await this.tronWeb.trx.getCurrentBlock();
      const bn = block?.block_header?.raw_data?.number ?? "unknown";
      console.log("✅ TronService initialized • Current block:", bn);
      this.initialized = true;
      return true;
    } catch (err) {
      console.error("❌ TronService initialization failed:", err.message);
      this.initialized = false;
      return false;
    }
  }

  /** Validate address quickly */
  isValidAddress(address) {
    return !!this.tronWeb && this.tronWeb.isAddress(address);
  }

  /** TRX balance in TRX (number) */
  async getTRXBalance(address) {
    try {
      if (!this.tronWeb) return 0;
      if (!this.isValidAddress(address)) return 0;
      const sun = await this.tronWeb.trx.getBalance(address);
      return Number(this.tronWeb.fromSun(sun));
    } catch (e) {
      console.error("getTRXBalance error:", e.message);
      return 0;
    }
  }

  /** USDT balance in decimal number (safe for typical sizes) */
  async getUSDTBalance(address) {
    try {
      if (!this.tronWeb) return 0;
      if (!this.isValidAddress(address)) return 0;
      if (!this.usdtContractAddress) return 0;

      // Method 1: triggerConstantContract (low level)
      try {
        const res = await this.tronWeb.transactionBuilder.triggerConstantContract(
          this.usdtContractAddress,
          "balanceOf(address)",
          {},
          [{ type: "address", value: address }],
          address
        );
        const hex = res?.constant_result?.[0];
        if (hex) {
          const units = parseHexToBigInt(hex);
          const asStr = unitsToDecimalString(units, this.usdtDecimals);
          return Number(asStr);
        }
      } catch (e) {
        // fallthrough
      }

      // Method 2: contract().at().call()
      try {
        const c = await this.tronWeb.contract().at(this.usdtContractAddress);
        const raw = await c.balanceOf(address).call({ shouldPollResponse: false });
        const units = parseHexToBigInt(raw?._hex ?? raw);
        const asStr = unitsToDecimalString(units, this.usdtDecimals);
        return Number(asStr);
      } catch (e) {
        // fallthrough
      }

      // Method 3: account tokens (may not expose TRC20 balances)
      try {
        const acc = await this.tronWeb.trx.getAccount(address);
        const list = acc?.assetV2 || [];
        const hit = list.find((x) => String(x.key) === this.usdtContractAddress);
        if (hit) {
          const units = BigInt(hit.value);
          const asStr = unitsToDecimalString(units, this.usdtDecimals);
          return Number(asStr);
        }
      } catch (e) {
        // fallthrough
      }

      return 0;
    } catch (error) {
      console.error("getUSDTBalance fatal:", error.message);
      return 0;
    }
  }

  /** Combined balances */
  async getWalletBalances(address) {
    try {
      const [usdt, trx] = await Promise.all([this.getUSDTBalance(address), this.getTRXBalance(address)]);
      return { address, usdt, trx, timestamp: new Date().toISOString(), error: null };
    } catch (e) {
      return { address, usdt: 0, trx: 0, timestamp: new Date().toISOString(), error: e.message };
    }
  }

  /** Send TRC20 USDT from the hot wallet */
  async transferUSDT(toAddress, amount) {
    if (!this.initialized) throw new Error("TronService not initialized");
    if (!this.hotPrivateKey) throw new Error("Hot wallet private key not configured");
    if (!this.isValidAddress(toAddress)) throw new Error("Invalid recipient address");
    if (!this.usdtContractAddress) throw new Error("USDT contract not configured");

    // ensure fee TRX
    const from = this.hotAddress || this.tronWeb.address.fromPrivateKey(this.hotPrivateKey);
    const trxBalSun = await this.tronWeb.trx.getBalance(from);
    if (Number(trxBalSun) < 2_000_000) {
      throw new Error("Hot wallet has insufficient TRX for network fees");
    }

    // convert to token units
    const units = amountToUnits(amount, this.usdtDecimals);

    const c = await this.tronWeb.contract().at(this.usdtContractAddress);
    // signing uses the private key set in initialize()
    const txid = await c.transfer(toAddress, units).send({
      feeLimit: 10_000_000, // 10 TRX max
      callValue: 0,
      shouldPollResponse: false,
      from,
    });

    // txid is a string
    return String(txid);
  }

  /** Optional: poll for confirmation (receipt) */
  async waitForConfirmation(txid, { timeoutMs = 120_000, pollMs = 3_000 } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const info = await this.tronWeb.trx.getTransactionInfo(txid);
        if (info && info.id) {
          // Typical success state
          if (info.receipt && info.receipt.result === "SUCCESS") return { confirmed: true, info };
          // If it exists with another result, consider it done too
          return { confirmed: false, info };
        }
      } catch {
        // not found yet
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    return { confirmed: false, timeout: true };
  }

  /** Status object for debugging/health check */
  getStatus() {
    return {
      initialized: this.initialized,
      tronWebAvailable: !!this.tronWeb,
      apiKeyConfigured: !!process.env.TRONGRID_API_KEY,
      hotWalletConfigured: !!process.env.TRON_HOT_ADDRESS,
      hotWalletAddress: this.hotAddress || process.env.TRON_HOT_ADDRESS || null,
      usdtContract: this.usdtContractAddress,
      usdtDecimals: this.usdtDecimals,
    };
  }

  /** Dev test utilities kept (fixed to respect token decimals) */
  async testTriggerConstantContract(address) {
    const res = await this.tronWeb.transactionBuilder.triggerConstantContract(
      this.usdtContractAddress,
      "balanceOf(address)",
      {},
      [{ type: "address", value: address }],
      address
    );
    const hex = res?.constant_result?.[0];
    const units = parseHexToBigInt(hex);
    return Number(unitsToDecimalString(units, this.usdtDecimals));
  }
  async testContractCall(address) {
    const c = await this.tronWeb.contract().at(this.usdtContractAddress);
    const raw = await c.balanceOf(address).call();
    const units = parseHexToBigInt(raw?._hex ?? raw);
    return Number(unitsToDecimalString(units, this.usdtDecimals));
  }
  async testGetAccount(address) {
    const acc = await this.tronWeb.trx.getAccount(address);
    const list = acc?.assetV2 || [];
    const hit = list.find((x) => String(x.key) === this.usdtContractAddress);
    if (!hit) return 0;
    const units = BigInt(hit.value);
    return Number(unitsToDecimalString(units, this.usdtDecimals));
  }
  async testAllMethods(address) {
    const trxBalance = await this.getTRXBalance(address);
    const m1 = await this.testTriggerConstantContract(address).catch((e) => ({ error: e.message }));
    const m2 = await this.testContractCall(address).catch((e) => ({ error: e.message }));
    const m3 = await this.testGetAccount(address).catch((e) => ({ error: e.message }));
    return {
      address,
      timestamp: new Date().toISOString(),
      trxBalance,
      methods: { triggerConstantContract: m1, contractCall: m2, getAccount: m3 },
    };
  }
}

// Singleton export
module.exports = new TronService();
