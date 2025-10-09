import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Modal from "react-modal";
import { Info, WalletSettings, AddressBookEntry } from "./AppState";
import routes from "../constants/routes.json";
import styles from "./TopMenuBar.module.css";
import cstyles from "./Common.module.css";
import { SettingsModal } from "./SettingsModal";
import { currencyManager } from "../utils/currencyManager";
import { useLock } from "../contexts/LockContext";

const { ipcRenderer } = window.require("electron");

type TopMenuBarProps = {
  info: Info;
  pageTitle?: string;
  onCurrencyChange?: (currency: string) => void;
  walletSettings?: WalletSettings;
  onWalletSettingsChange?: (settings: WalletSettings) => void;
  addressBook?: AddressBookEntry[];
  addAddressBookEntry?: (label: string, address: string) => void;
  openServerSelectModal?: () => void;
};

const TopMenuBar: React.FC<TopMenuBarProps> = ({ info, pageTitle, onCurrencyChange, walletSettings, onWalletSettingsChange, addressBook, addAddressBookEntry, openServerSelectModal }) => {
  const history = useHistory();
  const { hasPin, isLocked, lock } = useLock();
  const [showSettings, setShowSettings] = useState(false);
  const [showPriceInHeader, setShowPriceInHeader] = useState(false);
  const [isTorEnabled, setIsTorEnabled] = useState(false);
  const [showTorPrivacyModal, setShowTorPrivacyModal] = useState(false);
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

  useEffect(() => {
    // Load Tor/proxy settings
    const loadTorSettings = async () => {
      try {
        const settings = await ipcRenderer.invoke("loadSettings");
        const proxyEnabled = settings?.proxy?.enabled || false;
        setIsTorEnabled(proxyEnabled);
      } catch (error) {
        console.error("Failed to load proxy settings:", error);
      }
    };

    loadTorSettings();

    // Check periodically for settings changes
    const interval = setInterval(loadTorSettings, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleConnectionClick = () => {
    history.push(routes.ZCASHD);
  };

  const handleLockClick = () => {
    if (isLocked) {
      // Unlock will be handled by the lock screen
      return;
    } else {
      lock();
    }
  };

  const getLockTooltip = () => {
    if (!hasPin) return '';
    return isLocked
      ? 'Wallet is locked - enter PIN to unlock'
      : 'Click to lock wallet';
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

    const formattedPrice = currencyManager.formatCurrency(info.btczPrice);

    return `BTCZ: ${formattedPrice}`;
  };

  return (
    <>
      <div className={styles.topMenuBar}>
        <div className={styles.statusContainer}>
          <div className={styles.pageTitle}>
            {pageTitle || '\u00A0'}
          </div>
          <div className={styles.rightSection}>
            {showPriceInHeader && formatPrice() && (
              <div className={styles.priceDisplay}>
                <i className={`fas fa-chart-line ${styles.priceIcon}`} />
                <span className={styles.priceText}>{formatPrice()}</span>
              </div>
            )}
            {isTorEnabled && (
              <div
                className={styles.torIndicator}
                onClick={() => setShowTorPrivacyModal(true)}
                title="Anonymous Tor Connection"
              >
                <i className={`fas fa-user-secret ${styles.torIcon}`} />
              </div>
            )}
            {hasPin && (
              <div
                className={`${styles.lockButton} ${isLocked ? styles.locked : styles.unlocked}`}
                onClick={handleLockClick}
                title={getLockTooltip()}
              >
                <i className={`fas ${isLocked ? 'fa-lock' : 'fa-unlock'} ${styles.lockIcon}`} />
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
          addressBook={addressBook}
          addAddressBookEntry={addAddressBookEntry}
          openServerSelectModal={openServerSelectModal}
        />
      )}
      <Modal
        isOpen={showTorPrivacyModal}
        onRequestClose={() => setShowTorPrivacyModal(false)}
        className={cstyles.modal}
        overlayClassName={cstyles.modalOverlay}
        style={{
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 10000
          },
          content: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            zIndex: 10001,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
          }
        }}
      >
        <div style={{ textAlign: 'center', color: 'white' }}>
          {/* Icon */}
          <div style={{ marginBottom: '24px' }}>
            <i className="fas fa-user-secret" style={{ fontSize: '64px', color: '#C084FC', textShadow: '0 4px 12px rgba(192, 132, 252, 0.5)' }} />
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
            🔒 Anonymous Connection Active
          </h2>

          {/* Description */}
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', color: 'rgba(255, 255, 255, 0.9)' }}>
            Your wallet is connected through the Tor network, providing enhanced privacy and anonymity.
          </p>

          {/* Privacy Benefits */}
          <div style={{ textAlign: 'left', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '12px', fontSize: '16px' }} />
              <span style={{ fontSize: '14px' }}>Your IP address is hidden</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '12px', fontSize: '16px' }} />
              <span style={{ fontSize: '14px' }}>Your connection is encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '12px', fontSize: '16px' }} />
              <span style={{ fontSize: '14px' }}>Your location is protected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '12px', fontSize: '16px' }} />
              <span style={{ fontSize: '14px' }}>Network traffic is anonymized</span>
            </div>
          </div>

          {/* Footer Message */}
          <p style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '24px', color: 'rgba(255, 255, 255, 0.85)', fontStyle: 'italic' }}>
            No one can track that you're using BitcoinZ Wallet. Your financial privacy is secured through the Tor network's multi-layer encryption.
          </p>

          {/* Closing Tagline */}
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '24px', color: '#C084FC' }}>
            Stay safe. Stay private.
          </p>

          {/* Close Button */}
          <button
            onClick={() => setShowTorPrivacyModal(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 32px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            <i className="fas fa-check" />
            Got it
          </button>
        </div>
      </Modal>
    </>
  );
};

export default TopMenuBar;
