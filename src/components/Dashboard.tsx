/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-plusplus */
/* eslint-disable react/prop-types */

import React, { useState } from "react";
import { useHistory } from "react-router";
import dateformat from "dateformat";
import Modal from "react-modal";
import styles from "./Dashboard.module.css";
import cstyles from "./Common.module.css";
import { TotalBalance, Info, AddressBalance, Transaction } from "./AppState";
import Utils from "../utils/utils";
// Removed unused imports - using custom balance components now
import routes from "../constants/routes.json";
import RPC from "../rpc";

type Props = {
  totalBalance: TotalBalance;
  info: Info;
  addressesWithBalance: AddressBalance[];
  transactions: Transaction[];
};

const Home: React.FC<Props> = ({ totalBalance, info, addressesWithBalance, transactions }) => {
  const history = useHistory();
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [showShieldSuccessModal, setShowShieldSuccessModal] = useState(false);
  const [shieldTxId, setShieldTxId] = useState("");
  const [isShielding, setIsShielding] = useState(false);

  const navigateToTransactions = () => {
    history.push(routes.TRANSACTIONS);
  };

  const handleShieldIconClick = () => {
    if (totalBalance.transparent <= 0) {
      alert("No transparent funds to shield");
      return;
    }

    if (totalBalance.pendingTransparent > 0) {
      alert("Cannot shield while funds are pending confirmation.\n\nPlease wait for at least 1 confirmation before shielding.");
      return;
    }

    setShowShieldModal(true);
  };

  const handleShieldFunds = async () => {
    setShowShieldModal(false);
    setIsShielding(true);

    try {
      const result = RPC.doShield();

      if (result.error) {
        setIsShielding(false);
        alert(`Shielding failed: ${result.error}`);
      } else if (result.txid) {
        setIsShielding(false);
        setShieldTxId(result.txid);
        setShowShieldSuccessModal(true);
      } else {
        setIsShielding(false);
        alert("Shielding transaction submitted");
      }
    } catch (error) {
      console.error("Shield error:", error);
      setIsShielding(false);
      alert(`Failed to shield funds: ${error}`);
    }
  };

  const handleCopyTxId = () => {
    navigator.clipboard.writeText(shieldTxId);
    // Could add a toast notification here
  };



    return (
      <>
      <div className={styles.dashboardContainer}>
        {/* Fixed Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div className={styles.addressbalancecontainer}>
            {/* Unified Balance Card */}
            <div className={styles.unifiedBalanceCard}>
              {/* Main Total Balance Section */}
              <div className={styles.totalBalanceSection}>
                <div className={styles.mainBalanceTitle}>Total BitcoinZ Balance</div>
                <div className={styles.mainBalanceAmount}>
                  {Utils.maxPrecisionTrimmedBtcz(totalBalance.total)}
                </div>
                <div className={styles.mainBalanceUsd}>
                  {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.total)}
                </div>
                {totalBalance.pendingChange > 0 && (
                  <div className={styles.pendingChangeNotice}>
                    <i className="fas fa-clock"></i>
                    <span>{Utils.maxPrecisionTrimmedBtcz(totalBalance.pendingChange)} BTCZ change pending</span>
                    <div className={styles.pendingChangeTooltip}>
                      Your transaction is being processed. The change will appear shortly.
                    </div>
                  </div>
                )}
              </div>

              {/* Balance Breakdown Section */}
              <div className={styles.balanceBreakdownSection}>
                <div className={styles.breakdownSectionTitle}>Balance Breakdown</div>
                <div className={styles.balanceBreakdownGrid}>
                  <div className={styles.balanceBreakdownItem} style={{ position: 'relative' }}>
                    <div className={styles.breakdownLabel}>
                      Transparent
                      {totalBalance.pendingTransparent > 0 && (
                        <span className={styles.pendingIndicator}>
                          <i className="fas fa-circle-notch"></i>
                        </span>
                      )}
                    </div>
                    <div className={styles.breakdownAmount}>
                      {Utils.maxPrecisionTrimmedBtcz(totalBalance.transparent)}
                    </div>
                    <div className={styles.breakdownUsd}>
                      {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.transparent)}
                    </div>
                    {totalBalance.pendingTransparent > 0 && (
                      <div className={styles.pendingAmount}>
                        +{Utils.maxPrecisionTrimmedBtcz(totalBalance.pendingTransparent)} confirming
                      </div>
                    )}
                    {totalBalance.transparent > 0 && totalBalance.pendingTransparent === 0 && (
                      <div
                        className={styles.shieldIconGroup}
                        onClick={handleShieldIconClick}
                        title="Click to shield transparent funds for privacy"
                      >
                        <i className="fas fa-eye" />
                        <i className="fas fa-arrow-right" />
                        <i className="fas fa-shield-alt" />
                      </div>
                    )}
                  </div>

                  <div className={styles.balanceBreakdownItem}>
                    <div className={styles.breakdownLabel}>
                      Private
                      {totalBalance.pendingShielded > 0 && (
                        <span className={styles.pendingIndicator}>
                          <i className="fas fa-circle-notch"></i>
                        </span>
                      )}
                    </div>
                    <div className={styles.breakdownAmount}>
                      {Utils.maxPrecisionTrimmedBtcz(totalBalance.zbalance)}
                    </div>
                    <div className={styles.breakdownUsd}>
                      {Utils.getBtczToUsdStringBtcz(info.btczPrice, totalBalance.zbalance)}
                    </div>
                    {totalBalance.pendingShielded > 0 && (
                      <div className={styles.pendingAmount}>
                        +{Utils.maxPrecisionTrimmedBtcz(totalBalance.pendingShielded)} confirming
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className={styles.dashboardContent}>
          <div className={styles.recentTransactionsSection}>
            <div className={styles.recentTransactionsHeader}>
              <h3 className={styles.recentTransactionsTitle}>Recent Transactions</h3>
              {transactions && transactions.length > 0 && (
                <button
                  className={styles.viewAllButton}
                  onClick={navigateToTransactions}
                >
                  View All
                </button>
              )}
            </div>

            {!transactions && (
              <div className={[cstyles.center, cstyles.sublight].join(" ")} style={{ padding: "20px 12px", fontSize: "11px" }}>
                Loading transactions...
              </div>
            )}

            {transactions && transactions.length === 0 && (
              <div className={[cstyles.center, cstyles.sublight].join(" ")} style={{ padding: "20px 12px", fontSize: "11px" }}>
                No transactions yet. Start by receiving some BTCZ!
              </div>
            )}

            {transactions && transactions.length > 0 && (
              <div className={styles.recentTransactionsList}>
                {transactions.slice(0, 8).map((tx) => {
                  const txDate = new Date(tx.time * 1000);
                  const datePart = dateformat(txDate, "mmm dd");
                  const timePart = dateformat(txDate, "hh:MM tt");
                  const { bigPart, smallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(Math.abs(tx.amount));

                  return (
                    <div
                      key={tx.txid}
                      className={styles.recentTransactionItem}
                      onClick={navigateToTransactions}
                    >
                      <div className={styles.transactionIcon}>
                        <i
                          className={`fas ${tx.type === "receive" ? "fa-arrow-down" : "fa-arrow-up"}`}
                          style={{
                            color: tx.type === "receive" ? "#00E676" : "#FF5722",
                            textShadow: `0 1px 2px rgba(0, 0, 0, 0.5)`
                          }}
                        />
                      </div>

                      <div className={styles.transactionDetails}>
                        <div className={styles.transactionType}>
                          {tx.type === "receive" ? "Received" : "Sent"}
                          {tx.confirmations === 0 && (
                            <span className={[cstyles.orange, cstyles.small].join(" ")}> (confirming)</span>
                          )}
                        </div>
                        <div className={[cstyles.sublight, cstyles.small].join(" ")}>
                          {datePart} at {timePart}
                        </div>
                      </div>

                      <div className={styles.transactionAmount}>
                        <div className={styles.transactionAmountValue}>
                          {bigPart}<span className={[cstyles.small, cstyles.btczsmallpart].join(" ")}>{smallPart}</span>
                        </div>
                        <div className={styles.transactionAmountUsd}>
                          {Utils.getBtczToUsdStringBtcz(info.btczPrice, Math.abs(tx.amount))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shield Confirmation Modal */}
      <Modal
        isOpen={showShieldModal}
        onRequestClose={() => setShowShieldModal(false)}
        className={cstyles.modal}
        overlayClassName={cstyles.modalOverlay}
        style={{
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 10000
          },
          content: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #6A1B9A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            zIndex: 10001,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
          }
        }}
      >
        <div style={{ textAlign: 'center', color: 'white' }}>
          {/* Shield Icon */}
          <div style={{ marginBottom: '20px' }}>
            <i className="fas fa-shield-alt" style={{ fontSize: '56px', color: '#E1BEE7', textShadow: '0 4px 12px rgba(225, 190, 231, 0.5)' }} />
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
            🛡️ Shield Your Transparent Funds
          </h2>

          {/* Amount Display */}
          <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px', color: '#E1BEE7' }}>
            {Utils.maxPrecisionTrimmedBtcz(totalBalance.transparent)} BTCZ
          </div>

          {/* Fee Info */}
          <p style={{ fontSize: '13px', marginBottom: '20px', color: 'rgba(255, 255, 255, 0.85)' }}>
            A small network fee of <strong>0.0001 BTCZ</strong> will be deducted
          </p>

          {/* Privacy Benefits */}
          <div style={{ textAlign: 'left', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#E1BEE7' }}>
              Protect Your Privacy Now:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
              <span style={{ fontSize: '13px' }}>Hide your wallet activity</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
              <span style={{ fontSize: '13px' }}>Stop others from tracking your funds</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
              <span style={{ fontSize: '13px' }}>Make your balance private immediately</span>
            </div>
          </div>

          {/* Why Shield Now */}
          <div style={{ background: 'rgba(255, 165, 0, 0.15)', border: '1px solid rgba(255, 165, 0, 0.3)', borderRadius: '8px', padding: '14px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#FFD700' }}>
              ⚠️ Why Shield Now?
            </div>
            <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.95)', margin: '0 0 8px 0' }}>
              Your transparent balance is <strong>visible on the blockchain RIGHT NOW</strong>. Anyone can see how much you have, where it came from, and your transaction history.
            </p>
            <p style={{ fontSize: '11px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.85)', margin: 0, fontStyle: 'italic' }}>
              Note: While funds auto-shield when sending, your balance stays visible until then. Shield now for immediate privacy!
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowShieldModal(false)}
              disabled={isShielding}
              className={styles.modalButton}
              style={{
                padding: '12px 28px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isShielding ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                opacity: isShielding ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleShieldFunds}
              disabled={isShielding}
              className={styles.modalButtonPrimary}
              style={{
                padding: '12px 28px',
                background: isShielding ? 'rgba(156, 39, 176, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '700',
                cursor: isShielding ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                opacity: isShielding ? 0.8 : 1
              }}
            >
              {isShielding ? (
                <>
                  <i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }} />
                  Shielding...
                </>
              ) : (
                <>
                  <i className="fas fa-shield-alt" style={{ marginRight: '8px' }} />
                  Shield Now
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Shield Success Modal */}
      <Modal
        isOpen={showShieldSuccessModal}
        onRequestClose={() => setShowShieldSuccessModal(false)}
        className={cstyles.modal}
        overlayClassName={cstyles.modalOverlay}
        style={{
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          content: {
            position: 'relative',
            top: 'auto',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            transform: 'none',
            background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #6A1B9A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '550px',
            width: '90%',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.4s ease-out'
          }
        }}
      >
        <div style={{ textAlign: 'center', color: 'white' }}>
          {/* Animated Success Icon with Transition Effect */}
          <div style={{
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            position: 'relative'
          }}>
            {/* Transparent Icon (fading out) */}
            <div style={{
              position: 'relative',
              animation: 'fadeOut 0.8s ease-in forwards',
              animationDelay: '0.3s'
            }}>
              <i className="fas fa-eye" style={{
                fontSize: '42px',
                color: 'rgba(255, 255, 255, 0.9)',
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))'
              }} />
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#FF5722',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>✕</div>
            </div>

            {/* Animated Arrow */}
            <div style={{
              animation: 'slideRight 0.6s ease-out',
              animationDelay: '0.2s',
              opacity: 0,
              animationFillMode: 'forwards'
            }}>
              <i className="fas fa-arrow-right" style={{
                fontSize: '32px',
                color: '#86EFAC',
                filter: 'drop-shadow(0 0 8px rgba(134, 239, 172, 0.6))'
              }} />
            </div>

            {/* Shield Icon (appearing) */}
            <div style={{
              animation: 'popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              animationDelay: '0.5s',
              opacity: 0,
              animationFillMode: 'forwards',
              position: 'relative'
            }}>
              <i className="fas fa-shield-alt" style={{
                fontSize: '48px',
                color: '#86EFAC',
                filter: 'drop-shadow(0 0 12px rgba(134, 239, 172, 0.8))',
                textShadow: '0 0 20px rgba(134, 239, 172, 0.6)'
              }} />
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#86EFAC',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#1B5E20',
                animation: 'checkPop 0.4s ease-out',
                animationDelay: '0.9s',
                opacity: 0,
                animationFillMode: 'forwards'
              }}>✓</div>
            </div>
          </div>

          {/* Success Title */}
          <h2 style={{
            fontSize: '26px',
            fontWeight: '700',
            marginBottom: '12px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            animation: 'fadeIn 0.5s ease-out',
            animationDelay: '0.6s',
            opacity: 0,
            animationFillMode: 'forwards'
          }}>
            Shielding Successful!
          </h2>

          {/* Success Message */}
          <p style={{
            fontSize: '15px',
            marginBottom: '28px',
            color: 'rgba(255, 255, 255, 0.95)',
            lineHeight: '1.6',
            animation: 'fadeIn 0.5s ease-out',
            animationDelay: '0.7s',
            opacity: 0,
            animationFillMode: 'forwards'
          }}>
            Your transparent funds are now being moved to a <strong>private shielded address</strong>.<br/>
            Your balance will be <strong>completely private</strong> once confirmed!
          </p>

          {/* Transaction ID Box */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'fadeIn 0.5s ease-out',
            animationDelay: '0.8s',
            opacity: 0,
            animationFillMode: 'forwards'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '10px',
              color: '#E1BEE7',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Transaction ID
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '12px',
              lineHeight: '1.6',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '10px',
              borderRadius: '6px'
            }}>
              {shieldTxId}
            </div>
            <button
              onClick={handleCopyTxId}
              style={{
                padding: '8px 20px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <i className="fas fa-copy" />
              Copy Transaction ID
            </button>
          </div>

          {/* Privacy Achievement Badge */}
          <div style={{
            background: 'rgba(134, 239, 172, 0.15)',
            border: '1px solid rgba(134, 239, 172, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '28px',
            animation: 'fadeIn 0.5s ease-out',
            animationDelay: '0.9s',
            opacity: 0,
            animationFillMode: 'forwards'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <i className="fas fa-lock" style={{ fontSize: '16px', color: '#86EFAC' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#86EFAC' }}>
                Privacy Protection Activated
              </span>
              <i className="fas fa-lock" style={{ fontSize: '16px', color: '#86EFAC' }} />
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setShowShieldSuccessModal(false)}
            style={{
              padding: '14px 36px',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
              animation: 'fadeIn 0.5s ease-out',
              animationDelay: '1s',
              opacity: 0,
              animationFillMode: 'forwards'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            }}
          >
            Close
          </button>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeOut {
            from {
              opacity: 1;
              transform: scale(1);
            }
            to {
              opacity: 0;
              transform: scale(0.8);
            }
          }

          @keyframes slideRight {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes popIn {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes checkPop {
            0% {
              opacity: 0;
              transform: scale(0);
            }
            50% {
              transform: scale(1.3);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </Modal>
      </>
    );
};

export default Home;
