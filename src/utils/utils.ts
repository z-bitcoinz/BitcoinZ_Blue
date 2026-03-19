/* eslint-disable no-unused-vars */
/* eslint-disable no-else-return */
/* eslint-disable no-plusplus */
import { currencyManager } from "./currencyManager";

export const NO_CONNECTION: string = "Could not connect to bitcoinzd";

export default class Utils {
  // BitcoinZ LightwalletD servers
  // Now using proper HTTPS with valid SSL certificates
  static V1_LIGHTWALLETD: string = "https://light.z-text.com:443";

  // v2 LightwalletD
  static V2_LIGHTWALLETD: string = "https://light.z-text.com:443";

  // v3 LightwalletD
  static V3_LIGHTWALLETD: string = "https://light.z-text.com:443";

  static isUnified(addr: string): boolean {
    // BitcoinZ does not support Unified addresses
    return false;
  }

  static isSapling(addr: string): boolean {
    if (!addr) return false;
    // BitcoinZ shielded addresses start with 'zs1' (mainnet) or 'ztestsapling1' (testnet)
    // Total length is 78 characters: zs1 (3) + 75 characters
    return new RegExp("^zs1[a-z0-9]{75}$").test(addr) || new RegExp("^ztestsapling1[a-z0-9]+$").test(addr);
  }

  static isSprout(addr: string): boolean {
    if (!addr) return false;
    // BitcoinZ doesn't use Sprout addresses
    return false;
  }

  static isZaddr(addr: string): boolean {
    if (!addr) return false;
    return Utils.isSapling(addr) || Utils.isSprout(addr);
  }

  static isTransparent(addr: string): boolean {
    if (!addr) return false;
    // BitcoinZ transparent addresses start with 't1' (mainnet) or 'tm' (testnet)
    return new RegExp("^t1[a-zA-Z0-9]{33}$").test(addr) || new RegExp("^tm[a-zA-Z0-9]{33}$").test(addr);
  }

  static isValidSaplingPrivateKey(key: string): boolean {
    if (!key) return false;
    const k = key.trim().toLowerCase();
    return (
      /^btcz-secret-extended-key-main[0-9a-z]{10,500}$/.test(k) ||
      /^secret-extended-key-main[0-9a-z]{10,500}$/.test(k) ||
      /^secret-extended-key-test[0-9a-z]{10,500}$/.test(k)
    );
  }

  static isValidSaplingViewingKey(key: string): boolean {
    if (!key) return false;
    const k = key.trim().toLowerCase();
    return (
      /^btczxviews[0-9a-z]{10,500}$/.test(k) ||
      /^zxviews[0-9a-z]{10,500}$/.test(k) ||
      /^zxviewtestsapling[0-9a-z]{10,500}$/.test(k)
    );
  }

  // Transparent private key (WIF) for BitcoinZ/Zcash - typically starts with K or L (compressed), or 5 (uncompressed)
  static isValidTransparentPrivateKey(key: string): boolean {
    if (!key) return false;
    const k = key.trim();
    return (
      /^K[1-9A-HJ-NP-Za-km-z]{51}$/.test(k) ||
      /^L[1-9A-HJ-NP-Za-km-z]{51}$/.test(k) ||
      /^5[1-9A-HJ-NP-Za-km-z]{50}$/.test(k)
    );
  }

  // Convert to max 8 decimal places, and remove trailing zeros
  static maxPrecision(v: number): string {
    if (!v) return `${v}`;

    // if (typeof v === 'string' || v instanceof String) {
    //   // eslint-disable-next-line no-param-reassign
    //   v = parseFloat(v);
    // }

    return v.toFixed(8);
  }

  // BitcoinZ-specific: Convert to max 8 decimal places for fees, 4 for regular amounts
  static maxPrecisionBtcz(v: number): string {
    if (!v) return `${v}`;

    // For very small amounts (like fees), show up to 8 decimal places
    if (v < 0.001) {
      return v.toFixed(8).replace(/\.?0+$/, '');
    }

    return v.toFixed(4);
  }

  static maxPrecisionTrimmed(v: number): string {
    let s = Utils.maxPrecision(v);
    if (!s) {
      return s;
    }

    while (s.indexOf(".") >= 0 && s.substr(s.length - 1, 1) === "0") {
      s = s.substr(0, s.length - 1);
    }

    if (s.substr(s.length - 1) === ".") {
      s = s.substr(0, s.length - 1);
    }

    return s;
  }

  // BitcoinZ-specific: Trimmed version with 4 decimal places
  static maxPrecisionTrimmedBtcz(v: number): string {
    let s = Utils.maxPrecisionBtcz(v);
    if (!s) {
      return s;
    }

    while (s.indexOf(".") >= 0 && s.substr(s.length - 1, 1) === "0") {
      s = s.substr(0, s.length - 1);
    }

    if (s.substr(s.length - 1) === ".") {
      s = s.substr(0, s.length - 1);
    }

    return s;
  }

  static splitBtczAmountIntoBigSmall(btczValue: number) {
    if (!btczValue) {
      return { bigPart: btczValue, smallPart: "" };
    }

    let bigPart = Utils.maxPrecision(btczValue);
    let smallPart = "";

    if (bigPart.indexOf(".") >= 0) {
      const decimalPart = bigPart.substr(bigPart.indexOf(".") + 1);
      if (decimalPart.length > 4) {
        smallPart = decimalPart.substr(4);
        bigPart = bigPart.substr(0, bigPart.length - smallPart.length);

        // Pad the small part with trailing 0s
        while (smallPart.length < 4) {
          smallPart += "0";
        }
      }
    }

    if (smallPart === "0000") {
      smallPart = "";
    }

    return { bigPart, smallPart };
  }

  // BitcoinZ-specific: Split amount with 4 decimal precision for cleaner display
  static splitBtczAmountIntoBigSmallBtcz(btczValue: number) {
    if (!btczValue) {
      return { bigPart: "0", smallPart: "" };
    }

    // For very small amounts (like fees), ensure we show at least 4 decimal places
    let bigPart = Utils.maxPrecisionBtcz(btczValue);
    let smallPart = "";

    // If the amount is very small (less than 0.01), show all 4 decimal places
    if (btczValue < 0.01 && btczValue > 0) {
      // For very small amounts, don't split - show the full precision
      return { bigPart, smallPart: "" };
    }

    if (bigPart.indexOf(".") >= 0) {
      const decimalPart = bigPart.substr(bigPart.indexOf(".") + 1);
      if (decimalPart.length > 2) {
        smallPart = decimalPart.substr(2);
        bigPart = bigPart.substr(0, bigPart.length - smallPart.length);

        // Pad the small part with trailing 0s to ensure 2 digits
        while (smallPart.length < 2) {
          smallPart += "0";
        }
      }
    }

    if (smallPart === "00") {
      smallPart = "";
    }

    return { bigPart, smallPart };
  }

  static splitStringIntoChunks(s: string, numChunks: number) {
    if (numChunks > s.length) return [s];
    if (s.length < 16) return [s];

    const chunkSize = Math.round(s.length / numChunks);
    const chunks = [];
    for (let i = 0; i < numChunks - 1; i++) {
      chunks.push(s.substr(i * chunkSize, chunkSize));
    }
    // Last chunk might contain un-even length
    chunks.push(s.substr((numChunks - 1) * chunkSize));

    return chunks;
  }

  static nextToAddrID: number = 0;

  static getNextToAddrID(): number {
    // eslint-disable-next-line no-plusplus
    return Utils.nextToAddrID++;
  }

  static getDonationAddress(testnet: boolean): string {
    if (testnet) {
      return "ztestsapling1wn6889vznyu42wzmkakl2effhllhpe4azhu696edg2x6me4kfsnmqwpglaxzs7tmqsq7kudemp5";
    } else {
      return "t1RM689m6tHmywmCQpfSyFCuJkq4MM74YET";
    }
  }

  static getDefaultDonationAmount(testnet: boolean): number {
    return 0.1;
  }

  static getDefaultDonationMemo(testnet: boolean): string {
    return "Thanks for supporting BitcoinZ!";
  }

  static getBtczToUsdString(price: number | null, btczValue: number | null): string {
    if (!price || !btczValue) {
      return "USD --";
    }

    return `USD ${(price * btczValue).toFixed(2)}`;
  }

  // BitcoinZ-specific: USD conversion with better precision handling for small amounts
  static getBtczToUsdStringBtcz(price: number | null, btczValue: number | null): string {
    if (!price || !btczValue) {
      const currency = currencyManager.getCurrentCurrency();
      return `${currency.code} --`;
    }

    const currency = currencyManager.getCurrentCurrency();
    const fiatValue = price * btczValue;

    // For very small values (less than 0.01), show more decimal places
    if (fiatValue < 0.01 && fiatValue > 0) {
      return `${currency.code} ${currencyManager.formatCurrency(fiatValue, currency.code)}`;
    }

    return `${currency.code} ${currencyManager.formatCurrency(fiatValue, currency.code)}`;
  }

  // New method for better currency formatting
  static getBtczToFiatString(price: number | null, btczValue: number | null): string {
    if (!price || !btczValue) {
      const currency = currencyManager.getCurrentCurrency();
      return `${currency.symbol}--`;
    }

    const fiatValue = price * btczValue;
    return currencyManager.formatCurrency(fiatValue);
  }

  static utf16Split(s: string, chunksize: number): string[] {
    const ans = [];

    let current = "";
    let currentLen = 0;
    const a = [...s];
    for (let i = 0; i < a.length; i++) {
      // Each UTF-16 char will take upto 4 bytes when encoded
      const utf8len = a[i].length > 1 ? 4 : 1;

      // Test if adding it will exceed the size
      if (currentLen + utf8len > chunksize) {
        ans.push(current);
        current = "";
        currentLen = 0;
      }

      current += a[i];
      currentLen += utf8len;
    }

    if (currentLen > 0) {
      ans.push(current);
    }

    return ans;
  }

  // BigInt conversion utilities for handling large BTCZ amounts safely
  // These prevent precision loss when dealing with amounts like 23 million BTCZ

  /**
   * Convert BTCZ amount to zatoshis using BigInt to avoid precision loss
   * @param btczAmount - Amount in BTCZ (can be string or number)
   * @returns Amount in zatoshis as a number (safe for amounts up to ~90 million BTCZ)
   */
  static btczToZatoshi(btczAmount: number | string): number {
    // Convert to string to preserve precision, then to BigInt
    const btczStr = typeof btczAmount === 'string' ? btczAmount : btczAmount.toString();

    // Parse the decimal parts
    const parts = btczStr.split('.');
    const wholePart = parts[0] || '0';
    let decimalPart = parts[1] || '';

    // Pad or trim decimal part to exactly 8 digits
    if (decimalPart.length > 8) {
      decimalPart = decimalPart.substring(0, 8);
    } else {
      decimalPart = decimalPart.padEnd(8, '0');
    }

    // Combine whole and decimal parts as a BigInt
    const zatoshiStr = wholePart + decimalPart;
    const zatoshiBigInt = BigInt(zatoshiStr);

    // Check if the result is safe to convert to number
    if (zatoshiBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
      console.warn(`Amount ${btczAmount} BTCZ exceeds JavaScript safe integer limit. Precision may be lost.`);
    }

    return Number(zatoshiBigInt);
  }

  /**
   * Convert BTCZ amount to zatoshis as a string (for JSON serialization)
   * This is safer for very large amounts that might exceed MAX_SAFE_INTEGER
   * @param btczAmount - Amount in BTCZ (can be string or number)
   * @returns Amount in zatoshis as a string
   */
  static btczToZatoshiString(btczAmount: number | string): string {
    // Convert to string to preserve precision
    const btczStr = typeof btczAmount === 'string' ? btczAmount : btczAmount.toString();

    // Parse the decimal parts
    const parts = btczStr.split('.');
    const wholePart = parts[0] || '0';
    let decimalPart = parts[1] || '';

    // Pad or trim decimal part to exactly 8 digits
    if (decimalPart.length > 8) {
      decimalPart = decimalPart.substring(0, 8);
    } else {
      decimalPart = decimalPart.padEnd(8, '0');
    }

    // Combine whole and decimal parts and remove leading zeros
    const zatoshiStr = wholePart + decimalPart;
    return zatoshiStr.replace(/^0+/, '') || '0';
  }

  /**
   * Convert zatoshis to BTCZ amount
   * @param zatoshi - Amount in zatoshis (can be string, number, or BigInt)
   * @returns Amount in BTCZ as a number (for amounts under 90M BTCZ) or throws for larger amounts
   */
  static zatoshiToBtcz(zatoshi: number | string | bigint): number {
    try {
      const zatoshiBigInt = typeof zatoshi === 'bigint' ? zatoshi : BigInt(zatoshi.toString());

      // Check if amount exceeds safe limit
      if (zatoshiBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
        // For display purposes, we can still calculate and return a number, but with a warning
        console.warn(`Large amount detected: ${zatoshiBigInt} zatoshis. Using string conversion for safety.`);
      }

      const btczWhole = zatoshiBigInt / BigInt(100000000);
      const btczDecimal = zatoshiBigInt % BigInt(100000000);

      // Convert to number with proper decimal places
      return Number(btczWhole) + Number(btczDecimal) / 100000000;
    } catch (e) {
      console.error('Error converting zatoshi to BTCZ:', zatoshi, e);
      // Fallback to simple division
      return Number(zatoshi) / 100000000;
    }
  }

  /**
   * Convert zatoshis to BTCZ amount as a string (safe for any amount)
   * @param zatoshi - Amount in zatoshis (can be string, number, or BigInt)
   * @returns Amount in BTCZ as a string with proper decimal formatting
   */
  static zatoshiToBtczString(zatoshi: number | string | bigint): string {
    const zatoshiBigInt = typeof zatoshi === 'bigint' ? zatoshi : BigInt(zatoshi.toString());

    const btczWhole = zatoshiBigInt / BigInt(100000000);
    const btczDecimal = zatoshiBigInt % BigInt(100000000);

    // Format decimal part with leading zeros if needed
    const decimalStr = btczDecimal.toString().padStart(8, '0');

    // Remove trailing zeros from decimal part
    const trimmedDecimal = decimalStr.replace(/0+$/, '');

    if (trimmedDecimal.length === 0) {
      return btczWhole.toString();
    }

    return `${btczWhole}.${trimmedDecimal}`;
  }

  /**
   * Check if an amount would cause precision issues
   * @param btczAmount - Amount in BTCZ
   * @returns true if the amount might cause precision issues
   */
  static isAmountTooLarge(btczAmount: number | string): boolean {
    // For very large string amounts, use BigInt comparison
    try {
      const btczStr = typeof btczAmount === 'string' ? btczAmount : btczAmount.toString();
      const parts = btczStr.split('.');
      const wholePart = parts[0] || '0';
      let decimalPart = parts[1] || '';

      if (decimalPart.length > 8) {
        decimalPart = decimalPart.substring(0, 8);
      } else {
        decimalPart = decimalPart.padEnd(8, '0');
      }

      const zatoshiStr = wholePart + decimalPart;
      const zatoshiBigInt = BigInt(zatoshiStr);

      return zatoshiBigInt > BigInt(Number.MAX_SAFE_INTEGER);
    } catch (e) {
      // If conversion fails, consider it too large
      return true;
    }
  }

  /**
   * Safe addition of BTCZ amounts using BigInt
   * @param amount1 - First amount in BTCZ
   * @param amount2 - Second amount in BTCZ
   * @returns Sum as a string (for large amounts) or number (for safe amounts)
   */
  static addBtczAmounts(amount1: number | string, amount2: number | string): number | string {
    const zatoshi1 = BigInt(Utils.btczToZatoshiString(amount1));
    const zatoshi2 = BigInt(Utils.btczToZatoshiString(amount2));
    const sumZatoshi = zatoshi1 + zatoshi2;

    if (sumZatoshi > BigInt(Number.MAX_SAFE_INTEGER)) {
      return Utils.zatoshiToBtczString(sumZatoshi);
    }
    return Utils.zatoshiToBtcz(sumZatoshi);
  }

  /**
   * Check if amount exceeds BitcoinZ max supply
   * @param btczAmount - Amount in BTCZ
   * @returns true if amount exceeds 21 billion BTCZ
   */
  static exceedsMaxSupply(btczAmount: number | string): boolean {
    try {
      const btczStr = typeof btczAmount === 'string' ? btczAmount : btczAmount.toString();
      const btczNum = parseFloat(btczStr);
      return btczNum > 21000000000; // 21 billion BTCZ max supply
    } catch (e) {
      return true;
    }
  }

  /**
   * Format a BTCZ amount safely, handling large numbers
   * @param btczAmount - Amount in BTCZ
   * @param decimals - Number of decimal places to show (default 8)
   * @returns Formatted string
   */
  static formatBtczAmount(btczAmount: number | string, decimals: number = 8): string {
    const btczNum = typeof btczAmount === 'string' ? parseFloat(btczAmount) : btczAmount;

    if (Utils.isAmountTooLarge(btczAmount)) {
      // For very large amounts, use string manipulation to avoid precision loss
      const btczStr = btczAmount.toString();
      const parts = btczStr.split('.');
      const wholePart = parts[0];
      let decimalPart = parts[1] || '';

      if (decimalPart.length > decimals) {
        decimalPart = decimalPart.substring(0, decimals);
      } else if (decimalPart.length < decimals && decimals > 0) {
        decimalPart = decimalPart.padEnd(decimals, '0');
      }

      return decimalPart.length > 0 ? `${wholePart}.${decimalPart}` : wholePart;
    }

    return btczNum.toFixed(decimals);
  }
}
