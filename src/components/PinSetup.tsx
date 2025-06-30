import React, { useState } from 'react';
import styles from './PinSetup.module.css';

interface PinSetupProps {
  onPinSet: (pin: string) => void;
  onCancel: () => void;
  isChangingPin?: boolean;
}

const PinSetup: React.FC<PinSetupProps> = ({ onPinSet, onCancel, isChangingPin = false }) => {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handlePinInput = (value: string) => {
    if (step === 'enter') {
      setPin(value);
      if (value.length === 4) {
        setStep('confirm');
        setError('');
      }
    } else {
      setConfirmPin(value);
      if (value.length === 4) {
        if (value === pin) {
          onPinSet(pin);
        } else {
          setError('PINs do not match. Please try again.');
          setStep('enter');
          setPin('');
          setConfirmPin('');
        }
      }
    }
  };

  const handleNumberClick = (num: string) => {
    const currentPin = step === 'enter' ? pin : confirmPin;
    if (currentPin.length < 4) {
      handlePinInput(currentPin + num);
    }
  };

  const handleBackspace = () => {
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const handleClear = () => {
    if (step === 'enter') {
      setPin('');
    } else {
      setConfirmPin('');
    }
    setError('');
  };

  const currentPin = step === 'enter' ? pin : confirmPin;

  return (
    <div className={styles.pinSetupOverlay}>
      <div className={styles.pinSetupModal}>
        <div className={styles.header}>
          <h2>{isChangingPin ? 'Change Wallet PIN' : 'Set Wallet PIN'}</h2>
          <button className={styles.closeButton} onClick={onCancel}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${step === 'enter' ? styles.active : styles.completed}`}>
              1. Enter PIN
            </div>
            <div className={`${styles.step} ${step === 'confirm' ? styles.active : ''}`}>
              2. Confirm PIN
            </div>
          </div>

          <div className={styles.instructions}>
            {step === 'enter'
              ? 'Enter a 4-digit PIN to secure your wallet'
              : 'Re-enter your PIN to confirm'
            }
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.pinDisplay}>
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`${styles.pinDot} ${i < currentPin.length ? styles.filled : ''}`}
              />
            ))}
          </div>

          <div className={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                className={styles.keypadButton}
                onClick={() => handleNumberClick(num.toString())}
              >
                {num}
              </button>
            ))}
            <button
              className={styles.keypadButton}
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              className={styles.keypadButton}
              onClick={() => handleNumberClick('0')}
            >
              0
            </button>
            <button
              className={styles.keypadButton}
              onClick={handleBackspace}
            >
              ⌫
            </button>
          </div>

          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinSetup;
