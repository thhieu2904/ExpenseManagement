import React from "react";
import styles from "./HeaderCard.module.css";

const HeaderCard = ({ 
  title, 
  action, 
  filter, 
  extra, 
  children,
  className = "",
  variant = "default" // "default" | "flexible" | "grid"
}) => {
  // Grid layout - layout 2x2 chuẩn cho tất cả pages
  if (variant === "grid") {
    return (
      <div className={`${styles.headerCard} ${styles.gridLayout} ${className}`}>
        {children}
      </div>
    );
  }

  // Flexible layout - cho custom content
  if (children && variant === "flexible") {
    return (
      <div className={`${styles.headerCard} ${styles.flexibleLayout} ${className}`}>
        {children}
      </div>
    );
  }

  // Layout mặc định (backward compatible)
  return (
    <div className={`${styles.headerCard} ${styles.defaultLayout} ${className}`}>
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
