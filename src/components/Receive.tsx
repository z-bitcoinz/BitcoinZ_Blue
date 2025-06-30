/* eslint-disable react/prop-types */
import React, { Component, useState, useEffect } from "react";
import QRCode from "qrcode.react";
import styles from "./Receive.module.css";
import Utils from "../utils/utils";
import { AddressBalance, Info, ReceivePageState, AddressBookEntry, AddressDetail, AddressType } from "./AppState";

const { shell, clipboard } = window.require("electron");

type AddressBlockProps = {
  addressBalance: AddressBalance;
  currencyName: string;
  btczPrice: number;
  privateKey?: string;
  viewKey?: string;
  label?: string;
  fetchAndSetSinglePrivKey: (k: string) => void;
  fetchAndSetSingleViewKey: (k: string) => void;
  addressType?: 'private' | 'transparent';
};
const AddressBlock = ({
  addressBalance,
  label,
  currencyName,
  btczPrice,
  privateKey,
  fetchAndSetSinglePrivKey,
  viewKey,
  fetchAndSetSingleViewKey,
  addressType,
}: AddressBlockProps) => {
  const { address } = addressBalance;

  const [copied, setCopied] = useState(false);
  const [timerID, setTimerID] = useState<NodeJS.Timeout | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    return () => {
      if (timerID) {
        clearTimeout(timerID);
      }
    };
  });

  const balance = addressBalance.balance || 0;

  const openAddress = () => {
    if (currencyName === "TAZ") {
      shell.openExternal(`https://chain.so/address/ZECTEST/${address}`);
    } else {
      shell.openExternal(`https://explorer.getbtcz.com/#/address/${address}`);
    }
  };

  return (
    <div className={styles.compactAddressBlock}>
      {/* Compact Header - Always Visible */}
      <div className={styles.compactHeader}>
        <div className={styles.addressMainInfo}>
          {addressType && (
            <span className={`${styles.addressTypeBadge} ${styles[addressType]}`}>
              <i className={addressType === 'private' ? 'fas fa-shield-alt' : 'fas fa-eye'} />
              {addressType === 'private' ? 'Private' : 'Transparent'}
            </span>
          )}
          <div className={styles.addressDetails}>
            {label && <div className={styles.addressLabel}>{label}</div>}
            <div className={styles.addressText}>{address}</div>
            {balance > 0 && (
              <div className={styles.balanceInfo}>
                {currencyName} {balance} • {Utils.getBtczToUsdString(btczPrice, balance)}
              </div>
            )}
          </div>
        </div>

        {/* Essential Actions - Always Visible */}
        <div className={styles.essentialActions}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => {
              clipboard.writeText(address);
              setCopied(true);
              setTimerID(setTimeout(() => setCopied(false), 5000));
            }}
          >
            <i className="fas fa-copy" />
            {copied ? 'Copied!' : 'Copy Address'}
          </button>
          <button
            className={styles.detailsButton}
            type="button"
            onClick={() => setShowDetails(!showDetails)}
          >
            <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'}`} />
            {showDetails ? 'Hide Details' : 'Show More'}
          </button>
        </div>
      </div>

      {/* Expandable Details Section */}
      {showDetails && (
        <div className={styles.expandedDetails}>
          <div className={styles.detailsContent}>
            <div className={styles.leftColumn}>
              {/* QR Code */}
              <div className={styles.qrSection}>
                {/*
                // @ts-ignore */}
                <QRCode value={address} className={styles.addressQrCode} size={140} />
                <div className={styles.qrLabel}>Address QR Code</div>
              </div>
            </div>

            <div className={styles.rightColumn}>
              {/* Advanced Actions */}
              <div className={styles.advancedActions}>
                <h4 className={styles.sectionTitle}>Advanced Options</h4>

                {Utils.isZaddr(address) && !privateKey && (
                  <button
                    className={styles.modernButton}
                    type="button"
                    onClick={() => fetchAndSetSinglePrivKey(address)}
                  >
                    <i className="fas fa-key" />
                    Export Private Key
                  </button>
                )}

                {Utils.isZaddr(address) && !viewKey && (
                  <button
                    className={styles.modernButton}
                    type="button"
                    onClick={() => fetchAndSetSingleViewKey(address)}
                  >
                    <i className="fas fa-eye" />
                    Export Viewing Key
                  </button>
                )}

                {Utils.isTransparent(address) && (
                  <button className={styles.modernButton} type="button" onClick={() => openAddress()}>
                    <i className="fas fa-external-link-alt" />
                    View on Explorer
                  </button>
                )}
              </div>

              {/* Keys Display */}
              {(privateKey || viewKey) && (
                <div className={styles.keysSection}>
                  {privateKey && (
                    <div className={styles.keyDisplay}>
                      <div className={styles.keyLabel}>Private Key</div>
                      <div className={styles.keyContainer}>
                        <div className={styles.keyText}>{privateKey}</div>
                        {/*
                        // @ts-ignore */}
                        <QRCode value={privateKey} className={styles.keyQrCode} size={80} />
                      </div>
                    </div>
                  )}

                  {viewKey && (
                    <div className={styles.keyDisplay}>
                      <div className={styles.keyLabel}>Viewing Key</div>
                      <div className={styles.keyContainer}>
                        <div className={styles.keyText}>{viewKey}</div>
                        {/*
                        // @ts-ignore */}
                        <QRCode value={viewKey} className={styles.keyQrCode} size={80} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type Props = {
  addresses: AddressDetail[];
  addressesWithBalance: AddressBalance[];
  addressBook: AddressBookEntry[];
  info: Info;
  addressPrivateKeys: Map<string, string>;
  addressViewKeys: Map<string, string>;
  receivePageState: ReceivePageState;
  fetchAndSetSinglePrivKey: (k: string) => void;
  fetchAndSetSingleViewKey: (k: string) => void;
  createNewAddress: (t: AddressType) => void;
};

export default class Receive extends Component<Props> {
  state = {
    addressFilter: 'all' as 'all' | 'private' | 'transparent',
    currentPage: 1,
    itemsPerPage: 20
  };

  setAddressFilter = (filter: 'all' | 'private' | 'transparent') => {
    this.setState({ addressFilter: filter, currentPage: 1 }); // Reset to page 1 when filter changes
  };

  setCurrentPage = (page: number) => {
    this.setState({ currentPage: page });
  };

  render() {
    const {
      addresses,
      addressesWithBalance,
      addressPrivateKeys,
      addressViewKeys,
      addressBook,
      info,
      receivePageState,
      fetchAndSetSinglePrivKey,
      fetchAndSetSingleViewKey,
      createNewAddress,
    } = this.props;

    // Convert the addressBalances into a map.
    const addressMap: Map<string, number> = addressesWithBalance.reduce((m, a) => {
      // eslint-disable-next-line no-param-reassign
      m.set(a.address, a.balance);
      return m;
    }, new Map());

    // BitcoinZ does not support Unified addresses - removed uaddrs logic

    const zaddrs = addresses
      .filter((a) => Utils.isSapling(a.address))
      .map((a) => new AddressBalance(a.address, addressMap.get(a.address) || 0));

    let defaultZaddr = zaddrs.length ? zaddrs[0].address : "";
    if (receivePageState && Utils.isSapling(receivePageState.newAddress)) {
      defaultZaddr = receivePageState.newAddress;

      // move this address to the front, since the scrollbar will reset when we re-render
      zaddrs.sort((x, y) => {
        // eslint-disable-next-line, no-nested-ternary
        return x.address === defaultZaddr ? -1 : y.address === defaultZaddr ? 1 : 0;
      });
    }

    const taddrs = addresses
      .filter((a) => Utils.isTransparent(a.address))
      .map((a) => new AddressBalance(a.address, addressMap.get(a.address) || 0));

    let defaultTaddr = taddrs.length ? taddrs[0].address : "";
    if (receivePageState && Utils.isTransparent(receivePageState.newAddress)) {
      defaultTaddr = receivePageState.newAddress;

      // move this address to the front, since the scrollbar will reset when we re-render
      taddrs.sort((x, y) => {
        // eslint-disable-next-line  no-nested-ternary
        return x.address === defaultTaddr ? -1 : y.address === defaultTaddr ? 1 : 0;
      });
    }

    const addressBookMap = addressBook.reduce((m, obj) => {
      // eslint-disable-next-line no-param-reassign
      m.set(obj.address, obj.label);
      return m;
    }, new Map());

    // Combine all addresses into a single unified list
    const allAddresses = [
      ...zaddrs.map(a => ({ ...a, type: 'private' as const })),
      ...taddrs.map(a => ({ ...a, type: 'transparent' as const }))
    ];

    // Filter addresses based on selected filter
    const filteredAddresses = allAddresses.filter(address => {
      if (this.state.addressFilter === 'all') return true;
      return address.type === this.state.addressFilter;
    });

    // Sort addresses by balance (highest first), then by type (private first)
    filteredAddresses.sort((a, b) => {
      if (b.balance !== a.balance) return b.balance - a.balance;
      if (a.type === 'private' && b.type === 'transparent') return -1;
      if (a.type === 'transparent' && b.type === 'private') return 1;
      return 0;
    });

    // Pagination calculations
    const { currentPage, itemsPerPage } = this.state;
    const totalPages = Math.ceil(filteredAddresses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAddresses = filteredAddresses.slice(startIndex, endIndex);

    return (
      <div className={styles.receivePageContainer}>
        <div className={styles.receivePageContent}>
          <div className={styles.receiveHeader}>
            <h1 className={styles.receiveTitle}>Receive BitcoinZ</h1>
            <p className={styles.receiveSubtitle}>
              Manage your Private and Transparent addresses
            </p>
          </div>

          {/* Address Filter Buttons */}
          <div className={styles.filterContainer}>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${this.state.addressFilter === 'all' ? styles.active : ''}`}
                onClick={() => this.setAddressFilter('all')}
                type="button"
              >
                <i className="fas fa-list" />
                All Addresses ({allAddresses.length})
              </button>
              <button
                className={`${styles.filterButton} ${this.state.addressFilter === 'private' ? styles.active : ''}`}
                onClick={() => this.setAddressFilter('private')}
                type="button"
              >
                <i className="fas fa-shield-alt" />
                Private ({zaddrs.length})
              </button>
              <button
                className={`${styles.filterButton} ${this.state.addressFilter === 'transparent' ? styles.active : ''}`}
                onClick={() => this.setAddressFilter('transparent')}
                type="button"
              >
                <i className="fas fa-eye" />
                Transparent ({taddrs.length})
              </button>
            </div>
          </div>

          {/* Action Buttons - Compact Top Section */}
          <div className={styles.topActionBar}>
            <div className={styles.compactButtonGroup}>
              {(this.state.addressFilter === 'all' || this.state.addressFilter === 'private') && (
                <button
                  className={styles.compactActionButton}
                  onClick={() => createNewAddress(AddressType.sapling)}
                  type="button"
                  title="Create new private address"
                >
                  <i className="fas fa-plus-circle" />
                  <span>New Private</span>
                </button>
              )}
              {(this.state.addressFilter === 'all' || this.state.addressFilter === 'transparent') && (
                <button
                  className={styles.compactActionButton}
                  type="button"
                  onClick={() => createNewAddress(AddressType.transparent)}
                  title="Create new transparent address"
                >
                  <i className="fas fa-plus-circle" />
                  <span>New Transparent</span>
                </button>
              )}
            </div>
          </div>

          {/* Address List */}
          {filteredAddresses.length > 0 ? (
            <div className={styles.addressList}>
              {paginatedAddresses.map((a) => (
                <AddressBlock
                  key={a.address}
                  addressBalance={a}
                  currencyName={info.currencyName}
                  label={addressBookMap.get(a.address)}
                  btczPrice={info.btczPrice}
                  privateKey={addressPrivateKeys.get(a.address)}
                  viewKey={addressViewKeys.get(a.address)}
                  fetchAndSetSinglePrivKey={fetchAndSetSinglePrivKey}
                  fetchAndSetSingleViewKey={fetchAndSetSingleViewKey}
                  addressType={a.type}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noAddressesMessage}>
              <i className="fas fa-info-circle" />
              <p>No {this.state.addressFilter === 'all' ? '' : this.state.addressFilter} addresses found.</p>
              <p>Create a new address using the buttons below.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAddresses.length > itemsPerPage && (
            <div className={styles.paginationContainer}>
              <button
                className={styles.paginationButton}
                onClick={() => this.setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                type="button"
              >
                <i className="fas fa-chevron-left" />
                Previous
              </button>
              
              <span className={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                className={styles.paginationButton}
                onClick={() => this.setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                type="button"
              >
                Next
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
