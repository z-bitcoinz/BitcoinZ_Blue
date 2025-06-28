import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Info } from "./AppState";
import routes from "../constants/routes.json";
import styles from "./TopMenuBar.module.css";
import { SettingsModal } from "./SettingsModal";

type TopMenuBarProps = {
  info: Info;
  pageTitle?: string;
  onCurrencyChange?: (currency: string) => void;
};

const TopMenuBar: React.FC<TopMenuBarProps> = ({ info, pageTitle, onCurrencyChange }) => {
  const history = useHistory();
  const [showSettings, setShowSettings] = useState(false);
  const isConnected = info && info.latestBlock > 0;
  const blockHeight = info?.latestBlock || 0;

  const handleConnectionClick = () => {
    history.push(routes.ZCASHD);
  };

  const getConnectionTooltip = () => {
    return isConnected
      ? `Connected to lightwalletd server\nClick to view server details`
      : `Disconnected from lightwalletd server\nClick to view connection status`;
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
      {onCurrencyChange && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onCurrencyChange={onCurrencyChange}
        />
      )}
    </>
  );
};

export default TopMenuBar;
