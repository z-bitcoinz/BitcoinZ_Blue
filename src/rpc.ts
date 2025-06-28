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
    const currentBalance = balanceJSON.tbalance + balanceJSON.zbalance;

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
    const infostr = RPC.getNative().litelib_execute("info", "");
    try {
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

      return info;
    } catch (err) {
      console.log("Failed to parse info", err);
      return new Info();
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

    const wallet_settings = new WalletSettings();
    wallet_settings.download_memos = download_memos;
    wallet_settings.spam_filter_threshold = parseInt(spam_filter_threshold);

    this.fnSetWalletSettings(wallet_settings);
  }

  static async setWalletSettingOption(name: string, value: string): Promise<string> {
    const r = RPC.getNative().litelib_execute("setoption", `${name}=${value}`);

    RPC.doSave();
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

    // Total Balance
    const balance = new TotalBalance();
    balance.uabalance = balanceJSON.uabalance / 10 ** 8;
    balance.zbalance = balanceJSON.zbalance / 10 ** 8;
    balance.transparent = balanceJSON.tbalance / 10 ** 8;
    balance.verifiedZ = balanceJSON.verified_zbalance / 10 ** 8;
    balance.unverifiedZ = balanceJSON.unverified_zbalance / 10 ** 8;
    balance.spendableZ = balanceJSON.spendable_zbalance / 10 ** 8;

    // Set pending balances
    balance.pendingTransparent = pendingTransparent;
    balance.pendingShielded = pendingShielded;
    balance.totalPending = pendingTransparent + pendingShielded;

    // Calculate confirmed balances (excluding pending)
    balance.totalConfirmed = balance.transparent + balance.zbalance + balance.uabalance - balance.totalPending;

    // Total includes both confirmed and pending
    balance.total = balance.uabalance + balance.zbalance + balance.transparent;

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
    //console.log(listJSON);

    let txlist: Transaction[] = listJSON.map((tx: any) => {
      const transaction = new Transaction();

      const type = tx.outgoing_metadata ? "sent" : "receive";

      transaction.address =
        // eslint-disable-next-line no-nested-ternary
        type === "sent" ? (tx.outgoing_metadata.length > 0 ? tx.outgoing_metadata[0].address : "") : tx.address;
      transaction.type = type;
      transaction.amount = tx.amount / 10 ** 8;
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
          detail.amount = (o.value / 10 ** 8).toFixed(8);
          detail.memo = o.memo;

          return detail;
        });

        transaction.detailedTxns = RPC.combineTxDetails(dts);
      } else {
        transaction.detailedTxns = [new TxDetail()];
        transaction.detailedTxns[0].address = tx.address;
        transaction.detailedTxns[0].amount = (tx.amount / 10 ** 8).toFixed(8);
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

    try {
      console.log(`Sending ${JSON.stringify(sendJson)}`);
      RPC.getNative().litelib_execute("send", JSON.stringify(sendJson));
    } catch (err) {
      // TODO Show a modal with the error
      console.log(`Error sending Tx: ${err}`);
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
          // And refresh data (full refresh)
          this.refresh(true);

          resolve(progress.txid as string);
        }

        if (progress.error) {
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
