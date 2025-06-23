/* eslint-disable react/prop-types */
import Modal from "react-modal";
import React, { useState } from "react";
import cstyles from "./Common.module.css";

// Add CSS for modern close button
const modernButtonCSS = `
  .modern-close-button {
    all: unset !important;
    min-width: 120px !important;
    padding: 10px 16px !important;
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
    color: white !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    box-sizing: border-box !important;
  }

  .modern-close-button:hover {
    background: rgba(255, 255, 255, 0.15) !important;
    transform: translateY(-1px) !important;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = modernButtonCSS;
  if (!document.head.querySelector('style[data-modern-button]')) {
    styleElement.setAttribute('data-modern-button', 'true');
    document.head.appendChild(styleElement);
  }
}

const { shell, clipboard } = window.require("electron");

export class TransactionSuccessModalData {
  title: string;
  txid: string;
  modalIsOpen: boolean;
  closeModal?: () => void;
  redirectToDashboard?: () => void;

  constructor() {
    this.modalIsOpen = false;
    this.title = "";
    this.txid = "";
  }
}

type TransactionSuccessModalProps = {
  title: string;
  txid: string;
  modalIsOpen: boolean;
  closeModal?: () => void;
  redirectToDashboard?: () => void;
};

export const TransactionSuccessModal = ({ title, txid, modalIsOpen, closeModal, redirectToDashboard }: TransactionSuccessModalProps) => {
  const [copiedTxid, setCopiedTxid] = useState(false);

  const copyTransactionId = () => {
    clipboard.writeText(txid);
    setCopiedTxid(true);
    setTimeout(() => setCopiedTxid(false), 2000);
  };

  const shareTransaction = () => {
    const shareText = `BitcoinZ Transaction\nTXID: ${txid}\nExplorer: https://explorer.getbtcz.com/#/tx/${txid}`;
    
    // Try to use the native share API if available
    if (navigator.share) {
      navigator.share({
        title: 'BitcoinZ Transaction',
        text: shareText,
        url: `https://explorer.getbtcz.com/#/tx/${txid}`
      }).catch((err) => {
        console.log('Error sharing:', err);
        // Fallback to clipboard
        clipboard.writeText(shareText);
      });
    } else {
      // Fallback to clipboard
      clipboard.writeText(shareText);
    }
  };

  const openInExplorer = () => {
    const explorerUrl = `https://explorer.getbtcz.com/#/tx/${txid}`;
    shell.openExternal(explorerUrl);
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={() => {
        if (closeModal) {
          closeModal();
        }
      }}
      className={cstyles.modal}
      overlayClassName={cstyles.modalOverlay}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        },
        content: {
          position: 'relative',
          top: 'auto',
          left: 'auto',
          right: 'auto',
          bottom: 'auto',
          border: 'none',
          background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 50%, #1e3a8a 100%)',
          borderRadius: '16px',
          padding: '20px',
          maxWidth: '450px',
          width: '90%',
          maxHeight: '380px',
          overflow: 'visible',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }
      }}
    >
      <div className={[cstyles.verticalflex].join(" ")}>
        <div className={cstyles.marginbottomlarge} style={{ textAlign: "center" }}>
          {title}
        </div>

        <div style={{
          textAlign: "center",
          marginBottom: "24px",
          padding: "12px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.15)"
        }}>
          <div style={{
            marginBottom: "12px",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Transaction was successfully broadcast.
          </div>
          <div style={{
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            TXID:
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "10px",
            padding: "6px 8px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            wordBreak: "break-all",
            lineHeight: "1.3"
          }}>
            {txid}
          </div>
        </div>

        {/* Transaction Action Buttons */}
        <div style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          marginBottom: "20px",
          marginTop: "20px",
          flexWrap: "wrap"
        }}>
          <button
            type="button"
            onClick={copyTransactionId}
            style={{
              minWidth: "100px",
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "white",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <i className={copiedTxid ? "fas fa-check" : "fas fa-copy"} />
            {copiedTxid ? "Copied!" : "Copy TXID"}
          </button>

          <button
            type="button"
            onClick={shareTransaction}
            style={{
              minWidth: "100px",
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "white",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <i className="fas fa-share-alt" />
            Share
          </button>

          <button
            type="button"
            onClick={openInExplorer}
            style={{
              minWidth: "100px",
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "white",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <i className="fas fa-external-link-alt" />
            Explorer
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          className="modern-close-button"
          onClick={() => {
            if (closeModal) {
              closeModal();
            }
            // Don't automatically redirect - let user choose
          }}
          style={{
            minWidth: "100px",
            padding: "8px 16px",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "white",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            textTransform: "none",
            letterSpacing: "normal"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
