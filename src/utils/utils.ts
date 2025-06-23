/* eslint-disable no-unused-vars */
/* eslint-disable no-else-return */
/* eslint-disable no-plusplus */
export const NO_CONNECTION: string = "Could not connect to bitcoinzd";

export default class Utils {
  // BitcoinZ LightwalletD servers
  // Now using proper HTTPS with valid SSL certificates
  static V1_LIGHTWALLETD: string = "https://lightd.btcz.rocks:9067";

  // v2 LightwalletD
  static V2_LIGHTWALLETD: string = "https://lightd.btcz.rocks:9067";

  // v3 LightwalletD
  static V3_LIGHTWALLETD: string = "https://lightd.btcz.rocks:9067";

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
    return (
      new RegExp("^secret-extended-key-test[0-9a-z]{278}$").test(key) ||
      new RegExp("^secret-extended-key-main[0-9a-z]{278}$").test(key)
    );
  }

  static isValidSaplingViewingKey(key: string): boolean {
    return new RegExp("^zxviews[0-9a-z]{278}$").test(key);
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

  // BitcoinZ-specific: Convert to max 4 decimal places for better display
  static maxPrecisionBtcz(v: number): string {
    if (!v) return `${v}`;

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
      return { bigPart: btczValue, smallPart: "" };
    }

    let bigPart = Utils.maxPrecisionBtcz(btczValue);
    let smallPart = "";

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
      return "zs1gv64eu0v2wx7raxqxlmj354y9ycznwaau9kduljzczxztvs4qcl00kn2sjxtejvrxnkucw5xx9u";
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
      return "USD --";
    }

    const usdValue = price * btczValue;

    // For very small USD values (less than $0.01), show more decimal places
    if (usdValue < 0.01 && usdValue > 0) {
      return `USD ${usdValue.toFixed(4)}`;
    }

    return `USD ${usdValue.toFixed(2)}`;
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
}
