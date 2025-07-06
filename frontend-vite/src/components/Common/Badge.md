# Badge Component - Hướng dẫn sử dụng

## Tổng quan
Badge Component là một component tái sử dụng với hiệu ứng hover đẹp mắt và nhiều variant khác nhau.

## Cài đặt

### 1. Import component:
```jsx
import Badge from '../components/Common/Badge';
```

### 2. Sử dụng CSS module (nếu cần customize):
```jsx
import badgeStyles from '../styles/components/Badge.module.css';
```

## Các Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `variant` | string | 'default' | Màu sắc: 'default', 'primary', 'success', 'warning', 'danger', 'info' |
| `size` | string | 'default' | Kích thước: 'small', 'default', 'large' |
| `highlight` | boolean | false | Hiển thị trạng thái highlight |
| `highlightVariant` | string | 'primary' | Màu highlight: 'primary', 'success' |
| `number` | string/number | - | Số hiển thị |
| `text` | string | - | Text hiển thị |
| `to` | string | - | Link nội bộ (React Router) |
| `href` | string | - | Link bên ngoài |
| `onClick` | function | - | Xử lý click |
| `title` | string | - | Tooltip |
| `className` | string | '' | CSS class bổ sung |
| `children` | ReactNode | - | Nội dung tùy chỉnh |

## Ví dụ sử dụng

### 1. Badge cơ bản
```jsx
<Badge text="Active" variant="success" />
<Badge number={5} text="items" />
```

### 2. Badge với link
```jsx
// Link nội bộ
<Badge 
  to="/transactions?categoryId=123" 
  number={3} 
  text="giao dịch"
  variant="primary"
  title="Xem giao dịch"
/>

// Link bên ngoài  
<Badge 
  href="https://example.com"
  text="Xem thêm"
  variant="info"
/>
```

### 3. Badge button
```jsx
<Badge 
  text="Delete" 
  variant="danger"
  onClick={() => handleDelete()}
/>
```

### 4. Badge với highlight
```jsx
<Badge 
  number={10} 
  text="notifications"
  variant="warning" 
  highlight={true}
  highlightVariant="success"
/>
```

### 5. Badge kích thước khác nhau
```jsx
<Badge text="Small" size="small" variant="primary" />
<Badge text="Default" variant="primary" />  
<Badge text="Large" size="large" variant="primary" />
```

### 6. Badge với nội dung tùy chỉnh
```jsx
<Badge variant="info">
  <FontAwesomeIcon icon={faUser} />
  <span>5 users</span>
</Badge>
```

## Các Variant có sẵn

### Default
- Màu: Gray (#6c757d)
- Sử dụng: Trạng thái trung tính

### Primary  
- Màu: Blue (#667eea)
- Sử dụng: Hành động chính, link quan trọng

### Success
- Màu: Green (#28a745) 
- Sử dụng: Trạng thái thành công, số liệu tích cực

### Warning
- Màu: Yellow (#ffc107)
- Sử dụng: Cảnh báo, chú ý

### Danger
- Màu: Red (#dc3545)
- Sử dụng: Lỗi, xóa, hành động nguy hiểm

### Info
- Màu: Cyan (#17a2b8)
- Sử dụng: Thông tin, hướng dẫn

## Hiệu ứng có sẵn

### 1. Shimmer Effect
- Hiệu ứng sáng chạy qua khi hover
- Tự động áp dụng cho tất cả badge

### 2. Lift Effect  
- Badge nhấc lên khi hover
- Có box-shadow

### 3. Pulse Animation
- Áp dụng khi `highlight={true}`
- Hiệu ứng pulse ring

### 4. Press Effect
- Scale nhẹ khi click/active

## Tùy chỉnh và mở rộng

### 1. Thêm variant mới
Trong `Badge.module.css`, thêm:
```css
.badgeCustom {
  color: #your-color;
  background: rgba(your-color, 0.1);
  border-color: rgba(your-color, 0.2);
}

.badgeCustom:hover {
  background: linear-gradient(135deg, #your-color 0%, #darker-color 100%);
  color: white;
  border-color: #your-color;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(your-color-rgb, 0.3);
}
```

### 2. Sử dụng với các component khác
```jsx
// Trong CategoryList
<Badge 
  to={`/transactions?categoryId=${category.id}`}
  number={category.transactionCount}
  text="giao dịch"
  variant="primary"
  highlight={isSelected}
/>

// Trong UserList
<Badge 
  text={user.role}
  variant={user.role === 'admin' ? 'danger' : 'default'}
/>

// Trong Notification
<Badge 
  number={unreadCount}
  variant="warning"
  highlight={unreadCount > 0}
  size="small"
/>
```

## Responsive và Accessibility

### Responsive
- Tự động điều chỉnh kích thước trên mobile
- Sử dụng CSS media queries

### Accessibility  
- Hỗ trợ keyboard focus
- Screen reader friendly
- ARIA attributes tự động

## Browser Support
- Chrome, Firefox, Safari, Edge (modern versions)
- IE11+ (với polyfills)
- Mobile browsers

## Performance
- CSS animations sử dụng GPU acceleration
- Minimal re-renders
- Optimized for 60fps
