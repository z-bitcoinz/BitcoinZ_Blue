import React from "react";
import { TotalBalance, Info } from "./AppState";
import Utils from "../utils/utils";
import styles from "./TopMenuBar.module.css";
// import cstyles from "./Common.module.css"; // Not used in this component

type TopMenuBarProps = {
  totalBalance: TotalBalance;
  info: Info;
};

const TopMenuBar: React.FC<TopMenuBarProps> = ({ totalBalance, info }) => {
  const { bigPart: totalBigPart, smallPart: totalSmallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(totalBalance.total);
  const { bigPart: zBigPart, smallPart: zSmallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(totalBalance.zbalance);
  const { bigPart: tBigPart, smallPart: tSmallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(totalBalance.transparent);

  return (
    <div className={styles.topMenuBar}>
      {/* Left side - Total Balance */}
      <div className={styles.totalBalanceSection}>
        <div className={styles.totalBalanceLabel}>Total Balance</div>
        <div className={styles.totalBalanceAmount}>
          <span className={styles.currencyName}>{info.currencyName}</span>
          <span className={styles.balanceMain}>{totalBigPart}</span>
          <span className={styles.balanceSmall}>{totalSmallPart}</span>
        </div>
        <div className={styles.totalBalanceUsd}>
          {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.total)}
        </div>
      </div>

      {/* Right side - Z and T Balances */}
      <div className={styles.subBalancesSection}>
        <div className={styles.subBalance}>
          <div className={styles.subBalanceLabel}>Z Balance (Shielded)</div>
          <div className={styles.subBalanceAmount}>
            <span className={styles.subCurrencyName}>{info.currencyName}</span>
            <span className={styles.subBalanceMain}>{zBigPart}</span>
            <span className={styles.subBalanceSmall}>{zSmallPart}</span>
          </div>
          <div className={styles.subBalanceUsd}>
            {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.zbalance)}
          </div>
        </div>

        <div className={styles.subBalance}>
          <div className={styles.subBalanceLabel}>T Balance (Transparent)</div>
          <div className={styles.subBalanceAmount}>
            <span className={styles.subCurrencyName}>{info.currencyName}</span>
            <span className={styles.subBalanceMain}>{tBigPart}</span>
            <span className={styles.subBalanceSmall}>{tSmallPart}</span>
          </div>
          <div className={styles.subBalanceUsd}>
            {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.transparent)}
          </div>
        </div>
      </div>

      {/* Pending indicator */}
      {totalBalance.totalPending > 0 && (
        <div className={styles.pendingIndicator}>
          <i className="fas fa-clock" />
          <span>{Utils.maxPrecisionTrimmedBtcz(totalBalance.totalPending)} BTCZ pending</span>
        </div>
      )}
    </div>
  );
};

export default TopMenuBar;
