import SecurityManager from './securityManager';

// Mock electron's ipcRenderer and crypto in the browser-like test env
const mockInvoke = jest.fn();

declare global {
  interface Window { require: any }
}

beforeAll(() => {
  (global as any).window = (global as any).window || {};
  (window as any).require = (moduleName: string) => {
    if (moduleName === 'electron') {
      return { ipcRenderer: { invoke: mockInvoke } };
    }
    if (moduleName === 'crypto') {
      return {
        randomBytes: (n: number) => ({ toString: () => 'a'.repeat(n * 2) }),
        pbkdf2Sync: (pin: string, salt: string, _i: number, _k: number, _d: string) => ({ toString: () => `${pin}:${salt}:hash` }),
      };
    }
    throw new Error(`Unexpected require: ${moduleName}`);
  };

  // Mock localStorage
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('persists PIN settings via IPC and reloads them', async () => {
  // First instance: set PIN and ensure save invoked
  mockInvoke.mockImplementation(async (channel: string, payload?: any) => {
    if (channel === 'save-security-settings') {
      // emulate successful write
      return { success: true };
    }
    if (channel === 'load-security-settings') {
      // no settings yet
      return null;
    }
  });

  const mgr1 = SecurityManager.getInstance();
  await mgr1.ready();
  const ok = await mgr1.setPin('1234');
  expect(ok).toBe(true);
  expect(mockInvoke).toHaveBeenCalledWith('save-security-settings', expect.objectContaining({ hasPin: true }));

  // Emulate app restart: next load should return saved settings
  const saved = (mockInvoke.mock.calls.find(c => c[0] === 'save-security-settings')?.[1]) as any;
  mockInvoke.mockImplementation(async (channel: string) => {
    if (channel === 'load-security-settings') {
      return saved;
    }
  });

  // Create a fresh instance by poking into the singleton for test purposes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (SecurityManager as any).instance = undefined;
  const mgr2 = SecurityManager.getInstance();
  await mgr2.ready();
  expect(mgr2.hasPin()).toBe(true);
});

