import React from 'react';
import PinEntry from './PinEntry';
import styles from './LockScreen.module.css';

interface LockScreenProps {
  onUnlock: (pin: string) => void;
  error?: string;
  attemptsRemaining?: number;
  isLocked?: boolean;
  lockoutTimeRemaining?: number;
}

const LockScreen: React.FC<LockScreenProps> = ({ 
  onUnlock, 
  error, 
  attemptsRemaining,
  isLocked,
  lockoutTimeRemaining 
}) => {
  return (
    <div className={styles.lockScreenContainer}>
      {/* Background with blurred wallet content */}
      <div className={styles.blurredBackground}>
        <div className={styles.securityMessage}>
          <div className={styles.lockIcon}>🔒</div>
          <h2>Wallet Secured</h2>
          <p>Your BitcoinZ Blue wallet is protected with PIN security</p>
        </div>
      </div>

      {/* PIN Entry Modal */}
      <PinEntry
        onPinEntered={onUnlock}
        error={error}
        attemptsRemaining={attemptsRemaining}
        isLocked={isLocked}
        lockoutTimeRemaining={lockoutTimeRemaining}
      />
    </div>
  );
};

export default LockScreen;
