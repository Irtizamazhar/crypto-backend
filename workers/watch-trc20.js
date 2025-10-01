"use strict";
const axios = require("axios");
require("dotenv").config();
const { UserAddress, Deposit, WalletEntry, sequelize } = require("../models");

const API = process.env.TRON_FULLHOST;
const KEY = process.env.TRONGRID_API_KEY;
const USDT = process.env.USDT_TRON_CONTRACT;
const MIN_CONF = Number(process.env.TRON_MIN_CONFIRMATIONS || 20);

async function getNowBlock() {
  const { data } = await axios.get(`${API}/wallet/getnowblock`, { headers: { "TRON-PRO-API-KEY": KEY } });
  return data?.block_header?.raw_data?.number || 0;
}

async function fetchIncomingUSDT(address, minTs) {
  const url = `${API}/v1/accounts/${address}/transactions/trc20`;
  const params = { only_to: true, contract_address: USDT, min_timestamp: minTs || 0, limit: 50, order_by: "block_timestamp,asc" };
  const { data } = await axios.get(url, { params, headers: { "TRON-PRO-API-KEY": KEY } });
  return (data?.data || []).map(x => ({
    txid: x.transaction_id, to: x.to,
    amount: Number(x.value) / 1e6, block_ts: x.block_timestamp, block: x.block_number
  }));
}

async function creditDeposit(userId, address, tx, t) {
  const exists = await Deposit.findOne({ where: { network: "TRC20", address, txid: tx.txid }, transaction: t, lock: t.LOCK.UPDATE });
  if (exists) return;

  const dep = await Deposit.create({
    user_id: userId, network: "TRC20", address, txid: tx.txid,
    amount_usdt: tx.amount, status: "credited", block_ts: tx.block_ts, credited_at: new Date()
  }, { transaction: t });

  const [last] = await sequelize.query(
    "SELECT balance_after_usdt FROM wallet_entries WHERE user_id=? ORDER BY id DESC LIMIT 1",
    { replacements: [userId], type: sequelize.QueryTypes.SELECT, transaction: t }
  );
  const prev = Number(last?.balance_after_usdt || 0);
  const next = prev + Number(tx.amount);

  await WalletEntry.create({
    user_id: userId, delta_usdt: tx.amount, balance_after_usdt: next, type: "deposit",
    ref_type: "deposits", ref_id: dep.id
  }, { transaction: t });
}

async function runOnce() {
  const nowBlock = await getNowBlock();
  const addrs = await UserAddress.findAll({ where: { network: "TRC20" } });

  for (const ua of addrs) {
    const minTs = ua.last_seen_ts || 0;
    const txs = await fetchIncomingUSDT(ua.address, minTs);

    for (const t of txs) {
      if (!t.block || (nowBlock - t.block) < MIN_CONF) continue;
      await sequelize.transaction(async (trx) => { await creditDeposit(ua.user_id, ua.address, t, trx); });
    }

    const newest = txs.length ? txs[txs.length - 1].block_ts : (ua.last_seen_ts || Date.now());
    await ua.update({ last_seen_ts: Math.max(ua.last_seen_ts || 0, newest) });
  }
}

if (require.main === module) {
  runOnce().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { runOnce };
