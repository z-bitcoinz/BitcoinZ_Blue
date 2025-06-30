import React, { useState } from 'react';
import Modal from 'react-modal';
import styles from './SettingsModal.module.css';
import { currencyManager, SUPPORTED_CURRENCIES } from '../utils/currencyManager';
import { WalletSettings } from './AppState';
import { useLock } from '../contexts/LockContext';
import PinSetup from './PinSetup';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCurrencyChange: (currency: string) => void;
  walletSettings: WalletSettings;
  onWalletSettingsChange: (settings: WalletSettings) => void;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onCurrencyChange,
  walletSettings,
  onWalletSettingsChange
}) => {
  const { hasPin, getSettings, updateSettings, setPin, removePin } = useLock();

  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    currencyManager.getCurrentCurrency().code
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showPriceInHeader, setShowPriceInHeader] = useState<boolean>(
    localStorage.getItem('btcz_wallet_show_price_header') === 'true'
  );
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [securitySettings, setSecuritySettings] = useState(() => getSettings());

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    currencyManager.setCurrentCurrency(currencyCode);
    onCurrencyChange(currencyCode);
  };

  const handlePriceToggle = () => {
    const newValue = !showPriceInHeader;
    setShowPriceInHeader(newValue);
    localStorage.setItem('btcz_wallet_show_price_header', newValue.toString());
  };

  const handlePinSetup = async (pin: string) => {
    const success = await setPin(pin);
    if (success) {
      setShowPinSetup(false);
      setSecuritySettings(getSettings());
    }
  };

  const handleRemovePin = async () => {
    if (window.confirm('Are you sure you want to remove PIN protection? This will make your wallet less secure.')) {
      const success = await removePin();
      if (success) {
        setSecuritySettings(getSettings());
      }
    }
  };

  const handleSecuritySettingChange = async (key: string, value: any) => {
    const newSettings = { ...securitySettings, [key]: value };
    const success = await updateSettings(newSettings);
    if (success) {
      setSecuritySettings(newSettings);
    }
  };



  const filteredCurrencies = Object.values(SUPPORTED_CURRENCIES).filter(currency => 
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }
      }}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <i className="fas fa-cog" /> Settings
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            <i className="fas fa-times" />
          </button>
        </div>



        <div className={styles.tabContent}>
          {/* Wallet Security Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <i className="fas fa-shield-alt" /> Wallet Security
            </h3>

            <div className={styles.securityItem}>
              <div className={styles.securityInfo}>
                <span className={styles.securityLabel}>PIN Protection</span>
                <span className={styles.securityDescription}>
                  {hasPin ? 'Your wallet is protected with a 4-digit PIN' : 'Secure your wallet with a 4-digit PIN code'}
                </span>
              </div>
              <div className={styles.securityActions}>
                {hasPin ? (
                  <>
                    <button
                      className={styles.changeButton}
                      onClick={() => setShowPinSetup(true)}
                    >
                      Change PIN
                    </button>
                    <button
                      className={styles.removeButton}
                      onClick={handleRemovePin}
                    >
                      Remove PIN
                    </button>
                  </>
                ) : (
                  <button
                    className={styles.setupButton}
                    onClick={() => setShowPinSetup(true)}
                  >
                    Set PIN
                  </button>
                )}
              </div>
            </div>

            {hasPin && (
              <>
                <div className={styles.toggleItem}>
                  <span className={styles.toggleLabel}>Lock wallet on app close</span>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={securitySettings.lockOnClose}
                      onChange={(e) => handleSecuritySettingChange('lockOnClose', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.autoLockSection}>
                  <span className={styles.toggleLabel}>Auto-lock after inactivity</span>
                  <select
                    className={styles.autoLockSelect}
                    value={securitySettings.autoLockMinutes}
                    onChange={(e) => handleSecuritySettingChange('autoLockMinutes', parseInt(e.target.value))}
                  >
                    <option value={0}>Disabled</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className={styles.toggleSection}>
            <div className={styles.toggleItem}>
              <span className={styles.toggleLabel}>Show Price in Header</span>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={showPriceInHeader}
                  onChange={handlePriceToggle}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Display Currency</h3>

            <div className={styles.searchContainer}>
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.currencyList}>
              {filteredCurrencies.map((currency) => (
                <div
                  key={currency.code}
                  className={`${styles.currencyItem} ${
                    selectedCurrency === currency.code ? styles.selected : ''
                  }`}
                  onClick={() => handleCurrencyChange(currency.code)}
                >
                  <div className={styles.currencyInfo}>
                    <span className={styles.currencyFlag}>{currency.flag}</span>
                    <div className={styles.currencyDetails}>
                      <span className={styles.currencyCode}>{currency.code}</span>
                      <span className={styles.currencyName}>{currency.name}</span>
                    </div>
                  </div>
                  <div className={styles.currencySymbol}>
                    {currency.symbol}
                  </div>
                  {selectedCurrency === currency.code && (
                    <i className="fas fa-check" style={{ color: '#4a90e2' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.saveButton}
            onClick={onClose}
          >
            <i className="fas fa-check" />
            Save Settings
          </button>
        </div>
      </div>

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <PinSetup
          onPinSet={handlePinSetup}
          onCancel={() => setShowPinSetup(false)}
          isChangingPin={hasPin}
        />
      )}
    </Modal>
  );
};