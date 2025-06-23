/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-plusplus */
/* eslint-disable react/prop-types */

import React, { Component } from "react";
import styles from "./Dashboard.module.css";
import cstyles from "./Common.module.css";
import { TotalBalance, Info, AddressBalance } from "./AppState";
import Utils from "../utils/utils";
import { BalanceBlockHighlight, BalanceBlock } from "./BalanceBlocks";

type Props = {
  totalBalance: TotalBalance;
  info: Info;
  addressesWithBalance: AddressBalance[];
};

export default class Home extends Component<Props> {
  render() {
    const { totalBalance, info, addressesWithBalance } = this.props;

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

        {/* Address list moved to dedicated Address Management page */}
        <div className={styles.dashboardFooter}>
          <div className={[cstyles.center, cstyles.sublight, cstyles.small].join(" ")}>
            💡 Use the "Addresses" tab below to manage your wallet addresses
          </div>
        </div>
      </div>
    );
  }
}
