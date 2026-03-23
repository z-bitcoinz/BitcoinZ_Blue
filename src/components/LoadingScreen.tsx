/* eslint-disable radix */
/* eslint-disable max-classes-per-file */
import React, { Component } from "react";
import { Redirect, RouteComponentProps, withRouter } from "react-router";
import TextareaAutosize from "react-textarea-autosize";
import getNativeModule from "../native-loader";
import routes from "../constants/routes.json";
import { RPCConfig, Info } from "./AppState";
import RPC from "../rpc";
import Logo from "../assets/img/logobig.png";
import Utils from "../utils/utils";
import { ParamManager } from "../utils/paramManager";
import FirstTimeServerSetup from "./FirstTimeServerSetup";

const { ipcRenderer } = window.require("electron");

class LoadingScreenState {
  currentStatus: string | JSX.Element;

  currentStatusIsError: boolean;

  loadingDone: boolean;

  rpcConfig: RPCConfig | null;

  url: string;

  walletScreen: number; // 0 -> no wallet, load existing wallet 1 -> show option 2-> create new 3 -> restore existing

  newWalletError: null | string; // Any errors when creating/restoring wallet

  seed: string; // The new seed phrase for a newly created wallet or the seed phrase to restore from

  birthday: number; // Wallet birthday if we're restoring

  walletBirthday: number; // The birthday of a newly created wallet

  getinfoRetryCount: number;

  // First-time server setup
  showFirstTimeServerSetup: boolean;

  // Cumulative sync progress tracking (across multiple sync rounds)
  initialWalletHeight: number | null;
  targetNetworkHeight: number | null;

  constructor() {
    this.currentStatus = "Loading...";
    this.currentStatusIsError = false;
    this.loadingDone = false;
    this.rpcConfig = null;
    this.url = "";
    this.getinfoRetryCount = 0;
    this.walletScreen = 0;
    this.newWalletError = null;
    this.seed = "";
    this.birthday = 0;
    this.walletBirthday = 0;
    this.showFirstTimeServerSetup = false;
    this.initialWalletHeight = null;
    this.targetNetworkHeight = null;
  }
}

type Props = {
  setRPCConfig: (rpcConfig: RPCConfig) => void;
  rescanning: boolean;
  prevSyncId: number;
  setRescanning: (rescan: boolean, prevSyncId: number) => void;
  setInfo: (info: Info) => void;
  openServerSelectModal: () => void;
};
class LoadingScreen extends Component<Props & RouteComponentProps, LoadingScreenState> {
  constructor(props: Props & RouteComponentProps) {
    super(props);

    const state = new LoadingScreenState();
    this.state = state;
  }

  componentDidMount() {
    const { rescanning, prevSyncId } = this.props;

    if (rescanning) {
      this.runSyncStatusPoller(prevSyncId);
    } else {
      (async () => {
        // Do it in a timeout, so the window has a chance to load.
        setTimeout(() => this.doFirstTimeSetup(), 100);
      })();
    }
  }

  loadServerURI = async () => {
    // Try to read the default server
    const settings = await ipcRenderer.invoke("loadSettings");
    let server = settings?.lwd?.serveruri || Utils.V3_LIGHTWALLETD;

    // Automatically upgrade from old servers to the current default.
    // Include hardcoded old URLs so migration works even after constants change.
    const oldServers = [
      "https://lightd.btcz.rocks:9067",
      "http://lightd.btcz.rocks:9067",
      "https://lightd.btcz.rocks:443",
      "http://localhost:9067",
    ];
    if (server === Utils.V1_LIGHTWALLETD || server === Utils.V2_LIGHTWALLETD || oldServers.includes(server)) {
      server = Utils.V3_LIGHTWALLETD;
    }

    const newstate = new LoadingScreenState();
    Object.assign(newstate, this.state);

    newstate.url = server;
    this.setState(newstate);
  };

  doFirstTimeSetup = async () => {
    // Check if user has selected a server before
    const settings = await ipcRenderer.invoke("loadSettings");
    const hasSelectedServer = settings?.hasSelectedServer || false;

    // If this is first time and no server selected, show server selection modal
    if (!hasSelectedServer) {
      console.log('[LoadingScreen] First time setup - showing server selection');
      this.setState({ showFirstTimeServerSetup: true });
      return;
    }

    await this.loadServerURI();

    // Proceed with wallet setup
    this.proceedWithWalletSetup();
  };

  handleFirstTimeServerSelected = async (serverUri: string) => {
    console.log('[LoadingScreen] Server selected:', serverUri);
    this.setState({ showFirstTimeServerSetup: false });

    // Now continue with the normal setup flow
    await this.loadServerURI();
    await this.doFirstTimeSetup();
  };

  proceedWithWalletSetup = async () => {
    // Try to load the light client
    const { url } = this.state;

    // First, check if Sapling parameters are set up
    this.setState({ currentStatus: "Checking privacy features..." });

    const paramManager = ParamManager.getInstance();
    const paramsValid = await paramManager.areParamsValid();

    if (!paramsValid) {
      this.setState({ currentStatus: "Setting up BitcoinZ privacy features (one-time download)..." });

      try {
        await paramManager.setupParams((progress, message) => {
          this.setState({ currentStatus: message });
        });
      } catch (error) {
        this.setState({
          currentStatus: (
            <span>
              Setup failed. Please check your internet connection.
              <br />
              <br />
              For help visit: getbtcz.com/support
              <br />
              <br />
              Error: {(error as Error).message}
            </span>
          ),
          currentStatusIsError: true,
        });
        return;
      }
    }

    // Now set up the exit handler
    this.setupExitHandler();

    // Test to see if the wallet exists
    if (!getNativeModule().litelib_wallet_exists("main")) {
      // Show the wallet creation screen
      this.setState({ walletScreen: 1 });
    } else {
      try {
        const result = getNativeModule().litelib_initialize_existing(url);
        console.log(`Intialization: ${result}`);
        if (result !== "OK") {
          this.setState({
            currentStatus: (
              <span>
                Error Initializing Lightclient
                <br />
                {result}
              </span>
            ),
            currentStatusIsError: true,
          });

          return;
        }

        this.getInfo();
      } catch (e) {
        console.log("Error initializing", e);
        this.setState({
          currentStatus: (
            <span>
              Error Initializing Lightclient
              <br />
              {`${e}`}
            </span>
          ),
          currentStatusIsError: true,
        });
      }
    }
  };

  setupExitHandler = () => {
    // App is quitting, make sure to save the wallet properly.
    ipcRenderer.on("appquitting", () => {
      try {
        // Attempt a final save to persist latest balances/txs before shutdown
        RPC.doSave();
      } catch (e) {
        console.error("Error during final wallet save:", e);
      }

      // Then deinitialize the native client cleanly
      RPC.deinitialize();

      // And reply that we're all done after 100ms, to allow cleanup of the rust stuff.
      setTimeout(() => {
        ipcRenderer.send("appquitdone");
      }, 100);
    });
  };

  getInfo() {
    // Try getting the info.
    try {
      // Do a sync at start
      this.setState({ currentStatus: "Setting things up..." });

      // Enhanced Windows wallet validation
      if (process.platform === 'win32') {
        console.log("🪟 Windows platform detected - performing wallet validation...");

        // Verify wallet balance is accessible before sync
        try {
          const balanceStr = getNativeModule().litelib_execute("balance", "");
          const balanceJSON = JSON.parse(balanceStr);
          const totalBalance = Utils.zatoshiToBtcz(balanceJSON.tbalance + balanceJSON.zbalance + balanceJSON.uabalance);
          console.log("💰 Pre-sync balance verification:", {
            transparent: balanceJSON.tbalance / 10 ** 8,
            shielded: balanceJSON.zbalance / 10 ** 8,
            unified: balanceJSON.uabalance / 10 ** 8,
            total: totalBalance
          });

          // If balance is zero but wallet has transactions, this might indicate a loading issue
          if (totalBalance === 0) {
            const listStr = getNativeModule().litelib_execute("list", "");
            const listJSON = JSON.parse(listStr);
            if (listJSON.length > 0) {
              console.warn("⚠️ WARNING: Wallet has transactions but zero balance - potential Windows loading issue");
              console.log("Transaction count:", listJSON.length);

              // Force a save and reload cycle to fix potential Windows file locking issues
              console.log("🔄 Attempting Windows wallet recovery...");
              try {
                RPC.doSave();

                // Use setTimeout instead of await since this is not an async function
                setTimeout(() => {
                  try {
                    // Try to refresh the balance after delay
                    const refreshedBalanceStr = getNativeModule().litelib_execute("balance", "");
                    const refreshedBalanceJSON = JSON.parse(refreshedBalanceStr);
                    const refreshedTotal = Utils.zatoshiToBtcz(refreshedBalanceJSON.tbalance + refreshedBalanceJSON.zbalance + refreshedBalanceJSON.uabalance);
                    console.log("💰 Post-recovery balance:", refreshedTotal);

                    if (refreshedTotal > 0) {
                      console.log("✅ Windows wallet recovery successful!");
                    }
                  } catch (refreshError) {
                    console.error("❌ Windows balance refresh failed:", refreshError);
                  }
                }, 2000); // Wait 2 seconds for file system

              } catch (recoveryError) {
                console.error("❌ Windows wallet recovery failed:", recoveryError);
              }
            }
          }
        } catch (balanceError) {
          console.error("❌ Windows balance verification failed:", balanceError);
          // Continue with sync anyway, but log the issue
        }
      }

      // Grab the previous sync ID.
      const prevSyncId = JSON.parse(RPC.doSyncStatus()).sync_id;

      // This will do the sync in another thread, so we have to check for sync status
      RPC.doSync();

      this.runSyncStatusPoller(prevSyncId);
    } catch (err) {
      // Enhanced error handling for Windows
      console.error("❌ getInfo error:", err);

      let errorMessage = err as string;
      if (process.platform === 'win32') {
        console.error("🪟 Windows-specific error detected");
        errorMessage = `Windows Error: ${err}\n\nThis may be caused by:\n• File permission issues\n• Antivirus software blocking wallet files\n• Corrupted wallet data\n• Missing Visual C++ Redistributables\n\nTry running as administrator or check Windows Event Viewer for details.`;
      }

      // Not yet finished loading. So update the state, and setup the next refresh
      this.setState({ currentStatus: errorMessage });
    }
  }

  runSyncStatusPoller = (initialPrevSyncId: number) => {
    // Make prevSyncId mutable so we can update it when starting new sync rounds
    let prevSyncId = initialPrevSyncId;

    // Track which sync IDs we've actually seen running (in_progress: true)
    // This prevents false-positive completion detection for queued-but-not-started syncs
    let lastSyncIdStarted = initialPrevSyncId;

    const me = this;

    const { setRPCConfig, setInfo, setRescanning } = this.props;
    const { url } = this.state;

    // And after a while, check the sync status.
    const poller = setInterval(() => {
      const syncstatus = RPC.doSyncStatus();

      if (syncstatus.startsWith("Error")) {
        // Something went wrong
        this.setState({
          currentStatus: syncstatus,
          currentStatusIsError: true,
        });

        // And cancel the updater
        clearInterval(poller);
      } else {
        const ss = JSON.parse(syncstatus);
        console.log(ss);
        // console.log(`Prev SyncID: ${prevSyncId}`);

        // Track when we see a sync actually running (in_progress: true)
        // This helps us distinguish between completed syncs and queued-but-not-started syncs
        if (ss.in_progress && ss.sync_id > lastSyncIdStarted) {
          lastSyncIdStarted = ss.sync_id;
          console.log(`[LoadingScreen] 🔄 Sync ${ss.sync_id} has started (in_progress: true)`);
        }

        // Capture initial heights when first sync starts (for cumulative progress tracking)
        if (ss.in_progress && me.state.initialWalletHeight === null) {
          const initialHeight = RPC.fetchWalletHeight();
          const networkInfo = RPC.getInfoObject();
          const targetHeight = networkInfo.latestBlock;

          console.log('[LoadingScreen] 📊 Capturing initial sync state:');
          console.log(`   Initial wallet height: ${initialHeight}`);
          console.log(`   Target network height: ${targetHeight}`);
          console.log(`   Total blocks to sync: ${targetHeight - initialHeight}`);

          me.setState({
            initialWalletHeight: initialHeight,
            targetNetworkHeight: targetHeight
          });
        }

        // Process "sync complete" when sync_id advanced and is no longer in progress.
        // Accept completion even if we never saw in_progress (sync finished faster than polling).
        if (ss.sync_id > prevSyncId && !ss.in_progress && (ss.sync_id <= lastSyncIdStarted || !ss.last_error)) {
          // If sync failed, log it but continue (will retry automatically)
          if (ss.last_error) {
            console.log('[LoadingScreen] Sync failed with error:', ss.last_error);
            console.log('[LoadingScreen] Will retry on next sync...');
            // Don't return - let it continue and retry
          }

          //  ✅ Save wallet state immediately after sync completes
          console.log('[LoadingScreen] 💾 Saving wallet state after sync completion...');
          RPC.doSave();
          console.log('[LoadingScreen] ✅ Wallet saved');

          // Quick check if wallet state is updated (reduced from 500ms to 100ms)
          setTimeout(() => {
            // Now fetch fresh wallet info and check if we're caught up
            const walletHeight = RPC.fetchWalletHeight();
            const networkInfo = RPC.getInfoObject();
            const networkHeight = networkInfo.latestBlock;
            const blocksBehind = networkHeight - walletHeight;

            console.log('[LoadingScreen] Sync batch complete. Checking if caught up...');
            console.log(`   Wallet: ${walletHeight}, Network: ${networkHeight}, Behind: ${blocksBehind}`);

            if (blocksBehind > 0) {
              // ❌ Still behind - start another sync round
              console.log(`[LoadingScreen] ⏳ Still ${blocksBehind} blocks behind. Starting next sync round...`);

              me.setState({ currentStatus: `Syncing blockchain (${blocksBehind} blocks remaining)...` });

              // Update prevSyncId in parent to track next sync
              setRescanning(true, ss.sync_id);

              // ✅ CRITICAL: Update LOCAL prevSyncId to prevent re-entering this block
              // while waiting for the new sync to start in the background thread
              prevSyncId = ss.sync_id;
              console.log(`[LoadingScreen] Updated prevSyncId to ${ss.sync_id} for next sync round`);

              // Start another sync
              RPC.doSync();

              // Continue polling (don't clear interval, don't transition to Dashboard)
              return;
            }

            // ✅ If we get here, we're fully synced to network tip!
            console.log('[LoadingScreen] ✅ Fully synced! Transitioning to Dashboard...');

            // Cancel the sync status poller
            clearInterval(poller);

            // Configure the RPC immediately - this fetches correct latestBlockHeight
            // This is critical for transaction confirmations to display correctly
            const rpcConfig = new RPCConfig();
            rpcConfig.url = url;
            setRPCConfig(rpcConfig);

            // Show "Loading wallet data..." message while RPC fetches balance
            me.setState({ currentStatus: "Loading wallet data..." });

            // Quick buffer for balance to load (reduced from 2000ms for Tor)
            const waitTime = 200;
            console.log(`[LoadingScreen] Waiting ${waitTime}ms for balance to load...`);

            setTimeout(() => {
              console.log('[LoadingScreen] Balance load wait complete, fetching wallet info...');

              // Get fresh info after network connection is established
              const info = RPC.getInfoObject();
              console.log('[LoadingScreen] Wallet info retrieved:', {
                latestBlock: info.latestBlock,
                walletHeight: info.walletHeight,
                connections: info.connections
              });

              // Set the info object and rescanning status - this triggers Dashboard to show
              setInfo(info);
              setRescanning(false, prevSyncId);

              console.log('[LoadingScreen] Transitioning to Dashboard...');

              // This will cause a redirect to the dashboard screen
              me.setState({
                loadingDone: true
              });
            }, waitTime);
          }, 100); // Quick buffer for wallet state to update

          // Exit early - the setTimeout will handle both cases (still behind or fully synced)
          return;
        } else {
          // Still syncing - show batch progress using sync status data
          // If sync fields are not ready yet, show simple message but don't block
          if (!ss.in_progress || !ss.start_block || !ss.end_block) {
            // Sync is starting - show simple message
            me.setState({ currentStatus: "Starting blockchain sync..." });
            return;
          }

          const { initialWalletHeight, targetNetworkHeight } = me.state;

          // Calculate display values
          let currentHeightFormatted, targetHeightFormatted, syncedBlocksFormatted, totalBlocksFormatted;
          let progress;

          if (initialWalletHeight !== null && targetNetworkHeight !== null) {
            // We know the overall sync range - show cumulative progress across all sync rounds
            const currentBatchStart = ss.end_block; // Syncing backwards: end_block is where we start
            const totalBlocksToSync = targetNetworkHeight - initialWalletHeight;
            const blocksSyncedSoFar = targetNetworkHeight - currentBatchStart;

            // Calculate overall cumulative progress (not just current batch)
            progress = (blocksSyncedSoFar * 100) / totalBlocksToSync;

            // Display blocks synced (not current position) so numbers increase with progress
            currentHeightFormatted = blocksSyncedSoFar.toLocaleString();
            targetHeightFormatted = totalBlocksToSync.toLocaleString();
            syncedBlocksFormatted = ss.synced_blocks.toLocaleString();
            totalBlocksFormatted = ss.total_blocks.toLocaleString();
          } else {
            // No initial heights captured - show batch info only
            // Use batch progress from sync status (this updates in real-time during sync)
            let progress_blocks = (ss.synced_blocks + ss.trial_decryptions_blocks + ss.txn_scan_blocks) / 3;
            progress = progress_blocks;
            if (ss.total_blocks) {
              progress = (progress_blocks * 100) / ss.total_blocks;
            }

            // Display batch progress (blocks synced so far in this batch)
            currentHeightFormatted = ss.synced_blocks.toLocaleString();
            targetHeightFormatted = ss.total_blocks.toLocaleString();
            syncedBlocksFormatted = ss.synced_blocks.toLocaleString();
            totalBlocksFormatted = ss.total_blocks.toLocaleString();
          }

          const currentStatus = (
            <div>
              Syncing blockchain...
              <br />
              {currentHeightFormatted} / {targetHeightFormatted} blocks ({progress.toFixed(1)}%)
              <br />
              {syncedBlocksFormatted} of {totalBlocksFormatted} blocks synced
              <br />
              <br />
              Light wallet sync in progress... Usually takes just a few minutes
            </div>
          );
          me.setState({ currentStatus });
        }
      }
    }, 1000);
  };

  createNewWallet = () => {
    const { url } = this.state;
    const result = getNativeModule().litelib_initialize_new(url);

    if (result.startsWith("Error")) {
      this.setState({ newWalletError: result });
    } else {
      const r = JSON.parse(result);
      this.setState({ walletScreen: 2, seed: r.seed, walletBirthday: r.birthday });
    }
  };

  startNewWallet = () => {
    // Start using the new wallet
    this.setState({ walletScreen: 0 });
    this.getInfo();
  };

  restoreExistingWallet = () => {
    this.setState({ walletScreen: 3 });
  };

  updateSeed = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ seed: e.target.value });
  };

  updateBirthday = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ birthday: parseInt(e.target.value) });
  };

  restoreWalletBack = () => {
    // Reset the seed and birthday and try again
    this.setState({
      seed: "",
      birthday: 0,
      newWalletError: null,
      walletScreen: 3,
    });
  };

  doRestoreWallet = () => {
    const { seed, birthday, url } = this.state;
    console.log(`Restoring ${seed} with ${birthday}`);

    const allowOverwrite = true;

    const result = getNativeModule().litelib_initialize_new_from_phrase(url, seed, birthday, allowOverwrite);
    if (result.startsWith("Error")) {
      this.setState({ newWalletError: result });
    } else {
      this.setState({ walletScreen: 0 });
      this.getInfo();
    }
  };

  render() {
    const { loadingDone, currentStatus, currentStatusIsError, walletScreen, newWalletError, seed, birthday, walletBirthday, showFirstTimeServerSetup } =
      this.state;

    const { openServerSelectModal } = this.props;

    // If still loading, show the status
    if (!loadingDone) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #4A90E2 0%, #2E5BBA 50%, #1E3A8A 100%)',
          color: 'white'
        }}>
          {walletScreen === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '600px',
              width: '100%'
            }}>
              {Logo && (
                <div style={{
                  marginBottom: "30px",
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <img
                    src={Logo}
                    width="200"
                    height="200"
                    alt="BitcoinZ Logo"
                    style={{ display: 'block', objectFit: 'contain' }}
                    onError={(e) => {
                      console.error("Failed to load logo image:", e);
                      // Fallback to displaying text if image fails
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '20px',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
              }}>{currentStatus}</div>
              {currentStatusIsError && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  alignItems: 'center',
                  marginTop: '30px'
                }}>
                  <button
                    type="button"
                    onClick={openServerSelectModal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      minWidth: '200px',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fas fa-server" />
                    Switch LightwalletD Server
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      this.setState({ walletScreen: 1 });
                      this.setState({
                        currentStatus: "",
                        currentStatusIsError: false,
                      });
                      this.restoreExistingWallet();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      minWidth: '200px',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fas fa-key" />
                    Restore Wallet From Seed
                  </button>
                </div>
              )}
            </div>
          )}

          {walletScreen === 1 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '600px',
              width: '100%',
              padding: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '30px'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  letterSpacing: '0.5px'
                }}>
                  In Decentralization We Trust
                </div>
                <img src={Logo} width="90px" alt="BitcoinZ Logo" style={{ display: 'block' }} />
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: '500px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'white',
                      marginBottom: '10px',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>Create A New Wallet</div>
                    <div style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '16px',
                      lineHeight: '1.4'
                    }}>
                      Creates a new wallet with a new randomly generated seed phrase. Please save the seed phrase
                      carefully, it's the only way to restore your wallet.
                    </div>
                    <button
                      type="button"
                      onClick={this.createNewWallet}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        minWidth: '140px',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="fas fa-plus" />
                      Create New
                    </button>
                  </div>

                  <div style={{
                    height: '1px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    margin: '0 20px'
                  }} />

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'white',
                      marginBottom: '10px',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>Restore Wallet From Seed</div>
                    <div style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '16px',
                      lineHeight: '1.4'
                    }}>
                      If you already have a seed phrase, you can restore it to this wallet. This will rescan the
                      blockchain for all transactions from the seed phrase.
                    </div>
                    <button
                      type="button"
                      onClick={this.restoreExistingWallet}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        minWidth: '140px',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="fas fa-key" />
                      Restore Existing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {walletScreen === 2 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '600px',
              width: '100%',
              padding: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '30px'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  letterSpacing: '0.5px'
                }}>
                  Your Keys, Your Coins
                </div>
                <img src={Logo} width="90px" alt="BitcoinZ Logo" style={{ display: 'block' }} />
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: '500px'
              }}>
                {newWalletError && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#ff6b6b',
                      marginBottom: '12px',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>Error Creating New Wallet</div>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '20px'
                    }}>There was an error creating a new wallet</div>
                    <div style={{
                      background: 'rgba(255, 107, 107, 0.1)',
                      border: '1px solid rgba(255, 107, 107, 0.3)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '20px',
                      fontSize: '13px',
                      color: '#ffcccb',
                      fontFamily: 'monospace',
                      wordBreak: 'break-word'
                    }}>{newWalletError}</div>
                  </div>
                )}

                {!newWalletError && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: 'white',
                      marginBottom: '12px',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>Your New Wallet</div>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '20px',
                      lineHeight: '1.5'
                    }}>
                      This is your new wallet. Below is your seed phrase. PLEASE STORE IT CAREFULLY! The seed phrase
                      is the only way to recover your funds and transactions.
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px',
                      fontSize: '13px',
                      color: 'white',
                      fontFamily: 'monospace',
                      wordBreak: 'break-word',
                      lineHeight: '1.4'
                    }}>{seed}</div>
                    <div style={{
                      background: 'rgba(255, 200, 0, 0.1)',
                      border: '1px solid rgba(255, 200, 0, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '24px',
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      textAlign: 'center'
                    }}>
                      <strong>Wallet Birthday:</strong> Block {walletBirthday}
                      <br />
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Save this block number along with your seed phrase. You'll need it if you restore your wallet.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={this.startNewWallet}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        minWidth: '160px',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="fas fa-rocket" />
                      Start Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {walletScreen === 3 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '600px',
              width: '100%',
              padding: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '30px'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  letterSpacing: '0.5px'
                }}>
                  Welcome Back to Freedom
                </div>
                <img src={Logo} width="90px" alt="BitcoinZ Logo" style={{ display: 'block' }} />
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: '500px'
              }}>
                {newWalletError && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#ff6b6b',
                      marginBottom: '12px',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>Error Restoring Wallet</div>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '20px'
                    }}>There was an error restoring your seed phrase</div>
                    <div style={{
                      background: 'rgba(255, 107, 107, 0.1)',
                      border: '1px solid rgba(255, 107, 107, 0.3)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '20px',
                      fontSize: '13px',
                      color: '#ffcccb',
                      fontFamily: 'monospace',
                      wordBreak: 'break-word'
                    }}>{newWalletError}</div>
                    <button
                      type="button"
                      onClick={this.restoreWalletBack}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        minWidth: '120px',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="fas fa-arrow-left" />
                      Back
                    </button>
                  </div>
                )}

                {!newWalletError && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: 'white',
                      marginBottom: '20px',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>Please enter your seed phrase</div>

                    <TextareaAutosize
                      value={seed}
                      onChange={(e) => this.updateSeed(e)}
                      placeholder="Enter your seed phrase here..."
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        resize: 'vertical',
                        marginBottom: '20px',
                        boxSizing: 'border-box'
                      }}
                    />

                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '8px',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}>
                      Wallet Birthday
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '12px'
                    }}>
                      If you don't know this, it is OK to enter '0'
                    </div>
                    <input
                      type="number"
                      value={birthday}
                      onChange={(e) => this.updateBirthday(e)}
                      placeholder="0"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        marginBottom: '24px',
                        boxSizing: 'border-box'
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => this.doRestoreWallet()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        minWidth: '160px',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="fas fa-key" />
                      Restore Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* First-Time Server Setup Modal */}
          <FirstTimeServerSetup
            modalIsOpen={showFirstTimeServerSetup}
            onServerSelected={this.handleFirstTimeServerSelected}
          />
        </div>
      );
    }

    return <Redirect to={routes.DASHBOARD} />;
  }
}

// @ts-ignore
export default withRouter(LoadingScreen);
