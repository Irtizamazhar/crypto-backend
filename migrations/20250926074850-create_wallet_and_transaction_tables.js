"use strict";

module.exports = {
  async up(q, S) {
    // Create kv_counters table
    await q.createTable("kv_counters", {
      key: { type: S.STRING(64), primaryKey: true },
      value_int: { type: S.BIGINT, allowNull: false, defaultValue: 0 },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("NOW") },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("NOW") },
    });

    // Create user_addresses table
    await q.createTable("user_addresses", {
      id: { type: S.BIGINT, autoIncrement: true, primaryKey: true },
      user_id: { type: S.BIGINT, allowNull: false },
      network: { type: S.STRING(16), allowNull: false }, // 'TRC20'
      address: { type: S.STRING(64), allowNull: false }, // base58 T...
      derivation_index: { type: S.INTEGER, allowNull: false },
      last_seen_ts: { type: S.BIGINT },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("NOW") },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("NOW") },
    });
    await q.addIndex("user_addresses", ["user_id", "network"], { unique: true, name: "ua_user_network_uq" });
    await q.addIndex("user_addresses", ["address"], { unique: true, name: "ua_address_uq" });

    // Create deposits table
    await q.createTable("deposits", {
      id: { type: S.BIGINT, autoIncrement: true, primaryKey: true },
      user_id: { type: S.BIGINT, allowNull: false },
      network: { type: S.STRING(16), allowNull: false },
      address: { type: S.STRING(64), allowNull: false },
      txid: { type: S.STRING(128), allowNull: false },
      amount_usdt: { type: S.DECIMAL(18, 6), allowNull: false },
      status: { type: S.STRING(16), allowNull: false, defaultValue: "pending" },
      block_ts: { type: S.BIGINT },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("NOW") },
      credited_at: { type: S.DATE },
    });
    await q.addIndex("deposits", ["network", "txid"], { unique: true, name: "dep_net_tx_uq" });
    await q.addIndex("deposits", ["user_id", "created_at"], { name: "dep_user_created_idx" });

    // Create withdrawals table
    await q.createTable("withdrawals", {
      id: { type: S.BIGINT, autoIncrement: true, primaryKey: true },
      user_id: { type: S.BIGINT, allowNull: false },
      network: { type: S.STRING(16), allowNull: false },
      to_address: { type: S.STRING(64), allowNull: false },
      amount_usdt: { type: S.DECIMAL(18, 6), allowNull: false }, // gross
      fee_usdt: { type: S.DECIMAL(18, 6), allowNull: false, defaultValue: 0 },
      status: { type: S.STRING(16), allowNull: false, defaultValue: "pending" }, // pending|approved|paid|rejected
      txid: { type: S.STRING(128) },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("NOW") },
      processed_at: { type: S.DATE },
    });
    await q.addIndex("withdrawals", ["user_id", "created_at"], { name: "wd_user_created_idx" });

    // Create wallet_entries table
    await q.createTable("wallet_entries", {
      id: { type: S.BIGINT, autoIncrement: true, primaryKey: true },
      user_id: { type: S.BIGINT, allowNull: false },
      delta_usdt: { type: S.DECIMAL(18, 6), allowNull: false },
      balance_after_usdt: { type: S.DECIMAL(18, 6), allowNull: false },
      type: { type: S.STRING(16), allowNull: false }, // deposit|withdraw|purchase|bonus|invest
      ref_type: { type: S.STRING(16) },
      ref_id: { type: S.BIGINT },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("NOW") },
    });
    await q.addIndex("wallet_entries", ["user_id", "id"]);

    // Create platform_entries table
    await q.createTable("platform_entries", {
      id: { type: S.BIGINT, autoIncrement: true, primaryKey: true },
      delta_usdt: { type: S.DECIMAL(18, 6), allowNull: false },
      balance_after_usdt: { type: S.DECIMAL(18, 6), allowNull: false },
      type: { type: S.STRING(24), allowNull: false }, // fee|invest_fee|sweep_out|correction
      ref_type: { type: S.STRING(32) },
      ref_id: { type: S.BIGINT },
      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn("NOW") },
    });
  },

  async down(q) {
    await q.dropTable("platform_entries");
    await q.dropTable("wallet_entries");
    await q.dropTable("withdrawals");
    await q.dropTable("deposits");
    await q.dropTable("user_addresses");
    await q.dropTable("kv_counters");
  }
};
