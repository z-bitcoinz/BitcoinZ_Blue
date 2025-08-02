import React, { useState } from 'react';
import Modal from 'react-modal';
import styles from './SettingsModal.module.css';
import { currencyManager, SUPPORTED_CURRENCIES } from '../utils/currencyManager';
import { WalletSettings, AddressBookEntry } from './AppState';
import { useLock } from '../contexts/LockContext';
import PinSetup from './PinSetup';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCurrencyChange: (currency: string) => void;
  walletSettings: WalletSettings;
  onWalletSettingsChange: (settings: WalletSettings) => void;
  addressBook?: AddressBookEntry[];
  addAddressBookEntry?: (label: string, address: string) => void;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onCurrencyChange,
  walletSettings,
  onWalletSettingsChange,
  addressBook,
  addAddressBookEntry
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

  const handleExportContacts = async () => {
    if (!addressBook || addressBook.length === 0) {
      alert('No contacts to export');
      return;
    }

    try {
      const { ipcRenderer } = window.require('electron');
      const dataStr = JSON.stringify(addressBook, null, 2);
      const exportFileDefaultName = `bitcoinz_contacts_${new Date().toISOString().split('T')[0]}.json`;
      
      // Show save dialog
      const result = await ipcRenderer.invoke('show-save-dialog', {
        defaultPath: exportFileDefaultName,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled && result.filePath) {
        // Write the file
        const writeResult = await ipcRenderer.invoke('write-file', result.filePath, dataStr);
        
        if (writeResult.success) {
          alert(`Exported ${addressBook.length} contacts successfully to ${result.filePath}`);
        } else {
          alert(`Failed to export contacts: ${writeResult.error}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export contacts');
    }
  };

  const handleImportContacts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importedContacts: AddressBookEntry[] = JSON.parse(text);
        
        if (!Array.isArray(importedContacts)) {
          throw new Error('Invalid contacts file format');
        }
        
        let addedCount = 0;
        let skippedCount = 0;
        
        for (const contact of importedContacts) {
          if (!contact.label || !contact.address) {
            skippedCount++;
            continue;
          }
          
          const exists = addressBook?.some(c => c.label === contact.label);
          if (!exists && addAddressBookEntry) {
            addAddressBookEntry(contact.label, contact.address);
            addedCount++;
          } else {
            skippedCount++;
          }
        }
        
        alert(`Import complete!\nAdded: ${addedCount} contacts\nSkipped: ${skippedCount} (duplicates or invalid)`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import contacts. Please check the file format.');
      }
    };
    
    input.click();
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
              </>
            )}
          </div>

          {/* Contacts Backup Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <i className="fas fa-address-book" /> Contacts Backup
            </h3>

            <div className={styles.securityItem}>
              <div className={styles.securityInfo}>
                <span className={styles.securityLabel}>Backup & Restore</span>
                <span className={styles.securityDescription}>
                  Export your contacts to a file or import contacts from a backup
                </span>
              </div>
              <div className={styles.securityActions}>
                <button
                  className={styles.setupButton}
                  onClick={handleExportContacts}
                  disabled={!addressBook || addressBook.length === 0}
                >
                  <i className="fas fa-download" /> Export Contacts
                </button>
                <button
                  className={styles.changeButton}
                  onClick={handleImportContacts}
                >
                  <i className="fas fa-upload" /> Import Contacts
                </button>
              </div>
            </div>
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