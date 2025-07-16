import React from "react";
import styles from "./ExtendedHeaderCard.module.css";
import HeaderCard from "./HeaderCard";

/**
 * ExtendedHeaderCard - Component mở rộng từ HeaderCard
 * Hỗ trợ thêm các section tùy chỉnh trong khi vẫn kế thừa styling từ HeaderCard
 * 
 * Props:
 * - Tất cả props của HeaderCard (title, action, filter, extra, className)
 * - customSections: Array các section tùy chỉnh sẽ được render sau header
 * - layout: 'default' | 'extended' - layout type
 */
const ExtendedHeaderCard = ({
  // HeaderCard props
  title,
  action,
  filter,
  extra,
  className = "",
  
  // Extended props
  customSections = [],
  layout = "default",
  children,
  
  ...props
}) => {
  // Nếu layout default và không có customSections, dùng HeaderCard gốc
  if (layout === "default" && customSections.length === 0 && !children) {
    return (
      <HeaderCard
        title={title}
        action={action}
        filter={filter}
        extra={extra}
        className={className}
        {...props}
      />
    );
  }

  // Extended layout với customSections
  return (
    <div className={`${styles.extendedHeaderCard} ${className}`}>
      {/* Dòng 1: Title và extra (không có action) */}
      <div className={styles.titleSection}>
        <div className={styles.title}>{title}</div>
        {extra && <div className={styles.extra}>{extra}</div>}
        {filter && <div className={styles.filter}>{filter}</div>}
      </div>
      
      {/* Dòng 2: Custom sections hoặc Children content */}
      {customSections.length > 0 && (
        <div className={styles.customSections}>
          {customSections.map((section, index) => (
            <div key={index} className={styles.customSection}>
              {section}
            </div>
          ))}
        </div>
      )}
      
      {children && (
        <div className={styles.childrenContent}>
          {children}
        </div>
      )}
      
      {/* Dòng 3: Action button căn phải */}
      {action && (
        <div className={styles.actionSection}>
          {action}
        </div>
      )}
    </div>
  );
};

export default ExtendedHeaderCard;
