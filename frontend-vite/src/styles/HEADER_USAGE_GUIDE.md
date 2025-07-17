/* 
=== HƯỚNG DẪN SỬ DỤNG HEADER LAYOUT CHUẨN ===

1. LAYOUT: Sử dụng HeaderCard variant="grid" và các class gridItem
2. TYPOGRAPHY: Sử dụng HeaderTitle cho tiêu đề
3. STYLE ĐẶC THÙ: Để trong CSS module của page tương ứng

VÍ DỤ CHO TRANSACTIONSPAGE:
*/

// TransactionsPage.jsx
import HeaderCard from "../components/Common/HeaderCard";
import HeaderTitle from "../components/Common/HeaderTitle";
import headerStyles from "../components/Common/HeaderCard.module.css";
import styles from "../styles/TransactionsPage.module.css";

// Trong render:
<HeaderCard variant="grid">
  {/* Ô 1,1: Title */}
  <div className={`${headerStyles.gridItem1_1} ${styles.titleSection}`}>
    <HeaderTitle icon={<FontAwesomeIcon icon={faReceipt} />}>
      Giao dịch
    </HeaderTitle>
    <span className={styles.subtitle}>Theo dõi mọi thu chi</span>
  </div>

  {/* Ô 1,2: Stats */}
  <div className={`${headerStyles.gridItem1_2} ${styles.statsSection}`}>
    <StatWidget />
  </div>

  {/* Ô 2,1: Filters */}
  <div className={`${headerStyles.gridItem2_1} ${styles.filterSection}`}>
    <DateRangeNavigator />
  </div>

  {/* Ô 2,2: Actions */}
  <div className={`${headerStyles.gridItem2_2} ${styles.actionSection}`}>
    <Button onClick={handleAdd}>
      <FontAwesomeIcon icon={faPlus} /> Thêm
    </Button>
  </div>
</HeaderCard>

/*
TransactionsPage.module.css - CHỈ CHỨA STYLE ĐẶC THÙ:
*/
.titleSection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.statsSection {
  /* Style cho stats widget */
}

.filterSection {
  /* Style cho filter */
}

.actionSection {
  /* Style cho actions */
}

/*
=== QUY TẮC THIẾT KẾ ===

1. HeaderCard.module.css: CHỈ LAYOUT (grid, positioning, responsive)
2. HeaderTitle.module.css: CHỈ TYPOGRAPHY (font, size, weight)
3. PageName.module.css: CHỈ STYLE ĐẶC THÙ (colors, spacing, icons)

=== LỢI ÍCH ===
- Dễ maintain: Mỗi file có trách nhiệm rõ ràng
- Reusable: Layout và typography có thể dùng lại
- Flexible: Mỗi page có thể customize style riêng
- Consistent: Typography đồng nhất trên mọi page
*/
