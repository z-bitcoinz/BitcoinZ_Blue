/* eslint-disable react/prop-types */
import Modal from "react-modal";
import React from "react";
import cstyles from "./Common.module.css";
import styles from "./Send.module.css";

export class ErrorModalData {
  title: string;
  body: string | JSX.Element;
  modalIsOpen: boolean;
  closeModal?: () => void;

  constructor() {
    this.modalIsOpen = false;
    this.title = "";
    this.body = "";
  }
}

export const ErrorModal = ({ title, body, modalIsOpen, closeModal }: ErrorModalData) => {
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
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
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '400px',
          overflow: 'visible',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          color: '#ffffff'
        }
      }}
    >
      <div className={[cstyles.verticalflex].join(" ")}>
        <div
          className={cstyles.marginbottomlarge}
          style={{
            textAlign: "center",
            fontSize: '18px',
            fontWeight: '700',
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}
        >
          {title}
        </div>

        <div
          style={{
            textAlign: "center",
            wordBreak: "break-all",
            maxHeight: "300px",
            overflowY: "auto",
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            color: '#ffffff',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        >
          {body}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          className={styles.modernButton}
          onClick={closeModal}
          style={{
            minWidth: '100px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <i className="fas fa-times" style={{ marginRight: '8px' }} />
          Close
        </button>
      </div>
    </Modal>
  );
};
