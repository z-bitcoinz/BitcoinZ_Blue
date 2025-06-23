import React, { Component } from "react";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import {
  AccordionItemButton,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemPanel,
  Accordion,
} from "react-accessible-accordion";
import { AddressBalance, Info, AddressDetail, AddressType, AddressBookEntry } from "./AppState";
import Utils from "../utils/utils";
import ScrollPane from "./ScrollPane";
import styles from "./AddressManagement.module.css";
import cstyles from "./Common.module.css";

type AddressItemProps = {
  addressBalance: AddressBalance;
  currencyName: string;
  btczPrice: number;
  label?: string;
  onCopyAddress: (address: string) => void;
};

const AddressItem: React.FC<AddressItemProps> = ({ 
  addressBalance, 
  currencyName, 
  btczPrice, 
  label,
  onCopyAddress 
}) => {
  const { bigPart, smallPart } = Utils.splitBtczAmountIntoBigSmallBtcz(Math.abs(addressBalance.balance));
  const addressType = Utils.isSapling(addressBalance.address) ? "Shielded (Z)" : "Transparent (T)";

  return (
    <AccordionItem className={[cstyles.well, cstyles.margintopsmall].join(" ")} uuid={addressBalance.address}>
      <AccordionItemHeading>
        <AccordionItemButton className={cstyles.accordionHeader}>
          <div className={[cstyles.flexspacebetween].join(" ")}>
            <div className={styles.addressInfo}>
              <div className={styles.addressText}>
                {Utils.splitStringIntoChunks(addressBalance.address, 6).join(" ")}
              </div>
              <div className={styles.addressMeta}>
                <span className={styles.addressType}>{addressType}</span>
                {label && <span className={styles.addressLabel}>• {label}</span>}
              </div>
              {addressBalance.containsPending && (
                <div className={[cstyles.orange, cstyles.small, cstyles.padtopsmall].join(" ")}>
                  ⏳ Pending transactions
                </div>
              )}
            </div>
            <div className={styles.balanceSection}>
              <div className={styles.balanceAmount}>
                <span>{currencyName} {bigPart}</span>
                <span className={[cstyles.small, cstyles.btczsmallpart].join(" ")}>{smallPart}</span>
              </div>
              <div className={[cstyles.sublight, cstyles.small].join(" ")}>
                {Utils.getBtczToUsdStringBtcz(btczPrice, Math.abs(addressBalance.balance))}
              </div>
            </div>
          </div>
        </AccordionItemButton>
      </AccordionItemHeading>
      <AccordionItemPanel>
        <div className={styles.addressActions}>
          <button
            type="button"
            className={[cstyles.primarybutton, styles.actionButton].join(" ")}
            onClick={() => onCopyAddress(addressBalance.address)}
          >
            <i className="fas fa-copy" /> Copy Address
          </button>
        </div>
      </AccordionItemPanel>
    </AccordionItem>
  );
};

type Props = {
  addresses: AddressDetail[];
  addressesWithBalance: AddressBalance[];
  addressBook: AddressBookEntry[];
  info: Info;
  createNewAddress: (type: AddressType) => void;
};

type State = {
  copiedAddress: string | null;
  rerenderKey: number;
};

export default class AddressManagement extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      copiedAddress: null,
      rerenderKey: 0,
    };
  }

  handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    this.setState({ copiedAddress: address });
    
    // Clear the copied state after 2 seconds
    setTimeout(() => {
      this.setState({ copiedAddress: null });
    }, 2000);
  };

  handleCreateNewAddress = (type: AddressType) => {
    this.props.createNewAddress(type);
    // Force re-render to show new address
    this.setState({ rerenderKey: this.state.rerenderKey + 1 });
  };

  render() {
    const { addresses, addressesWithBalance, addressBook, info } = this.props;
    const { copiedAddress } = this.state;

    // Convert addressesWithBalance to a map for quick lookup
    const addressMap: Map<string, number> = addressesWithBalance.reduce((m, a) => {
      m.set(a.address, a.balance);
      return m;
    }, new Map());

    // Create address book map for labels
    const addressBookMap = addressBook.reduce((m, obj) => {
      m.set(obj.address, obj.label);
      return m;
    }, new Map());

    // Filter and map addresses
    const zaddrs = addresses
      .filter((a) => Utils.isSapling(a.address))
      .map((a) => new AddressBalance(a.address, addressMap.get(a.address) || 0));

    const taddrs = addresses
      .filter((a) => Utils.isTransparent(a.address))
      .map((a) => new AddressBalance(a.address, addressMap.get(a.address) || 0));

    return (
      <div className={styles.addressManagementContainer}>
        <div className={styles.header}>
          <h2>Address Management</h2>
          <p className={cstyles.sublight}>Manage your BitcoinZ addresses and create new ones</p>
        </div>

        {copiedAddress && (
          <div className={styles.copyNotification}>
            ✅ Address copied to clipboard!
          </div>
        )}

        <Tabs className={styles.tabsContainer}>
          <TabList className={styles.tabList}>
            <Tab className={styles.tab}>Shielded Addresses ({zaddrs.length})</Tab>
            <Tab className={styles.tab}>Transparent Addresses ({taddrs.length})</Tab>
          </TabList>

          <TabPanel className={styles.tabPanel}>
            <div className={styles.addressSection}>
              <div className={styles.sectionHeader}>
                <h3>Shielded (Z) Addresses</h3>
                <button
                  className={[cstyles.primarybutton, styles.createButton].join(" ")}
                  onClick={() => this.handleCreateNewAddress(AddressType.sapling)}
                  type="button"
                >
                  <i className="fas fa-plus" /> New Shielded Address
                </button>
              </div>
              
              <ScrollPane offsetHeight={150}>
                {zaddrs.length === 0 ? (
                  <div className={[cstyles.center, cstyles.sublight, styles.emptyState].join(" ")}>
                    No shielded addresses yet. Create your first one!
                  </div>
                ) : (
                  <Accordion allowZeroExpanded>
                    {zaddrs.map((addr) => (
                      <AddressItem
                        key={addr.address}
                        addressBalance={addr}
                        currencyName={info.currencyName}
                        btczPrice={info.btczPrice}
                        label={addressBookMap.get(addr.address)}
                        onCopyAddress={this.handleCopyAddress}
                      />
                    ))}
                  </Accordion>
                )}
              </ScrollPane>
            </div>
          </TabPanel>

          <TabPanel className={styles.tabPanel}>
            <div className={styles.addressSection}>
              <div className={styles.sectionHeader}>
                <h3>Transparent (T) Addresses</h3>
                <button
                  className={[cstyles.primarybutton, styles.createButton].join(" ")}
                  onClick={() => this.handleCreateNewAddress(AddressType.transparent)}
                  type="button"
                >
                  <i className="fas fa-plus" /> New Transparent Address
                </button>
              </div>
              
              <ScrollPane offsetHeight={150}>
                {taddrs.length === 0 ? (
                  <div className={[cstyles.center, cstyles.sublight, styles.emptyState].join(" ")}>
                    No transparent addresses yet. Create your first one!
                  </div>
                ) : (
                  <Accordion allowZeroExpanded>
                    {taddrs.map((addr) => (
                      <AddressItem
                        key={addr.address}
                        addressBalance={addr}
                        currencyName={info.currencyName}
                        btczPrice={info.btczPrice}
                        label={addressBookMap.get(addr.address)}
                        onCopyAddress={this.handleCopyAddress}
                      />
                    ))}
                  </Accordion>
                )}
              </ScrollPane>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    );
  }
}
