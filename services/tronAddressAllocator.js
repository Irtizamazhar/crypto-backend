"use strict";
const { UserAddress, KvCounter, sequelize } = require("../models");
const tronAddressGenerator = require("./tronAddressGenerator");

/**
 * Generate a REAL TRON address for user
 */
async function createTronAddressForUser(userId) {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if user already has a TRC20 address
    const existingAddress = await UserAddress.findOne({
      where: { user_id: userId, network: "TRC20" },
      transaction
    });

    if (existingAddress) {
      await transaction.commit();
      console.log(`User ${userId} already has TRC20 address: ${existingAddress.address}`);
      return { 
        address: existingAddress.address, 
        derivation_index: existingAddress.derivation_index 
      };
    }

    // Get next available index
    const key = "tronAddressIndex";
    let counter = await KvCounter.findByPk(key, { transaction });
    let derivationIndex;
    
    if (!counter) {
      counter = await KvCounter.create({ key, value_int: 0 }, { transaction });
      derivationIndex = 0;
    } else {
      derivationIndex = Number(counter.value_int) + 1;
      counter.value_int = derivationIndex;
      await counter.save({ transaction });
    }

    console.log(`🎯 Generating TRC20 address for user ${userId} at index ${derivationIndex}`);

    // Generate address using the enhanced generator
    const addressData = await tronAddressGenerator.generateRealTronAddress(derivationIndex);
    
    if (!addressData || !addressData.address) {
      throw new Error('Address generation failed');
    }

    // Validate address format using the fixed isValidAddress method
    if (!tronAddressGenerator.isValidAddress(addressData.address)) {
      console.error(`❌ Invalid address format: ${addressData.address}`);
      throw new Error(`Invalid TRON address: ${addressData.address}`);
    }

    // Double-check for hot wallet conflict
    if (tronAddressGenerator.isConflictWithHotWallet(addressData.address)) {
      console.error(`❌ Generated address conflicts with hot wallet: ${addressData.address}`);
      throw new Error('Generated address conflicts with hot wallet');
    }

    console.log(`✅ Generated valid TRC20 address: ${addressData.address} (${addressData.method})`);

    // Create user address record
    const userAddress = await UserAddress.create({
      user_id: userId,
      network: "TRC20",
      address: addressData.address,
      derivation_index: derivationIndex,
      last_seen_ts: 0,
    }, { transaction });

    await transaction.commit();
    
    console.log(`🎉 Successfully created TRC20 address for user ${userId}: ${addressData.address}`);
    
    return { 
      address: userAddress.address, 
      derivation_index: userAddress.derivation_index 
    };
    
  } catch (error) {
    await transaction.rollback();
    console.error("💥 CRITICAL: Address generation failed for user", userId, ":", error.message);
    
    throw new Error(`Cannot create wallet address: ${error.message}`);
  }
}

/**
 * Get address generator status (for admin)
 */
async function getAddressGeneratorStatus() {
  return tronAddressGenerator.getStatus();
}

/**
 * Test address generation (for admin)
 */
async function testAddressGeneration() {
  return await tronAddressGenerator.testAllMethods();
}

module.exports = {
  createTronAddressForUser,
  getAddressGeneratorStatus,
  testAddressGeneration
};