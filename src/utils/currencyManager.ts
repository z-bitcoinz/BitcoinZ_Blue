export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  flag?: string; // Unicode flag emoji
}

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, flag: '🇬🇧' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, flag: '🇯🇵' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2, flag: '🇨🇳' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimals: 2, flag: '🇷🇺' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, flag: '🇦🇺' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, flag: '🇨🇭' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, flag: '🇮🇳' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2, flag: '🇧🇷' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0, flag: '🇰🇷' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimals: 2, flag: '🇲🇽' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimals: 2, flag: '🇸🇪' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimals: 2, flag: '🇳🇴' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2, flag: '🇳🇿' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, flag: '🇸🇬' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2, flag: '🇭🇰' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimals: 2, flag: '🇵🇱' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimals: 2, flag: '🇹🇷' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2, flag: '🇿🇦' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimals: 2, flag: '🇦🇪' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2, flag: '🇹🇭' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2, flag: '🇲🇾' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 2, flag: '🇵🇭' },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0, flag: '🇮🇩' },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0, flag: '🇻🇳' },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimals: 2, flag: '🇨🇿' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimals: 2, flag: '🇮🇱' },
  CLP: { code: 'CLP', symbol: '$', name: 'Chilean Peso', decimals: 0, flag: '🇨🇱' },
  ARS: { code: 'ARS', symbol: '$', name: 'Argentine Peso', decimals: 2, flag: '🇦🇷' },
  UAH: { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', decimals: 2, flag: '🇺🇦' }
};

const CURRENCY_PREFERENCE_KEY = 'btcz_wallet_currency_preference';

export class CurrencyManager {
  private static instance: CurrencyManager;
  private currentCurrency: Currency;
  private exchangeRates: Map<string, number> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Load saved preference or default to USD
    const saved = localStorage.getItem(CURRENCY_PREFERENCE_KEY);
    this.currentCurrency = saved && SUPPORTED_CURRENCIES[saved] 
      ? SUPPORTED_CURRENCIES[saved] 
      : SUPPORTED_CURRENCIES.USD;
  }

  static getInstance(): CurrencyManager {
    if (!CurrencyManager.instance) {
      CurrencyManager.instance = new CurrencyManager();
    }
    return CurrencyManager.instance;
  }

  getCurrentCurrency(): Currency {
    return this.currentCurrency;
  }

  setCurrentCurrency(currencyCode: string): void {
    if (SUPPORTED_CURRENCIES[currencyCode]) {
      this.currentCurrency = SUPPORTED_CURRENCIES[currencyCode];
      localStorage.setItem(CURRENCY_PREFERENCE_KEY, currencyCode);
    }
  }

  async getExchangeRates(): Promise<Map<string, number>> {
    const now = Date.now();
    
    // Return cached rates if still valid
    if (this.exchangeRates.size > 0 && now - this.lastFetchTime < this.CACHE_DURATION) {
      return this.exchangeRates;
    }

    try {
      // Fetch all supported currencies in one API call
      const currencyCodes = Object.keys(SUPPORTED_CURRENCIES).join(',').toLowerCase();

      // Add timeout to prevent freezing if API is slow/unreachable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoinz&vs_currencies=${currencyCodes}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId); // Clear timeout if fetch completes

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.bitcoinz) {
        this.exchangeRates.clear();
        for (const [currency, rate] of Object.entries(data.bitcoinz)) {
          this.exchangeRates.set(currency.toUpperCase(), rate as number);
        }
        this.lastFetchTime = now;
      }

      return this.exchangeRates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Return cached rates if available, even if expired
      return this.exchangeRates;
    }
  }

  async getCurrentExchangeRate(): Promise<number | null> {
    const rates = await this.getExchangeRates();
    return rates.get(this.currentCurrency.code) || null;
  }

  formatCurrency(amount: number, currencyCode?: string): string {
    const currency = currencyCode && SUPPORTED_CURRENCIES[currencyCode] 
      ? SUPPORTED_CURRENCIES[currencyCode] 
      : this.currentCurrency;

    // Handle very small numbers by using more decimals
    if (amount > 0 && amount < 0.01) {
      // For very small amounts, show up to 8 decimals
      // but remove trailing zeros
      const formatted = amount.toFixed(8);
      const trimmed = formatted.replace(/\.?0+$/, '');
      const formattedAmount = trimmed;
      
      // Position symbol based on currency conventions
      switch (currency.code) {
        case 'EUR':
        case 'GBP':
        case 'INR':
        case 'CNY':
        case 'JPY':
        case 'KRW':
          return `${currency.symbol}${formattedAmount}`;
        case 'PLN':
        case 'CZK':
        case 'SEK':
        case 'NOK':
        case 'THB':
          return `${formattedAmount} ${currency.symbol}`;
        default:
          return `${currency.symbol}${formattedAmount}`;
      }
    }

    // Handle special formatting for currencies with 0 decimals
    const formattedAmount = currency.decimals === 0 
      ? Math.round(amount).toLocaleString()
      : amount.toFixed(currency.decimals);

    // Position symbol based on currency conventions
    switch (currency.code) {
      case 'EUR':
      case 'GBP':
      case 'INR':
      case 'CNY':
      case 'JPY':
      case 'KRW':
        return `${currency.symbol}${formattedAmount}`;
      case 'PLN':
      case 'CZK':
      case 'SEK':
      case 'NOK':
      case 'THB':
        return `${formattedAmount} ${currency.symbol}`;
      default:
        return `${currency.symbol}${formattedAmount}`;
    }
  }

  convertBtczToFiat(btczAmount: number, exchangeRate: number): number {
    return btczAmount * exchangeRate;
  }

  convertFiatToBtcz(fiatAmount: number, exchangeRate: number): number {
    return exchangeRate > 0 ? fiatAmount / exchangeRate : 0;
  }
}

// Export singleton instance
export const currencyManager = CurrencyManager.getInstance();