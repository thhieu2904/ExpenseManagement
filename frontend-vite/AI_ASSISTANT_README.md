# AI Assistant - Trợ lý thông minh cho Expense Management

## Tổng quan

AI Assistant là một nút nổi (floating button) xuất hiện trên toàn bộ trang web, cho phép người dùng tương tác nhanh với hệ thống thông qua nhập liệu bằng text hoặc giọng nói.

## Tính năng chính

### 🎯 Truy cập nhanh

- **Nút nổi**: Luôn hiển thị ở góc dưới bên phải của trang web
- **Đa trang**: Hoạt động trên tất cả các trang (trừ Welcome, Login, Register)
- **Responsive**: Tự động điều chỉnh kích thước theo thiết bị

### 🗣️ Nhập liệu đa dạng

- **Text input**: Nhập thông qua bàn phím
- **Voice input**: Nhận diện giọng nói tiếng Việt
- **Quick actions**: Các nút thao tác nhanh cho chức năng phổ biến

### 🤖 AI thông minh

- **Phân tích intent**: Hiểu ý định người dùng từ câu nói tự nhiên
- **Trích xuất thông tin**: Tự động lấy số tiền, danh mục, loại giao dịch
- **Phản hồi thông minh**: Đưa ra câu trả lời và hành động phù hợp

### 💾 Lưu trữ thông minh

- **Chat history**: Lưu lịch sử 20 tin nhắn gần nhất
- **Offline support**: Hoạt động kể cả khi mất kết nối internet
- **Auto-save**: Tự động lưu và khôi phục cuộc trò chuyện

## Các lệnh được hỗ trợ

### 📊 Xem thống kê

```
"Xem thống kê tháng này"
"Tổng chi tiêu"
"Số dư hiện tại"
"Báo cáo thu chi"
```

### 💰 Thêm giao dịch

```
"Thêm chi tiêu 50k cho ăn uống"
"Thu nhập 2 triệu từ lương"
"Chi 100 nghìn mua xăng"
"Thêm giao dịch thu 500k"
```

### 🎯 Quản lý mục tiêu

```
"Tạo mục tiêu tiết kiệm 5 triệu"
"Đặt mục tiêu 10 triệu"
"Mục tiêu tiết kiệm mới"
```

### 🏦 Quản lý tài khoản & danh mục

```
"Thêm tài khoản mới"
"Tạo danh mục mới"
"Xem danh sách giao dịch"
```

## Cách sử dụng

### 1. Mở AI Assistant

- Click vào nút robot 🤖 ở góc dưới bên phải
- Modal sẽ hiện ra với giao diện chat

### 2. Nhập yêu cầu

**Cách 1: Nhập text**

- Gõ yêu cầu vào ô input
- Nhấn Enter hoặc nút gửi ➤

**Cách 2: Dùng giọng nói**

- Click nút microphone 🎤
- Nói yêu cầu bằng tiếng Việt
- Chờ AI xử lý và phản hồi

**Cách 3: Quick actions**

- Click vào các nút hành động nhanh
- Hệ thống sẽ tự động điền lệnh

### 3. Xử lý phản hồi

- AI sẽ phân tích và đưa ra phản hồi
- Nếu cần, AI sẽ tự động chuyển đến trang phù hợp
- Hoặc yêu cầu thêm thông tin nếu chưa đủ

## Cấu trúc kỹ thuật

### Frontend Components

```
src/components/AIAssistant/
├── AIAssistant.jsx         # Main component
└── AIAssistant.module.css  # Styling
```

### Backend API

```
backend/
├── controllers/aiController.js  # AI processing logic
├── routes/ai.js                # API routes
└── models/                     # Database models
```

### API Services

```
src/api/aiService.js            # Frontend service layer
```

## API Endpoints

### POST `/api/ai-assistant`

Xử lý tin nhắn từ người dùng

```json
{
  "message": "Thêm chi tiêu 50k cho ăn uống"
}
```

### POST `/api/ai-assistant/create-transaction`

Tạo giao dịch tự động

```json
{
  "amount": 50000,
  "type": "expense",
  "category": "ăn uống",
  "description": "Giao dịch được tạo bởi AI Assistant"
}
```

## Trạng thái hoạt động

### Online Mode

- Kết nối với backend API
- Xử lý thông minh với database
- Truy cập đầy đủ tính năng

### Offline Mode

- Xử lý local với JavaScript
- Phân tích intent cơ bản
- Hướng dẫn và điều hướng

### Visual Indicators

- 🟢 Chấm xanh: Online
- 🔴 Chấm đỏ: Offline
- 🎤 Đỏ nhấp nháy: Đang ghi âm

## Tương lai

### Planned Features

- [ ] Integration với OpenAI/ChatGPT
- [ ] Hỗ trợ nhiều ngôn ngữ
- [ ] Voice feedback (TTS)
- [ ] Smart suggestions dựa trên lịch sử
- [ ] Export chat history
- [ ] Custom voice commands
- [ ] Dark/Light theme toggle

### Technical Improvements

- [ ] WebSocket real-time communication
- [ ] Advanced NLP processing
- [ ] Machine learning suggestions
- [ ] Voice recognition improvements
- [ ] Performance optimization

## Troubleshooting

### Microphone không hoạt động

1. Kiểm tra quyền truy cập microphone
2. Đảm bảo sử dụng HTTPS (required cho Web Speech API)
3. Thử refresh trang web

### AI không hiểu lệnh

1. Sử dụng câu rõ ràng và đơn giản
2. Bao gồm số tiền cụ thể (50k, 2 triệu)
3. Đề cập danh mục rõ ràng (ăn uống, xăng xe)

### Không kết nối được backend

1. Kiểm tra server backend đang chạy
2. Kiểm tra network connection
3. AI sẽ tự động chuyển sang offline mode

---

_AI Assistant được phát triển để cải thiện trải nghiệm người dùng và tăng tốc độ thao tác với hệ thống Expense Management._
