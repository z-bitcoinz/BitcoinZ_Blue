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
    borderRadius: '12px',
    padding: '24px',
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
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '1100px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 10001,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      <div style={{ color: 'white' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>
            <i className="fas fa-network-wired" style={{ color: '#86EFAC' }} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
            Choose Your Connection Type
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto' }}>
            BitcoinZ Wallet needs to connect to a lightwalletd server to access the blockchain. Choose the option that best fits your needs.
          </p>
        </div>

        {/* Server Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
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
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                {server.recommended && (
                  <span style={{
                    background: 'rgba(76, 175, 80, 0.3)',
                    color: '#4CAF50',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
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
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255, 152, 0, 0.5)'
                  }}>
                    Advanced
                  </span>
                )}
              </div>

              {/* Icon and Title */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <i className={`fas ${server.icon}`} style={{ fontSize: '48px', color: server.iconColor }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                  {server.name}
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' }}>
                  {server.title}
                </p>
              </div>

              {/* Benefits */}
              <div style={{ marginBottom: '16px', flex: 1 }}>
                {server.benefits.map((benefit, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                    <i className="fas fa-check-circle" style={{ color: '#86EFAC', marginRight: '10px', fontSize: '14px' }} />
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Privacy Level */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '12px', color: '#86EFAC', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {server.privacyLevel}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.4' }}>
                  {server.privacyDetails}
                </div>
              </div>

              {/* Technical Note */}
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                💡 {server.technicalNote}
              </div>

              {/* Selection Indicator */}
              {selected === server.uri && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(76, 175, 80, 0.3)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #4CAF50'
                }}>
                  <i className="fas fa-check" style={{ color: '#4CAF50', fontSize: '16px' }} />
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
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#FFC107', fontSize: '24px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Tor Network Required</div>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
                The wallet will automatically start Tor when you continue. This may take 10-20 seconds on first launch.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '24px',
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
              gap: '10px',
              padding: '16px 48px',
              background: 'rgba(76, 175, 80, 0.3)',
              backdropFilter: 'blur(10px)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'rgba(76, 175, 80, 0.6)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              minWidth: '200px',
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

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
          You can change this later in Settings → Switch Server
        </p>
      </div>
    </Modal>
  );
}
