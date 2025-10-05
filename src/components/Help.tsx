import React, { Component } from "react";
import styles from "./Help.module.css";

interface HelpState {
  activeTab: string;
}

export default class Help extends Component<{}, HelpState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      activeTab: "help"
    };
  }

  render() {
    const { activeTab } = this.state;

    return (
      <div className={styles.helpContainer}>
        <div className={styles.helpHeader}>
          <h2>📚 BitcoinZ Blue Help & About</h2>
          <p>Everything you need to know about using your BitcoinZ wallet</p>
        </div>

        <div className={styles.helpTabs} style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
          <button
            onClick={() => this.setState({ activeTab: "help" })}
            style={{
              padding: '12px 30px',
              background: activeTab === "help" ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px 10px 0 0',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '16px'
            }}
          >
            📖 Help
          </button>
          <button
            onClick={() => this.setState({ activeTab: "about" })}
            style={{
              padding: '12px 30px',
              background: activeTab === "about" ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px 10px 0 0',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '16px'
            }}
          >
            ℹ️ About
          </button>
        </div>

        <div className={styles.helpContent}>
          {activeTab === "help" && (
            <>
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
            <h3>💰 Understanding Your Spendable Balance (How Notes Work)</h3>
            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🎫 What Are Sapling Notes?</div>
              <div className={styles.helpCardBody}>
                <p><strong>Think of notes like physical bills in your wallet:</strong></p>
                <ul style={{ marginTop: '10px', lineHeight: '1.8' }}>
                  <li>💵 You have: $100 bill, $50 bill, $20 bill</li>
                  <li>💰 Total: $170</li>
                  <li>📝 Each bill is a separate "note"</li>
                </ul>

                <p style={{ marginTop: '15px' }}><strong>In BitcoinZ:</strong></p>
                <ul style={{ marginTop: '10px', lineHeight: '1.8' }}>
                  <li>🎫 You might have: 10,000 BTCZ note, 5,000 BTCZ note</li>
                  <li>💰 Total: 15,000 BTCZ</li>
                  <li>📝 Each amount is a separate Sapling "note"</li>
                </ul>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🔄 Why Your Spendable Balance Drops After Sending</div>
              <div className={styles.helpCardBody}>
                <p><strong>Example: You send 1 BTCZ from 10,000 BTCZ</strong></p>

                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 255, 0, 0.05)', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '8px' }}>
                  <strong>BEFORE SENDING:</strong>
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '5px' }}>
                    <div>✅ Spendable: <strong>10,000 BTCZ</strong></div>
                    <div>✅ Total: <strong>10,000 BTCZ</strong></div>
                    <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>You have one 10,000 BTCZ note</small>
                  </div>
                </div>

                <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(33, 150, 243, 0.05)', border: '1px solid rgba(33, 150, 243, 0.3)', borderRadius: '8px' }}>
                  <strong>WHAT HAPPENS:</strong>
                  <ol style={{ marginTop: '10px', lineHeight: '1.8' }}>
                    <li>Wallet uses the FULL 10,000 BTCZ note</li>
                    <li>Sends 1 BTCZ to recipient</li>
                    <li>Creates 9,999 BTCZ "change" returning to you</li>
                  </ol>
                </div>

                <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(255, 165, 0, 0.05)', border: '1px solid rgba(255, 165, 0, 0.3)', borderRadius: '8px' }}>
                  <strong>IMMEDIATELY AFTER (Scary! 😱):</strong>
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '5px' }}>
                    <div>⚠️ Spendable: <strong>0 BTCZ</strong> ← Change not confirmed yet!</div>
                    <div>✅ Total: <strong>10,000 BTCZ</strong></div>
                    <div>⏱️ Change Returning: <strong>9,999 BTCZ</strong> (waiting ~1-2 min)</div>
                  </div>
                </div>

                <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(0, 255, 0, 0.05)', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '8px' }}>
                  <strong>AFTER 1 CONFIRMATION (~2.5 min):</strong>
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '5px' }}>
                    <div>✅ Spendable: <strong>9,999 BTCZ</strong> ← Change confirmed!</div>
                    <div>✅ Total: <strong>9,999 BTCZ</strong></div>
                    <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Everything is back to normal!</small>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>💡 Real-World Analogy</div>
              <div className={styles.helpCardBody}>
                <p><strong>Like paying with cash:</strong></p>
                <ul style={{ marginTop: '10px', lineHeight: '1.8' }}>
                  <li>💵 You have: $100 bill</li>
                  <li>☕ You buy: $1 coffee</li>
                  <li>💸 You give: Full $100 bill (can't split it!)</li>
                  <li>💰 You get back: $99 change</li>
                  <li>⏱️ While waiting for change: You have $0 spendable</li>
                  <li>✅ After getting change: You have $99 spendable</li>
                </ul>

                <div className={styles.safetyNote} style={{ marginTop: '15px' }}>
                  <strong>Same with BitcoinZ notes!</strong> You can't split a note, so the wallet uses the full amount and creates change.
                </div>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>⏱️ Why Does Change Need Confirmation?</div>
              <div className={styles.helpCardBody}>
                <ul style={{ lineHeight: '1.8' }}>
                  <li>🔒 <strong>Security:</strong> Prevents double-spending attacks</li>
                  <li>🌐 <strong>Network consensus:</strong> Ensures transaction is accepted by the network</li>
                  <li>🌳 <strong>Cryptographic tree:</strong> Note must be included in the Sapling commitment tree</li>
                  <li>⏱️ <strong>Time needed:</strong> ~1-2 minutes (1 confirmation)</li>
                </ul>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>📊 More Examples</div>
              <div className={styles.helpCardBody}>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Example 1: Send 100 from 500 BTCZ</strong>
                  <ul style={{ marginTop: '5px', lineHeight: '1.6' }}>
                    <li>Before: Spendable 500</li>
                    <li>After: Spendable 0, Change 400 (waiting)</li>
                    <li>After 1 conf: Spendable 400 ✅</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <strong>Example 2: Send 5,000 from 10,000 BTCZ</strong>
                  <ul style={{ marginTop: '5px', lineHeight: '1.6' }}>
                    <li>Before: Spendable 10,000</li>
                    <li>After: Spendable 0, Change 5,000 (waiting)</li>
                    <li>After 1 conf: Spendable 5,000 ✅</li>
                  </ul>
                </div>

                <div>
                  <strong>Example 3: Multiple notes (1,000 + 2,000 + 5,000 BTCZ)</strong>
                  <ul style={{ marginTop: '5px', lineHeight: '1.6' }}>
                    <li>Send 500: Uses 1,000 note, change 500</li>
                    <li>Remaining: 2,000 + 5,000 still spendable immediately</li>
                    <li>After 1 conf: All 7,500 spendable (500 + 2,000 + 5,000) ✅</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>✅ Key Takeaways</div>
              <div className={styles.helpCardBody}>
                <ul style={{ lineHeight: '1.8' }}>
                  <li>🎫 <strong>Notes are like physical bills</strong> - can't be split</li>
                  <li>💸 <strong>Wallet uses full notes</strong> and creates change</li>
                  <li>⏱️ <strong>Change needs 1 confirmation</strong> (~1-2 min) to be spendable</li>
                  <li>✅ <strong>Your funds are SAFE</strong> - just waiting for confirmation</li>
                  <li>💰 <strong>Total balance stays the same</strong> during this time</li>
                  <li>🔧 <strong>This is normal blockchain behavior</strong>, not a bug!</li>
                </ul>

                <div className={styles.safetyNote} style={{ marginTop: '15px', background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                  <strong>💡 Don't Panic!</strong> When you see your spendable balance drop to 0 after sending, it's completely normal. Your change is on the way and will be spendable in ~1-2 minutes!
                </div>
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
            <h3>🔑 Importing Private Keys & Wallet Birthday</h3>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🎂 What is Wallet Birthday?</div>
              <div className={styles.helpCardBody}>
                <p>The "birthday" is the block height (block number) where your wallet or a specific private key was first created or used.</p>

                <div className={styles.safetyNote} style={{ marginTop: '15px', background: 'rgba(74, 144, 226, 0.1)', border: '1px solid rgba(74, 144, 226, 0.3)' }}>
                  <strong>Why it matters:</strong> The wallet only scans the blockchain starting from the birthday block. This saves time by not scanning blocks where no transactions could exist.
                </div>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>📥 Importing Private Keys</div>
              <div className={styles.helpCardBody}>
                <p>When importing a private key, you must specify its birthday (the block height where it was first used):</p>

                <ul style={{ marginTop: '10px', marginBottom: '15px' }}>
                  <li><strong>Use 0</strong> - Scans entire blockchain (safest, but slower)</li>
                  <li><strong>Use 328,500</strong> - BitcoinZ Sapling activation (for shielded addresses created after this block)</li>
                  <li><strong>Use specific height</strong> - If you know exactly when the key was created/first used</li>
                </ul>

                <div className={styles.safetyNote} style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                  <strong>⚠️ Important:</strong> If you set the birthday too high (after the key's actual first use), you will miss transactions! When in doubt, always use birthday 0.
                </div>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🔄 Rescan Process</div>
              <div className={styles.helpCardBody}>
                <p>After importing a private key, the wallet rescans the blockchain:</p>

                <ol style={{ marginTop: '10px', lineHeight: '1.8' }}>
                  <li>Wallet clears its transaction history</li>
                  <li>Starts scanning from the birthday block height</li>
                  <li>Searches every block for transactions belonging to your keys</li>
                  <li>Rebuilds your transaction history and balance</li>
                </ol>

                <div className={styles.safetyNote} style={{ marginTop: '15px', background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                  <strong>💡 Tip:</strong> Rescanning from block 0 can take several minutes. Be patient and let it complete - your funds will appear once the scan reaches the blocks containing your transactions.
                </div>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>❌ Common Import Issues</div>
              <div className={styles.helpCardBody}>
                <ul>
                  <li><strong>Missing funds after import?</strong> You likely set the birthday too high. Import again with birthday = 0</li>
                  <li><strong>Import stuck/slow?</strong> Birthday 0 scans the entire chain - this is normal and may take time</li>
                  <li><strong>Can't import private key?</strong> Ensure wallet is unlocked (for viewing keys) or unencrypted (for spending keys)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3>🔒 Security Best Practices</h3>
            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🔐 PIN Protection</div>
              <div className={styles.helpCardBody}>
                <div className={styles.securityTips}>
                  <div className={styles.securityTip}>
                    <span className={styles.tipIcon}>🔢</span>
                    <div>
                      <strong>4-digit PIN</strong> protects your wallet
                      <br />
                      <small>Quick access while maintaining security</small>
                    </div>
                  </div>
                  <div className={styles.securityTip}>
                    <span className={styles.tipIcon}>⚡</span>
                    <div>
                      <strong>Progressive lockout</strong> prevents brute force
                      <br />
                      <small>Lockout time increases with failed attempts</small>
                    </div>
                  </div>
                  <div className={styles.securityTip}>
                    <span className={styles.tipIcon}>🔒</span>
                    <div>
                      <strong>Auto-lock options</strong> available in settings
                      <br />
                      <small>Lock on app close or after inactivity</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                    <span className={styles.tipIcon}>📅</span>
                    <div>
                      <strong>Remember wallet birthday</strong> (creation date)
                      <br />
                      <small>Speeds up wallet restoration by skipping old blocks</small>
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

                <div className={styles.safetyNote}>
                  <strong>🎂 What is Wallet Birthday?</strong>
                  <p>Your wallet birthday is the date when you first created your wallet. When restoring from seed phrase, the wallet only needs to scan blocks from this date forward, making restoration much faster.</p>
                  <ul>
                    <li>✅ <strong>Faster restoration</strong> - Skip scanning old blocks</li>
                    <li>✅ <strong>Less bandwidth</strong> - Download only necessary data</li>
                    <li>✅ <strong>Quicker sync</strong> - Get your wallet working sooner</li>
                  </ul>
                  <p><strong>Tip:</strong> Write down the creation date along with your seed phrase!</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3>🌐 BitcoinZ Resources & Community Support</h3>
            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>📚 Official BitcoinZ Homepage</div>
              <div className={styles.helpCardBody}>
                <div className={styles.resourceLink}>
                  <a href="https://getbtcz.com" target="_blank" rel="noopener noreferrer" className={styles.mainResource}>
                    <span className={styles.resourceIcon}>🌍</span>
                    <div className={styles.resourceInfo}>
                      <strong>getbtcz.com</strong>
                      <p>All information about BitcoinZ - whitepapers, wallets, exchanges, roadmap, and more!</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>💬 Live Support from Community</div>
              <div className={styles.helpCardBody}>
                <div className={styles.communityLinks}>
                  <a href="https://discord.com/invite/K59mxyf" target="_blank" rel="noopener noreferrer" className={styles.communityLink}>
                    <span className={styles.communityIcon}>💙</span>
                    <div className={styles.communityInfo}>
                      <strong>Discord Community</strong>
                      <p>Join our active Discord server for real-time help and discussions</p>
                    </div>
                  </a>
                  
                  <a href="https://t.me/btczofficialgroup" target="_blank" rel="noopener noreferrer" className={styles.communityLink}>
                    <span className={styles.communityIcon}>📱</span>
                    <div className={styles.communityInfo}>
                      <strong>Telegram Group</strong>
                      <p>@btczofficialgroup - Get instant support from the community</p>
                    </div>
                  </a>
                </div>

                <div className={styles.safetyNote} style={{ marginTop: '20px' }}>
                  <strong>🤝 Community Guidelines:</strong>
                  <ul>
                    <li>✅ Be respectful and helpful to all members</li>
                    <li>✅ Never share your private keys or seed phrases</li>
                    <li>✅ Verify information from official sources</li>
                    <li>✅ Report suspicious activity to moderators</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3>🔧 Expert Mode - Advanced Information</h3>
            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>📁 Wallet Data Locations</div>
              <div className={styles.helpCardBody}>
                <p><strong>Your wallet data is stored locally on your computer:</strong></p>
                <div style={{ marginTop: '15px' }}>
                  <h6 style={{ fontSize: '16px', marginBottom: '10px' }}>💻 Windows:</h6>
                  <code style={{ display: 'block', padding: '10px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '5px', marginBottom: '15px' }}>
                    %APPDATA%\BitcoinZ-LightWallet\
                  </code>
                  
                  <h6 style={{ fontSize: '16px', marginBottom: '10px' }}>🍎 macOS:</h6>
                  <div style={{ marginBottom: '15px' }}>
                    <code style={{ display: 'block', padding: '10px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '5px', marginBottom: '5px' }}>
                      ~/Library/Application Support/BitcoinZ Wallet Lite/
                    </code>
                    <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Main wallet data (wallet.dat, keys, etc.)</small>
                    
                    <code style={{ display: 'block', padding: '10px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '5px', marginTop: '10px', marginBottom: '5px' }}>
                      ~/Library/Application Support/BitcoinZ-LightWallet/
                    </code>
                    <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Additional data (logs, address book, etc.)</small>
                  </div>
                  
                  <h6 style={{ fontSize: '16px', marginBottom: '10px' }}>🐧 Linux:</h6>
                  <code style={{ display: 'block', padding: '10px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '5px' }}>
                    ~/.bitcoinz-lightwallet/
                  </code>
                </div>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>📄 Important Files</div>
              <div className={styles.helpCardBody}>
                <ul style={{ lineHeight: '1.8' }}>
                  <li><strong>wallet.dat</strong> - Your encrypted wallet data (contains private keys)</li>
                  <li><strong>lightclient.toml</strong> - Configuration file with server settings</li>
                  <li><strong>logs/</strong> - Debug logs for troubleshooting</li>
                  <li><strong>*.lock</strong> - Lock files to prevent multiple instances</li>
                </ul>
                
                <div className={styles.safetyNote} style={{ marginTop: '20px' }}>
                  <strong>⚠️ WARNING:</strong> Never share your wallet.dat file with anyone! It contains your private keys.
                </div>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>💾 Backup & Restore</div>
              <div className={styles.helpCardBody}>
                <h6 style={{ fontSize: '16px', marginBottom: '10px' }}>Creating a Backup:</h6>
                <ol style={{ marginBottom: '20px' }}>
                  <li>Close BitcoinZ Blue wallet completely</li>
                  <li>Navigate to your wallet data directory (see above)</li>
                  <li>Copy the entire folder to a secure backup location</li>
                  <li>Especially important: <code>wallet.dat</code> file</li>
                </ol>
                
                <h6 style={{ fontSize: '16px', marginBottom: '10px' }}>Restoring from Backup:</h6>
                <ol>
                  <li>Close BitcoinZ Blue if running</li>
                  <li>Replace the wallet data folder with your backup</li>
                  <li>Start BitcoinZ Blue - it will rescan the blockchain</li>
                </ol>
              </div>
            </div>

            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🗑️ Complete Reset (Clean Install)</div>
              <div className={styles.helpCardBody}>
                <p><strong>To completely reset BitcoinZ Blue:</strong></p>
                <ol style={{ marginTop: '15px', lineHeight: '1.8' }}>
                  <li>Make sure you have your seed phrase backed up!</li>
                  <li>Close BitcoinZ Blue completely</li>
                  <li>Delete the entire wallet data directory</li>
                  <li>Restart BitcoinZ Blue</li>
                  <li>Restore from your seed phrase</li>
                </ol>
                
                <div className={styles.safetyNote} style={{ marginTop: '20px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
                  <strong>🚨 CRITICAL:</strong> Deleting wallet data without a seed phrase backup means permanent loss of funds!
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {activeTab === "about" && (
            <>
          <div className={styles.helpSection}>
            <h3>📋 About BitcoinZ Blue</h3>
            <div className={styles.helpCard}>
              <div className={styles.helpCardHeader}>🏆 Professional Light Wallet for BitcoinZ</div>
              <div className={styles.helpCardBody}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '24px', color: '#87CEEB', margin: '10px 0' }}>BitcoinZ Blue v2.0.0</h4>
                  <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)' }}>Modern, Secure, Privacy-Focused Light Wallet</p>
                </div>

                <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(74, 144, 226, 0.05)', borderRadius: '8px', border: '1px solid rgba(74, 144, 226, 0.2)' }}>
                  <strong>🚀 About This Wallet</strong>
                  <p style={{ marginTop: '10px', lineHeight: '1.6' }}>
                    BitcoinZ Blue represents the pinnacle of community-driven cryptocurrency wallet development. Built with cutting-edge technology 
                    and a deep commitment to user privacy, this wallet showcases what's possible when talented developers collaborate for a common cause.
                  </p>
                  <p style={{ marginTop: '10px', lineHeight: '1.6' }}>
                    Our development team has invested countless hours ensuring this wallet meets the highest standards of security, usability, and performance. 
                    We utilize industry-leading cryptographic libraries, implement best practices for secure key management, and maintain rigorous testing protocols.
                  </p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <strong>🔧 Technical Excellence</strong>
                  <ul style={{ marginTop: '10px', lineHeight: '1.8' }}>
                    <li>• <strong>zk-SNARKs Technology:</strong> Military-grade privacy protection for your transactions</li>
                    <li>• <strong>Light Client Architecture:</strong> Fast synchronization without downloading the entire blockchain</li>
                    <li>• <strong>Cross-Platform Support:</strong> Native performance on Windows, macOS, and Linux</li>
                    <li>• <strong>Rust + TypeScript:</strong> Memory-safe backend with modern, reactive frontend</li>
                    <li>• <strong>Hardware Security:</strong> Integration with secure key storage mechanisms</li>
                    <li>• <strong>Open Source:</strong> Fully auditable codebase with transparent development</li>
                  </ul>
                </div>

                <div className={styles.safetyNote} style={{ background: 'rgba(255, 0, 0, 0.05)', border: '1px solid rgba(255, 0, 0, 0.3)', marginBottom: '30px' }}>
                  <strong>⚖️ LEGAL DISCLAIMER & TERMS OF USE</strong>
                  <p style={{ marginTop: '15px', fontSize: '13px', lineHeight: '1.6' }}>
                    <strong>PLEASE READ CAREFULLY BEFORE USING THIS SOFTWARE</strong>
                  </p>
                  <p style={{ marginTop: '10px', fontSize: '12px', lineHeight: '1.6' }}>
                    This software is provided "AS IS" without warranty of any kind, either express or implied, including but not limited to 
                    the implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
                  </p>
                  <p style={{ marginTop: '10px', fontSize: '12px', lineHeight: '1.6' }}>
                    <strong>NO LIABILITY:</strong> In no event shall the developers, contributors, or BitcoinZ community be liable for any claim, 
                    damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection 
                    with the software or the use or other dealings in the software.
                  </p>
                  <p style={{ marginTop: '10px', fontSize: '12px', lineHeight: '1.6' }}>
                    <strong>ASSUMPTION OF RISK:</strong> You acknowledge that cryptocurrency transactions carry inherent risks, including but not 
                    limited to the risk of software bugs, hardware failures, protocol changes, regulatory actions, and market volatility. 
                    You assume full responsibility for all risks associated with using this wallet.
                  </p>
                  <p style={{ marginTop: '10px', fontSize: '12px', lineHeight: '1.6' }}>
                    <strong>NO PROFESSIONAL ADVICE:</strong> Nothing in this software constitutes professional financial, investment, legal, 
                    or tax advice. You should consult with appropriate professionals before making any financial decisions.
                  </p>
                </div>

                <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(255, 165, 0, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 165, 0, 0.2)' }}>
                  <strong>🛡️ Security & Best Practices</strong>
                  <p style={{ marginTop: '10px', fontSize: '14px', lineHeight: '1.6' }}>
                    While our developers have implemented numerous security measures and follow industry best practices, 
                    no software can guarantee absolute security. Users must take responsibility for their own security:
                  </p>
                  <ul style={{ marginTop: '10px', fontSize: '13px', lineHeight: '1.8' }}>
                    <li>• <strong>Always</strong> download from official sources: <strong style={{ color: '#87CEEB' }}>getbtcz.com</strong></li>
                    <li>• <strong>Verify</strong> SHA256 checksums and digital signatures</li>
                    <li>• <strong>Backup</strong> your seed phrase in multiple secure locations</li>
                    <li>• <strong>Never</strong> share your seed phrase or private keys with anyone</li>
                    <li>• <strong>Test</strong> with small amounts before trusting with larger sums</li>
                    <li>• <strong>Keep</strong> your software updated to the latest version</li>
                    <li>• <strong>Use</strong> PIN protection and enable auto-lock features</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(0, 255, 0, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
                  <strong>🌟 Community & Support</strong>
                  <p style={{ marginTop: '10px', lineHeight: '1.6' }}>
                    BitcoinZ Blue is a testament to the power of decentralized, community-driven development. 
                    Hundreds of contributors worldwide have made this project possible.
                  </p>
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <a href="https://github.com/z-bitcoinz/BitcoinZ_Blue" target="_blank" rel="noopener noreferrer" 
                       style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', textDecoration: 'none', color: '#87CEEB', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>💻</span>
                      <div>
                        <strong>GitHub Repository</strong><br />
                        <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Source code, issues, and contributions</small>
                      </div>
                    </a>
                    <a href="https://getbtcz.com" target="_blank" rel="noopener noreferrer" 
                       style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', textDecoration: 'none', color: '#87CEEB', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🌐</span>
                      <div>
                        <strong>Official BitcoinZ Website</strong><br />
                        <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Downloads, documentation, and resources</small>
                      </div>
                    </a>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '20px' }}>
                  <p><strong>License:</strong> MIT License - Free and Open Source Software</p>
                  <p style={{ marginTop: '5px' }}><strong>Copyright © 2024</strong> BitcoinZ Community Contributors</p>
                  <p style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Built with ❤️ by the BitcoinZ community for the benefit of all humanity
                  </p>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>

        {activeTab === "help" && (
          <div className={styles.helpFooter}>
            <p>
              <strong>BitcoinZ Blue</strong> - Modern. Secure. Private. 💙
            </p>
            <p>
              <small>
                For development updates, visit our{" "}
                <a href="https://github.com/z-bitcoinz/BitcoinZ_Blue" target="_blank" rel="noopener noreferrer">
                  GitHub repository
                </a>
              </small>
            </p>
          </div>
        )}
      </div>
    );
  }
}
