import React, { useState } from 'react';
import Modal from 'react-modal';
import styles from './SettingsModal.module.css';
import { currencyManager, SUPPORTED_CURRENCIES } from '../utils/currencyManager';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCurrencyChange: (currency: string) => void;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onCurrencyChange }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    currencyManager.getCurrentCurrency().code
  );
  const [searchTerm, setSearchTerm] = useState('');

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    currencyManager.setCurrentCurrency(currencyCode);
    onCurrencyChange(currencyCode);
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

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Display Currency</h3>
          <p className={styles.sectionDescription}>
            Choose your preferred currency for displaying values
          </p>

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
    </Modal>
  );
};