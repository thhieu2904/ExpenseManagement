# DetailedAnalyticsSection - Áp dụng Title Hierarchy

## Cấu trúc Title Hierarchy trong DetailedAnalyticsSection

### 1. Cấp trung (H2): "Phân Tích Chi Tiêu..."
```jsx
{/* Cấp trung (H2): Title của section lớn */}
<h2 className={styles.analyticsTitle}>{getDynamicTitle()}</h2>
```

**Đặc điểm:**
- Font size: 1.7rem (desktop) → 1.5rem (tablet) → 1.3rem (mobile)
- Font weight: 600 (semibold)
- Letter spacing: -0.5px
- Đây là title của section lớn, cấp trung

**Nội dung dynamic:**
- "Phân Tích Chi Tiêu Tuần Này"
- "Phân Tích Chi Tiêu Tháng 1/2025"
- "Phân Tích Chi Tiêu Năm 2025"

### 2. Cấp thấp nhất (H3): Titles của 2 biểu đồ con

#### Biểu đồ 1: Xu hướng thu nhập và chi tiêu
```jsx
{/* Cấp thấp nhất (H3): Title của component biểu đồ con */}
<h3 className={styles.chartTitle}>
  {activeCategoryName 
    ? `Xu hướng thu nhập và chi tiêu - ${activeCategoryName}`
    : "Xu hướng thu nhập và chi tiêu theo ngày"
  }
</h3>
```

#### Biểu đồ 2: Phân bổ chi tiêu theo danh mục
```jsx
{/* Cấp thấp nhất (H3): Title của component biểu đồ con */}
<h3 className={styles.chartTitle}>Phân bổ chi tiêu theo danh mục</h3>
```

**Đặc điểm:**
- Font size: 1.4rem (desktop) → 1.25rem (tablet) → 1.1rem (mobile)
- Font weight: 600 (semibold)
- Letter spacing: -0.3px
- Đây là title của các component biểu đồ con

## So sánh Before vs After

### Before (Cũ):
```css
/* Section title */
.analyticsTitle {
  font-size: 1.6rem;  /* Cố định */
  color: #2c3e50;     /* Màu cố định */
  font-weight: 600;
  margin: 0;
}

/* Chart titles */
.chartTitle {
  font-size: 1.3rem;  /* Cố định */
  color: #2c3e50;     /* Màu cố định */
  font-weight: 500;   /* Nhẹ hơn */
  margin: 0 0 15px 0;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 10px;
}
```

### After (Mới):
```css
/* Section title - Cấp trung */
.analyticsTitle {
  font-size: var(--title-font-size-h2);  /* Responsive */
  font-weight: 600;
  color: var(--color-text-primary);      /* Color system */
  margin: 0 0 var(--spacing-base) 0;     /* Spacing system */
  letter-spacing: -0.5px;
  line-height: 1.3;
}

/* Chart titles - Cấp thấp nhất */
.chartTitle {
  font-size: var(--title-font-size-h3);  /* Responsive */
  font-weight: 600;                      /* Đậm hơn */
  color: var(--color-text-primary);      /* Color system */
  margin: 0 0 var(--spacing-sm) 0;       /* Spacing system */
  letter-spacing: -0.3px;
  line-height: 1.4;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}
```

## Cấu trúc phân cấp trong Context

### Trong HomePage:
```jsx
function HomePage() {
  return (
    <div>
      {/* H1: Title chính của trang */}
      <HeaderCard title="Quản lý Chi tiêu" />
      
      {/* H2: StatsOverview section */}
      <StatsOverview /> {/* Bên trong có H1 + H3 */}
      
      {/* H2: DetailedAnalytics section */}
      <DetailedAnalyticsSection /> {/* H2 + 2 x H3 */}
      
      {/* H2: RecentTransactions section */}
      <RecentTransactions /> {/* H2 + H3 */}
    </div>
  );
}
```

### Trong StatisticsPage:
```jsx
function StatisticsPage() {
  return (
    <div>
      {/* H1: Title chính của trang */}
      <HeaderCard title="Thống kê Chi tiêu" />
      
      {/* H2: DetailedAnalytics section (main focus) */}
      <DetailedAnalyticsSection />
        {/* - H2: "Phân Tích Chi Tiêu..." */}
        {/* - H3: "Xu hướng thu nhập và chi tiêu..." */}
        {/* - H3: "Phân bổ chi tiêu theo danh mục" */}
    </div>
  );
}
```

## Responsive Behavior

### Desktop (>992px):
- Section title (H2): 1.7rem
- Chart titles (H3): 1.4rem

### Tablet (768px-992px):
- Section title (H2): 1.5rem
- Chart titles (H3): 1.25rem

### Mobile (<768px):
- Section title (H2): 1.3rem
- Chart titles (H3): 1.1rem

## Lợi ích của cập nhật:

### 1. **Consistency** 
- Cùng cấp độ trong toàn app = cùng style
- DetailedAnalytics H2 = RecentTransactions H2

### 2. **Proper Hierarchy**
- Section title (H2) lớn hơn rõ ràng so với chart titles (H3)
- Phù hợp với semantic HTML

### 3. **Design System Integration**
- Sử dụng CSS variables cho colors, spacing, borders
- Dễ maintain và update

### 4. **Responsive Design**
- Tự động scale trên mobile/tablet
- Duy trì tỷ lệ phân cấp

## Visual Impact:

### Trước:
```
Phân Tích Chi Tiêu Tháng 1/2025     (1.6rem, weight 600)
  ├─ Xu hướng thu nhập và chi tiêu  (1.3rem, weight 500)
  └─ Phân bổ chi tiêu theo danh mục (1.3rem, weight 500)
```

### Sau:
```
Phân Tích Chi Tiêu Tháng 1/2025     (1.7rem, weight 600) ← Lớn hơn
  ├─ Xu hướng thu nhập và chi tiêu  (1.4rem, weight 600) ← Rõ ràng hơn
  └─ Phân bổ chi tiêu theo danh mục (1.4rem, weight 600) ← Nhất quán
```

Với cập nhật này, DetailedAnalyticsSection giờ đây hoàn toàn tuân theo hệ thống title hierarchy và sẽ có giao diện professional, nhất quán với toàn bộ ứng dụng! 🎯📊
