/* eslint-disable react/prop-types */
import React, { Component } from "react";
import { Info, RPCConfig } from "./AppState";
import cstyles from "./Common.module.css";
import styles from "./Bitcoinzd.module.css";
import ScrollPane from "./ScrollPane";

type DetailLineProps = {
  label: string;
  value: string;
};
const DetailLine = ({ label, value }: DetailLineProps) => {
  return (
    <div className={styles.detailline}>
      <div className={[cstyles.sublight].join(" ")}>{label} :</div>
      <div className={cstyles.breakword}>{value}</div>
    </div>
  );
};

type Props = {
  info: Info;
  refresh: () => void;
  rpcConfig: RPCConfig;
  openServerSelectModal: () => void;
};

export default class Bitcoinzd extends Component<Props> {
  render() {
    const { info, rpcConfig, refresh, openServerSelectModal } = this.props;
    const { url } = rpcConfig;

    if (!info || !info.latestBlock) {
      return (
        <div>
          <div className={[cstyles.verticalflex, cstyles.center].join(" ")}>
            <div style={{ marginTop: "100px" }}>
              <i className={["fas", "fa-times-circle"].join(" ")} style={{ fontSize: "96px", color: "red" }} />
            </div>
            <div className={cstyles.margintoplarge}>Not Connected</div>
          </div>
        </div>
      );
      // eslint-disable-next-line no-else-return
    } else {
      let height = `${info.latestBlock}`;
      if (info.verificationProgress < 0.9999) {
        const progress = (info.verificationProgress * 100).toFixed(1);
        height = `${height} (${progress}%)`;
      }

      return (
        <div>
          <div className={styles.container}>
            <ScrollPane offsetHeight={0}>
              <div className={styles.messagecontainer}>
                <div className={styles.freedomMessage}>
                  <h2 className={styles.messageTitle}>Your Freedom. Your Privacy. Your Community.</h2>
                  <p className={styles.messageText}>
                    BitcoinZ: No middlemen. No banks. Just you and the decentralized network.
                  </p>
                  <p className={styles.messageText}>
                    With zk-SNARKs technology, your funds stay yours—no freezing, no censorship, no compromise.
                  </p>
                  <p className={styles.messageHighlight}>
                    Together, we build true financial freedom.
                  </p>
                </div>
              </div>

              <div className={styles.detailcontainer}>
                <div className={styles.detaillines}>
                  <DetailLine label="Version" value={info.version} />
                  <DetailLine label="Node" value={info.zcashdVersion} />
                  <DetailLine label="Lightwallet Server" value={url} />
                  <DetailLine label="Network" value={info.testnet ? "Testnet" : "Mainnet"} />
                  <DetailLine label="Block Height" value={height} />
                  <DetailLine label="BTCZ Price" value={`USD ${info.btczPrice.toFixed(2)}`} />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                paddingTop: '24px',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={openServerSelectModal}
                  style={{
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
                    minWidth: '160px',
                    justifyContent: 'center'
                  }}
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
                  <i className="fas fa-server" />
                  Switch Server
                </button>
                <button
                  type="button"
                  onClick={refresh}
                  style={{
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
                    minWidth: '160px',
                    justifyContent: 'center'
                  }}
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
                  <i className="fas fa-sync-alt" />
                  Refresh Data
                </button>
              </div>

              <div className={cstyles.margintoplarge} />
            </ScrollPane>
          </div>
        </div>
      );
    }
  }
}
