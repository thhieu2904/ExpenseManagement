// src/components/Common/HeaderSection.jsx
import React from "react";
import HeaderCard from "./HeaderCard";
import styles from "./HeaderSection.module.css";

const HeaderSection = ({ 
  children, 
  className = "",
  variant = "default" // "default" | "personalized"
}) => {
  if (variant === "personalized") {
    // Dành cho PersonalizedAccountHeader - render trực tiếp children
    return children;
  }

  // Default HeaderCard với min-height đồng nhất
  return (
    <HeaderCard className={`${styles.headerSection} ${className}`}>
      {children}
    </HeaderCard>
  );
};

export default HeaderSection;
