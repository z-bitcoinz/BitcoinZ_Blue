import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Info, WalletSettings } from "./AppState";
import routes from "../constants/routes.json";
import styles from "./TopMenuBar.module.css";
import { SettingsModal } from "./SettingsModal";
import { currencyManager } from "../utils/currencyManager";

type TopMenuBarProps = {
  info: Info;
  pageTitle?: string;
  onCurrencyChange?: (currency: string) => void;
  walletSettings?: WalletSettings;
  onWalletSettingsChange?: (settings: WalletSettings) => void;
};

const TopMenuBar: React.FC<TopMenuBarProps> = ({ info, pageTitle, onCurrencyChange, walletSettings, onWalletSettingsChange }) => {
  const history = useHistory();
  const [showSettings, setShowSettings] = useState(false);
  const [showPriceInHeader, setShowPriceInHeader] = useState(false);
  const isConnected = info && info.latestBlock > 0;
  const blockHeight = info?.latestBlock || 0;

  useEffect(() => {
    // Check localStorage for price display preference
    const checkPricePreference = () => {
      const showPrice = localStorage.getItem('btcz_wallet_show_price_header') === 'true';
      setShowPriceInHeader(showPrice);
    };

    // Check on mount
    checkPricePreference();

    // Listen for storage changes (when settings modal updates the preference)
    const handleStorageChange = () => {
      checkPricePreference();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check when the component re-renders (for same-window updates)
    const interval = setInterval(checkPricePreference, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleConnectionClick = () => {
    history.push(routes.ZCASHD);
  };

  const getConnectionTooltip = () => {
    return isConnected
      ? `Connected to lightwalletd server\nClick to view server details`
      : `Disconnected from lightwalletd server\nClick to view connection status`;
  };

  const formatPrice = () => {
    if (!info || !info.btczPrice || info.btczPrice === 0) {
      return null;
    }

    const currency = currencyManager.getCurrentCurrency();
    const formattedPrice = currencyManager.formatCurrency(info.btczPrice);
    
    return `BTCZ: ${formattedPrice}`;
  };

  return (
    <>
      <div className={styles.topMenuBar}>
        <div className={styles.statusContainer}>
          {pageTitle && (
            <div className={styles.pageTitle}>
              {pageTitle}
            </div>
          )}
          <div className={styles.rightSection}>
            {showPriceInHeader && formatPrice() && (
              <div className={styles.priceDisplay}>
                <i className={`fas fa-chart-line ${styles.priceIcon}`} />
                <span className={styles.priceText}>{formatPrice()}</span>
              </div>
            )}
            <div
              className={styles.connectionStatus}
              onClick={handleConnectionClick}
              title={getConnectionTooltip()}
            >
              <i className={`fas ${isConnected ? 'fa-link' : 'fa-unlink'} ${styles.connectionIcon}`} />
            </div>
            <div className={styles.blockHeight}>
              <i className={`fas fa-cube ${styles.blockIcon}`} />
              <span className={styles.blockText}>{blockHeight.toLocaleString()}</span>
            </div>
            <div
              className={styles.settingsButton}
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <i className={`fas fa-cog ${styles.settingsIcon}`} />
            </div>
          </div>
        </div>
      </div>
      {onCurrencyChange && walletSettings && onWalletSettingsChange && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onCurrencyChange={onCurrencyChange}
          walletSettings={walletSettings}
          onWalletSettingsChange={onWalletSettingsChange}
        />
      )}
    </>
  );
};

export default TopMenuBar;
