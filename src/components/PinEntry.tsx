import React, { useState, useEffect } from 'react';
import styles from './PinEntry.module.css';

interface PinEntryProps {
  onPinEntered: (pin: string) => void;
  onCancel?: () => void;
  error?: string;
  attemptsRemaining?: number;
  isLocked?: boolean;
  lockoutTimeRemaining?: number;
}

const PinEntry: React.FC<PinEntryProps> = ({ 
  onPinEntered, 
  onCancel, 
  error, 
  attemptsRemaining,
  isLocked = false,
  lockoutTimeRemaining = 0
}) => {
  const [pin, setPin] = useState('');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (error) {
      setShowError(true);
      setPin('');
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNumberClick = (num: string) => {
    if (isLocked) return;

    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 4) {
        // Auto-submit when PIN is exactly 4 digits
        setTimeout(() => {
          onPinEntered(newPin);
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    if (isLocked) return;
    setPin(pin.slice(0, -1));
    setShowError(false);
  };

  const handleClear = () => {
    if (isLocked) return;
    setPin('');
    setShowError(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLockoutMessage = (timeRemaining: number) => {
    const minutes = Math.ceil(timeRemaining / 60);
    if (minutes === 1) {
      return `Locked for ${formatTime(timeRemaining)} due to multiple failed attempts`;
    }
    return `Progressive lockout active - ${formatTime(timeRemaining)} remaining`;
  };

  return (
    <div className={styles.pinEntryOverlay}>
      <div className={styles.pinEntryModal}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.lockIcon}>🔒</div>
            <h2>BitcoinZ Blue</h2>
          </div>
          {onCancel && (
            <button className={styles.closeButton} onClick={onCancel}>×</button>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.title}>Wallet Locked</div>
          <div className={styles.subtitle}>
            {isLocked
              ? formatLockoutMessage(lockoutTimeRemaining)
              : 'Enter your 4-digit PIN to unlock'
            }
          </div>

          {showError && error && (
            <div className={styles.error}>
              {error}
              {attemptsRemaining !== undefined && attemptsRemaining > 0 && (
                <div className={styles.attemptsWarning}>
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                </div>
              )}
            </div>
          )}

          <div className={styles.pinDisplay}>
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`${styles.pinDot} ${i < pin.length ? styles.filled : ''}`}
              />
            ))}
          </div>

          <div className={`${styles.keypad} ${isLocked ? styles.disabled : ''}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                className={styles.keypadButton}
                onClick={() => handleNumberClick(num.toString())}
                disabled={isLocked}
              >
                {num}
              </button>
            ))}
            <button
              className={styles.keypadButton}
              onClick={handleClear}
              disabled={isLocked}
            >
              Clear
            </button>
            <button
              className={styles.keypadButton}
              onClick={() => handleNumberClick('0')}
              disabled={isLocked}
            >
              0
            </button>
            <button
              className={styles.keypadButton}
              onClick={handleBackspace}
              disabled={isLocked}
            >
              ⌫
            </button>
          </div>

          <div className={styles.helpText}>
            Your wallet is protected with PIN security
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinEntry;
