/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-plusplus */
/* eslint-disable react/prop-types */

import React, { Component } from "react";
import {
  AccordionItemButton,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemPanel,
  Accordion,
} from "react-accessible-accordion";
import styles from "./Dashboard.module.css";
import cstyles from "./Common.module.css";
import { TotalBalance, Info, AddressBalance } from "./AppState";
import Utils from "../utils/utils";
import ScrollPane from "./ScrollPane";
import { BalanceBlockHighlight, BalanceBlock } from "./BalanceBlocks";

type AddressBalanceItemProps = {
  currencyName: string;
  btczPrice: number;
  item: AddressBalance;
};

const AddressBalanceItem = ({ currencyName, btczPrice, item }: AddressBalanceItemProps) => {
  const { bigPart, smallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(Math.abs(item.balance));

  return (
    <AccordionItem key={item.label} className={[cstyles.well, cstyles.margintopsmall].join(" ")} uuid={item.address}>
      <AccordionItemHeading>
        <AccordionItemButton className={cstyles.accordionHeader}>
          <div className={[cstyles.flexspacebetween].join(" ")}>
            <div>
              <div>{Utils.splitStringIntoChunks(item.address, 6).join(" ")}</div>
              {item.containsPending && (
                <div className={[cstyles.red, cstyles.small, cstyles.padtopsmall].join(" ")}>
                  Some transactions are pending. Balances may change.
                </div>
              )}
            </div>
            <div className={[styles.txamount, cstyles.right].join(" ")}>
              <div>
                <span>
                  {currencyName} {bigPart}
                </span>
                <span className={[cstyles.small, cstyles.btczsmallpart].join(" ")}>{smallPart}</span>
              </div>
              <div className={[cstyles.sublight, cstyles.small, cstyles.padtopsmall].join(" ")}>
                {Utils.getBtczToUsdStringBtcz(btczPrice, Math.abs(item.balance))}
              </div>
            </div>
          </div>
        </AccordionItemButton>
      </AccordionItemHeading>
      <AccordionItemPanel />
    </AccordionItem>
  );
};

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

        <div className={styles.addressbalancecontainer}>
          <ScrollPane offsetHeight={200}>
            <div className={styles.addressbooklist}>
              <div className={[cstyles.flexspacebetween, cstyles.tableheader, cstyles.sublight].join(" ")}>
                <div>Address</div>
                <div>Balance</div>
              </div>
              {addressesWithBalance &&
                (addressesWithBalance.length === 0 ? (
                  <div className={[cstyles.center, cstyles.sublight].join(" ")}>No Addresses with a balance</div>
                ) : (
                  <Accordion>
                    {addressesWithBalance
                      .filter((ab) => ab.balance > 0)
                      .map((ab) => (
                        <AddressBalanceItem
                          key={ab.address}
                          item={ab}
                          currencyName={info.currencyName}
                          btczPrice={info.btczPrice}
                        />
                      ))}
                  </Accordion>
                ))}
            </div>
          </ScrollPane>
        </div>
      </div>
    );
  }
}
