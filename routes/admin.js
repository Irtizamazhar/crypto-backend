const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/JWTAuth");
const { User, Deposit, Withdrawal, PlatformEntry, WalletEntry, UserAddress } = require("../models");
const { getPlatformBalanceUSDT, getHotWalletBalance } = require("../services/wallet.service");
const Sequelize = require('sequelize');

// ⬇️ Import Paper controller for Prize Rain admin actions
const Paper = require("../controllers/PaperWalletController");

// OPTIONAL: real admin login route (only if you want it).
const Auth = require("../controllers/AuthController");
router.post("/auth/login", async (req, res, next) => {
  try {
    let responded = false;
    const _json = res.json.bind(res);
    res.json = (payload) => {
      responded = true;
      const role = String(payload?.user?.role || "").toLowerCase();
      if (role !== "admin") {
        return res.status(403).json({ message: "This account is not an admin." });
      }
      return _json(payload);
    };
    await Auth.login(req, res, next);
    if (!responded) res.status(500).json({ message: "Login handler did not respond" });
  } catch (err) {
    next(err);
  }
});

// Admin-only identity (used by AdminAPI.me fallback)
router.get("/auth/me", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ user: req.user });
});

// Simple health
router.get("/ping", requireAuth, requireRole("admin"), (req, res) => res.json({ ok: true }));

// ---- Overview ----
router.get("/overview", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const usersTotal = await User.count();
    const usersActive24h = await User.count({
      where: {
        updatedAt: {
          [Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const payments24h = await Deposit.count({
      where: {
        status: 'completed',
        createdAt: {
          [Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const paperDistributed24h = 0;

    res.json({
      users_total: usersTotal,
      users_active_24h: usersActive24h,
      payments_24h: payments24h,
      paper_distributed_24h: paperDistributed24h
    });
  } catch (error) {
    console.error("Overview error:", error);
    res.json({
      users_total: 0,
      users_active_24h: 0,
      payments_24h: 0,
      paper_distributed_24h: 0
    });
  }
});

// ---- Users (⬅️ now returns tapCount and paper too) ----
router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 20;
    const offset = (page - 1) * limit;
    const q = String(req.query.q || "").trim();

    const where = {};
    if (q) {
      where[Sequelize.Op.or] = [
        { email: { [Sequelize.Op.like]: `%${q}%` } },
        { name: { [Sequelize.Op.like]: `%${q}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'status', 'tapCount', 'paper', 'createdAt', 'updatedAt'], // ⬅️ added
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      page,
      pages: Math.ceil(count / limit),
      total: count,
      items: rows
    });
  } catch (error) {
    console.error("Users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.put("/users/:id/role", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({ ok: true, id, role });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

router.put("/users/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status;
    await user.save();

    res.json({ ok: true, id, status });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// ---- Payments ----
router.get("/payments", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 20;
    const offset = (page - 1) * limit;
    const q = String(req.query.q || "").trim();

    const where = {};
    if (q) {
      where[Sequelize.Op.or] = [
        { reference: { [Sequelize.Op.like]: `%${q}%` } },
        { '$user.email$': { [Sequelize.Op.like]: `%${q}%` } },
        { '$user.name$': { [Sequelize.Op.like]: `%${q}%` } }
      ];
    }

    const { count, rows } = await Deposit.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      page,
      pages: Math.ceil(count / limit),
      total: count,
      items: rows
    });
  } catch (error) {
    console.error("Payments error:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

// ---- Earn Paper settings ----
router.get("/earn-paper", requireAuth, requireRole("admin"), async (_req, res) => {
  res.json({
    daily_reward_base: 1,
    daily_reward_cap: 3,
    streak_step: 3,
    tap_reward: 1,
    referral_bonus: 5,
  });
});

router.put("/earn-paper", requireAuth, requireRole("admin"), async (req, res) => {
  // TODO: persist payload in DB
  res.json({ ok: true, saved: req.body || {} });
});

// ---- Withdrawals ----
router.get("/withdrawals", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 20;
    const offset = (page - 1) * limit;
    const q = String(req.query.q || "").trim();
    const status = req.query.status === "all" ? null : String(req.query.status || "");

    const where = {};
    if (status) where.status = status;

    if (q) {
      where[Sequelize.Op.or] = [
        { to_address: { [Sequelize.Op.like]: `%${q}%` } },
        { '$user.email$': { [Sequelize.Op.like]: `%${q}%` } },
        { '$user.name$': { [Sequelize.Op.like]: `%${q}%` } }
      ];
    }

    const { count, rows } = await Withdrawal.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      page,
      pages: Math.ceil(count / limit),
      total: count,
      items: rows
    });
  } catch (error) {
    console.error("Withdrawals error:", error);
    res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
});

// ---- Deposits ----
router.get("/deposits", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 20;
    const offset = (page - 1) * limit;
    const q = String(req.query.q || "").trim();
    const status = req.query.status === "all" ? null : String(req.query.status || "");

    const where = {};
    if (status) where.status = status;

    if (q) {
      where[Sequelize.Op.or] = [
        { from_address: { [Sequelize.Op.like]: `%${q}%` } },
        { txid: { [Sequelize.Op.like]: `%${q}%` } },
        { '$user.email$': { [Sequelize.Op.like]: `%${q}%` } },
        { '$user.name$': { [Sequelize.Op.like]: `%${q}%` } }
      ];
    }

    const { count, rows } = await Deposit.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      page,
      pages: Math.ceil(count / limit),
      total: count,
      items: rows
    });
  } catch (error) {
    console.error("Deposits error:", error);
    res.status(500).json({ message: "Failed to fetch deposits" });
  }
});

router.post("/withdrawals/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Withdrawal already processed" });
    }

    withdrawal.status = "approved";
    await withdrawal.save();

    res.json({ ok: true, message: "Withdrawal approved" });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({ message: "Failed to approve withdrawal" });
  }
});

router.post("/withdrawals/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findByPk(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Withdrawal already processed" });
    }

    withdrawal.status = "rejected";
    withdrawal.reject_reason = req.body.reason;
    await withdrawal.save();

    res.json({ ok: true, message: "Withdrawal rejected" });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({ message: "Failed to reject withdrawal" });
  }
});

// ---- Accounts ----
router.get("/accounts", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [
      platformBalance,
      hotWalletBalance,
      totalDeposits,
      totalWithdrawals,
      totalFees,
      pendingWithdrawals,
      pendingDeposits,
      recentTransactions
    ] = await Promise.all([
      getPlatformBalanceUSDT(),
      getHotWalletBalance(),
      Deposit.sum('amount_usdt', { where: { status: 'completed' } }) || 0,
      Withdrawal.sum('amount_usdt', { where: { status: ['approved', 'completed'] } }) || 0,
      Withdrawal.sum('fee_usdt', { where: { status: ['approved', 'completed'] } }) || 0,
      Withdrawal.count({ where: { status: 'pending' } }),
      Deposit.count({ where: { status: 'pending' } }),
      PlatformEntry.findAll({
        order: [['created_at', 'DESC']],
        limit: 10
      })
    ]);

    res.json({
      platform_balance: platformBalance,
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      net_revenue: totalFees,
      pending_withdrawals_count: pendingWithdrawals,
      pending_deposits_count: pendingDeposits,
      hot_wallet_address: hotWalletBalance.address,
      hot_wallet_balance: hotWalletBalance.usdt,
      hot_wallet_trx_balance: hotWalletBalance.trx,
      hot_wallet_timestamp: hotWalletBalance.timestamp,
      hot_wallet_error: hotWalletBalance.error,
      recent_transactions: recentTransactions.map(tx => ({
        type: tx.type,
        ref_type: tx.ref_type,
        delta_usdt: Number(tx.delta_usdt),
        created_at: tx.created_at
      }))
    });
  } catch (error) {
    console.error("Accounts error:", error);
    res.status(500).json({
      message: "Failed to fetch account data",
      error: error.message
    });
  }
});

// ---- Hot Wallet Refresh Endpoint ----
router.get("/accounts/refresh-wallet", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const hotWalletBalance = await getHotWalletBalance();

    res.json({
      success: true,
      hot_wallet_address: hotWalletBalance.address,
      hot_wallet_balance: hotWalletBalance.usdt,
      hot_wallet_trx_balance: hotWalletBalance.trx,
      timestamp: hotWalletBalance.timestamp,
      error: hotWalletBalance.error
    });
  } catch (error) {
    console.error("Refresh wallet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh wallet balance",
      error: error.message
    });
  }
});

// ---- Tron Service Status ----
router.get("/tron-status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const tronService = require("../services/tron.service");
    const status = tronService.getStatus();
    const hotWalletAddress = process.env.TRON_HOT_ADDRESS;

    let walletBalance = { usdt: 0, trx: 0, error: 'Service not available' };
    if (status.tronWebAvailable && hotWalletAddress) {
      walletBalance = await tronService.getWalletBalances(hotWalletAddress);
    }

    res.json({
      service_status: status,
      wallet_balance: walletBalance,
      environment: {
        trongrid_api_key: process.env.TRONGRID_API_KEY ? '***' + process.env.TRONGRID_API_KEY.slice(-4) : 'Not set',
        hot_wallet_address: hotWalletAddress,
        usdt_contract: process.env.USDT_TRON_CONTRACT,
        node_url: process.env.TRON_FULLHOST
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ---- Prize Rain admin controls (NEW) ----
router.post("/paper/rain/start", requireAuth, requireRole("admin"), Paper.adminStartRain);
router.post("/paper/rain/stop", requireAuth, requireRole("admin"), Paper.adminStopRain);

module.exports = router;
