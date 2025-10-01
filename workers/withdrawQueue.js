"use strict";
const { Withdrawal } = require("../models");
const { derivePkByIndex, makeTron } = require("../services/tronHd");
require("dotenv").config();

const USDT = process.env.USDT_TRON_CONTRACT;
const DEC  = Number(process.env.USDT_TRON_DECIMALS || 6);
const HOT_INDEX = Number(process.env.TRON_HOT_INDEX || 0);

async function sendUsdtTRC20(fromPk, to, amountUsdt) {
  const tron = makeTron(fromPk);
  const c = await tron.contract().at(USDT);
  const units = Math.round(Number(amountUsdt) * 10 ** DEC);
  return await c.transfer(to, units).send();
}

async function queueBroadcast({ withdrawalId, netAmount, toAddress }) {
  const w = await Withdrawal.findByPk(withdrawalId);
  if (!w || w.status !== "approved") return;
  const pk = await derivePkByIndex(HOT_INDEX);
  const txid = await sendUsdtTRC20(pk, toAddress, netAmount);
  await w.update({ status: "paid", txid, processed_at: new Date() });
  return txid;
}

module.exports = { queueBroadcast };
