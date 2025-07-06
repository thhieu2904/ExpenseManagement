# StatsOverview - Ví dụ Áp dụng Title Hierarchy

## Cấu trúc Title Hierarchy trong StatsOverview

### 1. Cấp cao nhất (H1): "Tổng quan chi tiêu" 
```jsx
// Trong ExtendedHeaderCard title
<>
  <FontAwesomeIcon icon={faChartLine} className={styles.titleIcon} />
  Tổng quan chi tiêu
</>
```

**Đặc điểm:**
- Font size: 2.2rem (desktop) → 1.9rem (tablet) → 1.6rem (mobile)
- Font weight: 700 (bold)
- Letter spacing: -0.8px
- Đây là title chính của component, cấp cao nhất

### 2. Cấp thấp nhất (H3): Card titles ("Thu nhập", "Chi tiêu", "Dòng tiền")
```jsx
// Trong mỗi stat card
<h3 className={styles.cardTitle}>Thu nhập</h3>
<h3 className={styles.cardTitle}>Chi tiêu</h3>
<h3 className={styles.cardTitle}>Dòng tiền</h3>
```

**Đặc điểm:**
- Font size: 1.4rem (desktop) → 1.25rem (tablet) → 1.1rem (mobile)
- Font weight: 600 (semibold)
- Letter spacing: -0.3px
- Là title của các component nhỏ bên trong

## Tại sao không có cấp trung (H2)?

Trong StatsOverview, chúng ta chỉ có 2 cấp:
- **H1**: Title chính của toàn bộ component
- **H3**: Title của từng card con

Không cần H2 vì không có section trung gian nào giữa title chính và các cards.

## So sánh Before vs After

### Before (Cũ):
```css
/* ExtendedHeaderCard title */
.title {
  font-size: var(--title-font-size-h1);
  font-weight: 600;  /* Nhẹ hơn */
  letter-spacing: -0.5px;  /* Ít hơn */
}

/* Stats card titles */
.cardTitle {
  font-size: 1rem;  /* Cố định, không responsive */
  color: #495057;   /* Màu cố định */
  font-weight: 600;
  letter-spacing: 0.02em;
}
```

### After (Mới):
```css
/* ExtendedHeaderCard title */
.title {
  font-size: var(--title-font-size-h1);
  font-weight: 700;  /* Đậm hơn, nổi bật */
  letter-spacing: -0.8px;  /* Chặt hơn, professional */
  line-height: 1.2;  /* Thêm line-height */
}

/* Stats card titles */
.cardTitle {
  font-size: var(--title-font-size-h3);  /* Responsive tự động */
  color: var(--color-text-primary);  /* Sử dụng color system */
  font-weight: 600;
  letter-spacing: -0.3px;  /* Phù hợp với cấp độ */
  line-height: 1.4;
}
```

## Lợi ích của thay đổi này:

### 1. **Consistency (Nhất quán)**
- Tất cả titles cùng cấp độ sẽ có cùng style
- Không cần nhớ từng component có style riêng

### 2. **Responsive Design**
- Tự động điều chỉnh kích thước trên mobile/tablet
- Tỷ lệ phân cấp được duy trì

### 3. **Professional Look**
- Phân cấp rõ ràng, dễ đọc
- Font weights và letter-spacing được tối ưu

### 4. **Maintainability**
- Chỉ cần thay đổi CSS variables để update toàn bộ app
- Dễ debug và maintain

## Ví dụ sử dụng trong các trang khác:

### HomePage:
```jsx
function HomePage() {
  return (
    <div>
      {/* H1: Title chính của trang */}
      <HeaderCard title="Quản lý Chi tiêu" />
      
      {/* H2: Section title */}
      <h2 className="title-h2">Thống kê tổng quan</h2>
      <StatsOverview /> {/* Bên trong có H3 */}
      
      {/* H2: Section title khác */}
      <h2 className="title-h2">Giao dịch gần đây</h2>
      <RecentTransactions /> {/* Bên trong có H3 */}
    </div>
  );
}
```

### TransactionsPage:
```jsx
function TransactionsPage() {
  return (
    <div>
      {/* H1: Title chính */}
      <HeaderCard title="Quản lý Giao dịch" />
      
      {/* H2: Filter section */}
      <h2 className="title-h2">Bộ lọc</h2>
      <FilterComponent>
        <h3 className="title-h3">Loại giao dịch</h3>
        <h3 className="title-h3">Khoảng thời gian</h3>
      </FilterComponent>
      
      {/* H2: List section */}
      <h2 className="title-h2">Danh sách giao dịch</h2>
      <TransactionList />
    </div>
  );
}
```

Với hệ thống này, bạn sẽ có giao diện nhất quán và professional hơn rất nhiều! 🎯
