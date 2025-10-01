"use strict";
const TronWeb = require("tronweb");

/**
 * Derive a private key for the TRON hot wallet using an index. In
 * production this would use a hierarchical deterministic wallet
 * (BIP44/BIP32). For demonstration we simply return the base
 * private key from an environment variable. You should replace
 * this with proper key derivation.
 *
 * @param {number} index Derivation index
 * @returns {Promise<string>} A hex string of the derived private key
 */
async function derivePkByIndex(index) {
  // In a real implementation you'd derive a new private key based
  // on index using BIP44. Here we simply return the base key for
  // all indices.
  const pk = process.env.TRON_HOT_PK;
  if (!pk) throw new Error("TRON_HOT_PK not set in environment");
  return pk;
}

/**
 * Instantiate a TronWeb client using a provided private key. The
 * returned instance can sign and send transactions on behalf of
 * the corresponding account.
 *
 * @param {string} pk Private key
 */
function makeTron(pk) {
  return new TronWeb({
    fullHost: process.env.TRON_FULLHOST,
    privateKey: pk,
  });
}

module.exports = {
  derivePkByIndex,
  makeTron,
};