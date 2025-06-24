import Modal from "react-modal";
import React, { useEffect, useState } from "react";
import cstyles from "./Common.module.css";
import Utils from "../utils/utils";
const { ipcRenderer } = window.require("electron");

type ModalProps = {
  modalIsOpen: boolean;
  closeModal: () => void;
  openErrorModal: (title: string, body: string) => void;
};

export default function ServerSelectModal({ modalIsOpen, closeModal, openErrorModal }: ModalProps) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");

  useEffect(() => {
    (async () => {
      const settings = await ipcRenderer.invoke("loadSettings");
      const server = settings?.lwd?.serveruri || "";
      setCustom(server);
    })();
  }, []);

  const switchServer = () => {
    let serveruri = selected;
    if (serveruri === "custom") {
      serveruri = custom;
    }

    ipcRenderer.invoke("saveSettings", { key: "lwd.serveruri", value: serveruri });

    closeModal();

    setTimeout(() => {
      openErrorModal("Restart BitcoinZ Wallet", "Please restart BitcoinZ Wallet to connect to the new server");
    }, 10);
  };

  const servers = [
    { name: "BitcoinZ (Default)", uri: Utils.V3_LIGHTWALLETD },
    { name: "BitcoinZ Local", uri: "http://localhost:9067" },
    { name: "BitcoinZ Community (9067)", uri: "https://lightd.btcz.rocks:9067" },
    { name: "BitcoinZ Community (443)", uri: "https://lightd.btcz.rocks:443" },
  ];

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
    minWidth: '120px',
    justifyContent: 'center'
  };

  const disabledButtonStyle = {
    ...modernButtonStyle,
    background: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'not-allowed'
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
          maxWidth: '600px',
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
          Switch LightwalletD Server
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {servers.map((s) => (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px'
            }} key={s.uri}>
              <input
                type="radio"
                name="server"
                value={s.uri}
                onClick={(e) => setSelected(e.currentTarget.value)}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontWeight: '600' }}>{s.name}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>- {s.uri}</span>
            </div>
          ))}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px'
          }}>
            <input
              type="radio"
              name="server"
              value="custom"
              onClick={(e) => setSelected(e.currentTarget.value)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontWeight: '600' }}>Custom Server:</span>
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Enter custom server URL"
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '13px',
                outline: 'none'
              }}
            />
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
            onClick={switchServer}
            disabled={selected === ""}
            style={selected === "" ? disabledButtonStyle : modernButtonStyle}
            onMouseEnter={(e) => {
              if (selected !== "") {
                const target = e.target as HTMLButtonElement;
                target.style.background = 'rgba(255, 255, 255, 0.25)';
                target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                target.style.transform = 'translateY(-1px)';
                target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== "") {
                const target = e.target as HTMLButtonElement;
                target.style.background = 'rgba(255, 255, 255, 0.15)';
                target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <i className="fas fa-exchange-alt" />
            Switch Server
          </button>
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
            <i className="fas fa-times" />
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
