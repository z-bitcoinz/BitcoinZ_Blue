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
import { BalanceBlockHighlight, BalanceBlock } from "./BalanceBlocks";
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
      <div>
        <div className={[cstyles.well, cstyles.containermargin].join(" ")}>
          <div className={cstyles.balancebox}>
            <BalanceBlockHighlight
              topLabel="Total Balance"
              zecValue={totalBalance.total}
              usdValue={Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.total)}
              currencyName={info.currencyName}
            />
            <BalanceBlock
              topLabel="Confirmed"
              zecValue={totalBalance.totalConfirmed}
              usdValue={Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.totalConfirmed)}
              currencyName={info.currencyName}
            />
            {totalBalance.totalPending > 0 && (
              <BalanceBlock
                topLabel="Pending"
                zecValue={totalBalance.totalPending}
                usdValue={Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.totalPending)}
                currencyName={info.currencyName}
              />
            )}
            <BalanceBlock
              topLabel="Transparent"
              zecValue={totalBalance.transparent}
              usdValue={Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.transparent)}
              currencyName={info.currencyName}
            />
            <BalanceBlock
              topLabel="Sapling"
              zecValue={totalBalance.zbalance}
              usdValue={Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.zbalance)}
              currencyName={info.currencyName}
            />
          </div>
          <div>
            {totalBalance.totalPending > 0 && (
              <div className={[cstyles.orange, cstyles.small, cstyles.padtopsmall].join(" ")}>
                ⏳ {Utils.maxPrecisionTrimmedBtcz(totalBalance.totalPending)} BTCZ pending confirmation
                {totalBalance.pendingTransparent > 0 && ` (${Utils.maxPrecisionTrimmedBtcz(totalBalance.pendingTransparent)} transparent)`}
                {totalBalance.pendingShielded > 0 && ` (${Utils.maxPrecisionTrimmedBtcz(totalBalance.pendingShielded)} shielded)`}
              </div>
            )}
            {anyPending && (
              <div className={[cstyles.sublight, cstyles.small, cstyles.padtopsmall].join(" ")}>
                Pending transactions will be confirmed in the next block (~1-2 minutes)
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Section */}
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
            <div className={[cstyles.center, cstyles.sublight].join(" ")}>
              Loading transactions...
            </div>
          )}

          {transactions && transactions.length === 0 && (
            <div className={[cstyles.center, cstyles.sublight].join(" ")}>
              No transactions yet. Start by receiving some BTCZ!
            </div>
          )}

          {transactions && transactions.length > 0 && (
            <div className={styles.recentTransactionsList}>
              {transactions.slice(0, 4).map((tx) => {
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
                          color: tx.type === "receive" ? "#4CAF50" : "#f44336"
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
                      <div>
                        <span>{info.currencyName} {bigPart}</span>
                        <span className={[cstyles.small, cstyles.btczsmallpart].join(" ")}>{smallPart}</span>
                      </div>
                      <div className={[cstyles.sublight, cstyles.small].join(" ")}>
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
    );
};

export default Home;
