/* eslint-disable react/prop-types */
import React, { Component } from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";
import styles from "./Addressbook.module.css";
import { AddressBookEntry } from "./AppState";
import Utils from "../utils/utils";
import { BitcoinzURITarget } from "../utils/uris";
import routes from "../constants/routes.json";

type AddressBookItemProps = {
  item: AddressBookEntry;
  removeAddressBookEntry: (label: string) => void;
  setSendTo: (targets: BitcoinzURITarget | BitcoinzURITarget[]) => void;
  onEdit: (item: AddressBookEntry) => void;
};

const AddressBookItemInternal: React.FC<RouteComponentProps & AddressBookItemProps> = ({
  item,
  removeAddressBookEntry,
  setSendTo,
  onEdit,
  history,
}) => {
  const handleSendTo = () => {
    setSendTo(new BitcoinzURITarget(item.address, undefined, undefined));
    history.push(routes.SEND);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete contact "${item.label}"?`)) {
      removeAddressBookEntry(item.label);
    }
  };

  return (
    <div className={styles.contactItem}>
      <div className={styles.contactInfo}>
        <div className={styles.contactHeader}>
          <div className={styles.contactIcon}>
            <i className="fas fa-user" />
          </div>
          <div className={styles.contactDetails}>
            <div className={styles.contactName}>{item.label}</div>
            <div className={styles.contactAddress}>
              {Utils.splitStringIntoChunks(item.address, 8).join(" ")}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.contactActions}>
        <button
          type="button"
          className={styles.modernButton}
          onClick={handleSendTo}
          title="Send to this contact"
        >
          <i className="fas fa-paper-plane" />
          Send
        </button>
        <button
          type="button"
          className={styles.modernButton}
          onClick={() => onEdit(item)}
          title="Edit contact"
        >
          <i className="fas fa-edit" />
          Edit
        </button>
        <button
          type="button"
          className={`${styles.modernButton} ${styles.deleteButton}`}
          onClick={handleDelete}
          title="Delete contact"
        >
          <i className="fas fa-trash" />
          Delete
        </button>
      </div>
    </div>
  );
};
const AddressBookItem = withRouter(AddressBookItemInternal);

type AddressBookProps = {
  addressBook: AddressBookEntry[];
  addAddressBookEntry: (label: string, address: string) => void;
  removeAddressBookEntry: (label: string) => void;
  setSendTo: (targets: BitcoinzURITarget[] | BitcoinzURITarget) => void;
};

type AddressBookState = {
  currentLabel: string;
  currentAddress: string;
  addButtonEnabled: boolean;
  editingItem: AddressBookEntry | null;
  isEditing: boolean;
  showAddForm: boolean;
};

export default class AddressBook extends Component<AddressBookProps, AddressBookState> {
  constructor(props: AddressBookProps) {
    super(props);

    this.state = {
      currentLabel: "",
      currentAddress: "",
      addButtonEnabled: false,
      editingItem: null,
      isEditing: false,
      showAddForm: false
    };
  }

  updateLabel = (currentLabel: string) => {
    // Don't update the field if it is longer than 20 chars
    if (currentLabel.length > 20) return;

    const { currentAddress } = this.state;
    this.setState({ currentLabel });

    const { labelError, addressIsValid } = this.validate(currentLabel, currentAddress);
    this.setAddButtonEnabled(!labelError && addressIsValid && currentLabel !== "" && currentAddress !== "");
  };

  updateAddress = (currentAddress: string) => {
    const { currentLabel } = this.state;
    this.setState({ currentAddress });

    const { labelError, addressIsValid } = this.validate(currentLabel, currentAddress);

    this.setAddButtonEnabled(!labelError && addressIsValid && currentLabel !== "" && currentAddress !== "");
  };

  addButtonClicked = () => {
    const { addAddressBookEntry, removeAddressBookEntry } = this.props;
    const { currentLabel, currentAddress, isEditing, editingItem } = this.state;

    if (isEditing && editingItem) {
      // Remove the old entry and add the new one
      removeAddressBookEntry(editingItem.label);
      addAddressBookEntry(currentLabel, currentAddress);
      this.setState({
        currentLabel: "",
        currentAddress: "",
        isEditing: false,
        editingItem: null,
        showAddForm: false,
        addButtonEnabled: false
      });
    } else {
      addAddressBookEntry(currentLabel, currentAddress);
      this.setState({
        currentLabel: "",
        currentAddress: "",
        showAddForm: false,
        addButtonEnabled: false
      });
    }
  };

  handleEdit = (item: AddressBookEntry) => {
    this.setState({
      currentLabel: item.label,
      currentAddress: item.address,
      isEditing: true,
      editingItem: item,
      addButtonEnabled: true,
      showAddForm: true
    });
  };

  handleCancelEdit = () => {
    this.setState({
      currentLabel: "",
      currentAddress: "",
      isEditing: false,
      editingItem: null,
      addButtonEnabled: false,
      showAddForm: false
    });
  };

  showAddContactForm = () => {
    this.setState({ showAddForm: true });
  };

  hideAddContactForm = () => {
    this.setState({
      showAddForm: false,
      currentLabel: "",
      currentAddress: "",
      addButtonEnabled: false,
      isEditing: false,
      editingItem: null
    });
  };

  setAddButtonEnabled = (addButtonEnabled: boolean) => {
    this.setState({ addButtonEnabled });
  };

  validate = (currentLabel: string, currentAddress: string) => {
    const { addressBook } = this.props;

    let labelError = addressBook.find((i) => i.label === currentLabel) ? "Contact name already exists" : null;
    labelError = currentLabel.length > 12 ? "Contact name is too long" : labelError;

    const addressIsValid =
      currentAddress === "" || Utils.isZaddr(currentAddress) || Utils.isTransparent(currentAddress);

    return { labelError, addressIsValid };
  };

  render() {
    const { addressBook, removeAddressBookEntry, setSendTo } = this.props;
    const { currentLabel, currentAddress, addButtonEnabled, isEditing, showAddForm } = this.state;

    const { labelError, addressIsValid } = this.validate(currentLabel, currentAddress);

    return (
      <div className={styles.contactContainer}>
        {/* Modern Header with Add Button */}
        <div className={styles.contactHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1 className={styles.contactTitle}>Contacts</h1>
              <div className={styles.contactCount}>
                {addressBook ? addressBook.length : 0} contact{addressBook && addressBook.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              type="button"
              className={styles.addContactButton}
              onClick={this.showAddContactForm}
              title="Add new contact"
            >
              <i className="fas fa-plus" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Expandable Contact Form */}
        {showAddForm && (
          <div className={styles.addContactForm}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>
                {isEditing ? "Edit Contact" : "Add New Contact"}
              </h3>
              <button
                type="button"
                className={styles.closeFormButton}
                onClick={this.hideAddContactForm}
                title="Close form"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <div className={styles.formContent}>
              <div className={styles.inputGroup}>
                <div className={styles.inputHeader}>
                  <label className={styles.inputLabel}>Contact Name</label>
                  <div className={styles.validationIndicator}>
                    {!labelError ? (
                      <i className="fas fa-check" style={{ color: '#4CAF50' }} />
                    ) : (
                      <span className={styles.errorText}>{labelError}</span>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={currentLabel}
                  className={styles.modernInput}
                  placeholder="Enter contact name..."
                  onChange={(e) => this.updateLabel(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.inputHeader}>
                  <label className={styles.inputLabel}>Contact Address</label>
                  <div className={styles.validationIndicator}>
                    {addressIsValid ? (
                      <i className="fas fa-check" style={{ color: '#4CAF50' }} />
                    ) : (
                      <span className={styles.errorText}>Invalid Address</span>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={currentAddress}
                  className={styles.modernInput}
                  placeholder="Enter BitcoinZ address..."
                  onChange={(e) => this.updateAddress(e.target.value)}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.modernButton}
                  disabled={!addButtonEnabled}
                  onClick={this.addButtonClicked}
                >
                  <i className={isEditing ? "fas fa-save" : "fas fa-plus"} />
                  {isEditing ? "Update Contact" : "Add Contact"}
                </button>
                <button
                  type="button"
                  className={`${styles.modernButton} ${styles.cancelButton}`}
                  onClick={this.hideAddContactForm}
                >
                  <i className="fas fa-times" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary Contacts List */}
        <div className={styles.contactsList}>
          <div className={styles.contactsContent}>
            {!addressBook || addressBook.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <i className="fas fa-address-book" />
                </div>
                <div className={styles.emptyStateText}>No contacts yet</div>
                <div className={styles.emptyStateSubtext}>
                  Tap "Add Contact" to create your first contact for easy sending
                </div>
                <button
                  type="button"
                  className={styles.emptyStateButton}
                  onClick={this.showAddContactForm}
                >
                  <i className="fas fa-plus" />
                  Add Your First Contact
                </button>
              </div>
            ) : (
              <div className={styles.contactsGrid}>
                {addressBook.map((item) => (
                  <AddressBookItem
                    key={item.label}
                    item={item}
                    removeAddressBookEntry={removeAddressBookEntry}
                    setSendTo={setSendTo}
                    onEdit={this.handleEdit}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
