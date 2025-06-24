/* eslint-disable no-else-return */

/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import React, { PureComponent, ReactElement, useState } from "react";
import dateformat from "dateformat";
import Modal from "react-modal";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import styles from "./Sidebar.module.css";
import cstyles from "./Common.module.css";
import routes from "../constants/routes.json";
import Logo from "../assets/img/logobig.png";
import { AddressDetail, Info, Transaction, WalletSettings } from "./AppState";
import Utils from "../utils/utils";
import RPC from "../rpc";
import { parseBitcoinzURI, BitcoinzURITarget } from "../utils/uris";
import WalletSettingsModal from "./WalletSettingsModal";

const { ipcRenderer, remote } = window.require("electron");
const fs = window.require("fs");

type ExportPrivKeyModalProps = {
  modalIsOpen: boolean;
  exportedPrivKeys: string[];
  closeModal: () => void;
};
const ExportPrivKeyModal = ({ modalIsOpen, exportedPrivKeys, closeModal }: ExportPrivKeyModalProps) => {
  const modernButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
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
    margin: '0 8px',
    minWidth: '100px',
    justifyContent: 'center'
  };

  return (
    <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className={cstyles.modal}
        overlayClassName={cstyles.modalOverlay}
        style={{
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 10000
          },
          content: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #4A90E2 0%, #2E5BBA 50%, #1E3A8A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 10001,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
      <div className={[cstyles.verticalflex].join(" ")}>
        <div className={cstyles.marginbottomlarge} style={{
          textAlign: "center",
          color: 'white',
          fontSize: '18px',
          fontWeight: '700',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          Your Wallet Private Keys
        </div>

        <div className={[cstyles.marginbottomlarge, cstyles.center].join(" ")} style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          These are all the private keys in your wallet. Please store them carefully!
        </div>

        {exportedPrivKeys && (
          <TextareaAutosize
            value={exportedPrivKeys.join("\n")}
            className={styles.exportedPrivKeys}
            disabled
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              padding: '12px',
              fontFamily: 'monospace'
            }}
          />
        )}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '16px'
      }}>
        <button
          type="button"
          style={modernButtonStyle}
          onClick={closeModal}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(255, 255, 255, 0.25)';
            target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            target.style.transform = 'translateY(-1px)';
            target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(255, 255, 255, 0.15)';
            target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
        >
          <i className="fas fa-times" />
          Close
        </button>
      </div>
    </Modal>
  );
};

type ImportPrivKeyModalProps = {
  modalIsOpen: boolean;
  closeModal: () => void;
  doImportPrivKeys: (pk: string, birthday: string) => void;
};
const ImportPrivKeyModal = ({ modalIsOpen, closeModal, doImportPrivKeys }: ImportPrivKeyModalProps) => {
  const [pkey, setPKey] = useState("");
  const [birthday, setBirthday] = useState("0");

  const modernModalStyle = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #4A90E2 0%, #2E5BBA 50%, #1E3A8A 100%)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      padding: '24px',
      width: '480px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      overflow: 'auto' as const,
      color: 'white'
    },
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(5px)',
      zIndex: 1000
    }
  };

  // Removed unused modernInputStyle variable

  const modernButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    margin: '0 8px',
    minWidth: '100px',
    justifyContent: 'center'
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={modernModalStyle}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Modern Modal Title */}
        <div style={{
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: '700',
          color: '#ffffff',
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.7)',
          marginBottom: '8px'
        }}>
          Import Spending or Viewing Key
        </div>

        {/* Description */}
        <div style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.85)',
          textAlign: 'center',
          lineHeight: '1.5',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
        }}>
          Please paste your private key here (spending key or viewing key).
        </div>

        {/* Private Key Input */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '16px'
        }}>
          <TextareaAutosize
            minRows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'monospace',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              outline: 'none',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              boxSizing: 'border-box' as const,
              resize: 'vertical' as const
            }}
            placeholder="Spending or Viewing Key"
            value={pkey}
            onChange={(e) => setPKey(e.target.value)}
          />
        </div>

        {/* Birthday Section */}
        <div>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.85)',
            marginBottom: '12px',
            fontWeight: '500',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
          }}>
            Birthday (The earliest block height where this key was used. Ok to enter '0')
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '16px'
          }}>
            <input
              type="number"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'inherit',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxSizing: 'border-box' as const
              }}
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Modern Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            type="button"
            style={modernButtonStyle}
            onClick={() => {
              doImportPrivKeys(pkey, birthday);
              closeModal();
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(255, 255, 255, 0.25)';
              target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(255, 255, 255, 0.15)';
              target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <i className="fas fa-download" />
            Import
          </button>
          <button
            type="button"
            style={modernButtonStyle}
            onClick={closeModal}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(255, 255, 255, 0.25)';
              target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(255, 255, 255, 0.15)';
              target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <i className="fas fa-times" />
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

type PayURIModalProps = {
  modalIsOpen: boolean;
  modalInput?: string;
  setModalInput: (i: string) => void;
  closeModal: () => void;
  modalTitle: string;
  actionButtonName: string;
  actionCallback: (uri: string) => void;
};
const PayURIModal = ({
  modalIsOpen,
  modalInput,
  setModalInput,
  closeModal,
  modalTitle,
  actionButtonName,
  actionCallback,
}: PayURIModalProps) => {
  const modernButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
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
    margin: '0 8px',
    minWidth: '100px',
    justifyContent: 'center'
  };

  return (
    <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className={cstyles.modal}
        overlayClassName={cstyles.modalOverlay}
        style={{
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 10000
          },
          content: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #4A90E2 0%, #2E5BBA 50%, #1E3A8A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 10001,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
      <div className={[cstyles.verticalflex].join(" ")}>
        <div className={cstyles.marginbottomlarge} style={{
          textAlign: "center",
          color: 'white',
          fontSize: '18px',
          fontWeight: '700',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {modalTitle}
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: "center"
        }}>
          <input
            type="text"
            placeholder="Enter BitcoinZ URI"
            value={modalInput}
            onChange={(e) => setModalInput(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              padding: '12px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '16px'
      }}>
        {actionButtonName && (
          <button
            type="button"
            style={modernButtonStyle}
            onClick={() => {
              if (modalInput) {
                actionCallback(modalInput);
              }
              closeModal();
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(255, 255, 255, 0.25)';
              target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(255, 255, 255, 0.15)';
              target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <i className="fas fa-paper-plane" />
            {actionButtonName}
          </button>
        )}

        <button
          type="button"
          style={modernButtonStyle}
          onClick={closeModal}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(255, 255, 255, 0.25)';
            target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            target.style.transform = 'translateY(-1px)';
            target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(255, 255, 255, 0.15)';
            target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
        >
          <i className="fas fa-times" />
          Close
        </button>
      </div>
    </Modal>
  );
};

type SidebarMenuItemProps = {
  name: string;
  routeName: string;
  currentRoute: string;
  iconname: string;
};
const SidebarMenuItem = ({ name, routeName, currentRoute, iconname }: SidebarMenuItemProps) => {
  let isActive = false;

  if ((currentRoute.endsWith("app.html") && routeName === routes.HOME) || currentRoute === routeName) {
    isActive = true;
  }

  let activeColorClass = "";
  if (isActive) {
    activeColorClass = styles.sidebarmenuitemactive;
  }

  return (
    <div className={[styles.sidebarmenuitem, activeColorClass].join(" ")}>
      <Link to={routeName}>
        <span className={activeColorClass}>
          <i className={["fas", iconname].join(" ")} />
          &nbsp; &nbsp;
          {name}
        </span>
      </Link>
    </div>
  );
};

type Props = {
  info: Info;
  setRescanning: (rescan: boolean, prevSyncId: number) => void;
  addresses: AddressDetail[];
  transactions: Transaction[];
  setInfo: (info: Info) => void;
  clearTimers: () => void;
  setSendTo: (targets: BitcoinzURITarget[] | BitcoinzURITarget) => void;
  getPrivKeyAsString: (address: string) => string;
  importPrivKeys: (keys: string[], birthday: string) => Promise<boolean>;
  openErrorModal: (title: string, body: string | ReactElement) => void;
  openPassword: (
    confirmNeeded: boolean,
    passwordCallback: (p: string) => void,
    closeCallback: () => void,
    helpText?: string | JSX.Element
  ) => void;
  openPasswordAndUnlockIfNeeded: (successCallback: () => void | Promise<void>) => void;
  lockWallet: () => void;
  encryptWallet: (p: string) => void;
  decryptWallet: (p: string) => Promise<boolean>;
  walletSettings: WalletSettings;
  updateWalletSettings: () => Promise<void>;
};

type State = {
  uriModalIsOpen: boolean;
  uriModalInputValue?: string;
  privKeyModalIsOpen: boolean;
  privKeyInputValue: string | null;
  exportPrivKeysModalIsOpen: boolean;
  exportedPrivKeys: string[];
  walletSettingsModalIsOpen: boolean;
};

class Sidebar extends PureComponent<Props & RouteComponentProps, State> {
  constructor(props: Props & RouteComponentProps) {
    super(props);
    this.state = {
      uriModalIsOpen: false,
      uriModalInputValue: undefined,
      privKeyModalIsOpen: false,
      exportPrivKeysModalIsOpen: false,
      exportedPrivKeys: [],
      privKeyInputValue: null,
      walletSettingsModalIsOpen: false,
    };
  }

  componentDidMount() {
    this.setupMenuHandlers();

    // Signal to the main process that IPC listeners are ready
    // This prevents race conditions with menu creation
    ipcRenderer.send("ipc-listeners-ready");
  }

  componentWillUnmount() {
    // Clean up IPC listeners to prevent memory leaks
    ipcRenderer.removeAllListeners("about");
    ipcRenderer.removeAllListeners("donate");
    ipcRenderer.removeAllListeners("import");
    ipcRenderer.removeAllListeners("payuri");
    ipcRenderer.removeAllListeners("seed");
    ipcRenderer.removeAllListeners("exportalltx");
    ipcRenderer.removeAllListeners("encrypt");
    ipcRenderer.removeAllListeners("decrypt");
    ipcRenderer.removeAllListeners("unlock");
    ipcRenderer.removeAllListeners("rescan");
    ipcRenderer.removeAllListeners("exportall");
    ipcRenderer.removeAllListeners("zcashd");
    ipcRenderer.removeAllListeners("walletSettings");
    ipcRenderer.removeAllListeners("connectmobile");
  }

  // Handle menu items
  setupMenuHandlers = async () => {
    const { clearTimers, setSendTo, setInfo, setRescanning, history, openErrorModal, openPasswordAndUnlockIfNeeded } =
      this.props;

    // About
    ipcRenderer.on("about", () => {
      openErrorModal(
        "Zecwallet Lite",
        <div className={cstyles.verticalflex}>
          <div className={cstyles.margintoplarge}>Zecwallet Lite v1.8.8</div>
          <div className={cstyles.margintoplarge}>Built with Electron. Copyright (c) 2018-2022, Aditya Kulkarni.</div>
          <div className={cstyles.margintoplarge}>
            The MIT License (MIT) Copyright (c) 2018-2022 Zecwallet
            <br />
            <br />
            Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
            documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including
            without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
            following conditions:
            <br />
            <br />
            The above copyright notice and this permission notice shall be included in all copies or substantial
            portions of the Software.
            <br />
            <br />
            THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
            NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
            NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
            IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
            USE OR OTHER DEALINGS IN THE SOFTWARE.
          </div>
        </div>
      );
    });

    // Donate button
    ipcRenderer.on("donate", () => {
      const { info } = this.props;

      setSendTo(
        new BitcoinzURITarget(
          Utils.getDonationAddress(info.testnet),
          Utils.getDefaultDonationAmount(info.testnet),
          Utils.getDefaultDonationMemo(info.testnet)
        )
      );

      history.push(routes.SEND);
    });

    // Import a Private Key
    ipcRenderer.on("import", () => {
      // Access props dynamically to get current values, not captured values
      const { info, openErrorModal } = this.props;

      // Check if wallet is loaded and ready
      if (!info || !info.latestBlock) {
        openErrorModal(
          "Wallet Not Ready",
          "Please wait for the wallet to finish loading before importing private keys."
        );
        return;
      }

      this.openImportPrivKeyModal(null);
    });

    // Pay URI
    ipcRenderer.on("payuri", (event: any, uri: string) => {
      this.openURIModal(uri);
    });

    // Export Seed
    ipcRenderer.on("seed", () => {
      openPasswordAndUnlockIfNeeded(() => {
        const seed = RPC.fetchSeed();

        openErrorModal(
          "Wallet Seed",
          <div className={cstyles.verticalflex}>
            <div>
              This is your wallet&rsquo;s seed phrase. It can be used to recover your entire wallet.
              <br />
              PLEASE KEEP IT SAFE!
            </div>
            <hr />
            <div
              style={{
                wordBreak: "break-word",
                fontFamily: "monospace, Roboto",
              }}
            >
              {seed}
            </div>
            <hr />
          </div>
        );
      });
    });

    // Export All Transactions
    ipcRenderer.on("exportalltx", async () => {
      const save = await remote.dialog.showSaveDialog({
        title: "Save Transactions As CSV",
        defaultPath: "bitcoinz_transactions.csv",
        filters: [{ name: "CSV File", extensions: ["csv"] }],
        properties: ["showOverwriteConfirmation"],
      });

      if (save.filePath) {
        // Construct a CSV
        const { transactions } = this.props;
        const rows = transactions.flatMap((t) => {
          if (t.detailedTxns) {
            return t.detailedTxns.map((dt) => {
              const normaldate = dateformat(t.time * 1000, "mmm dd yyyy hh::MM tt");

              // Add a single quote "'" into the memo field to force interpretation as a string, rather than as a
              // formula from a rogue memo
              const escapedMemo = dt.memo ? `'${dt.memo.replace(/"/g, '""')}'` : "";
              const price = t.btczPrice ? t.btczPrice.toFixed(2) : "--";

              return `${t.time},"${normaldate}","${t.txid}","${t.type}",${dt.amount},"${dt.address}","${price}","${escapedMemo}"`;
            });
          } else {
            return [];
          }
        });

        const header = [`UnixTime, Date, Txid, Type, Amount, Address, BTCZPrice, Memo`];

        try {
          await fs.promises.writeFile(save.filePath, header.concat(rows).join("\n"));
        } catch (err) {
          openErrorModal("Error Exporting Transactions", `${err}`);
        }
      }
    });

    // Encrypt wallet
    ipcRenderer.on("encrypt", async () => {
      const { info, lockWallet, encryptWallet, openPassword } = this.props;

      if (info.encrypted && info.locked) {
        openErrorModal("Already Encrypted", "Your wallet is already encrypted and locked.");
      } else if (info.encrypted && !info.locked) {
        await lockWallet();
        openErrorModal("Locked", "Your wallet has been locked. A password will be needed to spend funds.");
      } else {
        // Encrypt the wallet
        openPassword(
          true,
          async (password) => {
            await encryptWallet(password);
            openErrorModal("Encrypted", "Your wallet has been encrypted. The password will be needed to spend funds.");
          },
          () => {
            openErrorModal("Cancelled", "Your wallet was not encrypted.");
          },
          <div>
            Please enter a password to encrypt your wallet. <br />
            WARNING: If you forget this password, the only way to recover your wallet is from the seed phrase.
          </div>
        );
      }
    });

    // Remove wallet encryption
    ipcRenderer.on("decrypt", async () => {
      const { info, decryptWallet, openPassword } = this.props;

      if (!info.encrypted) {
        openErrorModal("Not Encrypted", "Your wallet is not encrypted and ready for spending.");
      } else {
        // Remove the wallet remove the wallet encryption
        openPassword(
          false,
          async (password) => {
            const success = await decryptWallet(password);
            if (success) {
              openErrorModal(
                "Decrypted",
                `Your wallet's encryption has been removed. A password will no longer be needed to spend funds.`
              );
            } else {
              openErrorModal("Decryption Failed", "Wallet decryption failed. Do you have the right password?");
            }
          },
          () => {
            openErrorModal("Cancelled", "Your wallet is still encrypted.");
          },
          ""
        );
      }
    });

    // Unlock wallet
    ipcRenderer.on("unlock", () => {
      const { info } = this.props;
      if (!info.encrypted || !info.locked) {
        openErrorModal("Already Unlocked", "Your wallet is already unlocked for spending");
      } else {
        openPasswordAndUnlockIfNeeded(async () => {
          openErrorModal("Unlocked", "Your wallet is unlocked for spending");
        });
      }
    });

    // Rescan
    ipcRenderer.on("rescan", () => {
      // To rescan, we reset the wallet loading
      // So set info the default, and redirect to the loading screen
      clearTimers();

      // Grab the previous sync ID.
      const prevSyncId = JSON.parse(RPC.doSyncStatus()).sync_id;

      RPC.doRescan();

      // Set the rescanning global state to true
      setRescanning(true, prevSyncId);

      // Reset the info object, it will be refetched
      setInfo(new Info());

      history.push(routes.LOADING);
    });

    // Export all private keys
    ipcRenderer.on("exportall", async () => {
      // Get all the addresses and run export key on each of them.
      // Access props dynamically to get current values, not captured values
      const { addresses, info, openPasswordAndUnlockIfNeeded, openErrorModal } = this.props;

      // Check if wallet is loaded and addresses are available
      if (!info || !info.latestBlock) {
        openErrorModal(
          "Wallet Not Ready",
          "Please wait for the wallet to finish loading before exporting private keys."
        );
        return;
      }

      if (!addresses || addresses.length === 0) {
        openErrorModal(
          "No Addresses Found",
          "No addresses are available to export. Please wait for the wallet to fully sync."
        );
        return;
      }

      openPasswordAndUnlockIfNeeded(async () => {
        // Access current props again inside the callback
        const currentAddresses = this.props.addresses;
        const currentGetPrivKeyAsString = this.props.getPrivKeyAsString;

        const privKeysPromise = currentAddresses.map(async (a) => {
          const privKey = currentGetPrivKeyAsString(a.address);
          return `${privKey} #${a}`;
        });
        const exportedPrivKeys = await Promise.all(privKeysPromise);

        this.setState({ exportPrivKeysModalIsOpen: true, exportedPrivKeys });
      });
    });

    // View zcashd
    ipcRenderer.on("zcashd", () => {
      history.push(routes.ZCASHD);
    });

    // Wallet Settings
    ipcRenderer.on("walletSettings", () => {
      this.setState({ walletSettingsModalIsOpen: true });
    });

    // Connect mobile app
    ipcRenderer.on("connectmobile", () => {
      history.push(routes.CONNECTMOBILE);
    });
  };

  closeExportPrivKeysModal = () => {
    this.setState({ exportPrivKeysModalIsOpen: false, exportedPrivKeys: [] });
  };

  openImportPrivKeyModal = (defaultValue: string | null) => {
    const privKeyInputValue = defaultValue || "";
    this.setState({ privKeyModalIsOpen: true, privKeyInputValue });
  };

  setImprovPrivKeyInputValue = (privKeyInputValue: string) => {
    this.setState({ privKeyInputValue });
  };

  closeImportPrivKeyModal = () => {
    this.setState({ privKeyModalIsOpen: false });
  };

  openURIModal = (defaultValue: string | null) => {
    const uriModalInputValue = defaultValue || "";
    this.setState({ uriModalIsOpen: true, uriModalInputValue });
  };

  doImportPrivKeys = async (key: string, birthday: string) => {
    const { importPrivKeys, openErrorModal, setInfo, clearTimers, setRescanning, history, info } = this.props;

    // eslint-disable-next-line no-control-regex
    if (key) {
      // eslint-disable-next-line no-control-regex
      let keys = key.split(new RegExp("[\n\r]+"));
      if (!keys || keys.length === 0) {
        openErrorModal("No Keys Imported", "No keys were specified, so none were imported");
        return;
      }

      // Filter out empty lines and clean up the private keys
      keys = keys.filter((k) => !(k.trim().startsWith("#") || k.trim().length === 0));

      // Special case.
      // Sometimes, when importing from a paperwallet or such, the key is split by newlines, and might have
      // been pasted like that. So check to see if the whole thing is one big private key
      if (Utils.isValidSaplingPrivateKey(keys.join("")) || Utils.isValidSaplingViewingKey(keys.join(""))) {
        keys = [keys.join("")];
      }

      if (keys.length > 1) {
        openErrorModal("Multiple Keys Not Supported", "Please import one key at a time");
        return;
      }

      if (!Utils.isValidSaplingPrivateKey(keys[0]) && !Utils.isValidSaplingViewingKey(keys[0])) {
        openErrorModal(
          "Bad Key",
          "The input key was not recognized as either a sapling spending key or a sapling viewing key"
        );
        return;
      }

      // in order to import a viewing key, the wallet can be encrypted,
      // but it must be unlocked
      if (Utils.isValidSaplingViewingKey(keys[0]) && info.locked) {
        openErrorModal(
          "Wallet Is Locked",
          "In order to import a Sapling viewing key, your wallet must be unlocked. If you wish to continue, unlock your wallet and try again."
        );
        return;
      }

      // in order to import a private key, the wallet must be unencrypted
      if (Utils.isValidSaplingPrivateKey(keys[0]) && info.encrypted) {
        openErrorModal(
          "Wallet Is Encrypted",
          "In order to import a Sapling private key, your wallet cannot be encrypted. If you wish to continue, remove the encryption from your wallet and try again."
        );
        return;
      }

      // To rescan, we reset the wallet loading
      // So set info the default, and redirect to the loading screen
      clearTimers();

      // Grab the previous sync ID.
      const prevSyncId = JSON.parse(RPC.doSyncStatus()).sync_id;
      const success = await importPrivKeys(keys, birthday);

      if (success) {
        // Set the rescanning global state to true
        setRescanning(true, prevSyncId);

        // Reset the info object, it will be refetched
        setInfo(new Info());

        history.push(routes.LOADING);
      }
    }
  };

  setURIInputValue = (uriModalInputValue: string) => {
    this.setState({ uriModalInputValue });
  };

  closeURIModal = () => {
    this.setState({ uriModalIsOpen: false });
  };

  closeWalletSettingsModal = () => {
    this.setState({ walletSettingsModalIsOpen: false });
  };

  setWalletSpamFilterThreshold = async (threshold: number) => {
    // Call the RPC to set the threshold as an option
    await RPC.setWalletSettingOption("spam_filter_threshold", threshold.toString());

    // Refresh the wallet settings
    await this.props.updateWalletSettings();
  };

  payURI = (uri: string) => {
    console.log(`Paying ${uri}`);
    const { openErrorModal, setSendTo, history } = this.props;

    const errTitle = "URI Error";
    const getErrorBody = (explain: string): ReactElement => {
      return (
        <div>
          <span>{explain}</span>
          <br />
        </div>
      );
    };

    if (!uri || uri === "") {
      openErrorModal(errTitle, getErrorBody("URI was not found or invalid"));
      return;
    }

    const parsedUri = parseBitcoinzURI(uri);
    if (typeof parsedUri === "string") {
      openErrorModal(errTitle, getErrorBody(parsedUri));
      return;
    }

    setSendTo(parsedUri);
    history.push(routes.SEND);
  };

  render() {
    const { location, info, walletSettings } = this.props;
    const {
      uriModalIsOpen,
      uriModalInputValue,
      privKeyModalIsOpen,
      //privKeyInputValue,
      exportPrivKeysModalIsOpen,
      exportedPrivKeys,
      walletSettingsModalIsOpen,
    } = this.state;

    let state = "DISCONNECTED";
    let progress = "100";
    if (info && info.latestBlock) {
      if (info.verificationProgress < 0.9999) {
        state = "SYNCING";
        progress = (info.verificationProgress * 100).toFixed(1);
      } else {
        state = "CONNECTED";
      }
    }

    return (
      <div>
        {/* Payment URI Modal */}
        <PayURIModal
          modalInput={uriModalInputValue}
          setModalInput={this.setURIInputValue}
          modalIsOpen={uriModalIsOpen}
          closeModal={this.closeURIModal}
          modalTitle="Pay URI"
          actionButtonName="Pay URI"
          actionCallback={this.payURI}
        />

        {/* Import Private Key Modal */}
        <ImportPrivKeyModal
          modalIsOpen={privKeyModalIsOpen}
          // setModalInput={this.setImprovPrivKeyInputValue}
          // modalInput={privKeyInputValue}
          closeModal={this.closeImportPrivKeyModal}
          doImportPrivKeys={this.doImportPrivKeys}
        />

        {/* Exported (all) Private Keys */}
        <ExportPrivKeyModal
          modalIsOpen={exportPrivKeysModalIsOpen}
          exportedPrivKeys={exportedPrivKeys}
          closeModal={this.closeExportPrivKeysModal}
        />

        <WalletSettingsModal
          modalIsOpen={walletSettingsModalIsOpen}
          closeModal={this.closeWalletSettingsModal}
          walletSettings={walletSettings}
          setWalletSpamFilterThreshold={this.setWalletSpamFilterThreshold}
        />

        {/* Hide the logo section and sidebar menu since we use top menu bar and bottom navigation now */}
        <div style={{ display: "none" }}>
          <div className={[cstyles.center, styles.sidebarlogobg].join(" ")}>
            <img src={Logo} width="70" alt="logo" />
          </div>

          <div className={styles.sidebar}>
            <SidebarMenuItem
              name="Dashboard"
              routeName={routes.DASHBOARD}
              currentRoute={location.pathname}
              iconname="fa-home"
            />
            <SidebarMenuItem
              name="Send"
              routeName={routes.SEND}
              currentRoute={location.pathname}
              iconname="fa-paper-plane"
            />
            <SidebarMenuItem
              name="Receive"
              routeName={routes.RECEIVE}
              currentRoute={location.pathname}
              iconname="fa-download"
            />
            <SidebarMenuItem
              name="Transactions"
              routeName={routes.TRANSACTIONS}
              currentRoute={location.pathname}
              iconname="fa-list"
            />
            <SidebarMenuItem
              name="Address Book"
              routeName={routes.ADDRESSBOOK}
              currentRoute={location.pathname}
              iconname="fa-address-book"
            />
          </div>

          <div className={cstyles.center}>
            {state === "CONNECTED" && (
              <div className={[cstyles.padsmallall, cstyles.margintopsmall, cstyles.blackbg].join(" ")}>
                <i className={[cstyles.green, "fas", "fa-check"].join(" ")} />
                &nbsp; {info.walletHeight}
              </div>
            )}
            {state === "SYNCING" && (
              <div className={[cstyles.padsmallall, cstyles.margintopsmall, cstyles.blackbg].join(" ")}>
                <div>
                  <i className={[cstyles.yellow, "fas", "fa-sync"].join(" ")} />
                  &nbsp; Syncing
                </div>
                <div>{`${progress}%`}</div>
              </div>
            )}
            {state === "DISCONNECTED" && (
              <div className={[cstyles.padsmallall, cstyles.margintopsmall, cstyles.blackbg].join(" ")}>
                <i className={[cstyles.yellow, "fas", "fa-times-circle"].join(" ")} />
                &nbsp; Connected
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// @ts-ignore
export default withRouter(Sidebar);
