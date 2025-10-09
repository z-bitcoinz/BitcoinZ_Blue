import Modal from "react-modal";
import React, { useState, useEffect } from "react";
import cstyles from "./Common.module.css";
import Utils from "../utils/utils";
const { ipcRenderer } = window.require("electron");

type Props = {
  modalIsOpen: boolean;
  onServerSelected: (serverUri: string) => void;
};

const servers = [
  {
    name: "BitcoinZ Official Server",
    uri: Utils.V3_LIGHTWALLETD,
    icon: "fa-server",
    iconColor: "#64B5F6",
    recommended: true,
    title: "Recommended for Most Users",
    benefits: [
      "Fast and reliable connection",
      "Maintained by BitcoinZ community",
      "No setup required"
    ],
    privacyLevel: "Standard Privacy",
    privacyDetails: "Your ISP and network can see you're connecting to BitcoinZ, but cannot see your transactions or balance.",
    technicalNote: "Best balance of speed and convenience"
  },
  {
    name: "Tor Network (Anonymous)",
    uri: "http://e4lxxtpwqfhbkdio6uq7lwcovwmoh624xj3itzjmctfm7hiartadd7qd.onion:9067",
    isTor: true,
    icon: "fa-user-secret",
    iconColor: "#C084FC",
    title: "Maximum Privacy",
    benefits: [
      "Complete IP anonymity",
      "Location cannot be traced",
      "Untraceable network activity"
    ],
    privacyLevel: "Maximum Privacy",
    privacyDetails: "Your connection is routed through the Tor network. No one can see your IP address, location, or that you're using BitcoinZ.",
    technicalNote: "Slightly slower due to Tor routing"
  },
  {
    name: "Local Server",
    uri: "http://localhost:9067",
    icon: "fa-home",
    iconColor: "#86EFAC",
    advanced: true,
    title: "Run Your Own Node",
    benefits: [
      "Full control over your server",
      "No reliance on external servers",
      "Maximum decentralization"
    ],
    privacyLevel: "Self-Hosted",
    privacyDetails: "Connect to your own lightwalletd server running on this computer. You must have already set up and running your own node.",
    technicalNote: "Requires technical knowledge"
  }
];

export default function FirstTimeServerSetup({ modalIsOpen, onServerSelected }: Props) {
  const [selected, setSelected] = useState(Utils.V3_LIGHTWALLETD);
  const [torStatus, setTorStatus] = useState<{status: string, progress: number}>({ status: 'stopped', progress: 0 });

  useEffect(() => {
    if (modalIsOpen) {
      (async () => {
        const status = await ipcRenderer.invoke("getTorStatus");
        setTorStatus(status);
      })();
    }
  }, [modalIsOpen]);

  const handleContinue = async () => {
    // Save the selected server
    const selectedServer = servers.find(s => s.uri === selected);
    const isTor = selectedServer?.isTor || false;

    await ipcRenderer.invoke("saveSettings", { key: "lwd.serveruri", value: selected });

    // Enable proxy if Tor, disable otherwise
    if (isTor) {
      await ipcRenderer.invoke("saveSettings", { key: "proxy.enabled", value: true });
      await ipcRenderer.invoke("saveSettings", { key: "proxy.url", value: "socks5://127.0.0.1:9050" });
    } else {
      await ipcRenderer.invoke("saveSettings", { key: "proxy.enabled", value: false });
    }

    // Mark that server has been selected
    await ipcRenderer.invoke("saveSettings", { key: "hasSelectedServer", value: true });

    onServerSelected(selected);
  };

  const cardStyle = (serverUri: string) => ({
    background: selected === serverUri ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: selected === serverUri ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const
  });

  return (
    <Modal
      isOpen={modalIsOpen}
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
          maxWidth: '950px',
          width: '92%',
          maxHeight: '85vh',
          overflow: 'auto',
          zIndex: 10001,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      <div style={{ color: 'white' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
            Choose Your Connection Type
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5', maxWidth: '650px', margin: '0 auto' }}>
            Select how you want to connect to the BitcoinZ network
          </p>
        </div>

        {/* Server Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {servers.map((server) => (
            <div
              key={server.uri}
              style={cardStyle(server.uri)}
              onClick={() => setSelected(server.uri)}
              onMouseEnter={(e) => {
                if (selected !== server.uri) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (selected !== server.uri) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Badges */}
              <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                {server.recommended && (
                  <span style={{
                    background: 'rgba(76, 175, 80, 0.3)',
                    color: '#4CAF50',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(76, 175, 80, 0.5)'
                  }}>
                    Recommended
                  </span>
                )}
                {server.advanced && (
                  <span style={{
                    background: 'rgba(255, 152, 0, 0.3)',
                    color: '#FFA726',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255, 152, 0, 0.5)'
                  }}>
                    Advanced
                  </span>
                )}
              </div>

              {/* Icon and Title */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <i className={`fas ${server.icon}`} style={{ fontSize: '36px', color: server.iconColor }} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '3px' }}>
                  {server.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' }}>
                  {server.title}
                </p>
              </div>

              {/* Benefits */}
              <div style={{ marginBottom: '10px', flex: 1 }}>
                {server.benefits.map((benefit, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
                    <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '8px', fontSize: '12px' }} />
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Privacy Level */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '6px',
                padding: '8px 10px',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '10px', color: '#86EFAC', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {server.privacyLevel}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.3' }}>
                  {server.privacyDetails}
                </div>
              </div>

              {/* Technical Note */}
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                💡 {server.technicalNote}
              </div>

              {/* Selection Indicator */}
              {selected === server.uri && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(76, 175, 80, 0.3)',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #4CAF50'
                }}>
                  <i className="fas fa-check" style={{ color: '#4CAF50', fontSize: '13px' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tor Warning */}
        {servers.find(s => s.uri === selected)?.isTor && torStatus.status !== 'ready' && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.2)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgba(255, 193, 7, 0.5)',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#FFC107', fontSize: '18px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '3px', fontSize: '13px' }}>Tor Network Required</div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.3' }}>
                The wallet will automatically start Tor when you continue. This may take 10-20 seconds on first launch.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '16px',
          borderTopWidth: '1px',
          borderTopStyle: 'solid',
          borderTopColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <button
            type="button"
            onClick={handleContinue}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 36px',
              background: 'rgba(76, 175, 80, 0.3)',
              backdropFilter: 'blur(10px)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'rgba(76, 175, 80, 0.6)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              minWidth: '180px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(76, 175, 80, 0.4)';
              target.style.borderColor = 'rgba(76, 175, 80, 0.8)';
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'rgba(76, 175, 80, 0.3)';
              target.style.borderColor = 'rgba(76, 175, 80, 0.6)';
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            <i className="fas fa-arrow-right" />
            Continue with {servers.find(s => s.uri === selected)?.name}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
          You can change this later in Settings → Switch Server
        </p>
      </div>
    </Modal>
  );
}
