import React from 'react';
import styles from './HeaderTitle.module.css';

/**
 * Component title chuẩn cho header cards
 * Chứa style typography đồng nhất cho mọi page
 */
const HeaderTitle = ({ children, className, icon, ...props }) => {
  return (
    <h1 className={`${styles.headerTitle} ${className || ''}`} {...props}>
      {icon && <span className={styles.titleIcon}>{icon}</span>}
      {children}
    </h1>
  );
};

export default HeaderTitle;
