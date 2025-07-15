# Header Component System

## Tổng quan

Hệ thống header đã được refactor để đảm bảo tính nhất quán và khả năng tái sử dụng cao. Tất cả các header trong ứng dụng hiện tại đều kế thừa từ một base design system thống nhất.

## Components

### 1. ExtendedHeaderCard

Component chính để tạo header cho các page với khả năng mở rộng linh hoạt.

**Props:**
- `title` (string): Tiêu đề chính
- `extra` (ReactNode): Nội dung bổ sung bên cạnh title (icon, badge, etc.)
- `filter` (ReactNode): Các bộ lọc hoặc controls
- `action` (ReactNode): Các nút hành động (thường ở phía bên phải)
- `customSections` (array): Các sections tùy chỉnh
- `children` (ReactNode): Nội dung con
- `layout` ('default' | 'extended'): Loại layout
- `className` (string): CSS class bổ sung

**Ví dụ sử dụng cơ bản:**
```jsx
<ExtendedHeaderCard
  title="Quản lý tài khoản"
  extra={<FontAwesomeIcon icon={faWallet} />}
  action={
    <Button onClick={handleAdd} variant="primary">
      Thêm tài khoản
    </Button>
  }
/>
```

**Ví dụ sử dụng nâng cao với custom sections:**
```jsx
<ExtendedHeaderCard
  title="Báo cáo & Phân tích"
  extra={
    <DateRangeNavigator
      period={period}
      currentDate={currentDate}
      onDateChange={handleDateChange}
      onPeriodChange={handlePeriodChange}
    />
  }
>
  {/* Nội dung tùy chỉnh */}
  <div className={styles.statsCards}>
    {/* Stats cards */}
  </div>
</ExtendedHeaderCard>
```

### 2. HeaderCard (Base)

Component gốc với functionality cơ bản, vẫn được sử dụng cho các trường hợp đơn giản.

## Design System Integration

Hệ thống sử dụng CSS variables từ `globals.css` để đảm bảo tính nhất quán:

### Typography
- `--font-size-xs` đến `--font-size-3xl`
- `--font-weight-normal`, `--font-weight-medium`, `--font-weight-bold`

### Spacing
- `--spacing-xs` đến `--spacing-3xl`

### Colors
- `--color-text-primary`, `--color-text-secondary`
- `--color-primary`, `--color-primary-hover`
- `--color-surface-primary`, `--color-border-light`

### Border & Shadow
- `--border-radius-sm` đến `--border-radius-xl`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`

## Migration Guide

### Trước khi refactor:
```jsx
// GoalsPage.jsx (cũ)
<div className={styles.header}>
  <h1 className={styles.pageTitle}>Mục tiêu của tôi</h1>
  <button onClick={handleAdd} className={styles.addButton}>
    <FontAwesomeIcon icon={faPlus} />
    Tạo mục tiêu mới
  </button>
</div>
```

### Sau khi refactor:
```jsx
// GoalsPage.jsx (mới)
<ExtendedHeaderCard
  title="Mục tiêu của tôi"
  action={
    <button onClick={handleAdd} className={styles.addButton}>
      <FontAwesomeIcon icon={faPlus} />
      Tạo mục tiêu mới
    </button>
  }
/>
```

## Các Page đã được refactor

1. **StatsOverview**: Sử dụng ExtendedHeaderCard với custom children cho stats cards
2. **GoalsPage**: Sử dụng ExtendedHeaderCard với action button
3. **StatisticsPage**: Sử dụng ExtendedHeaderCard với DateRangeNavigator trong extra
4. **AccountPageHeader**: Chuyển từ custom header sang ExtendedHeaderCard
5. **CategoryPageHeader**: Đã sử dụng HeaderCard từ trước, giờ tương thích với hệ thống mới

## Benefits

1. **Consistency**: Tất cả headers có cùng styling và behavior
2. **Maintainability**: Chỉ cần update ExtendedHeaderCard để thay đổi toàn bộ app
3. **Flexibility**: Dễ dàng thêm tính năng mới với custom sections
4. **Performance**: Ít code duplicate, CSS được optimize
5. **Design System**: Sử dụng design tokens thống nhất

## Best Practices

1. Luôn sử dụng ExtendedHeaderCard cho page headers mới
2. Sử dụng CSS variables từ globals.css thay vì hardcode values
3. Giữ actions đơn giản và consistent
4. Sử dụng extra prop cho metadata như icons, badges
5. Sử dụng children cho nội dung phức tạp như StatsOverview
