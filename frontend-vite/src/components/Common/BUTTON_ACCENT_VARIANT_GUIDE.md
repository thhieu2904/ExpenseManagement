# Button Accent Variant - Secondary Action Buttons

## Tổng quan

Đã tạo thành công **variant `accent`** cho Common/Button component để áp dụng cho các nút cấp 2 (secondary actions) với màu sắc nhất quán theo nút "Xem chi tiết" trong CategoryExpenseChart.

## Variant `accent` specifications

### 🎨 **Visual Design:**
```css
.accent {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  font-size: 0.875rem;         /* 14px - nhỏ hơn primary */
  height: 36px;                /* Nhỏ hơn primary (40px) */
  padding: 0 16px;             /* Compact padding */
  border-radius: 8px;
  box-shadow: 
    0 2px 4px rgba(59, 130, 246, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 🎯 **Interactive States:**
- **Hover**: Darkens gradient + subtle lift
- **Active**: Returns to base position
- **Disabled**: 60% opacity

### 🚀 **Usage Examples:**

#### ✅ **Đã áp dụng:**
```jsx
// RecentTransactions - "Xem tất cả"
<Button
  onClick={handleViewDetails}
  variant="accent"
  icon={<FontAwesomeIcon icon={faEye} />}
>
  Xem tất cả
</Button>
```

#### 🎯 **Các trường hợp nên sử dụng `accent`:**

1. **Secondary Navigation Actions:**
   - "Xem tất cả" buttons
   - "Xem chi tiết" links
   - Navigation shortcuts

2. **Supporting Actions:**
   - "Load more" buttons
   - Filter toggles
   - Quick actions

3. **Info/View Actions:**
   - "Xem báo cáo"
   - "Xuất dữ liệu"
   - "Tải về"

## Button Hierarchy System

### 📊 **Visual Hierarchy:**
```
Primary (Indigo)    ← Main actions (Thêm, Lưu, Xác nhận)
  ↓
Accent (Blue)       ← Secondary actions (Xem tất cả, Chi tiết)
  ↓  
Secondary (Indigo)  ← Alternative actions (Hủy, Đóng)
```

### 🎨 **Color Comparison:**

#### **Primary:** `#3f51b5` → `#32408f`
- Main CTA buttons
- Form submissions
- Primary actions

#### **Accent:** `#3b82f6` → `#2563eb` (Gradient)
- Secondary navigation
- Info/view actions
- Supporting features

#### **Secondary:** `#3f51b5` → `#32408f`
- Alternative actions
- Cancel buttons
- Secondary CTAs

## Implementation trong các components khác

### 🔄 **Candidates cho `accent` variant:**

#### **1. StatsOverview:**
```jsx
// Thay đổi từ primary sang accent cho nút phụ
<Button variant="accent" icon={<FontAwesomeIcon icon={faPlus} />}>
  Thêm giao dịch
</Button>
```

#### **2. CategoryExpenseChart:**
```jsx
// Thay thế Link bằng Button component
<Button 
  variant="accent" 
  onClick={() => navigate(detailsLink.url)}
  icon={<FontAwesomeIcon icon={faExternalLinkAlt} />}
>
  {detailsLink.text}
</Button>
```

#### **3. Goals sections:**
```jsx
<Button variant="accent" icon={<FontAwesomeIcon icon={faChartLine} />}>
  Xem tiến độ
</Button>
```

#### **4. Profile actions:**
```jsx
<Button variant="accent" icon={<FontAwesomeIcon icon={faEdit} />}>
  Chỉnh sửa thông tin
</Button>
```

## Responsive Behavior

### **Desktop:**
- Full size: 36px height
- Comfortable padding: 0 16px
- Clear gradients và shadows

### **Mobile:**
```css
@media (max-width: 480px) {
  .accent {
    width: 100%;           /* Full width trên mobile */
    justify-content: center;
    font-size: 0.875rem;   /* Giữ nguyên size */
  }
}
```

## Best Practices

### ✅ **DO:**
- Sử dụng cho secondary navigation
- Combine với semantic icons
- Apply cho viewing/info actions
- Maintain consistent sizing

### ❌ **DON'T:**
- Override gradient colors
- Use cho primary submissions
- Mix với custom styles
- Ignore responsive guidelines

## Migration Guide

### **Từ custom buttons sang `accent`:**

#### **Before:**
```jsx
<button className={styles.customViewButton}>
  Xem chi tiết
</button>
```

#### **After:**
```jsx
<Button 
  variant="accent"
  icon={<FontAwesomeIcon icon={faEye} />}
>
  Xem chi tiết
</Button>
```

#### **Benefits:**
- ✅ Consistent styling across app
- ✅ Built-in accessibility
- ✅ Responsive behavior
- ✅ Hover/focus states
- ✅ Loading states support

## Color Psychology

### **Accent Blue (#3b82f6):**
- **Trust & Reliability**: Professional blue
- **Information**: Suitable for viewing actions
- **Calm**: Less aggressive than primary
- **Navigate**: Perfect for secondary navigation

### **Contrast với Primary:**
- Primary (Indigo): Action-oriented
- Accent (Blue): Information-oriented
- Clear visual distinction
- Complementary color scheme

## Performance

### **CSS Optimizations:**
- Uses CSS gradients (no images)
- Hardware-accelerated transitions
- Minimal box-shadow changes
- Efficient transform properties

### **Bundle Size:**
- No additional dependencies
- Reuses existing Button logic
- Minimal CSS addition (~30 lines)

Với variant `accent` mới, bạn giờ có thể tạo ra giao diện nhất quán cho tất cả các nút cấp 2 trong ứng dụng! 🎨✨
