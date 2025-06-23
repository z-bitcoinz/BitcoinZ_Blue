import React from "react";
import { Link, useLocation } from "react-router-dom";
import routes from "../constants/routes.json";
import styles from "./BottomNavigation.module.css";

type NavigationItem = {
  name: string;
  routeName: string;
  iconName: string;
  id: string;
};

const navigationItems: NavigationItem[] = [
  {
    name: "Home",
    routeName: routes.DASHBOARD,
    iconName: "fa-home",
    id: "home"
  },
  {
    name: "Send",
    routeName: routes.SEND,
    iconName: "fa-paper-plane",
    id: "send"
  },
  {
    name: "Receive",
    routeName: routes.RECEIVE,
    iconName: "fa-download",
    id: "receive"
  },
  {
    name: "Transactions",
    routeName: routes.TRANSACTIONS,
    iconName: "fa-list",
    id: "transactions"
  },
  {
    name: "Addresses",
    routeName: routes.ADDRESSES || "/addresses",
    iconName: "fa-address-card",
    id: "addresses"
  }
];

type BottomNavigationItemProps = {
  item: NavigationItem;
  isActive: boolean;
};

const BottomNavigationItem: React.FC<BottomNavigationItemProps> = ({ item, isActive }) => {
  return (
    <Link to={item.routeName} className={styles.navItem}>
      <div className={`${styles.navButton} ${isActive ? styles.navButtonActive : ""}`}>
        <i className={`fas ${item.iconName} ${styles.navIcon}`} />
        <span className={styles.navLabel}>{item.name}</span>
      </div>
    </Link>
  );
};

const BottomNavigation: React.FC = () => {
  const location = useLocation();

  const isActive = (routeName: string): boolean => {
    // Handle special case for home route
    if (location.pathname.endsWith("app.html") && routeName === routes.DASHBOARD) {
      return true;
    }
    return location.pathname === routeName;
  };

  return (
    <div className={styles.bottomNavigation}>
      {navigationItems.map((item) => (
        <BottomNavigationItem
          key={item.id}
          item={item}
          isActive={isActive(item.routeName)}
        />
      ))}
    </div>
  );
};

export default BottomNavigation;
