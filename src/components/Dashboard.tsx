/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-plusplus */
/* eslint-disable react/prop-types */

import React from "react";
import { useHistory } from "react-router";
import dateformat from "dateformat";
import styles from "./Dashboard.module.css";
import cstyles from "./Common.module.css";
import { TotalBalance, Info, AddressBalance, Transaction } from "./AppState";
import Utils from "../utils/utils";
// Removed unused imports - using custom balance components now
import routes from "../constants/routes.json";

type Props = {
  totalBalance: TotalBalance;
  info: Info;
  addressesWithBalance: AddressBalance[];
  transactions: Transaction[];
};

const Home: React.FC<Props> = ({ totalBalance, info, addressesWithBalance, transactions }) => {
  const history = useHistory();

  const navigateToTransactions = () => {
    history.push(routes.TRANSACTIONS);
  };

    const anyPending = addressesWithBalance && addressesWithBalance.find((i) => i.containsPending);

    return (
      <div className={styles.dashboardContainer}>
        {/* Fixed Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div className={styles.addressbalancecontainer}>
            {/* Unified Balance Card */}
            <div className={styles.unifiedBalanceCard}>
              {/* Main Total Balance Section */}
              <div className={styles.totalBalanceSection}>
                <div className={styles.mainBalanceTitle}>Total BitcoinZ Balance</div>
                <div className={styles.mainBalanceAmount}>
                  {Utils.maxPrecisionTrimmedBtcz(totalBalance.total)}
                </div>
                <div className={styles.mainBalanceUsd}>
                  {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.total)}
                </div>
              </div>

              {/* Balance Breakdown Section */}
              <div className={styles.balanceBreakdownSection}>
                <div className={styles.breakdownSectionTitle}>Balance Breakdown</div>
                <div className={styles.balanceBreakdownGrid}>
                  <div className={styles.balanceBreakdownItem}>
                    <div className={styles.breakdownLabel}>Transparent</div>
                    <div className={styles.breakdownAmount}>
                      {Utils.maxPrecisionTrimmedBtcz(totalBalance.transparent)}
                    </div>
                    <div className={styles.breakdownUsd}>
                      {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.transparent)}
                    </div>
                  </div>

                  <div className={styles.balanceBreakdownItem}>
                    <div className={styles.breakdownLabel}>Private</div>
                    <div className={styles.breakdownAmount}>
                      {Utils.maxPrecisionTrimmedBtcz(totalBalance.zbalance)}
                    </div>
                    <div className={styles.breakdownUsd}>
                      {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.zbalance)}
                    </div>
                  </div>

                  {totalBalance.totalPending > 0 && (
                    <div className={styles.balanceBreakdownItem}>
                      <div className={styles.breakdownLabel}>Pending</div>
                      <div className={styles.breakdownAmount}>
                        {Utils.maxPrecisionTrimmedBtcz(totalBalance.totalPending)}
                      </div>
                      <div className={styles.breakdownUsd}>
                        {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.totalPending)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Balance Notification */}
            {(totalBalance.totalPending > 0 || anyPending) && (
              <div className={styles.pendingNotification}>
                {totalBalance.totalPending > 0 && (
                  <div className={styles.pendingAmount}>
                    ⏳ {Utils.maxPrecisionTrimmedBtcz(totalBalance.totalPending)} BTCZ pending confirmation
                    {totalBalance.pendingTransparent > 0 && ` (${Utils.maxPrecisionTrimmedBtcz(totalBalance.pendingTransparent)} transparent)`}
                    {totalBalance.pendingShielded > 0 && ` (${Utils.maxPrecisionTrimmedBtcz(totalBalance.pendingShielded)} shielded)`}
                  </div>
                )}
                {anyPending && (
                  <div className={styles.pendingInfo}>
                    Pending transactions will be confirmed in the next block (~1-2 minutes)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className={styles.dashboardContent}>
          <div className={styles.recentTransactionsSection}>
            <div className={styles.recentTransactionsHeader}>
              <h3 className={styles.recentTransactionsTitle}>Recent Transactions</h3>
              {transactions && transactions.length > 0 && (
                <button
                  className={styles.viewAllButton}
                  onClick={navigateToTransactions}
                >
                  View All
                </button>
              )}
            </div>

            {!transactions && (
              <div className={[cstyles.center, cstyles.sublight].join(" ")} style={{ padding: "20px 12px", fontSize: "11px" }}>
                Loading transactions...
              </div>
            )}

            {transactions && transactions.length === 0 && (
              <div className={[cstyles.center, cstyles.sublight].join(" ")} style={{ padding: "20px 12px", fontSize: "11px" }}>
                No transactions yet. Start by receiving some BTCZ!
              </div>
            )}

            {transactions && transactions.length > 0 && (
              <div className={styles.recentTransactionsList}>
                {transactions.slice(0, 8).map((tx) => {
                  const txDate = new Date(tx.time * 1000);
                  const datePart = dateformat(txDate, "mmm dd");
                  const timePart = dateformat(txDate, "hh:MM tt");
                  const { bigPart, smallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(Math.abs(tx.amount));

                  return (
                    <div
                      key={tx.txid}
                      className={styles.recentTransactionItem}
                      onClick={navigateToTransactions}
                    >
                      <div className={styles.transactionIcon}>
                        <i
                          className={`fas ${tx.type === "receive" ? "fa-arrow-circle-down" : "fa-arrow-circle-up"}`}
                          style={{
                            color: tx.type === "receive" ? "#00E676" : "#FF5722"
                          }}
                        />
                      </div>

                      <div className={styles.transactionDetails}>
                        <div className={styles.transactionType}>
                          {tx.type === "receive" ? "Received" : "Sent"}
                          {tx.confirmations === 0 && (
                            <span className={[cstyles.orange, cstyles.small].join(" ")}> (pending)</span>
                          )}
                        </div>
                        <div className={[cstyles.sublight, cstyles.small].join(" ")}>
                          {datePart} at {timePart}
                        </div>
                      </div>

                      <div className={styles.transactionAmount}>
                        <div className={styles.transactionAmountValue}>
                          {bigPart}<span className={[cstyles.small, cstyles.btczsmallpart].join(" ")}>{smallPart}</span>
                        </div>
                        <div className={styles.transactionAmountUsd}>
                          {Utils.getBtczToUsdStringBtcz(info.btczPrice, Math.abs(tx.amount))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default Home;
