// src/components/Common/PageTitle.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./PageTitle.module.css";

const PageTitle = ({ 
  level = "h1", 
  icon, 
  iconColor, 
  children, 
  className = "" 
}) => {
  const Tag = level;
  const titleClass = `title-${level}`;
  
  return (
    <Tag className={`${titleClass} ${styles.pageTitle} ${className}`}>
      {icon && (
        <FontAwesomeIcon 
          icon={icon} 
          className={styles.icon}
          style={{ color: iconColor }}
        />
      )}
      <span className={styles.text}>{children}</span>
    </Tag>
  );
};

export default PageTitle;
