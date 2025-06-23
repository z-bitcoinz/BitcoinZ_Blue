import React from "react";
import styles from "./TopMenuBar.module.css";

type TopMenuBarProps = {
  // Props removed since we're no longer displaying balance information
  // Keep the component structure for potential future features
};

const TopMenuBar: React.FC<TopMenuBarProps> = () => {
  return (
    <div className={styles.topMenuBar}>
      {/* Top menu bar kept for potential future features */}
      {/* Balance information removed to avoid duplication with Dashboard */}
      <div className={styles.walletTitle}>
        BitcoinZ Wallet Lite
      </div>
    </div>
  );
};

export default TopMenuBar;
