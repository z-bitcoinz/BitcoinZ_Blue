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

const { ipcRenderer } = window.require("electron");

class LoadingScreenState {
  currentStatus: string | JSX.Element;

  currentStatusIsError: boolean;

  loadingDone: boolean;

  rpcConfig: RPCConfig | null;

  url: string;

  proxyEnabled: boolean;

  proxyUrl: string;

  walletScreen: number; // 0 -> no wallet, load existing wallet 1 -> show option 2-> create new 3 -> restore existing

  newWalletError: null | string; // Any errors when creating/restoring wallet

  seed: string; // The new seed phrase for a newly created wallet or the seed phrase to restore from

  birthday: number; // Wallet birthday if we're restoring

  walletBirthday: number; // The birthday of a newly created wallet

  getinfoRetryCount: number;

  // Tor connection state
  torBootstrapProgress: number; // 0-100%
  torStatus: string; // 'stopped', 'starting', 'ready', 'error'
  torReady: boolean;
  waitingForTor: boolean;

  constructor() {
    this.currentStatus = "Loading...";
    this.currentStatusIsError = false;
    this.loadingDone = false;
    this.rpcConfig = null;
    this.url = "";
    this.proxyEnabled = false;
    this.proxyUrl = "socks5://127.0.0.1:9050";
    this.getinfoRetryCount = 0;
    this.walletScreen = 0;
    this.newWalletError = null;
    this.seed = "";
    this.birthday = 0;
    this.walletBirthday = 0;
    this.torBootstrapProgress = 0;
    this.torStatus = 'stopped';
    this.torReady = false;
    this.waitingForTor = false;
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

    // Set up Tor IPC listeners
    ipcRenderer.on('tor-bootstrap-progress', (_event: any, data: {progress: number; status: string}) => {
      console.log('[LoadingScreen] Tor bootstrap progress:', data);
      this.setState({
        torBootstrapProgress: data.progress,
        torStatus: data.status
      });
    });

    ipcRenderer.on('tor-ready', () => {
      console.log('[LoadingScreen] Tor is ready!');
      this.setState({
        torReady: true,
        torStatus: 'ready',
        currentStatus: "Tor circuit establishing..."
      });

      // Animate progress bar for visual feedback
      this.animateTorProgress(() => {
        // If we're waiting for Tor, wait 5 seconds for circuit to establish, then proceed
        if (this.state.waitingForTor) {
          console.log('[LoadingScreen] Waiting 5 seconds for Tor circuit to establish...');
          setTimeout(() => {
            console.log('[LoadingScreen] Proceeding with wallet initialization');
            this.proceedWithWalletSetup();
          }, 5000);
        }
      });
    });

    if (rescanning) {
      this.runSyncStatusPoller(prevSyncId);
    } else {
      (async () => {
        // Do it in a timeout, so the window has a chance to load.
        setTimeout(() => this.doFirstTimeSetup(), 100);
      })();
    }
  }

  componentWillUnmount() {
    // Clean up IPC listeners
    ipcRenderer.removeAllListeners('tor-bootstrap-progress');
    ipcRenderer.removeAllListeners('tor-ready');
  }

  animateTorProgress = (onComplete?: () => void) => {
    // Animate progress through stages for visual feedback
    const stages = [0, 20, 40, 60, 80, 100];
    let currentStage = 0;

    const updateProgress = () => {
      if (currentStage < stages.length) {
        this.setState({ torBootstrapProgress: stages[currentStage] });
        currentStage++;

        if (currentStage < stages.length) {
          setTimeout(updateProgress, 1000); // 1000ms between stages (5 seconds total)
        } else if (onComplete) {
          onComplete();
        }
      }
    };

    updateProgress();
  };

  loadServerURI = async () => {
    // Try to read the default server
    const settings = await ipcRenderer.invoke("loadSettings");
    let server = settings?.lwd?.serveruri || Utils.V3_LIGHTWALLETD;

    // Automatically upgrade to v2 server if you had the previous v1 server.
    if (server === Utils.V1_LIGHTWALLETD || server === Utils.V2_LIGHTWALLETD) {
      server = Utils.V3_LIGHTWALLETD;
    }

    // Load proxy settings
    const proxyEnabled = settings?.proxy?.enabled || false;
    const proxyUrl = settings?.proxy?.url || "socks5://127.0.0.1:9050";

    const newstate = new LoadingScreenState();
    Object.assign(newstate, this.state);

    newstate.url = server;
    newstate.proxyEnabled = proxyEnabled;
    newstate.proxyUrl = proxyUrl;
    this.setState(newstate);
  };

  doFirstTimeSetup = async () => {
    await this.loadServerURI();

    // Check if Tor is enabled and wait for it if necessary
    const { proxyEnabled } = this.state;
    if (proxyEnabled) {
      // Check current Tor status
      const torStatus = await ipcRenderer.invoke('getTorStatus');
      console.log('[LoadingScreen] Tor status:', torStatus);

      if (torStatus.status !== 'ready') {
        // Tor is not ready yet, wait for it
        console.log('[LoadingScreen] Waiting for Tor to be ready...');
        this.setState({
          waitingForTor: true,
          currentStatus: "Establishing anonymous Tor connection...",
          torBootstrapProgress: torStatus.progress || 0,
          torStatus: torStatus.status
        });
        return; // Exit and wait for tor-ready event
      } else {
        // Tor is already ready, but animate progress for visual feedback
        console.log('[LoadingScreen] Tor ready, animating progress and waiting for circuit to establish...');
        this.setState({
          waitingForTor: true,
          torReady: true,
          torStatus: 'ready',
          currentStatus: "Tor circuit establishing..."
        });

        // Animate progress bar, then wait for circuit establishment
        this.animateTorProgress(() => {
          // Wait 5 seconds for Tor circuit to fully establish (DNS resolution needs this)
          setTimeout(() => {
            console.log('[LoadingScreen] Proceeding with wallet initialization');
            this.proceedWithWalletSetup();
          }, 5000);
        });

        return; // Don't fall through - wait for animation and setTimeout
      }
    }

    // Proceed with wallet setup (only when Tor is disabled)
    this.proceedWithWalletSetup();
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
        const { proxyEnabled, proxyUrl } = this.state;
        const result = getNativeModule().litelib_initialize_existing(url, proxyEnabled, proxyUrl);
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

  runSyncStatusPoller = (prevSyncId: number) => {
    const me = this;

    const { setRPCConfig, setInfo, setRescanning } = this.props;
    const { url } = this.state;

    const info = RPC.getInfoObject();

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

        if (ss.sync_id > prevSyncId && !ss.in_progress) {
          // Don't exit loading screen if sync failed - keep waiting
          if (ss.last_error) {
            console.log('[LoadingScreen] Sync failed, waiting for successful sync...');
            me.setState({ currentStatus: "Connecting to network..." });
            return;
          }

          // First, save the wallet so we don't lose the just-synced data
          RPC.doSave();

          // Cancel the sync status poller
          clearInterval(poller);

          // Configure the RPC immediately - this fetches correct latestBlockHeight
          // This is critical for transaction confirmations to display correctly
          const rpcConfig = new RPCConfig();
          rpcConfig.url = url;
          setRPCConfig(rpcConfig);

          // Show "Loading wallet data..." message while RPC fetches balance
          me.setState({ currentStatus: "Loading wallet data..." });

          // Wait 2 seconds for balance to fully load, THEN show Dashboard
          // This keeps the Tor loading screen visible during balance fetch
          setTimeout(() => {
            console.log(info);

            // Set the info object and rescanning status - this triggers Dashboard to show
            setInfo(info);
            setRescanning(false, prevSyncId);

            // This will cause a redirect to the dashboard screen
            me.setState({
              loadingDone: true,
              waitingForTor: false  // Hide Tor UI now that we're completely done
            });
          }, 2000);
        } else {
          // Still syncing, grab the status and update the status
          let progress_blocks = (ss.synced_blocks + ss.trial_decryptions_blocks + ss.txn_scan_blocks) / 3;

          let progress = progress_blocks;
          if (ss.total_blocks) {
            progress = (progress_blocks * 100) / ss.total_blocks;
          }

          let base = 0;
          if (ss.batch_total) {
            base = (ss.batch_num * 100) / ss.batch_total;
            progress = base + progress / ss.batch_total;
          }

          if (!isNaN(progress_blocks)) {
            let batch_progress = (progress_blocks * 100) / ss.total_blocks;
            if (isNaN(batch_progress)) {
              batch_progress = 0;
            }
            const currentStatus = (
              <div>
                Syncing batch {ss.batch_num} of {ss.batch_total}
                <br />
                Batch Progress: {batch_progress.toFixed(2)}%. Total progress: {progress.toFixed(2)}%.
                <br />
                <br />
                Light wallet sync in progress... Usually takes just a few minutes
              </div>
            );
            me.setState({ currentStatus });
          }
        }
      }
    }, 1000);
  };

  createNewWallet = () => {
    const { url, proxyEnabled, proxyUrl } = this.state;
    const result = getNativeModule().litelib_initialize_new(url, proxyEnabled, proxyUrl);

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
    const { seed, birthday, url, proxyEnabled, proxyUrl } = this.state;
    console.log(`Restoring ${seed} with ${birthday}`);

    const allowOverwrite = true;

    const result = getNativeModule().litelib_initialize_new_from_phrase(url, seed, birthday, allowOverwrite, proxyEnabled, proxyUrl);
    if (result.startsWith("Error")) {
      this.setState({ newWalletError: result });
    } else {
      this.setState({ walletScreen: 0 });
      this.getInfo();
    }
  };

  render() {
    const { loadingDone, currentStatus, currentStatusIsError, walletScreen, newWalletError, seed, birthday, walletBirthday, waitingForTor, torBootstrapProgress } =
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
          {waitingForTor && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '500px',
              width: '100%'
            }}>
              {/* Tor Icon */}
              <div style={{ marginBottom: '32px' }}>
                <i className="fas fa-user-secret" style={{
                  fontSize: '80px',
                  color: '#C084FC',
                  textShadow: '0 0 20px rgba(192, 132, 252, 0.6), 0 4px 12px rgba(0, 0, 0, 0.5)',
                  animation: 'pulse 2s infinite'
                }} />
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '16px',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                letterSpacing: '0.5px'
              }}>
                Establishing Anonymous Connection
              </h2>

              {/* Status Message */}
              <div style={{
                fontSize: '16px',
                lineHeight: '1.6',
                marginBottom: '32px',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                {torBootstrapProgress === 100 && currentStatus ? currentStatus :
                 torBootstrapProgress < 25 ? 'Initializing Tor network...' :
                 torBootstrapProgress < 50 ? 'Building encrypted circuit...' :
                 torBootstrapProgress < 75 ? 'Establishing anonymous connection...' :
                 torBootstrapProgress < 100 ? 'Securing your privacy...' :
                 'Connection secured!'}
              </div>

              {/* Progress Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '32px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: '450px'
              }}>
                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: torBootstrapProgress === 100 ? '100%' : `${torBootstrapProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #C084FC 0%, #7C3AED 50%, #C084FC 100%)',
                    backgroundSize: '200% 100%',
                    borderRadius: '4px',
                    transition: 'width 1.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    boxShadow: '0 0 15px rgba(192, 132, 252, 0.6)',
                    animation: torBootstrapProgress === 100
                      ? 'shimmer 2s ease-in-out infinite'
                      : 'progressPulse 1.5s ease-in-out infinite, gradientMove 3s linear infinite',
                    transform: torBootstrapProgress < 100 ? 'scaleY(1.1)' : 'scaleY(1)',
                    transformOrigin: 'left center'
                  }} />
                </div>

                {/* Progress Text */}
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#C084FC',
                  marginBottom: '24px'
                }}>
                  {torBootstrapProgress === 100 ? (
                    <span style={{animation: 'pulse 2s ease-in-out infinite'}}>Loading...</span>
                  ) : `${torBootstrapProgress}% Connected`}
                </div>

                {/* Privacy Features - 2 Columns */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  textAlign: 'left',
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  {/* Left Column - Network Privacy (Tor) */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <i className="fas fa-shield-alt" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
                      <span>IP address hidden</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <i className="fas fa-lock" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
                      <span>Multi-layer encryption</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <i className="fas fa-map-marker-alt" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
                      <span>Location protected</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <i className="fas fa-eye-slash" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
                      <span>Untraceable activity</span>
                    </div>
                  </div>

                  {/* Right Column - Transaction Privacy (BitcoinZ) */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <i className="fas fa-coins" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
                      <span>Balance kept private</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <i className="fas fa-user-secret" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
                      <span>Payments fully encrypted</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <i className="fas fa-mask" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
                      <span>Wallet identity hidden</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
                      <span>No transaction history</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Message */}
              <p style={{
                fontSize: '12px',
                marginTop: '24px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontStyle: 'italic'
              }}>
                Double privacy: Hidden network connection + Fully encrypted transactions
              </p>

              <style>{`
                @keyframes pulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.05); }
                }
                @keyframes shimmer {
                  0% { opacity: 0.6; }
                  50% { opacity: 1; }
                  100% { opacity: 0.6; }
                }
                @keyframes progressPulse {
                  0%, 100% {
                    box-shadow: 0 0 15px rgba(192, 132, 252, 0.6);
                    filter: brightness(1);
                  }
                  50% {
                    box-shadow: 0 0 25px rgba(192, 132, 252, 0.9), 0 0 40px rgba(192, 132, 252, 0.4);
                    filter: brightness(1.2);
                  }
                }
                @keyframes gradientMove {
                  0% { background-position: 0% 50%; }
                  100% { background-position: 200% 50%; }
                }
              `}</style>
            </div>
          )}
          {!waitingForTor && walletScreen === 0 && (
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
        </div>
      );
    }

    return <Redirect to={routes.DASHBOARD} />;
  }
}

// @ts-ignore
export default withRouter(LoadingScreen);
