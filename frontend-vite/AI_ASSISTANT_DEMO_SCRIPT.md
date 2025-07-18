# AI Assistant Demo Script

## Giới thiệu tính năng AI Assistant

Chào bạn! Hôm nay tôi sẽ giới thiệu tính năng AI Assistant - trợ lý thông minh mới được tích hợp vào hệ thống quản lý chi tiêu.

## Demo Flow

### 1. Khởi động ứng dụng

- Mở browser và truy cập `http://localhost:5174`
- Đăng nhập vào hệ thống
- Nhận thấy nút AI Assistant 🤖 ở góc dưới bên phải

### 2. Mở AI Assistant

- Click vào nút robot
- Modal hiện ra với:
  - Header có icon robot và status online/offline
  - Quick action buttons
  - Sample commands
  - Input area với text và voice input

### 3. Demo Text Input

**Thêm giao dịch chi tiêu:**

- Gõ: "Thêm chi tiêu 50k cho ăn uống"
- AI phân tích và trả lời: "Tôi sẽ giúp bạn thêm giao dịch chi tiêu 50,000đ cho ăn uống. Bạn có muốn tôi thực hiện không?"
- Hệ thống tự động chuyển đến trang transactions với pre-filled data

**Xem thống kê:**

- Gõ: "Xem thống kê tháng này"
- AI trả lời với số liệu cụ thể và chuyển đến trang statistics

**Tạo mục tiêu:**

- Gõ: "Tạo mục tiêu tiết kiệm 5 triệu"
- AI xác nhận và chuyển đến trang goals

### 4. Demo Voice Input

**Bật microphone:**

- Click nút microphone 🎤
- Icon chuyển sang đỏ và nhấp nháy
- Nói: "Thêm thu nhập 2 triệu từ lương"
- Text tự động xuất hiện trong input box
- Nhấn send để xử lý

### 5. Demo Quick Actions

- Click "Xem thống kê" → Tự động điền lệnh
- Click "Thêm chi tiêu" → Điền template command
- Click "Tạo mục tiêu" → Template cho goal creation
- Click "Xem số dư" → Quick balance check

### 6. Demo Advanced Features

**Chat History:**

- Cuộc trò chuyện được lưu tự động
- Refresh trang và mở lại → history vẫn còn
- Click 🗑️ để xóa history

**Offline Mode:**

- Disconnect internet
- Status dot chuyển từ xanh sang đỏ
- AI vẫn hoạt động với offline processing
- Reconnect → automatic switch back to online

**Cross-page Navigation:**

- Từ trang Categories, mở AI Assistant
- Gõ: "Xem giao dịch"
- AI chuyển đến trang Transactions
- AI không hiển thị trên trang Login/Register

### 7. Demo Error Handling

**Incomplete Command:**

- Gõ: "Thêm chi tiêu"
- AI: "Tôi cần thêm thông tin về số tiền. Bạn có thể nói rõ hơn không?"

**Invalid Input:**

- Gõ random text
- AI: "Tôi có thể giúp bạn: • Thêm giao dịch thu/chi..."

**Network Error:**

- Offline mode fallback
- Graceful error handling

## Key Points để nhấn mạnh

### 🎯 Tiện lợi

- Truy cập từ mọi trang web
- Không cần navigate nhiều
- Voice input cho mobile users

### 🧠 Thông minh

- Hiểu ngôn ngữ tự nhiên
- Extract thông tin tự động
- Context-aware responses

### ⚡ Nhanh chóng

- Instant response
- Auto-navigation
- Pre-filled forms

### 🔄 Tin cậy

- Offline support
- Chat history
- Error recovery

## Sample Commands để demo

### Basic Commands

```
"Thêm chi tiêu 50k cho ăn uống"
"Thu nhập 2 triệu từ lương"
"Xem thống kê tháng này"
"Tạo mục tiêu tiết kiệm 10 triệu"
"Xem tổng số dư"
```

### Complex Commands

```
"Chi 200 nghìn mua xăng xe"
"Thêm thu 500k từ freelance"
"Đặt mục tiêu tiết kiệm cho du lịch 15 triệu"
"Xem chi tiêu ăn uống tháng này"
```

### Navigation Commands

```
"Chuyển đến trang thống kê"
"Xem danh sách giao dịch"
"Quản lý tài khoản"
"Thêm danh mục mới"
```

## Technical Demo Points

### Architecture

- Frontend: React với Speech Recognition API
- Backend: Node.js với AI processing
- Real-time: WebSocket potential
- Storage: LocalStorage + MongoDB

### AI Processing

- Intent Analysis với RegEx patterns
- Information Extraction
- Response Generation
- Action Routing

### UX/UI Features

- Gradient design
- Smooth animations
- Responsive layout
- Accessibility support

## Kết thúc Demo

AI Assistant giúp người dùng:

- Thao tác nhanh hơn 80%
- Giảm số click từ 5-7 xuống 1-2
- Hỗ trợ người dùng mới làm quen
- Tăng engagement và retention

**Next Steps:**

- Integration với ChatGPT API
- Advanced NLP processing
- Voice feedback (TTS)
- Multi-language support

---

_Demo script này có thể được sử dụng để record video hoặc present trực tiếp cho stakeholders._
