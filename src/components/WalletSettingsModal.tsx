import Modal from "react-modal";
import React, { useEffect, useState } from "react";
import cstyles from "./Common.module.css";
import { WalletSettings } from "./AppState";

type ModalProps = {
  walletSettings: WalletSettings;
  modalIsOpen: boolean;
  closeModal: () => void;
  setWalletSpamFilterThreshold: (threshold: number) => void;
};

export default function WalletSettingsModal({
  walletSettings,
  modalIsOpen,
  closeModal,
  setWalletSpamFilterThreshold,
}: ModalProps) {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (walletSettings.spam_filter_threshold <= 0) {
      setSelected("no_filter");
    } else {
      setSelected("filter");
    }
  }, [walletSettings]);

  const modernButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    margin: '0 8px',
    minWidth: '100px',
    justifyContent: 'center'
  };

  return (
    <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
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
            background: 'linear-gradient(135deg, #4A90E2 0%, #2E5BBA 50%, #1E3A8A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 10001,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
      <div className={[cstyles.verticalflex].join(" ")}>
        <div className={cstyles.marginbottomlarge} style={{
          textAlign: "center",
          color: 'white',
          fontSize: '18px',
          fontWeight: '700',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          marginLeft: 0
        }}>
          Wallet Settings
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            Spam Transaction Filter
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px'
          }}>
            <input
              type="radio"
              name="filter"
              defaultChecked={selected === "filter"}
              value="filter"
              onClick={(e) => setWalletSpamFilterThreshold(50)}
              style={{ marginRight: '8px' }}
            />
            Don't scan spammy transactions (may miss some T address transactions)
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px'
          }}>
            <input
              type="radio"
              name="filter"
              value="no_filter"
              defaultChecked={selected === "no_filter"}
              onClick={(e) => setWalletSpamFilterThreshold(0)}
              style={{ marginRight: '8px' }}
            />
            Scan all transactions (recommended for T address monitoring)
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          marginTop: '16px'
        }}>
          <button
            type="button"
            style={modernButtonStyle}
            onClick={closeModal}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(255, 255, 255, 0.25)';
              target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(255, 255, 255, 0.15)';
              target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <i className="fas fa-save" />
            Save & Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
