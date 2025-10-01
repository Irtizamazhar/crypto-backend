"use strict";

/**
 * Calculate investment fee for purchases. Returns the fee amount
 * (in USDT) for a given purchase amount. For demonstration we
 * apply a flat 1% fee with a minimum of 0.01 USDT.
 *
 * @param {number} amount Amount of the purchase in USDT
 * @returns {number} fee in USDT
 */
function calcInvestFee(amount) {
  const feeRate = 0.01;
  const fee = amount * feeRate;
  return Math.max(0.01, parseFloat(fee.toFixed(6)));
}

/**
 * Calculate withdrawal fee for USDT withdrawals. Returns an object
 * with the fee and the net amount. We apply a 1.5% fee with a
 * minimum of 0.5 USDT for demonstration purposes.
 *
 * @param {number} amount Amount requested for withdrawal
 * @returns {{ fee: number, net: number }}
 */
function calcWithdrawFee(amount) {
  const feeRate = 0.015;
  const fee = Math.max(0.5, amount * feeRate);
  const net = amount - fee;
  return { fee: parseFloat(fee.toFixed(6)), net: parseFloat(net.toFixed(6)) };
}

module.exports = {
  calcInvestFee,
  calcWithdrawFee,
};