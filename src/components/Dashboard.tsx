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
                    <div className={styles.breakdownLabel}>
                      Transparent
                      {totalBalance.pendingTransparent > 0 && (
                        <span className={styles.pendingIndicator}>
                          <i className="fas fa-circle-notch"></i>
                        </span>
                      )}
                    </div>
                    <div className={styles.breakdownAmount}>
                      {Utils.maxPrecisionTrimmedBtcz(totalBalance.transparent)}
                    </div>
                    <div className={styles.breakdownUsd}>
                      {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.transparent)}
                    </div>
                    {totalBalance.pendingTransparent > 0 && (
                      <div className={styles.pendingAmount}>
                        +{Utils.maxPrecisionTrimmedBtcz(totalBalance.pendingTransparent)} confirming
                      </div>
                    )}
                  </div>

                  <div className={styles.balanceBreakdownItem}>
                    <div className={styles.breakdownLabel}>
                      Private
                      {totalBalance.pendingShielded > 0 && (
                        <span className={styles.pendingIndicator}>
                          <i className="fas fa-circle-notch"></i>
                        </span>
                      )}
                    </div>
                    <div className={styles.breakdownAmount}>
                      {Utils.maxPrecisionTrimmedBtcz(totalBalance.zbalance)}
                    </div>
                    <div className={styles.breakdownUsd}>
                      {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.zbalance)}
                    </div>
                    {totalBalance.pendingShielded > 0 && (
                      <div className={styles.pendingAmount}>
                        +{Utils.maxPrecisionTrimmedBtcz(totalBalance.pendingShielded)} confirming
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


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
                          className={`fas ${tx.type === "receive" ? "fa-arrow-down" : "fa-arrow-up"}`}
                          style={{
                            color: tx.type === "receive" ? "#00E676" : "#FF5722",
                            textShadow: `0 1px 2px rgba(0, 0, 0, 0.5)`
                          }}
                        />
                      </div>

                      <div className={styles.transactionDetails}>
                        <div className={styles.transactionType}>
                          {tx.type === "receive" ? "Received" : "Sent"}
                          {tx.confirmations === 0 && (
                            <span className={[cstyles.orange, cstyles.small].join(" ")}> (confirming)</span>
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
