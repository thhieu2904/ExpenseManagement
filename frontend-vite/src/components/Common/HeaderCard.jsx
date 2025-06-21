import React from "react";
import styles from "./HeaderCard.module.css";

const HeaderCard = ({ title, action, filter, extra, className = "" }) => {
  return (
    <div className={`${styles.headerCard} ${className}`}>
      {/* Hàng 1 */}
      <div className={styles.title}>{title}</div>
      {extra && <div className={styles.extra}>{extra}</div>}
      {/* Hàng 2 */}
      {filter && <div className={styles.filter}>{filter}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

export default HeaderCard;
