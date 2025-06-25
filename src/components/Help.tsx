import React, { Component } from "react";
import styles from "./Help.module.css";

interface HelpState {
  activeTab: string;
}

export default class Help extends Component<{}, HelpState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      activeTab: "getting-started"
    };
  }

  render() {
    return (
      <div className={styles.helpContainer}>
        <div className={styles.helpHeader}>
          <h2>📚 BitcoinZ Blue Help</h2>
          <p>Everything you need to know about using your BitcoinZ wallet</p>
        </div>

        <div className={styles.helpContent}>
          <div className={styles.helpSection}>
            <h3>🔄 Why Your Funds Move Automatically (Auto-Shielding)</h3>
            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🛡️ Privacy Protection</div>
              <div className={styles.helpCardBody}>
                <p>BitcoinZ Blue automatically moves funds from transparent (T) to shielded (Z) addresses for your privacy and security.</p>

                <div className={styles.beforeAfter}>
                  <div className={styles.before}>
                    <h6>Before Auto-Shield</h6>
                    <div className={styles.addressExample}>
                      <span className={styles.tAddress}>T-address: 1000 BTCZ</span>
                      <small>🔍 Visible to everyone</small>
                    </div>
                  </div>
                  <div className={styles.arrow}>→</div>
                  <div className={styles.after}>
                    <h6>After Auto-Shield</h6>
                    <div className={styles.addressExample}>
                      <span className={styles.zAddress}>Z-address: 999 BTCZ</span>
                      <small>🔒 Private and secure</small>
                    </div>
                  </div>
                </div>

                <div className={styles.safetyNote}>
                  <strong>🎯 When Auto-Shielding Happens:</strong>
                  <ul>
                    <li>✅ <strong>When you make a transaction</strong> - T-address balance moves to Z-address</li>
                    <li>✅ After receiving funds to a T-address</li>
                    <li>✅ During wallet sync operations</li>
                    <li>✅ When you have sufficient balance (&gt; fee amount)</li>
                  </ul>

                  <strong>💰 Your Funds Stay Safe:</strong>
                  <ul>
                    <li>✅ Funds move to YOUR shielded addresses</li>
                    <li>✅ Same wallet, same total balance</li>
                    <li>✅ Only a small fee (~0.0001 BTCZ) is deducted</li>
                    <li>✅ Better privacy and security</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3>⏱️ Confirmation Requirements</h3>
            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🔐 When Can You Spend Your Funds?</div>
              <div className={styles.helpCardBody}>
                <div className={styles.confirmationInfo}>
                  <div className={styles.confirmationItem}>
                    <span className={styles.confirmationIcon}>🔓</span>
                    <div>
                      <strong>Transparent Funds</strong>
                      <br />
                      <small>Ready after 1 confirmation (~2.5 minutes)</small>
                    </div>
                  </div>
                  <div className={styles.confirmationItem}>
                    <span className={styles.confirmationIcon}>📨</span>
                    <div>
                      <strong>Received Shielded Funds</strong>
                      <br />
                      <small>Ready after 1 confirmation (~2.5 minutes)</small>
                    </div>
                  </div>
                  <div className={styles.confirmationItem}>
                    <span className={styles.confirmationIcon}>🔄</span>
                    <div>
                      <strong>Auto-Shielded Funds</strong>
                      <br />
                      <small>Ready after 2 confirmations (~5 minutes)</small>
                    </div>
                  </div>
                </div>
                <p><strong>Important:</strong> Auto-shielding happens when you make a transaction - the wallet automatically moves your T-address balance to Z-addresses for privacy.</p>
              </div>
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3>🆘 Common Issues</h3>
            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>💸 "Can't Send Transaction"</div>
              <div className={styles.helpCardBody}>
                <ul>
                  <li>✅ Check available balance (not "confirming" funds)</li>
                  <li>✅ Wait for auto-shielded funds to mature (2 confirmations)</li>
                  <li>✅ Received shielded funds are ready after 1 confirmation</li>
                  <li>✅ Verify recipient address format</li>
                  <li>✅ Ensure sufficient balance for fees</li>
                </ul>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🔄 "Wallet Not Syncing"</div>
              <div className={styles.helpCardBody}>
                <ul>
                  <li>✅ Check internet connection</li>
                  <li>✅ Restart the wallet application</li>
                  <li>✅ Check firewall settings</li>
                  <li>✅ Server: lightd.btcz.rocks:9067 (default)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3>🔒 Security Best Practices</h3>
            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🔑 Seed Phrase Security</div>
              <div className={styles.helpCardBody}>
                <div className={styles.securityTips}>
                  <div className={styles.securityTip}>
                    <span className={styles.tipIcon}>✅</span>
                    <div>
                      <strong>Write down</strong> your 24-word seed phrase
                      <br />
                      <small>Use pen and paper, not digital storage</small>
                    </div>
                  </div>
                  <div className={styles.securityTip}>
                    <span className={styles.tipIcon}>✅</span>
                    <div>
                      <strong>Store safely</strong> in multiple secure locations
                      <br />
                      <small>Safe deposit box, fireproof safe, etc.</small>
                    </div>
                  </div>
                  <div className={styles.securityTip}>
                    <span className={styles.tipIcon}>❌</span>
                    <div>
                      <strong>Never share</strong> with anyone
                      <br />
                      <small>Not even BitcoinZ support or developers</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.helpFooter}>
            <p>
              <strong>BitcoinZ Blue</strong> - Modern. Secure. Private. 💙
            </p>
            <p>
              <small>
                For technical support, visit our{" "}
                <a href="https://github.com/z-bitcoinz/BitcoinZ_Blue" target="_blank" rel="noopener noreferrer">
                  GitHub repository
                </a>{" "}
                or join the BitcoinZ community.
              </small>
            </p>
          </div>
        </div>
      </div>
    );
  }
}
