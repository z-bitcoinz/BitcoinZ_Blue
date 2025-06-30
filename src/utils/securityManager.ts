const { ipcRenderer } = window.require('electron');
const crypto = window.require('crypto');

interface SecuritySettings {
  hasPin: boolean;
  pinHash?: string;
  salt?: string;
  lockOnClose: boolean;
  autoLockMinutes: number;
  maxAttempts: number;
  lockoutMinutes: number;
}

interface LockState {
  isLocked: boolean;
  failedAttempts: number;
  lockoutUntil?: number;
  lastActivity: number;
  totalFailedAttempts: number; // Cumulative failed attempts across lockout periods
  lockoutLevel: number; // Current lockout level for progressive lockout
}

class SecurityManager {
  private static instance: SecurityManager;
  private settings: SecuritySettings;
  private lockState: LockState;
  private autoLockTimer?: NodeJS.Timeout;
  private lockoutTimer?: NodeJS.Timeout;

  private constructor() {
    this.settings = {
      hasPin: false,
      lockOnClose: false,
      autoLockMinutes: 0, // 0 = disabled
      maxAttempts: 5,
      lockoutMinutes: 5
    };
    
    this.lockState = {
      isLocked: false,
      failedAttempts: 0,
      lastActivity: Date.now(),
      totalFailedAttempts: 0,
      lockoutLevel: 0
    };

    this.loadSettings();
    this.loadLockState();
    this.setupAutoLock();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // PIN Management
  public async setPin(pin: string): Promise<boolean> {
    try {
      const salt = crypto.randomBytes(32).toString('hex');
      const pinHash = this.hashPin(pin, salt);
      
      this.settings.hasPin = true;
      this.settings.pinHash = pinHash;
      this.settings.salt = salt;
      
      await this.saveSettings();
      this.resetFailedAttempts();
      
      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  }

  public async removePin(): Promise<boolean> {
    try {
      this.settings.hasPin = false;
      this.settings.pinHash = undefined;
      this.settings.salt = undefined;
      
      await this.saveSettings();
      this.unlock();
      
      return true;
    } catch (error) {
      console.error('Error removing PIN:', error);
      return false;
    }
  }

  public async verifyPin(pin: string): Promise<boolean> {
    if (!this.settings.hasPin || !this.settings.pinHash || !this.settings.salt) {
      return false;
    }

    if (this.isInLockout()) {
      return false;
    }

    const pinHash = this.hashPin(pin, this.settings.salt);
    const isValid = pinHash === this.settings.pinHash;

    if (isValid) {
      this.resetFailedAttempts();
      this.unlock();
      return true;
    } else {
      this.incrementFailedAttempts();
      return false;
    }
  }

  private hashPin(pin: string, salt: string): string {
    return crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512').toString('hex');
  }

  // Lock State Management
  public lock(): void {
    this.lockState.isLocked = true;
    this.saveLockState();
  }

  public unlock(): void {
    this.lockState.isLocked = false;
    this.updateActivity();
    this.saveLockState();
    this.setupAutoLock();
  }

  public isLocked(): boolean {
    return this.lockState.isLocked;
  }

  public hasPin(): boolean {
    return this.settings.hasPin;
  }

  // Failed Attempts Management
  private incrementFailedAttempts(): void {
    this.lockState.failedAttempts++;
    this.lockState.totalFailedAttempts++;

    if (this.lockState.failedAttempts >= this.settings.maxAttempts) {
      this.startProgressiveLockout();
    }

    this.saveLockState();
  }

  private resetFailedAttempts(): void {
    this.lockState.failedAttempts = 0;
    this.lockState.totalFailedAttempts = 0;
    this.lockState.lockoutLevel = 0;
    this.lockState.lockoutUntil = undefined;
    this.saveLockState();

    if (this.lockoutTimer) {
      clearTimeout(this.lockoutTimer);
      this.lockoutTimer = undefined;
    }
  }

  private startProgressiveLockout(): void {
    // Increase lockout level
    this.lockState.lockoutLevel++;

    // Calculate progressive lockout duration
    const baseLockoutMinutes = 3; // Start with 3 minutes
    const lockoutMinutes = baseLockoutMinutes * this.lockState.lockoutLevel;
    const lockoutDuration = lockoutMinutes * 60 * 1000;

    this.lockState.lockoutUntil = Date.now() + lockoutDuration;
    this.lockState.failedAttempts = 0; // Reset current group counter
    this.saveLockState();

    this.lockoutTimer = setTimeout(() => {
      this.endLockout();
    }, lockoutDuration);
  }

  private endLockout(): void {
    this.lockState.lockoutUntil = undefined;
    this.lockState.failedAttempts = 0;
    this.saveLockState();

    if (this.lockoutTimer) {
      clearTimeout(this.lockoutTimer);
      this.lockoutTimer = undefined;
    }
  }

  public isInLockout(): boolean {
    if (!this.lockState.lockoutUntil) return false;
    return Date.now() < this.lockState.lockoutUntil;
  }

  public getLockoutTimeRemaining(): number {
    if (!this.lockState.lockoutUntil) return 0;
    const remaining = Math.max(0, this.lockState.lockoutUntil - Date.now());
    return Math.ceil(remaining / 1000);
  }

  public getAttemptsRemaining(): number {
    return Math.max(0, this.settings.maxAttempts - this.lockState.failedAttempts);
  }

  public getLockoutLevel(): number {
    return this.lockState.lockoutLevel;
  }

  public getTotalFailedAttempts(): number {
    return this.lockState.totalFailedAttempts;
  }

  // Auto-lock Management
  public updateActivity(): void {
    this.lockState.lastActivity = Date.now();
    this.setupAutoLock();
  }

  private setupAutoLock(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
    }

    if (this.settings.autoLockMinutes > 0 && !this.lockState.isLocked) {
      const timeout = this.settings.autoLockMinutes * 60 * 1000;
      this.autoLockTimer = setTimeout(() => {
        this.lock();
      }, timeout);
    }
  }

  // Settings Management
  public getSettings(): SecuritySettings {
    return { ...this.settings };
  }

  public async updateSettings(newSettings: Partial<SecuritySettings>): Promise<boolean> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();
      this.setupAutoLock();
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  // Persistence
  private async saveSettings(): Promise<void> {
    try {
      const settingsToSave = { ...this.settings };
      await ipcRenderer.invoke('save-security-settings', settingsToSave);
    } catch (error) {
      console.error('Error saving security settings:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await ipcRenderer.invoke('load-security-settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings };
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  }

  private saveLockState(): void {
    try {
      localStorage.setItem('wallet-lock-state', JSON.stringify(this.lockState));
    } catch (error) {
      console.error('Error saving lock state:', error);
    }
  }

  private loadLockState(): void {
    try {
      const savedState = localStorage.getItem('wallet-lock-state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.lockState = { ...this.lockState, ...parsed };
        
        // Check if we should start locked based on settings
        if (this.settings.hasPin && this.settings.lockOnClose) {
          this.lockState.isLocked = true;
        }
      }
    } catch (error) {
      console.error('Error loading lock state:', error);
    }
  }

  // Cleanup
  public cleanup(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
    }
    if (this.lockoutTimer) {
      clearTimeout(this.lockoutTimer);
    }
  }
}

export default SecurityManager;
