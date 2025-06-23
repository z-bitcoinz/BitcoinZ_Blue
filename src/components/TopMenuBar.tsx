import React from "react";
import { useHistory } from "react-router-dom";
import { Info } from "./AppState";
import routes from "../constants/routes.json";
import styles from "./TopMenuBar.module.css";

type TopMenuBarProps = {
  info: Info;
  pageTitle?: string;
};

const TopMenuBar: React.FC<TopMenuBarProps> = ({ info, pageTitle }) => {
  const history = useHistory();
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
            <i className={`fas ${isConnected ? 'fa-wifi' : 'fa-exclamation-triangle'} ${styles.connectionIcon} ${isConnected ? styles.connected : styles.disconnected}`} />
          </div>
          <div className={styles.blockHeight}>
            <i className={`fas fa-cube ${styles.blockIcon}`} />
            <span className={styles.blockText}>{blockHeight.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopMenuBar;
