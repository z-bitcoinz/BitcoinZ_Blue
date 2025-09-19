/* eslint-disable max-classes-per-file */
import {
  TotalBalance,
  AddressBalance,
  Transaction,
  RPCConfig,
  TxDetail,
  Info,
  SendProgress,
  AddressType,
  AddressDetail,
  WalletSettings,
} from "./components/AppState";
import { SendManyJson } from "./components/Send";
import { currencyManager } from "./utils/currencyManager";
import Utils from "./utils/utils";

import getNativeModule from "./native-loader";

export default class RPC {
  rpcConfig?: RPCConfig;

  fnSetInfo: (info: Info) => void;
  fnSetTotalBalance: (tb: TotalBalance) => void;
  fnSetAddressesWithBalance: (abs: AddressBalance[]) => void;
  fnSetTransactionsList: (t: Transaction[]) => void;
  fnSetAllAddresses: (a: AddressDetail[]) => void;
  fnSetBtczPrice: (p?: number) => void;
  fnSetWalletSettings: (settings: WalletSettings) => void;
  refreshTimerID?: NodeJS.Timeout;
  updateTimerId?: NodeJS.Timeout;

  updateDataLock: boolean;

  lastBlockHeight: number;

  // Helper method to get native module with error handling
  private static getNative() {
    return getNativeModule();
  }
  lastTxId?: string;
  lastBalance?: number;
  lastTxCount?: number;

  // Price caching to avoid CoinGecko rate limits
  private cachedPrice?: number;
  private priceLastFetched?: number;
  private readonly PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Track pending transactions that haven't appeared in mempool yet
  private pendingTransactions: Map<string, { sentTime: number; totalSpent: number; changeAmount: number }> = new Map();

  constructor(
    fnSetTotalBalance: (tb: TotalBalance) => void,
    fnSetAddressesWithBalance: (abs: AddressBalance[]) => void,
    fnSetTransactionsList: (t: Transaction[]) => void,
    fnSetAllAddresses: (a: AddressDetail[]) => void,
    fnSetInfo: (info: Info) => void,
    fnSetBtczPrice: (p?: number) => void,
    fnSetWalletSettings: (settings: WalletSettings) => void
  ) {
    this.fnSetTotalBalance = fnSetTotalBalance;
    this.fnSetAddressesWithBalance = fnSetAddressesWithBalance;
    this.fnSetTransactionsList = fnSetTransactionsList;
    this.fnSetAllAddresses = fnSetAllAddresses;
    this.fnSetInfo = fnSetInfo;
    this.fnSetBtczPrice = fnSetBtczPrice;
    this.fnSetWalletSettings = fnSetWalletSettings;
    this.lastBlockHeight = 0;
    this.lastBalance = undefined;
    this.lastTxCount = undefined;

    this.refreshTimerID = undefined;
    this.updateTimerId = undefined;
    this.updateDataLock = false;
  }

  async configure(rpcConfig: RPCConfig) {
    this.rpcConfig = rpcConfig;

    if (!this.refreshTimerID) {
      this.refreshTimerID = setInterval(() => this.refresh(false), 60 * 1000); // 1 min
    }

    if (!this.updateTimerId) {
      this.updateTimerId = setInterval(() => this.updateData(), 1 * 1000); // 1 sec - faster updates for T address transactions
    }

    // Immediately call the refresh after configure to update the UI
    this.refresh(true);
  }

  clearTimers() {
    if (this.refreshTimerID) {
      clearInterval(this.refreshTimerID);
      this.refreshTimerID = undefined;
    }

    if (this.updateTimerId) {
      clearInterval(this.updateTimerId);
      this.updateTimerId = undefined;
    }
  }

  static getDefaultFee(): number {
    const feeStr = RPC.getNative().litelib_execute("defaultfee", "");
    const fee = JSON.parse(feeStr);

    return fee.defaultfee / 10 ** 8;
  }

  static doSync() {
    const syncstr = RPC.getNative().litelib_execute("sync", "");
    console.log(`Sync exec result: ${syncstr}`);
  }

  static doRescan() {
    const syncstr = RPC.getNative().litelib_execute("rescan", "");
    console.log(`rescan exec result: ${syncstr}`);
  }

  static doSyncStatus(): string {
    const syncstr = RPC.getNative().litelib_execute("syncstatus", "");
    console.log(`syncstatus: ${syncstr}`);
    return syncstr;
  }

  static doSave() {
    const savestr = RPC.getNative().litelib_execute("save", "");
    console.log(`Save status: ${savestr}`);
  }

  static deinitialize() {
    const str = RPC.getNative().litelib_deinitialize();
    console.log(`Deinitialize status: ${str}`);
  }

  async updateData() {
    console.log(`[${new Date().toISOString()}] Update data triggered`);
    if (this.updateDataLock) {
      console.log("Update lock active, returning");
      return;
    }

    this.updateDataLock = true;
    const latest_txid = RPC.getLastTxid();

    // Also check balance and transaction count for better detection
    const balanceStr = RPC.getNative().litelib_execute("balance", "");
    const balanceJSON = JSON.parse(balanceStr);
    // CRITICAL: Convert zatoshis to BTCZ for proper comparison!
    const currentBalance = Utils.zatoshiToBtcz(balanceJSON.tbalance + balanceJSON.zbalance);

    const listStr = RPC.getNative().litelib_execute("list", "");
    const listJSON = JSON.parse(listStr);
    const currentTxCount = listJSON.length;

    // Detect changes in txid, balance, or transaction count
    const txidChanged = this.lastTxId !== latest_txid;
    const balanceChanged = this.lastBalance !== currentBalance;
    const txCountChanged = this.lastTxCount !== currentTxCount;

    if (txidChanged || balanceChanged || txCountChanged) {
      console.log(`🔄 CHANGE DETECTED!`);
      console.log(`   TxID: ${this.lastTxId} → ${latest_txid} (changed: ${txidChanged})`);
      console.log(`   Balance: ${this.lastBalance} → ${currentBalance} (changed: ${balanceChanged})`);
      console.log(`   Tx Count: ${this.lastTxCount} → ${currentTxCount} (changed: ${txCountChanged})`);

      const latestBlockHeight = await this.fetchInfo();
      this.lastBlockHeight = latestBlockHeight;
      this.lastTxId = latest_txid;
      this.lastBalance = currentBalance;
      this.lastTxCount = currentTxCount;

      console.log("📊 Fetching updated balance and transactions...");

      // And fetch the rest of the data.
      this.fetchTotalBalance();
      this.fetchTandZTransactions(latestBlockHeight);
      this.getZecPrice();
      this.fetchWalletSettings();

      console.log(`✅ Finished updating data at block ${latestBlockHeight}`);
    } else {
      console.log(`⏳ No changes detected (txid: ${latest_txid}, balance: ${currentBalance}, txs: ${currentTxCount})`);
    }
    this.updateDataLock = false;
  }

  async refresh(fullRefresh: boolean) {
    const latestBlockHeight = await this.fetchInfo();

    if (fullRefresh || !this.lastBlockHeight || this.lastBlockHeight < latestBlockHeight) {
      this.updateDataLock = true;

      // If the latest block height has changed, make sure to sync. This will happen in a new thread
      RPC.doSync();

      // We need to wait for the sync to finish. The way we know the sync is done is
      // if the height matches the latestBlockHeight
      let retryCount = 0;
      const pollerID = setInterval(async () => {
        const walletHeight = RPC.fetchWalletHeight();
        retryCount += 1;

        // Wait a max of 30 retries (30 secs)
        if (walletHeight >= latestBlockHeight || retryCount > 30) {
          // We are synced. Cancel the poll timer
          clearInterval(pollerID);

          // And fetch the rest of the data.
          this.fetchTotalBalance();
          this.fetchTandZTransactions(latestBlockHeight);
          this.getZecPrice();

          this.lastBlockHeight = latestBlockHeight;

          // Save the wallet
          RPC.doSave();

          this.updateDataLock = false;

          // All done
          console.log(`Finished full refresh at ${latestBlockHeight}`);
        }
      }, 1000);
    } else {
      // Already at the latest block
      console.log("Already have latest block, waiting for next refresh");
    }
  }

  // Special method to get the Info object. This is used both internally and by the Loading screen
  static getInfoObject(): Info {
    try {
      const infostr = RPC.getNative().litelib_execute("info", "");
      const infoJSON = JSON.parse(infostr);

      const info = new Info();
      info.testnet = infoJSON.chain_name === "test";
      info.latestBlock = infoJSON.latest_block_height;
      info.connections = 1;
      info.version = `${infoJSON.vendor}/${infoJSON.git_commit.substring(0, 6)}/${infoJSON.version}`;
      info.zcashdVersion = infoJSON.zcashd_version;
      info.verificationProgress = 1;
      info.currencyName = info.testnet ? "TBTCZ" : "BTCZ";
      info.solps = 0;

      const encStatus = RPC.getNative().litelib_execute("encryptionstatus", "");
      const encJSON = JSON.parse(encStatus);
      info.encrypted = encJSON.encrypted;
      info.locked = encJSON.locked;

      const walletHeight = RPC.fetchWalletHeight();
      info.walletHeight = walletHeight;

      // Windows-specific validation
      if (process.platform === 'win32') {
        console.log("🪟 Windows info validation:", {
          latestBlock: info.latestBlock,
          walletHeight: info.walletHeight,
          encrypted: info.encrypted,
          locked: info.locked,
          version: info.version
        });

        // Validate that we got reasonable values
        if (!info.latestBlock || info.latestBlock < 0) {
          console.warn("⚠️ Windows: Invalid latest block height detected");
        }
        if (!info.walletHeight || info.walletHeight < 0) {
          console.warn("⚠️ Windows: Invalid wallet height detected");
        }
      }

      return info;
    } catch (err) {
      console.error("❌ Failed to parse wallet info:", err);

      // Enhanced Windows error handling
      if (process.platform === 'win32') {
        console.error("🪟 Windows wallet info parsing failed");
        console.error("This may indicate:");
        console.error("• Wallet file corruption");
        console.error("• File locking issues");
        console.error("• Permission problems");
        console.error("• Native module communication failure");

        // Try to provide more diagnostic information
        try {
          const walletExists = RPC.getNative().litelib_wallet_exists("main");
          console.log("Wallet exists check:", walletExists);
        } catch (existsError) {
          console.error("Cannot check wallet existence:", existsError);
        }
      }

      // Return a default Info object to prevent complete failure
      const defaultInfo = new Info();
      defaultInfo.connections = 0; // 0 connections indicates disconnected state
      defaultInfo.currencyName = "BTCZ";
      return defaultInfo;
    }
  }

  static doImportPrivKey(key: string, birthday: string): string {
    const args = { key, birthday: parseInt(birthday, 10) };

    // eslint-disable-next-line no-restricted-globals
    if (isNaN(parseInt(birthday, 10))) {
      return `Error: Couldn't parse ${birthday} as a number`;
    }

    const address = RPC.getNative().litelib_execute("import", JSON.stringify(args));

    return address;
  }

  async fetchWalletSettings() {
    const download_memos_str = RPC.getNative().litelib_execute("getoption", "download_memos");
    const download_memos = JSON.parse(download_memos_str).download_memos;

    let spam_filter_threshold = "0";
    try {
      const spam_filter_str = RPC.getNative().litelib_execute("getoption", "spam_filter_threshold");
      spam_filter_threshold = JSON.parse(spam_filter_str).spam_filter_threshold;
      // console.log(`Spam filter threshold: ${spam_filter_threshold}`);

      // If it is -1, i.e., it was not set, then set it to 0 for BitcoinZ (disable spam filter)
      // BitcoinZ needs to detect all T address transactions for proper mempool monitoring
      if (spam_filter_threshold === "-1") {
        await RPC.setWalletSettingOption("spam_filter_threshold", "0");
      }
    } catch (e) {
      console.log(`Error getting spam filter threshold: ${e}`);
    }

    // Smart note management settings removed - not supported by BitcoinZ backend
    let smart_note_management = false;
    let target_note_count = 10;
    let auto_shield_threshold = 0.1;

    const wallet_settings = new WalletSettings();
    wallet_settings.download_memos = download_memos;
    wallet_settings.spam_filter_threshold = parseInt(spam_filter_threshold);
    wallet_settings.smart_note_management = smart_note_management;
    wallet_settings.target_note_count = target_note_count;
    wallet_settings.auto_shield_threshold = auto_shield_threshold;

    this.fnSetWalletSettings(wallet_settings);
  }

  static async setWalletSettingOption(name: string, value: string): Promise<string> {
    console.log(`🔧 Setting wallet option: ${name} = ${value}`);
    const r = RPC.getNative().litelib_execute("setoption", `${name}=${value}`);
    console.log(`🔧 Set option result: ${r}`);

    RPC.doSave();
    console.log(`💾 Wallet saved after setting ${name}`);
    return r;
  }

  async fetchInfo(): Promise<number> {
    const info = RPC.getInfoObject();

    this.fnSetInfo(info);

    return info.latestBlock;
  }

  // This method will get the total balances
  fetchTotalBalance() {
    const balanceStr = RPC.getNative().litelib_execute("balance", "");
    const balanceJSON = JSON.parse(balanceStr);

    // Windows-specific balance validation
    if (process.platform === 'win32') {
      const totalBalance = Utils.zatoshiToBtcz(balanceJSON.tbalance + balanceJSON.zbalance + balanceJSON.uabalance);
      console.log("🪟 Windows balance fetch:", {
        transparent: balanceJSON.tbalance / 10 ** 8,
        shielded: balanceJSON.zbalance / 10 ** 8,
        unified: balanceJSON.uabalance / 10 ** 8,
        total: totalBalance
      });

      // Check for potential Windows balance loading issues
      if (totalBalance === 0) {
        console.log("🔍 Windows: Zero balance detected, checking for transactions...");

        try {
          const listStr = RPC.getNative().litelib_execute("list", "");
          const listJSON = JSON.parse(listStr);

          if (listJSON.length > 0) {
            console.warn("⚠️ Windows: Wallet has transactions but zero balance - potential data loading issue");
            console.log("Transaction count:", listJSON.length);

            // Log some transaction details for debugging
            const recentTxs = listJSON.slice(0, 3);
            console.log("Recent transactions:", recentTxs.map((tx: any) => ({
              txid: tx.txid?.substring(0, 8) + "...",
              amount: tx.amount / 10 ** 8,
              block_height: tx.block_height,
              unconfirmed: tx.unconfirmed
            })));
          }
        } catch (listError) {
          console.error("❌ Windows: Failed to check transaction list:", listError);
        }
      }
    }

    // Get unconfirmed transactions to calculate pending balances
    const listStr = RPC.getNative().litelib_execute("list", "");
    const listJSON = JSON.parse(listStr);
    const unconfirmedTxs = listJSON.filter((tx: any) => tx.unconfirmed);

    // Calculate pending balances from unconfirmed transactions
    let pendingTransparent = 0;
    let pendingShielded = 0;

    unconfirmedTxs.forEach((tx: any) => {
      const amount = tx.amount / 10 ** 8;
      const isReceived = !tx.outgoing_metadata;

      if (isReceived && amount > 0) {
        // Incoming unconfirmed transaction
        if (tx.address && (tx.address.startsWith('t1') || tx.address.startsWith('t3'))) {
          pendingTransparent += amount;
        } else if (tx.address && tx.address.startsWith('zs1')) {
          pendingShielded += amount;
        }
      }
    });

    // Total Balance - Use safe conversion for potentially large amounts
    const balance = new TotalBalance();
    balance.uabalance = Utils.zatoshiToBtcz(balanceJSON.uabalance);
    balance.zbalance = Utils.zatoshiToBtcz(balanceJSON.zbalance);
    balance.transparent = Utils.zatoshiToBtcz(balanceJSON.tbalance);
    balance.verifiedZ = Utils.zatoshiToBtcz(balanceJSON.verified_zbalance);
    balance.unverifiedZ = Utils.zatoshiToBtcz(balanceJSON.unverified_zbalance);
    balance.spendableZ = Utils.zatoshiToBtcz(balanceJSON.spendable_zbalance);

    // Set pending balances
    balance.pendingTransparent = pendingTransparent;
    balance.pendingShielded = pendingShielded;
    balance.totalPending = pendingTransparent + pendingShielded;

    // Calculate confirmed balances (excluding pending)
    balance.totalConfirmed = balance.transparent + balance.zbalance + balance.uabalance - balance.totalPending;

    // Total includes both confirmed and pending
    balance.total = balance.uabalance + balance.zbalance + balance.transparent;

    // Calculate pending change from transactions not yet in mempool
    let totalPendingChange = 0;
    const now = Date.now();
    const PENDING_TIMEOUT = 60 * 1000; // 1 minute timeout for pending transactions
    
    // Clean up old pending transactions and calculate total pending change
    for (const [txId, pendingTx] of this.pendingTransactions) {
      if (now - pendingTx.sentTime > PENDING_TIMEOUT) {
        // Remove old pending transactions
        this.pendingTransactions.delete(txId);
      } else {
        totalPendingChange += pendingTx.changeAmount;
      }
    }
    
    balance.pendingChange = totalPendingChange;

    // Windows-specific balance recovery mechanism
    if (process.platform === 'win32' && balance.total === 0) {
      // Check if we have transactions but zero balance - this indicates a Windows loading issue
      try {
        const listStr = RPC.getNative().litelib_execute("list", "");
        const listJSON = JSON.parse(listStr);

        if (listJSON.length > 0) {
          console.warn("🚨 Windows Balance Recovery: Detected zero balance with existing transactions");
          console.log("Attempting automatic recovery...");

          // Try to trigger a wallet recovery
          this.attemptWindowsBalanceRecovery().then((recovered) => {
            if (recovered) {
              console.log("✅ Windows balance recovery successful, refreshing balance...");
              // Retry fetching balance after recovery
              setTimeout(() => {
                this.fetchTotalBalance();
              }, 2000);
            }
          }).catch((error) => {
            console.error("❌ Windows balance recovery failed:", error);
          });
        }
      } catch (error) {
        console.error("❌ Windows balance recovery check failed:", error);
      }
    }

    this.fnSetTotalBalance(balance);

    // Fetch pending notes and UTXOs
    const pendingNotes = RPC.getNative().litelib_execute("notes", "");
    const pendingJSON = JSON.parse(pendingNotes);

    const pendingAddressBalances = new Map();

    // Process sapling notes
    pendingJSON.pending_notes.forEach((s: any) => {
      pendingAddressBalances.set(s.address, s.value);
    });

    // Process UTXOs
    pendingJSON.pending_utxos.forEach((s: any) => {
      pendingAddressBalances.set(s.address, s.value);
    });

    // BitcoinZ doesn't support Unified addresses, so we skip ua_addresses

    const zaddresses = balanceJSON.z_addresses
      .map((o: any) => {
        // If this has any unconfirmed txns, show that in the UI
        const ab = new AddressBalance(o.address, o.zbalance / 10 ** 8);
        if (pendingAddressBalances.has(ab.address)) {
          ab.containsPending = true;
        }
        return ab;
      })
      .filter((ab: AddressBalance) => ab.balance > 0);

    const taddresses = balanceJSON.t_addresses
      .map((o: any) => {
        // If this has any unconfirmed txns, show that in the UI
        const ab = new AddressBalance(o.address, o.balance / 10 ** 8);
        if (pendingAddressBalances.has(ab.address)) {
          ab.containsPending = true;
        }
        return ab;
      })
      .filter((ab: AddressBalance) => ab.balance > 0);

    const addresses = zaddresses.concat(taddresses);

    this.fnSetAddressesWithBalance(addresses);

    // Also set all addresses (BitcoinZ doesn't support Unified addresses)
    const allZAddresses = balanceJSON.z_addresses.map((o: any) => new AddressDetail(o.address, AddressType.sapling));
    const allTAddresses = balanceJSON.t_addresses.map(
      (o: any) => new AddressDetail(o.address, AddressType.transparent)
    );
    const allAddresses = allZAddresses.concat(allTAddresses);

    this.fnSetAllAddresses(allAddresses);
  }

  // Windows-specific balance recovery mechanism
  private async attemptWindowsBalanceRecovery(): Promise<boolean> {
    if (process.platform !== 'win32') {
      return false;
    }

    console.log("🔄 Starting Windows balance recovery process...");

    try {
      // Step 1: Force save the wallet to ensure data persistence
      console.log("Step 1: Forcing wallet save...");
      RPC.doSave();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Check if balance is now available
      console.log("Step 2: Checking balance after save...");
      const balanceStr = RPC.getNative().litelib_execute("balance", "");
      const balanceJSON = JSON.parse(balanceStr);
      const totalBalance = Utils.zatoshiToBtcz(balanceJSON.tbalance + balanceJSON.zbalance + balanceJSON.uabalance);

      if (totalBalance > 0) {
        console.log("✅ Balance recovered after wallet save:", totalBalance);
        return true;
      }

      // Step 3: Try to trigger a rescan if balance is still zero
      console.log("Step 3: Balance still zero, attempting rescan...");
      try {
        // Get the wallet birthday to use for rescan
        const info = RPC.getInfoObject();
        const walletHeight = info.walletHeight || 0;

        // Trigger a rescan from a recent block (last 1000 blocks or wallet height, whichever is smaller)
        const rescanHeight = Math.max(0, walletHeight - 1000);
        console.log(`Triggering rescan from block ${rescanHeight}...`);

        const rescanResult = RPC.getNative().litelib_execute("rescan", rescanHeight.toString());
        console.log("Rescan result:", rescanResult);

        // Wait for rescan to complete
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check balance again
        const postRescanBalanceStr = RPC.getNative().litelib_execute("balance", "");
        const postRescanBalanceJSON = JSON.parse(postRescanBalanceStr);
        const postRescanTotal = Utils.zatoshiToBtcz(postRescanBalanceJSON.tbalance + postRescanBalanceJSON.zbalance + postRescanBalanceJSON.uabalance);

        if (postRescanTotal > 0) {
          console.log("✅ Balance recovered after rescan:", postRescanTotal);
          return true;
        }
      } catch (rescanError) {
        console.error("❌ Rescan failed:", rescanError);
      }

      // Step 4: Last resort - try to reinitialize the wallet connection
      console.log("Step 4: Attempting wallet reinitialization...");
      try {
        const serverUrl = "https://lightd.btcz.rocks:9067";
        const reinitResult = RPC.getNative().litelib_initialize_existing(serverUrl);

        if (reinitResult === "OK") {
          console.log("✅ Wallet reinitialization successful");
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check balance one more time
          const finalBalanceStr = RPC.getNative().litelib_execute("balance", "");
          const finalBalanceJSON = JSON.parse(finalBalanceStr);
          const finalTotal = Utils.zatoshiToBtcz(finalBalanceJSON.tbalance + finalBalanceJSON.zbalance + finalBalanceJSON.uabalance);

          if (finalTotal > 0) {
            console.log("✅ Balance recovered after reinitialization:", finalTotal);
            return true;
          }
        }
      } catch (reinitError) {
        console.error("❌ Wallet reinitialization failed:", reinitError);
      }

      console.log("❌ All Windows balance recovery attempts failed");
      return false;

    } catch (error) {
      console.error("❌ Windows balance recovery process failed:", error);
      return false;
    }
  }

  static getLastTxid(): string {
    const lastTxid = RPC.getNative().litelib_execute("lasttxid", "");
    const lastTxidJSON = JSON.parse(lastTxid);

    return lastTxidJSON.last_txid;
  }

  static getPrivKeyAsString(address: string): string {
    const privKeyStr = RPC.getNative().litelib_execute("export", address);
    const privKeyJSON = JSON.parse(privKeyStr);

    return privKeyJSON[0].private_key;
  }

  static getViewKeyAsString(address: string): string {
    const privKeyStr = RPC.getNative().litelib_execute("export", address);
    const privKeyJSON = JSON.parse(privKeyStr);

    return privKeyJSON[0].viewing_key;
  }

  static createNewAddress(type: AddressType) {
    console.log(`RPC.createNewAddress called with type: ${type}, AddressType.sapling: ${AddressType.sapling}`);
    // BitcoinZ only supports transparent and sapling addresses
    const addressTypeStr = type === AddressType.sapling ? "z" : "t";
    console.log(`Creating address with type string: ${addressTypeStr}`);

    const addrStr = RPC.getNative().litelib_execute("new", addressTypeStr);
    console.log(`Native module returned: ${addrStr}`);

    const addrJSON = JSON.parse(addrStr);
    console.log(`Parsed address JSON:`, addrJSON);

    return addrJSON[0];
  }

  static fetchSeed(): string {
    const seedStr = RPC.getNative().litelib_execute("seed", "");
    const seedJSON = JSON.parse(seedStr);

    return seedJSON.seed;
  }
  
  static fetchSeedAndBirthday(): { seed: string; birthday: number } {
    const seedStr = RPC.getNative().litelib_execute("seed", "");
    const seedJSON = JSON.parse(seedStr);

    return { seed: seedJSON.seed, birthday: seedJSON.birthday };
  }

  static fetchWalletHeight(): number {
    const heightStr = RPC.getNative().litelib_execute("height", "");
    const heightJSON = JSON.parse(heightStr);

    return heightJSON.height;
  }

  // Fetch all T and Z transactions
  fetchTandZTransactions(latestBlockHeight: number) {
    const listStr = RPC.getNative().litelib_execute("list", "");
    const listJSON = JSON.parse(listStr);

    // Debug logging for large transactions
    console.log(`📊 Fetching ${listJSON.length} transactions...`);
    listJSON.forEach((tx: any) => {
      if (tx.amount > 1000000000000000) { // Over 10M BTCZ in zatoshis
        console.log('🔍 LARGE TRANSACTION FOUND:', {
          txid: tx.txid?.substring(0, 16) + '...',
          amount_zatoshis: tx.amount,
          amount_btcz: tx.amount / 100000000,
          type: tx.outgoing_metadata ? 'sent' : 'received',
          address: tx.address,
          unconfirmed: tx.unconfirmed,
          block_height: tx.block_height
        });
      }
    });

    let txlist: Transaction[] = listJSON.map((tx: any) => {
      const transaction = new Transaction();

      const type = tx.outgoing_metadata ? "sent" : "receive";

      transaction.address =
        // eslint-disable-next-line no-nested-ternary
        type === "sent" ? (tx.outgoing_metadata.length > 0 ? tx.outgoing_metadata[0].address : "") : tx.address;
      transaction.type = type;

      // Debug: Check the type and value of amount
      if (tx.amount > 1000000000000000) { // Over 10M BTCZ
        console.log(`🎯 Processing large amount - Type: ${typeof tx.amount}, Value: ${tx.amount}`);
      }

      // Handle amount conversion - check if it's already a string or number
      const amountValue = typeof tx.amount === 'string' ? tx.amount : tx.amount.toString();

      try {
        // Use safe conversion for potentially large amounts
        if (BigInt(amountValue) > BigInt(Number.MAX_SAFE_INTEGER)) {
          // For very large amounts, keep as string and convert for display
          const btczStr = Utils.zatoshiToBtczString(amountValue);
          transaction.amount = parseFloat(btczStr); // Will lose precision but OK for display
          console.log(`✅ Large transaction converted: ${btczStr} BTCZ (from ${amountValue} zatoshis)`);
        } else {
          transaction.amount = Utils.zatoshiToBtcz(amountValue);
        }
      } catch (e) {
        console.error(`❌ Error converting amount ${tx.amount}:`, e);
        // Fallback to direct division
        transaction.amount = tx.amount / 100000000;
      }
      transaction.confirmations = tx.unconfirmed ? 0 : latestBlockHeight - tx.block_height + 1;

      // Log unconfirmed transactions for debugging
      if (tx.unconfirmed) {
        console.log(`🔄 UNCONFIRMED TRANSACTION: ${tx.txid} - ${transaction.type} ${transaction.amount} BTCZ to ${transaction.address}`);
      }
      transaction.txid = tx.txid;
      transaction.btczPrice = tx.zec_price;
      transaction.time = tx.datetime;
      transaction.position = tx.position;

      if (tx.outgoing_metadata) {
        const dts = tx.outgoing_metadata.map((o: any) => {
          const detail = new TxDetail();
          detail.address = o.address;
          // Handle large amounts safely
          if (o.value && BigInt(o.value) > BigInt(Number.MAX_SAFE_INTEGER)) {
            detail.amount = Utils.zatoshiToBtczString(o.value);
          } else {
            detail.amount = Utils.zatoshiToBtcz(o.value).toFixed(8);
          }
          detail.memo = o.memo;

          return detail;
        });

        transaction.detailedTxns = RPC.combineTxDetails(dts);
      } else {
        transaction.detailedTxns = [new TxDetail()];
        transaction.detailedTxns[0].address = tx.address;
        // Handle large amounts safely
        if (tx.amount && BigInt(tx.amount) > BigInt(Number.MAX_SAFE_INTEGER)) {
          transaction.detailedTxns[0].amount = Utils.zatoshiToBtczString(tx.amount);
        } else {
          transaction.detailedTxns[0].amount = Utils.zatoshiToBtcz(tx.amount).toFixed(8);
        }
        transaction.detailedTxns[0].memo = tx.memo;
      }

      return transaction;
    });

    // If you send yourself transactions, the underlying SDK doesn't handle it very well, so
    // we supress these in the UI to make things a bit clearer.
    txlist = txlist.filter((tx) => !(tx.type === "sent" && tx.amount < 0 && tx.detailedTxns.length === 0));

    // We need to group transactions that have the same (txid and send/recive), for multi-part memos
    const m = new Map<string, Transaction[]>();
    txlist.forEach((tx) => {
      const key = tx.txid + tx.type;
      const coll = m.get(key);
      if (!coll) {
        m.set(key, [tx]);
      } else {
        coll.push(tx);
      }
    });

    // Now, combine the amounts and memos
    const combinedTxList: Transaction[] = [];
    m.forEach((txns) => {
      // Get all the txdetails and merge them

      // Clone the first tx into a new one
      // eslint-disable-next-line prefer-object-spread
      const combinedTx = Object.assign({}, txns[0]);
      combinedTx.detailedTxns = RPC.combineTxDetails(txns.flatMap((tx) => tx.detailedTxns));

      combinedTxList.push(combinedTx);
    });

    // Sort the list by confirmations
    combinedTxList.sort((t1, t2) => t1.confirmations - t2.confirmations);

    this.fnSetTransactionsList(combinedTxList);
  }

  // We combine detailed transactions if they are sent to the same outgoing address in the same txid. This
  // is usually done to split long memos.
  // Remember to add up both amounts and combine memos
  static combineTxDetails(txdetails: TxDetail[]): TxDetail[] {
    // First, group by outgoing address.
    const m = new Map<string, TxDetail[]>();
    txdetails.forEach((i) => {
      const coll = m.get(i.address);
      if (!coll) {
        m.set(i.address, [i]);
      } else {
        coll.push(i);
      }
    });

    // Reduce the groups to a single TxDetail, combining memos and summing amounts
    const reducedDetailedTxns: TxDetail[] = [];
    m.forEach((txns, toaddr) => {
      const totalAmount = txns.reduce((p, td) => p + parseFloat(td.amount), 0);

      const memos = txns
        .filter((i) => i.memo)
        .map((i) => {
          const rex = /\((\d+)\/(\d+)\)((.|[\r\n])*)/;
          const tags = i.memo?.match(rex);
          if (tags && tags.length >= 4) {
            return { num: parseInt(tags[1], 10), memo: tags[3] };
          }

          // Just return as is
          return { num: 0, memo: i.memo };
        })
        .sort((a, b) => a.num - b.num)
        .map((a) => a.memo);

      const detail = new TxDetail();
      detail.address = toaddr;
      detail.amount = totalAmount.toFixed(8);
      detail.memo = memos.length > 0 ? memos.join("") : null;

      reducedDetailedTxns.push(detail);
    });

    return reducedDetailedTxns;
  }

  // Send a transaction using the already constructed sendJson structure
  async sendTransaction(sendJson: SendManyJson[], setSendProgress: (p?: SendProgress) => void): Promise<string> {
    // First, get the previous send progress id, so we know which ID to track
    const prevProgress = JSON.parse(RPC.getNative().litelib_execute("sendprogress", ""));
    const prevSendId = prevProgress.id;

    // Calculate total spent and expected change before sending
    const totalSent = sendJson.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const fee = RPC.getDefaultFee();
    
    // Get current balance to calculate change
    const balanceStr = RPC.getNative().litelib_execute("balance", "");
    const balanceJSON = JSON.parse(balanceStr);
    const totalBalance = Utils.zatoshiToBtcz(balanceJSON.tbalance + balanceJSON.zbalance + balanceJSON.uabalance);
    
    // Track this transaction as pending
    const tempTxId = `pending-${Date.now()}`;
    const totalSpent = totalSent + fee;
    const changeAmount = totalBalance - totalSpent;
    
    this.pendingTransactions.set(tempTxId, {
      sentTime: Date.now(),
      totalSpent,
      changeAmount: changeAmount > 0 ? changeAmount : 0
    });

    try {
      console.log(`Sending ${JSON.stringify(sendJson)}`);
      RPC.getNative().litelib_execute("send", JSON.stringify(sendJson));
    } catch (err) {
      // TODO Show a modal with the error
      console.log(`Error sending Tx: ${err}`);
      // Remove from pending if send failed
      this.pendingTransactions.delete(tempTxId);
      throw err;
    }

    const startTimeSeconds = new Date().getTime() / 1000;

    // The send command is async, so we need to poll to get the status
    const sendTxPromise: Promise<string> = new Promise((resolve, reject) => {
      const intervalID = setInterval(() => {
        const progress = JSON.parse(RPC.getNative().litelib_execute("sendprogress", ""));
        console.log(progress);

        const updatedProgress = new SendProgress();
        if (progress.id === prevSendId) {
          // Still not started, so wait for more time
          setSendProgress(updatedProgress);
          return;
        }

        // Calculate ETA.
        let secondsPerComputation = 3; // defalt
        if (progress.progress > 0) {
          const currentTimeSeconds = new Date().getTime() / 1000;
          secondsPerComputation = (currentTimeSeconds - startTimeSeconds) / progress.progress;
        }
        // console.log(`Seconds Per compute = ${secondsPerComputation}`);

        let eta = Math.round((progress.total - progress.progress) * secondsPerComputation);
        if (eta <= 0) {
          eta = 1;
        }

        updatedProgress.progress = progress.progress;
        updatedProgress.total = Math.max(progress.total, progress.progress); // sometimes, due to change, the total can be off by 1
        updatedProgress.sendInProgress = true;
        updatedProgress.etaSeconds = eta;

        if (progress.id === prevSendId) {
          // Still not started, so wait for more time
          setSendProgress(updatedProgress);
          return;
        }

        if (!progress.txid && !progress.error) {
          // Still processing
          setSendProgress(updatedProgress);
          return;
        }

        // Finished processing
        clearInterval(intervalID);
        setSendProgress(undefined);

        if (progress.txid) {
          // Remove from pending transactions once confirmed sent
          this.pendingTransactions.delete(tempTxId);
          
          // And refresh data (full refresh)
          this.refresh(true);

          resolve(progress.txid as string);
        }

        if (progress.error) {
          // Remove from pending if error occurred
          this.pendingTransactions.delete(tempTxId);
          reject(progress.error as string);
        }
      }, 2 * 1000); // Every 2 seconds
    });

    return sendTxPromise;
  }

  async encryptWallet(password: string): Promise<boolean> {
    const resultStr = RPC.getNative().litelib_execute("encrypt", password);
    const resultJSON = JSON.parse(resultStr);

    // To update the wallet encryption status
    this.fetchInfo();

    // And save the wallet
    RPC.doSave();

    return resultJSON.result === "success";
  }

  async decryptWallet(password: string): Promise<boolean> {
    const resultStr = RPC.getNative().litelib_execute("decrypt", password);
    const resultJSON = JSON.parse(resultStr);

    // To update the wallet encryption status
    this.fetchInfo();

    // And save the wallet
    RPC.doSave();

    return resultJSON.result === "success";
  }

  async lockWallet(): Promise<boolean> {
    const resultStr = RPC.getNative().litelib_execute("lock", "");
    const resultJSON = JSON.parse(resultStr);

    // To update the wallet encryption status
    this.fetchInfo();

    return resultJSON.result === "success";
  }

  async unlockWallet(password: string): Promise<boolean> {
    const resultStr = RPC.getNative().litelib_execute("unlock", password);
    const resultJSON = JSON.parse(resultStr);

    // To update the wallet encryption status
    this.fetchInfo();

    return resultJSON.result === "success";
  }

  async getZecPrice() {
    console.log("🔍 Attempting to fetch BTCZ price...");

    try {
      // Get exchange rates from currency manager (which handles caching)
      const rates = await currencyManager.getExchangeRates();
      
      // Get the current currency from currency manager
      const currentCurrency = currencyManager.getCurrentCurrency();
      const rate = rates.get(currentCurrency.code);

      if (rate) {
        console.log(`✅ Setting BTCZ price in ${currentCurrency.code}: ${currentCurrency.symbol}${rate}`);
        this.fnSetBtczPrice(rate);
        
        // Cache USD price for backward compatibility
        const usdRate = rates.get('USD');
        if (usdRate) {
          this.cachedPrice = usdRate;
          this.priceLastFetched = Date.now();
        }
      } else {
        console.log(`⚠️ No ${currentCurrency.code} price found`);
        
        // Fallback to USD if available
        const usdRate = rates.get('USD');
        if (usdRate) {
          console.log(`🔄 Using USD price as fallback: $${usdRate}`);
          this.fnSetBtczPrice(usdRate);
        }
      }
    } catch (error) {
      console.log(`❌ Error fetching prices:`, error);

      // Use cached price if available
      if (this.cachedPrice) {
        console.log(`🔄 Using cached USD price due to error: $${this.cachedPrice}`);
        this.fnSetBtczPrice(this.cachedPrice);
        return;
      }

      // Fallback: try the old method as last resort
      console.log("🔄 Trying fallback method...");
      try {
        const resultStr: string = RPC.getNative().litelib_execute("zecprice", "");
        if (!resultStr.toLowerCase().startsWith("error")) {
          const resultJSON = JSON.parse(resultStr);
          if (resultJSON.zec_price) {
            console.log(`✅ Fallback: Setting BTCZ price to: ${resultJSON.zec_price}`);
            this.fnSetBtczPrice(resultJSON.zec_price);
          }
        }
      } catch (fallbackError) {
        console.log(`❌ Fallback method also failed:`, fallbackError);
      }
    }
  }

  // Method to clear price cache (useful for testing or forcing fresh price fetch)
  clearPriceCache() {
    console.log("🗑️ Clearing price cache");
    this.cachedPrice = undefined;
    this.priceLastFetched = undefined;
  }

  // Method to get cache status for debugging
  getPriceCacheStatus() {
    if (!this.cachedPrice || !this.priceLastFetched) {
      return { cached: false, price: null, age: null };
    }

    const age = Date.now() - this.priceLastFetched;
    const isValid = age < this.PRICE_CACHE_DURATION;

    return {
      cached: true,
      price: this.cachedPrice,
      age: Math.round(age / 1000), // age in seconds
      valid: isValid,
      expiresIn: Math.round((this.PRICE_CACHE_DURATION - age) / 1000) // seconds until expiry
    };
  }
}
