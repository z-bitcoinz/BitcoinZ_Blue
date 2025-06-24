/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { Component } from "react";
import Modal from "react-modal";
import dateformat from "dateformat";
import { RouteComponentProps, withRouter } from "react-router";
import styles from "./Transactions.module.css";
import { Transaction, Info, AddressBookEntry, TxDetail } from "./AppState";
// import ScrollPane from "./ScrollPane"; // Not needed for modern layout
import Utils from "../utils/utils";
import { BitcoinzURITarget } from "../utils/uris";
import routes from "../constants/routes.json";
import RPC from "../rpc";

const { shell } = window.require("electron");

type TxModalInternalProps = {
  modalIsOpen: boolean;
  closeModal: () => void;
  tx?: Transaction;
  currencyName: string;
  setSendTo: (targets: BitcoinzURITarget | BitcoinzURITarget[]) => void;
};

const TxModalInternal: React.FC<RouteComponentProps & TxModalInternalProps> = ({
  modalIsOpen,
  tx,
  closeModal,
  currencyName,
  setSendTo,
  history,
}) => {
  let txid = "";
  let type = "";
  let typeIcon = "";
  let typeColor = "";
  let confirmations = 0;
  let detailedTxns: TxDetail[] = [];
  let amount = 0;
  let datePart = "";
  let timePart = "";
  let price = 0;

  if (tx) {
    txid = tx.txid;
    type = tx.type;
    if (tx.type === "receive") {
      typeIcon = "fa-arrow-circle-down";
      typeColor = "green";
    } else {
      typeIcon = "fa-arrow-circle-up";
      typeColor = "red";
    }

    datePart = dateformat(tx.time * 1000, "mmm dd, yyyy");
    timePart = dateformat(tx.time * 1000, "hh:MM tt");

    confirmations = tx.confirmations;
    detailedTxns = tx.detailedTxns;
    amount = Math.abs(tx.amount);
    price = tx.btczPrice;
  }

  const openTxid = () => {
    if (currencyName === "TAZ") {
      shell.openExternal(`https://chain.so/tx/ZECTEST/${txid}`);
    } else {
      shell.openExternal(`https://explorer.getbtcz.com/#/tx/${txid}`);
    }
  };

  const doReply = (address: string) => {
    const defaultFee = RPC.getDefaultFee();
    setSendTo(new BitcoinzURITarget(address, defaultFee));
    closeModal();

    history.push(routes.SEND);
  };

  const totalAmounts =
    tx && tx.detailedTxns ? tx.detailedTxns.reduce((s, t) => Math.abs(parseFloat(t.amount)) + s, 0) : 0;
  const fees = tx ? Math.abs(tx.amount) - totalAmounts : 0;

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      className={styles.txmodal}
      overlayClassName={styles.txmodalOverlay}
    >
      <div className={styles.modalContent}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Transaction Details</h2>
          <button className={styles.modalCloseButton} onClick={closeModal}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Transaction Icon and Type */}
        <div className={styles.modalTransactionInfo}>
          <div className={styles.modalTransactionIcon} style={{ color: typeColor }}>
            <i className={["fas", typeIcon].join(" ")} />
          </div>
          <div className={styles.modalTransactionType}>
            {type === "receive" ? "Received" : "Sent"}
          </div>
        </div>

        {/* Compact Amount Display */}
        <div className={styles.modalAmountSection}>
          <div className={styles.modalAmountValue}>
            {type === "receive" ? "+" : "-"}{Utils.splitBtczAmountIntoBigSmallBtcz(amount).bigPart}
            <span className={styles.modalAmountSmall}>{Utils.splitBtczAmountIntoBigSmallBtcz(amount).smallPart}</span>
          </div>
          <div className={styles.modalAmountUsd}>
            {Utils.getBtczToUsdStringBtcz(price, Math.abs(amount))}
          </div>
        </div>

        {/* Compact Transaction Info Grid */}
        <div className={styles.modalInfoGrid}>
          <div className={styles.modalInfoItem}>
            <div className={styles.modalInfoLabel}>Time</div>
            <div className={styles.modalInfoValue}>
              {datePart}<br />{timePart}
            </div>
          </div>

          {type === "sent" && (
            <div className={styles.modalInfoItem}>
              <div className={styles.modalInfoLabel}>Fees</div>
              <div className={styles.modalInfoValue}>
                BTCZ {Utils.maxPrecisionTrimmed(fees)}
              </div>
            </div>
          )}

          <div className={styles.modalInfoItem}>
            <div className={styles.modalInfoLabel}>Status</div>
            <div className={styles.modalInfoValue}>
              {confirmations === 0 ? (
                <span className={styles.modalStatusPending}>
                  <i className="fas fa-clock" /> Confirming
                </span>
              ) : (
                <span className={styles.modalStatusConfirmed}>
                  <i className="fas fa-check-circle" /> Confirmed ({confirmations})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compact TXID Section */}
        <div className={styles.modalTxidSection}>
          <div className={styles.modalInfoLabel}>Transaction ID</div>
          <div className={styles.modalTxidContainer}>
            <div className={styles.modalTxidValue}>{Utils.splitStringIntoChunks(txid, 8).join(" ")}</div>
            <button className={styles.modernButton} onClick={openTxid}>
              <i className="fas fa-external-link-alt" />
              Explorer
            </button>
          </div>
        </div>

        {/* Compact Address Details */}
        <div className={styles.modalAddressSection}>
          {detailedTxns.map((txdetail) => {
            let { address } = txdetail;
            const { memo } = txdetail;

            if (!address) {
              address = "(Private)";
            }

            let replyTo: string = "";
            if (tx && tx.type === "receive" && memo) {
              const split = memo.split(/[ :\n\r\t]+/);
              if (split && split.length > 0 && Utils.isSapling(split[split.length - 1])) {
                replyTo = split[split.length - 1];
              }
            }

            return (
              <div key={address} className={styles.modalAddressItem}>
                <div className={styles.modalAddressInfo}>
                  <div className={styles.modalInfoLabel}>
                    {type === "receive" ? "From Address" : "To Address"}
                  </div>
                  <div className={styles.modalAddressValue}>
                    {address === "(Private)" ? address : Utils.splitStringIntoChunks(address, 8).join(" ")}
                  </div>
                </div>

                {memo && (
                  <div className={styles.modalMemoSection}>
                    <div className={styles.modalInfoLabel}>Memo</div>
                    <div className={styles.modalMemoContent}>
                      <div className={styles.modalMemoText}>{memo}</div>
                      {replyTo && (
                        <button className={styles.modernButton} onClick={() => doReply(replyTo)}>
                          <i className="fas fa-reply" />
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modern Close Button */}
        <div className={styles.modalActions}>
          <button type="button" className={styles.modernButton} onClick={closeModal}>
            <i className="fas fa-times" />
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

const TxModal = withRouter(TxModalInternal);

type TxItemBlockProps = {
  transaction: Transaction;
  currencyName: string;
  btczPrice: number;
  txClicked: (tx: Transaction) => void;
  addressBookMap: Map<string, string>;
};
const TxItemBlock = ({ transaction, currencyName, btczPrice, txClicked, addressBookMap }: TxItemBlockProps) => {
  const txDate = new Date(transaction.time * 1000);
  const datePart = dateformat(txDate, "mmm dd, yyyy");
  const timePart = dateformat(txDate, "hh:MM tt");

  // Get transaction status
  const getTransactionStatus = () => {
    if (transaction.confirmations === 0) {
      return { status: 'confirming', icon: 'fas fa-clock', color: '#FFB74D' };
    } else if (transaction.confirmations >= 1) {
      return { status: 'confirmed', icon: 'fas fa-check-circle', color: '#4CAF50' };
    } else {
      return { status: 'failed', icon: 'fas fa-times-circle', color: '#F44336' };
    }
  };

  const statusInfo = getTransactionStatus();

  // Get transaction type icon
  const getTransactionTypeIcon = () => {
    if (transaction.type === "receive") {
      return { icon: 'fas fa-arrow-down', color: '#4CAF50' };
    } else {
      return { icon: 'fas fa-arrow-up', color: '#FF7043' };
    }
  };

  const typeInfo = getTransactionTypeIcon();

  return (
    <div className={styles.txItemContainer}>
      <div
        className={styles.modernTxBox}
        onClick={() => {
          txClicked(transaction);
        }}
      >
        {/* Transaction Icon and Type */}
        <div className={styles.txIconSection}>
          <div className={styles.txTypeIcon} style={{ color: typeInfo.color }}>
            <i className={typeInfo.icon} />
          </div>
          <div className={styles.txTypeInfo}>
            <div className={styles.txTypeLabel}>
              {transaction.type === "receive" ? "Received" : "Sent"}
            </div>
            <div className={styles.txDateTime}>
              {datePart} • {timePart}
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className={styles.txDetailsSection}>
          {transaction.detailedTxns.map((txdetail) => {
            let { address } = txdetail;
            const { memo } = txdetail;

            if (!address) {
              address = "(Private)";
            }

            const label = addressBookMap.get(address) || "";
            const displayAddress = address === "(Private)" ? address : Utils.splitStringIntoChunks(address, 8).join(" ");

            return (
              <div key={address} className={styles.txDetailItem}>
                <div className={styles.txAddressInfo}>
                  {label && <div className={styles.txLabel}>{label}</div>}
                  <div className={styles.txAddress}>{displayAddress}</div>
                  {memo && <div className={styles.txMemo}>{memo}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Amount and Status */}
        <div className={styles.txAmountSection}>
          <div className={styles.txAmount}>
            <div className={styles.txAmountValue}>
              {transaction.type === "receive" ? "+" : "-"}{Utils.splitBtczAmountIntoBigSmallBtcz(Math.abs(transaction.amount)).bigPart}
              <span className={styles.txAmountSmall}>{Utils.splitBtczAmountIntoBigSmallBtcz(Math.abs(transaction.amount)).smallPart}</span>
            </div>
            <div className={styles.txAmountUsd}>
              {Utils.getBtczToUsdStringBtcz(btczPrice, Math.abs(transaction.amount))}
            </div>
          </div>
          <div className={styles.txStatus}>
            <div className={styles.txStatusIcon} style={{ color: statusInfo.color }}>
              <i className={statusInfo.icon} />
            </div>
            <div className={styles.txStatusLabel} style={{ color: statusInfo.color }}>
              {statusInfo.status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type Props = {
  transactions: Transaction[];
  addressBook: AddressBookEntry[];
  info: Info;
  setSendTo: (targets: BitcoinzURITarget[] | BitcoinzURITarget) => void;
};

type State = {
  clickedTx?: Transaction;
  modalIsOpen: boolean;
  numTxnsToShow: number;
};

export default class Transactions extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = { clickedTx: undefined, modalIsOpen: false, numTxnsToShow: 100 };
  }

  txClicked = (tx: Transaction) => {
    // Show the modal
    if (!tx) return;
    this.setState({ clickedTx: tx, modalIsOpen: true });
  };

  closeModal = () => {
    this.setState({ clickedTx: undefined, modalIsOpen: false });
  };

  show100MoreTxns = () => {
    const { numTxnsToShow } = this.state;

    this.setState({ numTxnsToShow: numTxnsToShow + 100 });
  };

  render() {
    const { transactions, info, addressBook, setSendTo } = this.props;
    const { clickedTx, modalIsOpen, numTxnsToShow } = this.state;

    const isLoadMoreEnabled = transactions && numTxnsToShow < transactions.length;

    const addressBookMap: Map<string, string> = addressBook.reduce((m, obj) => {
      m.set(obj.address, obj.label);
      return m;
    }, new Map());

    return (
      <div className={styles.transactionsContainer}>
        {/* Modern Header */}
        <div className={styles.transactionsHeader}>
          <h1 className={styles.transactionsTitle}>Transaction History</h1>
          <div className={styles.transactionsSummary}>
            {transactions && (
              <span className={styles.transactionCount}>
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Transactions Content */}
        <div className={styles.transactionsContent}>
          {/* Loading State */}
          {!transactions && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <i className="fas fa-spinner fa-spin" />
              </div>
              <div className={styles.emptyStateText}>Loading transactions...</div>
            </div>
          )}

          {/* No Transactions State */}
          {transactions && transactions.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <i className="fas fa-receipt" />
              </div>
              <div className={styles.emptyStateText}>No transactions yet</div>
              <div className={styles.emptyStateSubtext}>
                Your transaction history will appear here once you send or receive BitcoinZ
              </div>
            </div>
          )}

          {/* Transactions List */}
          {transactions && transactions.length > 0 && (
            <div className={styles.transactionsList}>
              {transactions.slice(0, numTxnsToShow).map((t) => {
                const key = t.type + t.txid + (t.position || "");
                return (
                  <TxItemBlock
                    key={key}
                    transaction={t}
                    currencyName={info.currencyName}
                    btczPrice={info.btczPrice}
                    txClicked={this.txClicked}
                    addressBookMap={addressBookMap}
                  />
                );
              })}

              {/* Load More Button */}
              {isLoadMoreEnabled && (
                <div className={styles.loadMoreContainer}>
                  <button
                    className={styles.loadMoreButton}
                    onClick={this.show100MoreTxns}
                  >
                    <i className="fas fa-chevron-down" />
                    Load More Transactions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        <TxModal
          modalIsOpen={modalIsOpen}
          tx={clickedTx}
          closeModal={this.closeModal}
          currencyName={info.currencyName}
          setSendTo={setSendTo}
        />
      </div>
    );
  }
}
