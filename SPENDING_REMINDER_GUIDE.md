# Chức Năng Nhắc Nhở Chi Tiêu (Spending Reminder)

## Tổng Quan

Hệ thống nhắc nhở chi tiêu giúp người dùng theo dõi và kiểm soát chi tiêu hàng ngày/hàng tháng thông qua hệ thống thông báo thông minh.

## Các Tính Năng Chính

### 1. Cài Đặt Nhắc Nhở Chi Tiêu

- **Ngưỡng chi tiêu hàng ngày**: Thiết lập mức chi tiêu tối đa cho một ngày
- **Ngưỡng chi tiêu hàng tháng**: Thiết lập mức chi tiêu tối đa cho một tháng
- **Giờ thông báo**: Chọn thời gian nhận thông báo hàng ngày
- **Ngưỡng cảnh báo**: Thiết lập phần trăm (50-100%) để nhận cảnh báo
- **Bao gồm thông báo mục tiêu**: Tích hợp thông báo về tiến độ mục tiêu
- **Bao gồm thông báo nguồn tiền**: Thông báo về tình trạng các nguồn tài khoản

### 2. Thống Kê Chi Tiêu Real-time

- **Chi tiêu hôm nay**: Tổng số tiền đã chi và số giao dịch
- **Chi tiêu tháng này**: Tổng chi tiêu và mức trung bình hàng ngày
- **Giao dịch gần đây**: Hiển thị 5 giao dịch mới nhất trong ngày

### 3. Hệ Thống Thông Báo Thông Minh

- **Thông báo chi tiêu**: Cảnh báo khi vượt ngưỡng đã thiết lập
- **Thông báo mục tiêu**: Nhắc nhở về deadline và tiến độ mục tiêu
- **Phân loại ưu tiên**: High (đỏ), Medium (vàng), Low (xanh)
- **Cập nhật tự động**: Làm mới thông báo mỗi 5 phút

## Cách Sử Dụng

### Bước 1: Kích Hoạt Nhắc Nhở Chi Tiêu

1. Vào trang **Profile** → **Cài đặt**
2. Bật toggle **"Nhắc nhở chi tiêu"**
3. Click vào **"Cài đặt nhắc nhở chi tiêu"** để mở rộng tùy chọn

### Bước 2: Cấu Hình Chi Tiết

1. **Thiết lập ngưỡng chi tiêu**:

   - Nhập số tiền tối đa cho ngày (VD: 200,000₫)
   - Nhập số tiền tối đa cho tháng (VD: 5,000,000₫)

2. **Cài đặt thời gian thông báo**:

   - Chọn giờ nhận thông báo hàng ngày (VD: 09:00)

3. **Điều chỉnh ngưỡng cảnh báo**:

   - Kéo thanh trượt để chọn % (50-100%)
   - VD: 80% = cảnh báo khi chi 80% ngưỡng đã định

4. **Tùy chọn bổ sung**:

   - ☑️ Bao gồm thông báo về mục tiêu
   - ☑️ Bao gồm thông báo về nguồn tiền

5. Click **"Lưu cài đặt"**

### Bước 3: Theo Dõi Thông Báo

1. **Xem số lượng thông báo**: Kiểm tra icon chuông trên header
2. **Đọc chi tiết thông báo**: Click vào icon chuông để xem dropdown
3. **Theo dõi thống kê**: Xem phần "Thống kê chi tiêu" trong cài đặt

## Các Loại Thông Báo

### 🔴 Ưu Tiên Cao (High Priority)

- Chi tiêu vượt 100% ngưỡng đã định
- Mục tiêu đã quá hạn
- Tài khoản có vấn đề nghiêm trọng

### 🟡 Ưu Tiên Trung Bình (Medium Priority)

- Chi tiêu đạt ngưỡng cảnh báo đã thiết lập
- Mục tiêu sắp hết hạn (trong 7 ngày)

### 🟢 Ưu Tiên Thấp (Low Priority)

- Mục tiêu gần hoàn thành (≥90%)
- Thông báo thông tin chung

## Icon Thông Báo

| Icon | Loại Thông Báo       | Mô Tả                       |
| ---- | -------------------- | --------------------------- |
| 💰   | Chi tiêu             | Cảnh báo về ngưỡng chi tiêu |
| ⏰   | Mục tiêu sắp hết hạn | Deadline trong 7 ngày       |
| ⚠️   | Mục tiêu quá hạn     | Đã vượt qua deadline        |
| 🎯   | Tiến độ mục tiêu     | Gần hoàn thành mục tiêu     |

## Lưu Trữ Dữ Liệu

- **Cài đặt**: Lưu trong localStorage của trình duyệt
- **Thống kê**: Tính toán real-time từ dữ liệu giao dịch
- **Thông báo**: Tạo động dựa trên dữ liệu hiện tại

## Tương Thích

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile responsive
- ✅ Dark/Light mode
- ✅ Offline capable (cài đặt)

## Troubleshooting

### Thông báo không hiển thị?

1. Kiểm tra toggle "Nhắc nhở chi tiêu" đã bật
2. Xem lại ngưỡng cảnh báo có quá cao không
3. Làm mới trang để tải lại dữ liệu

### Thống kê không chính xác?

1. Đảm bảo có giao dịch trong khoảng thời gian
2. Kiểm tra kết nối internet
3. Thử tải lại trang

### Cài đặt không được lưu?

1. Kiểm tra localStorage của trình duyệt có bị vô hiệu hóa
2. Xóa cache và cookies
3. Thử ở chế độ riêng tư/incognito

## API Tích Hợp

### Endpoints Sử Dụng

- `GET /transactions` - Lấy dữ liệu giao dịch
- `GET /goals` - Lấy dữ liệu mục tiêu
- Các service khác theo cấu hình hiện có

### Custom Services

- `spendingReminderService.js` - Quản lý cài đặt và tính toán
- `notificationService.js` - Tích hợp thông báo
- `useNotifications.js` - Hook React cho thông báo

## Phát Triển Tương Lai

- [ ] Push notifications qua browser API
- [ ] Email notifications
- [ ] SMS notifications (tích hợp Twilio)
- [ ] Machine learning để dự đoán chi tiêu
- [ ] Báo cáo chi tiết hàng tuần/tháng
- [ ] So sánh với người dùng khác (anonymous)

---

_Tài liệu này được cập nhật lần cuối: 19/07/2025_
