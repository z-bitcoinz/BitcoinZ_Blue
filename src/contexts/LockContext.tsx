import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import SecurityManager from '../utils/securityManager';

interface LockContextType {
  isLocked: boolean;
  hasPin: boolean;
  isInLockout: boolean;
  attemptsRemaining: number;
  lockoutTimeRemaining: number;
  lockError: string | null;
  
  // Actions
  setPin: (pin: string) => Promise<boolean>;
  removePin: () => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  lock: () => void;
  unlock: () => void;
  updateActivity: () => void;
  clearError: () => void;
  
  // Settings
  getSettings: () => any;
  updateSettings: (settings: any) => Promise<boolean>;
}

const LockContext = createContext<LockContextType | undefined>(undefined);

interface LockProviderProps {
  children: ReactNode;
}

export const LockProvider: React.FC<LockProviderProps> = ({ children }) => {
  const [securityManager] = useState(() => SecurityManager.getInstance());
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isInLockout, setIsInLockout] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const [lockError, setLockError] = useState<string | null>(null);

  // Update state from security manager
  const updateState = useCallback(() => {
    setIsLocked(securityManager.isLocked());
    setHasPin(securityManager.hasPin());
    setIsInLockout(securityManager.isInLockout());
    setAttemptsRemaining(securityManager.getAttemptsRemaining());
    setLockoutTimeRemaining(securityManager.getLockoutTimeRemaining());
  }, [securityManager]);

  // Initialize state
  useEffect(() => {
    updateState();

    // Set up lockout timer if needed
    let lockoutInterval: NodeJS.Timeout;
    if (isInLockout && lockoutTimeRemaining > 0) {
      lockoutInterval = setInterval(() => {
        const remaining = securityManager.getLockoutTimeRemaining();
        setLockoutTimeRemaining(remaining);
        if (remaining <= 0) {
          updateState();
        }
      }, 1000);
    }

    return () => {
      if (lockoutInterval) {
        clearInterval(lockoutInterval);
      }
    };
  }, [isInLockout, lockoutTimeRemaining, securityManager, updateState]);

  // Activity tracking
  useEffect(() => {
    const handleActivity = () => {
      if (!isLocked && hasPin) {
        securityManager.updateActivity();
      }
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isLocked, hasPin, securityManager]);

  // Actions
  const setPin = async (pin: string): Promise<boolean> => {
    try {
      const success = await securityManager.setPin(pin);
      if (success) {
        updateState();
        setLockError(null);
      }
      return success;
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  };

  const removePin = async (): Promise<boolean> => {
    try {
      const success = await securityManager.removePin();
      if (success) {
        updateState();
        setLockError(null);
      }
      return success;
    } catch (error) {
      console.error('Error removing PIN:', error);
      return false;
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const success = await securityManager.verifyPin(pin);
      updateState();
      
      if (success) {
        setLockError(null);
      } else {
        if (securityManager.isInLockout()) {
          const lockoutLevel = securityManager.getLockoutLevel();
          const totalAttempts = securityManager.getTotalFailedAttempts();
          setLockError(`Too many failed attempts (${totalAttempts} total). Progressive lockout level ${lockoutLevel} active.`);
        } else {
          const remaining = securityManager.getAttemptsRemaining();
          const totalAttempts = securityManager.getTotalFailedAttempts();
          setLockError(`Incorrect 4-digit PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setLockError('An error occurred while verifying PIN.');
      return false;
    }
  };

  const lock = () => {
    securityManager.lock();
    updateState();
    setLockError(null);
  };

  const unlock = () => {
    securityManager.unlock();
    updateState();
    setLockError(null);
  };

  const updateActivity = () => {
    if (!isLocked && hasPin) {
      securityManager.updateActivity();
    }
  };

  const clearError = () => {
    setLockError(null);
  };

  const getSettings = () => {
    return securityManager.getSettings();
  };

  const updateSettings = async (settings: any): Promise<boolean> => {
    try {
      const success = await securityManager.updateSettings(settings);
      if (success) {
        updateState();
      }
      return success;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  const contextValue: LockContextType = {
    isLocked,
    hasPin,
    isInLockout,
    attemptsRemaining,
    lockoutTimeRemaining,
    lockError,
    
    setPin,
    removePin,
    verifyPin,
    lock,
    unlock,
    updateActivity,
    clearError,
    
    getSettings,
    updateSettings
  };

  return (
    <LockContext.Provider value={contextValue}>
      {children}
    </LockContext.Provider>
  );
};

export const useLock = (): LockContextType => {
  const context = useContext(LockContext);
  if (context === undefined) {
    throw new Error('useLock must be used within a LockProvider');
  }
  return context;
};

export default LockContext;
