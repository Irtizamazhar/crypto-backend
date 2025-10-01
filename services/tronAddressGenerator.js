"use strict";
const TronWeb = require('tronweb');
const { generateMnemonic, mnemonicToSeedSync, validateMnemonic } = require('bip39');
const { hdkey } = require('ethereumjs-wallet');
const crypto = require('crypto');

class TronAddressGenerator {
    constructor() {
        this.tronWeb = new TronWeb({
            fullHost: process.env.TRON_FULLHOST,
            headers: { 
                "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY 
            }
        });
        
        this.initialized = false;
        this.masterPrivateKey = process.env.TRON_HOT_WALLET_PRIVATE_KEY;
        this.mnemonic = process.env.TRON_HD_MNEMONIC;
        this.basePath = process.env.TRON_HD_BASE_PATH || "m/44'/195'/0'/0";
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🔌 Initializing TronAddressGenerator...');
            
            // Test TronWeb connection
            const block = await this.tronWeb.trx.getCurrentBlock();
            console.log('✅ TronWeb connected - Current block:', block.block_header.raw_data.number);
            
            // Verify master private key
            if (this.masterPrivateKey && this.masterPrivateKey !== 'your-actual-tronlink-private-key-here') {
                try {
                    const testAddress = this.tronWeb.address.fromPrivateKey(this.masterPrivateKey);
                    console.log(`✅ Master private key verified. Hot wallet: ${testAddress}`);
                    
                    // Check if it matches the configured hot wallet address
                    const configuredAddress = process.env.TRON_HOT_ADDRESS;
                    if (testAddress !== configuredAddress) {
                        console.warn(`⚠️  Private key derives to ${testAddress}, but TRON_HOT_ADDRESS is ${configuredAddress}`);
                    }
                } catch (keyError) {
                    console.error('❌ Invalid master private key:', keyError.message);
                    this.masterPrivateKey = null;
                }
            }

            // Verify mnemonic
            if (this.mnemonic && this.mnemonic !== "your 24 words here") {
                if (validateMnemonic(this.mnemonic)) {
                    console.log('✅ HD mnemonic validated');
                } else {
                    console.error('❌ Invalid mnemonic');
                    this.mnemonic = null;
                }
            }
            
            this.initialized = true;
            console.log('🎯 TronAddressGenerator ready. Available methods:');
            console.log('   - Private Key Derivation:', !!this.masterPrivateKey);
            console.log('   - HD Wallet:', !!this.mnemonic);
            console.log('   - Simple Generation:', true);
            
            return true;
        } catch (error) {
            console.error('❌ TronAddressGenerator initialization failed:', error.message);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Generate using HD Wallet (BIP44)
     */
    async generateHdWalletAddress(index) {
        try {
            if (!this.mnemonic) {
                throw new Error('No mnemonic configured');
            }

            console.log(`🔑 Generating HD wallet address at index ${index}`);

            // Convert mnemonic to seed
            const seed = mnemonicToSeedSync(this.mnemonic);
            
            // Create HD node from seed
            const hdWallet = hdkey.fromMasterSeed(seed);
            
            // Derive path: m/44'/195'/0'/0/index (Tron's BIP44 path)
            const derivationPath = `${this.basePath}/${index}`;
            const wallet = hdWallet.derivePath(derivationPath).getWallet();
            
            // Get private key
            const privateKey = wallet.getPrivateKey().toString('hex');
            
            // Generate Tron address from private key
            const address = this.tronWeb.address.fromPrivateKey(privateKey);
            
            if (!this.validateAddress(address)) {
                throw new Error('Invalid HD wallet address');
            }

            console.log(`✅ HD Wallet address: ${address}`);
            
            return {
                address: address,
                privateKey: privateKey,
                index: index,
                method: 'hd_wallet',
                derivationPath: derivationPath
            };
            
        } catch (error) {
            console.error('❌ HD wallet generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate using Private Key Derivation
     */
    async generateDerivedAddress(index) {
        try {
            if (!this.masterPrivateKey) {
                throw new Error('No master private key configured');
            }

            console.log(`🔑 Generating derived address from master key at index ${index}`);

            // Create deterministic derivation
            const derivationData = this.masterPrivateKey + 'USER_DERIVATION_' + index;
            const hash = crypto.createHash('sha256');
            hash.update(derivationData);
            let derivedPrivateKey = hash.digest('hex').padStart(64, '0').slice(0, 64);
            
            // Generate address from derived private key
            const address = this.tronWeb.address.fromPrivateKey(derivedPrivateKey);
            
            if (!this.validateAddress(address)) {
                throw new Error('Invalid derived address');
            }

            console.log(`✅ Derived address: ${address}`);
            
            return {
                address: address,
                privateKey: derivedPrivateKey,
                index: index,
                method: 'private_key_derivation'
            };
            
        } catch (error) {
            console.error('❌ Private key derivation failed:', error);
            throw error;
        }
    }

    /**
     * Simple deterministic generation (fallback)
     */
    async generateSimpleAddress(index) {
        try {
            console.log(`🔑 Generating simple deterministic address at index ${index}`);

            const appSecret = process.env.JWT_SECRET;
            const uniqueSeed = appSecret + index + Date.now();
            
            const hash = crypto.createHash('sha256');
            hash.update(uniqueSeed);
            let privateKey = hash.digest('hex').padStart(64, '0').slice(0, 64);
            
            const address = this.tronWeb.address.fromPrivateKey(privateKey);
            
            if (!this.validateAddress(address)) {
                throw new Error('Invalid simple address');
            }

            console.log(`✅ Simple address: ${address}`);
            
            return {
                address: address,
                privateKey: privateKey,
                index: index,
                method: 'simple_deterministic'
            };
            
        } catch (error) {
            console.error('❌ Simple address generation failed:', error);
            throw error;
        }
    }

    /**
     * Check if address conflicts with hot wallet
     */
    isConflictWithHotWallet(address) {
        const hotWallet = process.env.TRON_HOT_ADDRESS;
        return address === hotWallet;
    }

    /**
     * Main method - tries all available methods in order with conflict resolution
     */
    async generateRealTronAddress(index) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            let addressData;
            const methods = [
                { name: 'HD Wallet', func: () => this.generateHdWalletAddress(index) },
                { name: 'Private Key Derivation', func: () => this.generateDerivedAddress(index) },
                { name: 'Simple Generation', func: () => this.generateSimpleAddress(index) }
            ];

            for (const method of methods) {
                try {
                    console.log(`🔄 Trying ${method.name}...`);
                    addressData = await method.func();
                    
                    // Check for hot wallet conflict
                    if (this.isConflictWithHotWallet(addressData.address)) {
                        console.log(`⚠️  ${method.name} generated hot wallet address, trying next method...`);
                        continue;
                    }
                    
                    console.log(`✅ ${method.name} succeeded`);
                    break;
                } catch (methodError) {
                    console.log(`❌ ${method.name} failed:`, methodError.message);
                    continue;
                }
            }

            if (!addressData) {
                throw new Error('All address generation methods failed or generated hot wallet address');
            }

            // Final validation
            if (!this.validateAddress(addressData.address)) {
                throw new Error('Final address validation failed');
            }

            console.log(`🎉 Successfully generated: ${addressData.address} (${addressData.method})`);
            
            return addressData;
            
        } catch (error) {
            console.error('💥 All address generation methods failed:', error);
            throw error;
        }
    }

    /**
     * Validate address format
     */
    validateAddress(address) {
        try {
            const isValid = this.tronWeb.isAddress(address);
            const correctFormat = address.startsWith('T') && address.length === 34;
            
            if (!isValid || !correctFormat) {
                console.error(`❌ Invalid address: ${address} (isValid: ${isValid}, format: ${correctFormat})`);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Address validation error:', error);
            return false;
        }
    }

    /**
     * Alias for validateAddress for backward compatibility
     */
    isValidAddress(address) {
        return this.validateAddress(address);
    }

    /**
     * Get generator status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            masterKeyConfigured: !!this.masterPrivateKey && this.masterPrivateKey !== 'your-actual-tronlink-private-key-here',
            hdWalletConfigured: !!this.mnemonic && this.mnemonic !== "your 24 words here",
            hotWalletAddress: process.env.TRON_HOT_ADDRESS,
            network: this.tronWeb.fullHost
        };
    }

    /**
     * Test all methods
     */
    async testAllMethods() {
        console.log('\n🧪 TESTING ALL ADDRESS GENERATION METHODS\n');
        
        const status = this.getStatus();
        console.log('Generator Status:', status);
        
        const testIndex = 999; // Use high index for testing
        
        const methods = [
            { name: 'HD Wallet', func: () => this.generateHdWalletAddress(testIndex) },
            { name: 'Private Key Derivation', func: () => this.generateDerivedAddress(testIndex) },
            { name: 'Simple Generation', func: () => this.generateSimpleAddress(testIndex) }
        ];

        for (const method of methods) {
            console.log(`\n--- Testing ${method.name} ---`);
            try {
                const result = await method.func();
                console.log(`✅ ${method.name}: ${result.address}`);
                console.log(`   Method: ${result.method}`);
                console.log(`   Valid: ${this.validateAddress(result.address)}`);
                console.log(`   Conflicts with hot wallet: ${this.isConflictWithHotWallet(result.address)}`);
            } catch (error) {
                console.log(`❌ ${method.name}: ${error.message}`);
            }
        }
        
        console.log('\n--- Testing Main Method ---');
        try {
            const mainResult = await this.generateRealTronAddress(testIndex);
            console.log(`✅ Main Method: ${mainResult.address}`);
            console.log(`   Used: ${mainResult.method}`);
            console.log(`   Conflicts with hot wallet: ${this.isConflictWithHotWallet(mainResult.address)}`);
        } catch (error) {
            console.log(`❌ Main Method: ${error.message}`);
        }
        
        console.log('\n🧪 TESTING COMPLETE\n');
    }
}

// Create singleton instance
const tronAddressGenerator = new TronAddressGenerator();

module.exports = tronAddressGenerator;