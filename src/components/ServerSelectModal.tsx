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

// Define servers outside component to avoid re-creating on each render
const servers = [
  {
    name: "BitcoinZ Official (Default)",
    uri: Utils.V3_LIGHTWALLETD,
    description: "Official BitcoinZ server - Fast and reliable",
    privacyNote: "⚠️ Your ISP can see you're connecting to BitcoinZ",
    icon: "fa-server"
  },
  {
    name: "Local Server",
    uri: "http://localhost:9067",
    description: "Connect to your own lightwalletd server",
    privacyNote: "💡 For advanced users running their own node",
    icon: "fa-home"
  },
];

export default function ServerSelectModal({ modalIsOpen, closeModal, openErrorModal }: ModalProps) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const [currentServer, setCurrentServer] = useState("");

  useEffect(() => {
    (async () => {
      const settings = await ipcRenderer.invoke("loadSettings");
      const server = settings?.lwd?.serveruri || "";
      setCustom(server);
      setCurrentServer(server);

      // Pre-select the matching radio button
      const matchingServer = servers.find(s => s.uri === server);
      if (matchingServer) {
        setSelected(server);
      } else if (server) {
        // Custom server
        setSelected("custom");
      }
    })();
  }, [modalIsOpen]);

  const switchServer = async () => {
    let serveruri = selected;
    if (serveruri === "custom") {
      serveruri = custom;
    }

    // Save server settings
    await ipcRenderer.invoke("saveSettings", { key: "lwd.serveruri", value: serveruri });

    console.log("[ServerSelect] Settings saved:", { serveruri });

    closeModal();

    // Show brief message then restart automatically
    setTimeout(async () => {
      openErrorModal("Restarting Wallet", "Applying new server settings...");

      // Wait a moment for message to show
      setTimeout(async () => {
        await ipcRenderer.invoke("restartApp");
      }, 500);
    }, 10);
  };

  const modernButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {servers.map((s) => (
            <div
              key={s.uri}
              style={{
                background: selected === s.uri ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: selected === s.uri ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelected(s.uri)}
              onMouseEnter={(e) => {
                if (selected !== s.uri) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selected !== s.uri) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="radio"
                  name="server"
                  value={s.uri}
                  checked={selected === s.uri}
                  onChange={(e) => setSelected(e.currentTarget.value)}
                  style={{ marginTop: '4px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <i className={`fas ${s.icon}`} style={{ color: '#86EFAC', fontSize: '16px' }} />
                    <span style={{ fontWeight: '700', fontSize: '15px', color: 'white' }}>
                      {s.name}
                    </span>
                    {currentServer === s.uri && (
                      <span style={{
                        fontSize: '10px',
                        background: 'rgba(76, 175, 80, 0.3)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        color: '#4CAF50',
                        fontWeight: '600'
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                    {s.description}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', fontStyle: 'italic' }}>
                    {s.uri}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: s.privacyNote.startsWith('✓') ? '#86EFAC' : s.privacyNote.startsWith('⚠️') ? '#FFC107' : '#64B5F6',
                    fontWeight: '500'
                  }}>
                    {s.privacyNote}
                  </div>
                </div>
              </div>
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
              checked={selected === "custom"}
              onChange={(e) => setSelected(e.currentTarget.value)}
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
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(255, 255, 255, 0.3)',
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
          borderTopWidth: '1px',
          borderTopStyle: 'solid',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
