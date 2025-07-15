# Title Hierarchy System Guide

## Tổng quan
Hệ thống phân cấp title được thiết kế để tạo ra sự nhất quán và rõ ràng trong giao diện người dùng với 3 cấp độ chính.

## Cấu trúc phân cấp

### 1. Cấp cao nhất - Title của Header/Trang (title-h1 / title-primary)
**Sử dụng cho:**
- Title trong HeaderCard
- Tiêu đề chính của trang
- Tiêu đề quan trọng nhất trên màn hình

**Đặc điểm:**
- Font size: 2.2rem (desktop) → 1.9rem (tablet) → 1.6rem (mobile)
- Font weight: 700 (bold)
- Letter spacing: -0.8px
- Margin bottom: 24px

**Cách sử dụng:**
```jsx
<h1 className="title-h1">Quản lý Chi tiêu</h1>
// hoặc
<h1 className="title-primary">Trang chủ</h1>
```

### 2. Cấp trung - Title của Section/Component lớn (title-h2 / title-section)
**Sử dụng cho:**
- Tiêu đề của các section lớn
- Tiêu đề của các component chính (như StatsOverview, RecentTransactions)
- Phân chia các phần chính trong trang

**Đặc điểm:**
- Font size: 1.7rem (desktop) → 1.5rem (tablet) → 1.3rem (mobile)
- Font weight: 600 (semibold)
- Letter spacing: -0.5px
- Margin bottom: 16px

**Cách sử dụng:**
```jsx
<h2 className="title-h2">Thống kê tổng quan</h2>
// hoặc
<h2 className="title-section">Giao dịch gần đây</h2>
```

### 3. Cấp thấp nhất - Title của Component nhỏ (title-h3 / title-component)
**Sử dụng cho:**
- Tiêu đề của các component nhỏ bên trong section
- Tiêu đề của các card
- Tiêu đề của các form, modal

**Đặc điểm:**
- Font size: 1.4rem (desktop) → 1.25rem (tablet) → 1.1rem (mobile)
- Font weight: 600 (semibold)
- Letter spacing: -0.3px
- Margin bottom: 12px

**Cách sử dụng:**
```jsx
<h3 className="title-h3">Chi tiêu tháng này</h3>
// hoặc
<h3 className="title-component">Thông tin tài khoản</h3>
```

## Utility Classes bổ sung

### Spacing Modifiers
```jsx
<h1 className="title-h1 title-no-margin">Title không margin</h1>
<h2 className="title-h2 title-compact">Title margin nhỏ</h2>
<h2 className="title-h2 title-spaced">Title margin lớn</h2>
```

### Visual Enhancements
```jsx
<h2 className="title-h2 title-with-divider">Title với đường gạch dưới màu primary</h2>
<h2 className="title-h2 title-with-underline">Title với border dưới</h2>
```

## Quy tắc sử dụng

### ✅ Nên làm:
1. Luôn sử dụng đúng cấp độ theo thứ tự logic
2. Cấp cao nhất (h1) chỉ xuất hiện 1 lần trên mỗi trang
3. Sử dụng utility classes để điều chỉnh spacing khi cần
4. Giữ nguyên color scheme và không override trừ khi thật sự cần thiết

### ❌ Không nên làm:
1. Bỏ qua cấp độ (từ h1 nhảy thẳng h3)
2. Sử dụng nhiều h1 trên cùng một trang
3. Override font-size hoặc font-weight tùy ý
4. Sử dụng title class không phù hợp với semantic HTML

## Ví dụ thực tế

### Trang HomePage:
```jsx
function HomePage() {
  return (
    <div>
      {/* HeaderCard */}
      <HeaderCard>
        <h1 className="title-h1">Quản lý Chi tiêu</h1>
      </HeaderCard>
      
      {/* StatsOverview Component */}
      <StatsOverview>
        <h2 className="title-h2">Thống kê tổng quan</h2>
        <div className="stats-cards">
          <div className="card">
            <h3 className="title-h3">Tổng thu nhập</h3>
          </div>
          <div className="card">
            <h3 className="title-h3">Tổng chi tiêu</h3>
          </div>
        </div>
      </StatsOverview>
      
      {/* Recent Transactions */}
      <RecentTransactions>
        <h2 className="title-h2">Giao dịch gần đây</h2>
        <div className="transaction-list">
          <h3 className="title-h3">Hôm nay</h3>
          {/* ... */}
        </div>
      </RecentTransactions>
    </div>
  );
}
```

### Trang TransactionsPage:
```jsx
function TransactionsPage() {
  return (
    <div>
      <HeaderCard>
        <h1 className="title-h1">Quản lý Giao dịch</h1>
      </HeaderCard>
      
      <FilterSection>
        <h2 className="title-h2">Bộ lọc</h2>
        <div className="filter-groups">
          <div className="filter-group">
            <h3 className="title-h3">Loại giao dịch</h3>
          </div>
          <div className="filter-group">
            <h3 className="title-h3">Khoảng thời gian</h3>
          </div>
        </div>
      </FilterSection>
      
      <TransactionsList>
        <h2 className="title-h2">Danh sách giao dịch</h2>
      </TransactionsList>
    </div>
  );
}
```

## Responsive Behavior
Hệ thống tự động điều chỉnh kích thước font trên các thiết bị khác nhau:
- **Desktop (>992px)**: Kích thước font đầy đủ
- **Tablet (768px-992px)**: Giảm 10-15% kích thước
- **Mobile (<768px)**: Giảm 20-25% kích thước

Điều này đảm bảo giao diện luôn cân đối và dễ đọc trên mọi thiết bị.
