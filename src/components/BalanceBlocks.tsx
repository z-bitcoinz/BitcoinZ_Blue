import React from "react";
import cstyles from "./Common.module.css";
import Utils from "../utils/utils";

type BalanceBlockType = {
  zecValue: number;
  usdValue: string;
  currencyName: string;
  topLabel?: string;
  tooltip?: string;
};
export const BalanceBlockHighlight = ({ zecValue, usdValue, topLabel, currencyName, tooltip }: BalanceBlockType) => {
  const { bigPart, smallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(zecValue);

  return (
    <div style={{ padding: "0.6em" }} title={tooltip}>
      {topLabel && (
        <div className={[cstyles.small].join(" ")} style={{ marginBottom: "4px", fontSize: "11px", fontWeight: "600" }}>
          {topLabel}
          {tooltip && (
            <span>
              &nbsp;
              <i className={[cstyles.green, "fas", "fa-info-circle"].join(" ")} />
            </span>
          )}
        </div>
      )}

      <div className={[cstyles.highlight].join(" ")} style={{ fontSize: "20px", marginBottom: "2px" }}>
        <span>
          {currencyName && `${currencyName} `}{bigPart}
        </span>
        <span className={[cstyles.small, cstyles.btczsmallpart].join(" ")} style={{ fontSize: "14px" }}>{smallPart}</span>
      </div>
      <div className={[cstyles.sublight, cstyles.small].join(" ")} style={{ fontSize: "10px" }}>{usdValue}</div>
    </div>
  );
};

export const BalanceBlock = ({ zecValue, usdValue, topLabel, currencyName }: BalanceBlockType) => {
  const { bigPart, smallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(zecValue);

  return (
    <div className={cstyles.padall}>
      <div className={[cstyles.small].join(" ")}>{topLabel}</div>
      <div className={[cstyles.highlight, cstyles.large].join(" ")}>
        <span>
          {currencyName && `${currencyName} `}{bigPart}
        </span>
        <span className={[cstyles.small, cstyles.btczsmallpart].join(" ")}>{smallPart}</span>
      </div>
      <div className={[cstyles.sublight, cstyles.small].join(" ")}>{usdValue}</div>
    </div>
  );
};
