import React from "react";
import styles from "./ExtendedHeaderCard.module.css";
import HeaderCard from "./HeaderCard";

/**
 * ExtendedHeaderCard - Kế thừa hoàn toàn HeaderCard + thêm 1 dòng cuối cho actions
 * 
 * Props:
 * - Tất cả props của HeaderCard (variant, className, children, v.v.)
 * - bottomActions: JSX element sẽ được render ở dòng cuối, căn phải
 */
const ExtendedHeaderCard = ({
  // Props cho HeaderCard
  children,
  bottomActions,
  className = "",
  ...headerCardProps
}) => {
  return (
    <div className={`${styles.extendedContainer} ${className}`}>
      {/* Kế thừa hoàn toàn HeaderCard */}
      <HeaderCard 
        className={styles.headerCard}
        {...headerCardProps}
      >
        {children}
      </HeaderCard>
      
      {/* Dòng cuối: Actions căn phải */}
      {bottomActions && (
        <div className={styles.bottomActions}>
          {bottomActions}
        </div>
      )}
    </div>
  );
};

export default ExtendedHeaderCard;
