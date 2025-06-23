/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-else-return */
/* eslint-disable radix */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/prop-types */
/* eslint-disable max-classes-per-file */

import React, { PureComponent } from "react";
import Modal from "react-modal";
import TextareaAutosize from "react-textarea-autosize";
import { RouteComponentProps, withRouter } from "react-router-dom";
import styles from "./Send.module.css";
import cstyles from "./Common.module.css";
import {
  ToAddr,
  AddressBalance,
  SendPageState,
  Info,
  AddressBookEntry,
  TotalBalance,
  SendProgress,
  AddressDetail,
} from "./AppState";
import Utils from "../utils/utils";
import ScrollPane from "./ScrollPane";
import ArrowUpLight from "../assets/img/arrow_up_dark.png";
import { BalanceBlockHighlight } from "./BalanceBlocks";
import RPC from "../rpc";
import routes from "../constants/routes.json";
import { parseBitcoinzURI, BitcoinzURITarget } from "../utils/uris";
import { TransactionSuccessModal, TransactionSuccessModalData } from "./TransactionSuccessModal";

type OptionType = {
  value: string;
  label: string;
};



type ToAddrBoxProps = {
  toaddr: ToAddr;
  btczPrice: number;
  updateToField: (
    id: number,
    address: React.ChangeEvent<HTMLInputElement> | null,
    amount: React.ChangeEvent<HTMLInputElement> | null,
    memo: React.ChangeEvent<HTMLTextAreaElement> | string | null
  ) => void;
  fromAddress: string;
  fromAmount: number;
  setSendButtonEnable: (sendButtonEnabled: boolean) => void;
  setMaxAmount: (id: number, total: number) => void;
  totalAmountAvailable: number;
  addressBook: AddressBookEntry[];
  openErrorModal: (title: string, body: string) => void;
};
const ToAddrBox = ({
  toaddr,
  btczPrice,
  updateToField,
  fromAddress,
  fromAmount,
  setMaxAmount,
  setSendButtonEnable,
  totalAmountAvailable,
  addressBook,
  openErrorModal,
}: ToAddrBoxProps) => {
  const isMemoDisabled = !Utils.isZaddr(toaddr.to);

  const addressIsValid =
    toaddr.to === "" || Utils.isZaddr(toaddr.to) || Utils.isTransparent(toaddr.to);

  let amountError = null;
  if (toaddr.amount) {
    if (toaddr.amount < 0) {
      amountError = "Amount cannot be negative";
    }
    if (toaddr.amount > fromAmount) {
      amountError = "Amount Exceeds Balance";
    }
    if (toaddr.amount < 10 ** -8) {
      amountError = "Amount is too small";
    }
    const s = toaddr.amount.toString().split(".");
    if (s && s.length > 1 && s[1].length > 8) {
      amountError = "Too Many Decimals";
    }
  }

  if (isNaN(toaddr.amount)) {
    // Amount is empty
    amountError = "Amount cannot be empty";
  }

  let buttonstate = true;
  if (!addressIsValid || amountError || toaddr.to === "" || toaddr.amount === 0 || fromAmount === 0) {
    buttonstate = false;
  }

  // Use useEffect or immediate call instead of setTimeout to avoid memory leaks
  React.useEffect(() => {
    setSendButtonEnable(buttonstate);
  }, [buttonstate, setSendButtonEnable]);

  const usdValue = Utils.getBtczToUsdStringBtcz(btczPrice, toaddr.amount);

  const addReplyTo = () => {
    if (toaddr.memo.endsWith(fromAddress)) {
      return;
    }

    if (fromAddress && toaddr.id) {
      updateToField(toaddr.id, null, null, `${toaddr.memo}\nReply-To:\n${fromAddress}`);
    }
  };

  // Contact selection functionality
  const selectContact = (contact: AddressBookEntry) => {
    // Create a synthetic event to update the address field
    const syntheticEvent = {
      target: { value: contact.address }
    } as React.ChangeEvent<HTMLInputElement>;
    updateToField(toaddr.id as number, syntheticEvent, null, null);
  };

  // Paste address functionality
  const pasteAddress = async () => {
    try {
      const { clipboard } = window.require('electron');
      const clipboardText = clipboard.readText().trim();

      // Validate the clipboard content
      if (!clipboardText) {
        openErrorModal("Paste Error", "Clipboard is empty");
        return;
      }

      // Check if it's a valid BitcoinZ address
      const isValid = Utils.isZaddr(clipboardText) || Utils.isTransparent(clipboardText);
      if (!isValid) {
        openErrorModal("Invalid Address", "Clipboard does not contain a valid BitcoinZ address");
        return;
      }

      // Create a synthetic event to update the address field
      const syntheticEvent = {
        target: { value: clipboardText }
      } as React.ChangeEvent<HTMLInputElement>;
      updateToField(toaddr.id as number, syntheticEvent, null, null);

      openErrorModal("Address Pasted", "Address successfully pasted from clipboard");
    } catch (error) {
      openErrorModal("Paste Error", "Failed to read from clipboard");
    }
  };

  return (
    <div>
      <div className={[cstyles.well, cstyles.verticalflex, styles.toAddressSection].join(" ")}>
        <div className={[cstyles.flexspacebetween].join(" ")} style={{ marginBottom: "4px" }}>
          <div className={cstyles.sublight} style={{ fontSize: "12px" }}>To</div>
          <div className={cstyles.validationerror} style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "8px" }}>
            {toaddr.to && (
              <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "10px" }}>
                {toaddr.to.length} chars
              </span>
            )}
            {addressIsValid ? (
              <i className={[cstyles.green, "fas", "fa-check"].join(" ")} />
            ) : (
              toaddr.to && <span className={cstyles.red}>Invalid Address</span>
            )}
          </div>
        </div>

        {/* Full-width address input */}
        <div style={{ marginBottom: "8px" }}>
          <input
            type="text"
            placeholder="Enter BitcoinZ address (Z | T)"
            className={styles.fullWidthAddressInput}
            value={toaddr.to}
            onChange={(e) => updateToField(toaddr.id as number, e, null, null)}
            spellCheck={false}
            autoComplete="off"
          />
          {/* Address type indicator */}
          {toaddr.to && (
            <div style={{
              fontSize: "10px",
              color: "rgba(255, 255, 255, 0.7)",
              marginTop: "2px"
            }}>
              {Utils.isZaddr(toaddr.to) ? "🔒 Private Address (Z)" :
               Utils.isTransparent(toaddr.to) ? "👁️ Transparent Address (T)" :
               "❓ Invalid Address"}
            </div>
          )}
        </div>

        {/* Contact selection and paste buttons row */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
          {/* Contact selection dropdown */}
          {addressBook && addressBook.length > 0 && (
            <select
              className={styles.compactButton}
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const contact = addressBook.find(c => c.address === e.target.value);
                  if (contact) selectContact(contact);
                  e.target.value = ""; // Reset dropdown
                }
              }}
            >
              <option value="">👤 Contacts</option>
              {addressBook.map((contact) => (
                <option key={contact.address} value={contact.address}>
                  {contact.label}
                </option>
              ))}
            </select>
          )}

          {/* Paste button */}
          <button
            type="button"
            className={styles.compactButton}
            onClick={pasteAddress}
            title="Paste address from clipboard"
          >
            <i className="fas fa-paste" />
            Paste
          </button>
        </div>
        <div style={{ marginTop: "8px" }}>
          <div className={[cstyles.flexspacebetween].join(" ")} style={{ marginBottom: "2px" }}>
            <div className={cstyles.sublight} style={{ fontSize: "12px" }}>Amount</div>
            <div className={cstyles.validationerror} style={{ fontSize: "11px" }}>
              {amountError ? <span className={cstyles.red}>{amountError}</span> : <span>{usdValue}</span>}
            </div>
          </div>
          <div className={[cstyles.flexspacebetween].join(" ")}>
            <input
              type="number"
              step="any"
              className={[cstyles.inputbox, styles.compactAmountInput].join(" ")}
              value={isNaN(toaddr.amount) ? "" : toaddr.amount}
              onChange={(e) => updateToField(toaddr.id as number, null, e, null)}
              placeholder="0"
              style={{ flex: 1, marginRight: "8px" }}
            />
            <img
              className={styles.toaddrbutton}
              src={ArrowUpLight}
              alt="Max"
              onClick={() => setMaxAmount(toaddr.id as number, totalAmountAvailable)}
              style={{ height: "20px", marginTop: "4px" }}
            />
          </div>
        </div>

        {isMemoDisabled && (
          <div className={cstyles.sublight} style={{ fontSize: "11px", marginTop: "8px", opacity: 0.7 }}>
            Memos only for private (Z) addresses
          </div>
        )}

        {!isMemoDisabled && (
          <div style={{ marginTop: "8px" }}>
            <div className={[cstyles.flexspacebetween].join(" ")} style={{ marginBottom: "2px" }}>
              <div className={cstyles.sublight} style={{ fontSize: "12px" }}>Memo</div>
              <div className={cstyles.validationerror} style={{ fontSize: "11px" }}>{toaddr.memo.length}</div>
            </div>
            <TextareaAutosize
              className={cstyles.inputbox}
              value={toaddr.memo}
              disabled={isMemoDisabled}
              onChange={(e) => updateToField(toaddr.id as number, null, null, e)}
              minRows={1}
              maxRows={2}
              placeholder="Optional memo (encrypted)"
              style={{ resize: "none" }}
            />
            <div style={{ marginTop: "4px", fontSize: "10px" }}>
              <input type="checkbox" onChange={(e) => e.target.checked && addReplyTo()} style={{ marginRight: "4px" }} />
              Include Reply-To address
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export type SendManyJson = {
  address: string;
  amount: number;
  memo?: string;
};

function getSendManyJSON(sendPageState: SendPageState): SendManyJson[] {
  const json = sendPageState.toaddrs.flatMap((to) => {
    const memo = to.memo || "";
    const amount = parseInt((to.amount * 10 ** 8).toFixed(0));

    if (memo === "") {
      return { address: to.to, amount, memo: undefined };
    } else if (memo.length <= 512) {
      return { address: to.to, amount, memo };
    } else {
      // If the memo is more than 512 bytes, then we split it into multiple transactions.
      // Each memo will be `(xx/yy)memo_part`. The prefix "(xx/yy)" is 7 bytes long, so
      // we'll split the memo into 512-7 = 505 bytes length
      const splits = Utils.utf16Split(memo, 505);
      const tos = [];

      // The first one contains all the tx value
      tos.push({ address: to.to, amount, memo: `(1/${splits.length})${splits[0]}` });

      for (let i = 1; i < splits.length; i++) {
        tos.push({ address: to.to, amount: 0, memo: `(${i + 1}/${splits.length})${splits[i]}` });
      }

      return tos;
    }
  });

  console.log("Sending:");
  console.log(json);

  return json;
}

type ConfirmModalToAddrProps = {
  toaddr: ToAddr;
  info: Info;
};
const ConfirmModalToAddr = ({ toaddr, info }: ConfirmModalToAddrProps) => {
  const { bigPart, smallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(toaddr.amount);

  const memo: string = toaddr.memo ? toaddr.memo : "";

  return (
    <div className={toaddr.to === "Fee" ? `${styles.confirmModalSection} ${styles.networkFeeSection}` : styles.confirmModalSection}>
      <div className={styles.confirmModalLabel}>
        {toaddr.to === "Fee" ? "Network Fee" : "Recipient"}
      </div>
      <div className={[cstyles.flexspacebetween].join(" ")}>
        <div className={[styles.confirmModalAddress].join(" ")}>
          {toaddr.to === "Fee" ? "Network Transaction Fee" : Utils.splitStringIntoChunks(toaddr.to, 6).join(" ")}
        </div>
        <div className={[cstyles.verticalflex, cstyles.right].join(" ")}>
          <div className={styles.confirmModalAmount}>
            <span>
              {info.currencyName} {bigPart}
            </span>
            <span className={[cstyles.small, styles.btczsmallpart].join(" ")}>{smallPart}</span>
          </div>
          {toaddr.to !== "Fee" && (
            <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
              {Utils.getBtczToUsdStringBtcz(info.btczPrice, toaddr.amount)}
            </div>
          )}
        </div>
      </div>
      {memo && (
        <div style={{
          marginTop: "8px",
          padding: "8px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "6px",
          fontSize: "12px",
          color: "rgba(255, 255, 255, 0.8)"
        }}>
          <div className={styles.confirmModalLabel}>Memo</div>
          {memo}
        </div>
      )}
    </div>
  );
};

// Internal because we're using withRouter just below
type ConfirmModalProps = {
  sendPageState: SendPageState;
  totalBalance: TotalBalance;
  info: Info;
  sendTransaction: (sendJson: SendManyJson[], setSendProgress: (p?: SendProgress) => void) => Promise<string>;
  clearToAddrs: () => void;
  closeModal: () => void;
  modalIsOpen: boolean;
  openErrorModal: (title: string, body: string) => void;
  openPasswordAndUnlockIfNeeded: (successCallback: () => void | Promise<void>) => void;
  openTransactionSuccessModal: (txid: string) => void;
};

const ConfirmModalInternal: React.FC<RouteComponentProps & ConfirmModalProps> = ({
  sendPageState,
  totalBalance,
  info,
  sendTransaction,
  clearToAddrs,
  closeModal,
  modalIsOpen,
  openErrorModal,
  openPasswordAndUnlockIfNeeded,
  openTransactionSuccessModal,
  history,
}) => {
  const defaultFee = RPC.getDefaultFee();
  const sendingTotal = sendPageState.toaddrs.reduce((s, t) => s + t.amount, 0.0) + defaultFee;
  const { bigPart, smallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(sendingTotal);

  // Determine the tx privacy level
  let privacyLevel = "";
  // 1. If we're sending to a t-address, it is "transparent"
  const isToTransparent = sendPageState.toaddrs.map((to) => Utils.isTransparent(to.to)).reduce((p, c) => p || c, false);
  if (isToTransparent) {
    privacyLevel = "Transparent";
  } else {
    // 2. If we're sending to sapling or orchard, and don't have enough funds in the pool, it is "AmountsRevealed"
    const toSapling = sendPageState.toaddrs
      .map((to) => (Utils.isSapling(to.to) ? to.amount : 0))
      .reduce((s, c) => s + c, 0);
    const toOrchard = sendPageState.toaddrs
      .map((to) => (Utils.isUnified(to.to) ? to.amount : 0))
      .reduce((s, c) => s + c, 0);
    if (toSapling > totalBalance.spendableZ || toOrchard > totalBalance.uabalance) {
      privacyLevel = "AmountsRevealed";
    } else {
      // Else, it is a shielded transaction
      privacyLevel = "Shielded";
    }
  }

  const sendButton = () => {
    // First, close the confirm modal.
    closeModal();

    // This will be replaced by either a success TXID or error message that the user
    // has to close manually.
    openErrorModal("Computing Transaction", "Please wait...This could take a while");
    const setSendProgress = (progress?: SendProgress) => {
      if (progress && progress.sendInProgress) {
        openErrorModal(
          `Computing Transaction`,
          `Step ${progress.progress} of ${progress.total}. ETA ${progress.etaSeconds}s`
        );
      }
    };

    // Now, send the Tx in a timeout, so that the error modal above has a chance to display
    setTimeout(() => {
      openPasswordAndUnlockIfNeeded(() => {
        // Then send the Tx async
        (async () => {
          const sendJson = getSendManyJSON(sendPageState);
          let txid = "";

          try {
            txid = await sendTransaction(sendJson, setSendProgress);
            console.log(txid);

            openTransactionSuccessModal(txid);

            clearToAddrs();

            // Don't redirect automatically - let user interact with success modal
          } catch (err) {
            // If there was an error, show the error modal
            openErrorModal("Error Sending Transaction", `${err}`);
          }
        })();
      });
    }, 10);
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      className={styles.confirmModal}
      overlayClassName={styles.confirmOverlay}
    >
      <div className={[cstyles.verticalflex].join(" ")}>
        <div className={styles.confirmModalTitle}>Confirm Transaction</div>

        {/* Total Amount Section */}
        <div className={styles.confirmModalSection}>
          <div className={styles.confirmModalLabel}>Total Amount</div>
          <div className={[cstyles.flexspacebetween].join(" ")}>
            <div className={styles.confirmModalAmount}>
              <span>
                {info.currencyName} {bigPart}
              </span>
              <span className={[cstyles.small, styles.btczsmallpart].join(" ")}>{smallPart}</span>
            </div>
            <div className={[cstyles.normal, { color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }].join(" ")}>
              {Utils.getBtczToUsdStringBtcz(info.btczPrice, sendingTotal)}
            </div>
          </div>
        </div>

        <div className={styles.confirmModalScrollArea}>
          <div className={[cstyles.verticalflex].join(" ")}>
            {sendPageState.toaddrs.map((t) => (
              <ConfirmModalToAddr key={t.to} toaddr={t} info={info} />
            ))}
          </div>
          <ConfirmModalToAddr toaddr={{ to: "Fee", amount: defaultFee, memo: "" }} info={info} />

          <div className={styles.confirmModalSection}>
            <div className={styles.confirmModalLabel}>Privacy Level</div>
            <div className={[cstyles.flexspacebetween].join(" ")}>
              <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "14px" }}>
                Transaction Privacy Status
              </div>
              <div className={styles.confirmModalAmount}>
                <span>{privacyLevel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.confirmModalButtons}>
          <button
            type="button"
            className={`${styles.confirmModalButton} ${styles.primary}`}
            onClick={() => sendButton()}
          >
            <i className="fas fa-paper-plane" />
            Confirm Send
          </button>
          <button
            type="button"
            className={`${styles.confirmModalButton} ${styles.secondary}`}
            onClick={closeModal}
          >
            <i className="fas fa-times" />
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ConfirmModal = withRouter(ConfirmModalInternal);

type Props = {
  addresses: AddressDetail[];
  totalBalance: TotalBalance;
  addressBook: AddressBookEntry[];
  sendPageState: SendPageState;
  setSendTo: (targets: BitcoinzURITarget[] | BitcoinzURITarget) => void;
  sendTransaction: (sendJson: SendManyJson[], setSendProgress: (p?: SendProgress) => void) => Promise<string>;
  setSendPageState: (sendPageState: SendPageState) => void;
  openErrorModal: (title: string, body: string) => void;
  closeErrorModal: () => void;
  info: Info;
  openPasswordAndUnlockIfNeeded: (successCallback: () => void) => void;
  history?: any; // Add history as optional prop
};

class SendState {
  modalIsOpen: boolean;

  sendButtonEnabled: boolean;

  transactionSuccessModalData: TransactionSuccessModalData;

  constructor() {
    this.modalIsOpen = false;
    this.sendButtonEnabled = false;
    this.transactionSuccessModalData = new TransactionSuccessModalData();
  }
}

export default class Send extends PureComponent<Props, SendState> {
  constructor(props: Props) {
    super(props);

    this.state = new SendState();
  }

  addToAddr = () => {
    const { sendPageState, setSendPageState } = this.props;
    const newToAddrs = sendPageState.toaddrs.concat(new ToAddr(Utils.getNextToAddrID()));

    // Create the new state object
    const newState = new SendPageState();
    newState.fromaddr = sendPageState.fromaddr;
    newState.toaddrs = newToAddrs;

    setSendPageState(newState);
  };

  clearToAddrs = () => {
    const { sendPageState, setSendPageState } = this.props;
    const newToAddrs = [new ToAddr(Utils.getNextToAddrID())];

    // Create the new state object
    const newState = new SendPageState();
    newState.fromaddr = sendPageState.fromaddr;
    newState.toaddrs = newToAddrs;

    setSendPageState(newState);
  };

  changeFrom = (selectedOption: OptionType) => {
    const { sendPageState, setSendPageState } = this.props;

    // Create the new state object
    const newState = new SendPageState();
    newState.fromaddr = selectedOption.value;
    newState.toaddrs = sendPageState.toaddrs;

    setSendPageState(newState);
  };

  updateToField = (
    id: number,
    address: React.ChangeEvent<HTMLInputElement> | null,
    amount: React.ChangeEvent<HTMLInputElement> | null,
    memo: React.ChangeEvent<HTMLTextAreaElement> | string | null
  ) => {
    const { sendPageState, setSendPageState, setSendTo } = this.props;

    const newToAddrs = sendPageState.toaddrs.slice(0);
    // Find the correct toAddr
    const toAddr = newToAddrs.find((a) => a.id === id) as ToAddr;
    if (address) {
      // First, check if this is a URI
      // $FlowFixMe
      const parsedUri = parseBitcoinzURI(address.target.value);
      if (Array.isArray(parsedUri)) {
        setSendTo(parsedUri);
        return;
      }

      toAddr.to = address.target.value.replace(/ /g, ""); // Remove spaces
    }

    if (amount) {
      // Check to see the new amount if valid
      // $FlowFixMe
      const newAmount = parseFloat(amount.target.value);
      if (newAmount < 0 || newAmount > 21 * 10 ** 6) {
        return;
      }
      // $FlowFixMe
      toAddr.amount = newAmount;
    }

    if (memo) {
      if (typeof memo === "string") {
        toAddr.memo = memo;
      } else {
        // $FlowFixMe
        toAddr.memo = memo.target.value;
      }
    }

    // Create the new state object
    const newState = new SendPageState();
    newState.fromaddr = sendPageState.fromaddr;
    newState.toaddrs = newToAddrs;

    setSendPageState(newState);
  };

  setMaxAmount = (id: number, total: number) => {
    const { sendPageState, setSendPageState } = this.props;

    const newToAddrs = sendPageState.toaddrs.slice(0);

    let totalOtherAmount: number = newToAddrs.filter((a) => a.id !== id).reduce((s, a) => s + a.amount, 0);

    // Add Fee
    totalOtherAmount += RPC.getDefaultFee();

    // Find the correct toAddr
    const toAddr = newToAddrs.find((a) => a.id === id) as ToAddr;
    toAddr.amount = total - totalOtherAmount;
    if (toAddr.amount < 0) toAddr.amount = 0;
    //toAddr.amount = Utils.maxPrecisionTrimmed(toAddr.amount);

    // Create the new state object
    const newState = new SendPageState();
    newState.fromaddr = sendPageState.fromaddr;
    newState.toaddrs = newToAddrs;

    setSendPageState(newState);
  };

  setSendButtonEnable = (sendButtonEnabled: boolean) => {
    this.setState({ sendButtonEnabled });
  };

  openModal = () => {
    this.setState({ modalIsOpen: true });
  };

  closeModal = () => {
    this.setState({ modalIsOpen: false });
  };

  openTransactionSuccessModal = (txid: string) => {
    // First close the error modal (Computing Transaction modal)
    const { closeErrorModal } = this.props;
    closeErrorModal();

    const transactionSuccessModalData = new TransactionSuccessModalData();
    transactionSuccessModalData.modalIsOpen = true;
    transactionSuccessModalData.title = "Successfully Broadcast Transaction";
    transactionSuccessModalData.txid = txid;
    transactionSuccessModalData.closeModal = this.closeTransactionSuccessModal;
    transactionSuccessModalData.redirectToDashboard = this.redirectToDashboard;

    this.setState({ transactionSuccessModalData });
  };

  redirectToDashboard = () => {
    // Use history from props to navigate to dashboard
    const { history } = this.props;
    if (history && history.push) {
      history.push(routes.DASHBOARD);
    } else {
      // Fallback: reload the page to go to dashboard
      window.location.reload();
    }
  };

  closeTransactionSuccessModal = () => {
    const transactionSuccessModalData = new TransactionSuccessModalData();
    transactionSuccessModalData.modalIsOpen = false;

    this.setState({ transactionSuccessModalData });
  };

  getBalanceForAddress = (addr: string, addressesWithBalance: AddressBalance[]): number => {
    // Find the addr in addressesWithBalance
    const addressBalance = addressesWithBalance.find((ab) => ab.address === addr) as AddressBalance;

    if (!addressBalance) {
      return 0;
    }

    return addressBalance.balance;
  };

  getLabelForFromAddress = (addr: string, addressesWithBalance: AddressBalance[], currencyName: string) => {
    // Find the addr in addressesWithBalance
    const { addressBook } = this.props;
    const label = addressBook.find((ab) => ab.address === addr);
    const labelStr = label ? ` [ ${label.label} ]` : "";

    const balance = this.getBalanceForAddress(addr, addressesWithBalance);

    return `[ ${currencyName} ${balance.toString()} ]${labelStr} ${addr}`;
  };

  render() {
    const { modalIsOpen, sendButtonEnabled } = this.state;
    const {
      addresses,
      sendTransaction,
      sendPageState,
      info,
      totalBalance,
      openErrorModal,
      openPasswordAndUnlockIfNeeded,
      addressBook,
    } = this.props;

    const totalAmountAvailable = totalBalance.transparent + totalBalance.spendableZ + totalBalance.uabalance;
    const fromaddr = addresses.find((a) => Utils.isSapling(a.address))?.address || "";

    // If there are unverified funds, then show a tooltip
    let tooltip: string = "";
    if (totalBalance.unverifiedZ) {
      tooltip = `Waiting for confirmation of ${totalBalance.unverifiedZ} BTCZ with 1 block (approx 1-2 minutes)`;
    }
    if (totalBalance.totalPending > 0) {
      tooltip += (tooltip ? " | " : "") + `${totalBalance.totalPending} BTCZ pending confirmation`;
    }

    return (
      <div className={styles.sendPageContainer}>
        {/* Scrollable Content Area - No separate header */}
        <div className={styles.sendPageContent}>
          <div className={[cstyles.well, cstyles.balancebox, styles.compactBalanceBox].join(" ")}>
            <BalanceBlockHighlight
              topLabel="Spendable Funds"
              zecValue={totalAmountAvailable}
              usdValue={Utils.getBtczToUsdStringBtcz(info.btczPrice, totalAmountAvailable)}
              currencyName={info.currencyName}
              tooltip={tooltip}
            />
            <BalanceBlockHighlight
              topLabel="Total Balance"
              zecValue={totalBalance.total}
              usdValue={Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.total)}
              currencyName={info.currencyName}
            />
            {totalBalance.totalPending > 0 && (
              <BalanceBlockHighlight
                topLabel="Pending"
                zecValue={totalBalance.totalPending}
                usdValue={Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.totalPending)}
                currencyName={info.currencyName}
              />
            )}
          </div>

          <ScrollPane className={cstyles.containermargin} offsetHeight={320}>
            {sendPageState.toaddrs.map((toaddr) => {
              return (
                <ToAddrBox
                  key={toaddr.id}
                  toaddr={toaddr}
                  btczPrice={info.btczPrice}
                  updateToField={this.updateToField}
                  fromAddress={fromaddr}
                  fromAmount={totalAmountAvailable}
                  setMaxAmount={this.setMaxAmount}
                  setSendButtonEnable={this.setSendButtonEnable}
                  totalAmountAvailable={totalAmountAvailable}
                  addressBook={addressBook}
                  openErrorModal={openErrorModal}
                />
              );
            })}
            <div style={{ textAlign: "right" }}>
              <button type="button" onClick={this.addToAddr}>
                <i className={["fas", "fa-plus"].join(" ")} />
              </button>
            </div>
          </ScrollPane>

          <div className={cstyles.center}>
            <button
              type="button"
              disabled={!sendButtonEnabled}
              className={styles.modernButton}
              onClick={this.openModal}
            >
              <i className="fas fa-paper-plane" />
              Send
            </button>
            <button type="button" className={styles.modernButton} onClick={this.clearToAddrs}>
              <i className="fas fa-times" />
              Cancel
            </button>
          </div>

          <ConfirmModal
            sendPageState={sendPageState}
            totalBalance={totalBalance}
            info={info}
            sendTransaction={sendTransaction}
            openErrorModal={openErrorModal}
            closeModal={this.closeModal}
            modalIsOpen={modalIsOpen}
            clearToAddrs={this.clearToAddrs}
            openPasswordAndUnlockIfNeeded={openPasswordAndUnlockIfNeeded}
            openTransactionSuccessModal={this.openTransactionSuccessModal}
          />

          <TransactionSuccessModal
            title={this.state.transactionSuccessModalData.title}
            txid={this.state.transactionSuccessModalData.txid}
            modalIsOpen={this.state.transactionSuccessModalData.modalIsOpen}
            closeModal={this.closeTransactionSuccessModal}
            redirectToDashboard={this.redirectToDashboard}
          />
        </div>
      </div>
    );
  }
}


