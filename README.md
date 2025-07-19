# 💰 Hệ Thống Quản Lý Chi Tiêu Cá Nhân

> Ứng dụng quản lý tài chính cá nhân toàn diện với tích hợp AI thông minh và phân tích chi tiêu chuyên sâu.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 📖 Giới Thiệu Đồ Án

Đây là đồ án nhóm phát triển hệ thống quản lý chi tiêu cá nhân sử dụng công nghệ web hiện đại. Dự án được xây dựng nhằm giúp người dùng theo dõi, phân tích và quản lý tài chính cá nhân một cách hiệu quả thông qua giao diện web thân thiện và các tính năng AI thông minh.

### 🎯 Mục Tiêu Đồ Án

- Xây dựng ứng dụng web fullstack hoàn chỉnh
- Tích hợp công nghệ AI (Google Gemini) vào ứng dụng thực tế
- Áp dụng kiến thức về React, Node.js, MongoDB trong dự án lớn
- Triển khai ứng dụng với Docker và các công cụ DevOps
- Thiết kế giao diện responsive và user-friendly

## 🌟 Tính Năng Chính

### 💸 Quản Lý Tài Chính

- **Theo Dõi Giao Dịch**: Ghi lại các giao dịch thu chi với phân loại chi tiết theo danh mục
- **Quản Lý Nhiều Tài Khoản**: Hỗ trợ theo dõi nhiều tài khoản ngân hàng, tiền mặt, ví điện tử
- **Phân Loại Danh Mục**: Tổ chức chi tiêu theo các danh mục có thể tùy chỉnh (ăn uống, di chuyển, giải trí...)
- **Đặt Mục Tiêu Tài Chính**: Thiết lập và theo dõi tiến độ các mục tiêu tiết kiệm hoặc chi tiêu
- **Quản Lý Ngân Sách**: Thiết lập ngân sách hàng tháng cho từng danh mục chi tiêu

### 🤖 Tính Năng AI Thông Minh

- **Phân Tích Chi Tiêu Thông Minh**: AI phân tích thói quen chi tiêu và đưa ra insights sâu sắc
- **Gợi Ý Phân Loại Tự Động**: Tự động đề xuất danh mục phù hợp cho các giao dịch mới
- **Dự Đoán Chi Tiêu**: Dự báo chi tiêu tương lai dựa trên dữ liệu lịch sử
- **Tư Vấn Tài Chính Cá Nhân**: Đưa ra lời khuyên tài chính phù hợp với tình hình của từng người dùng
- **Cảnh Báo Chi Tiêu**: Thông báo khi chi tiêu vượt ngân sách hoặc có xu hướng bất thường

### 📊 Phân Tích và Báo Cáo

- **Biểu Đồ Tương Tác**: Hiển thị dữ liệu tài chính bằng các biểu đồ đẹp mắt (Pie Chart, Bar Chart, Line Chart)
- **Dashboard Thống Kê**: Tổng quan toàn diện về tình hình tài chính với các chỉ số quan trọng
- **Xu Hướng Chi Tiêu**: Theo dõi và phân tích xu hướng chi tiêu theo thời gian (ngày, tuần, tháng, năm)
- **Báo Cáo Tùy Chỉnh**: Tạo báo cáo chi tiết theo khoảng thời gian và danh mục cụ thể
- **So Sánh Thời Kỳ**: So sánh chi tiêu giữa các tháng/quý để đánh giá tiến bộ

### 🎨 Trải Nghiệm Người Dùng

- **Chế Độ Sáng/Tối**: Chuyển đổi linh hoạt giữa giao diện sáng và tối
- **Thiết Kế Responsive**: Tối ưu hóa cho cả máy tính và thiết bị di động
- **Cập Nhật Thời Gian Thực**: Đồng bộ dữ liệu ngay lập tức trên tất cả các thành phần
- **Giao Diện Trực Quan**: Thiết kế hiện đại, dễ sử dụng với UX/UI được chăm chút kỹ lưỡng
- **Đa Ngôn Ngữ**: Hỗ trợ tiếng Việt và tiếng Anh

## 🏗️ Kiến Trúc Dự Án

### 🎨 Frontend (Vite + React)

```
frontend-vite/
├── src/
│   ├── components/         # Các component UI tái sử dụng
│   │   ├── Common/         # Component chung (Header, Sidebar, Loading...)
│   │   ├── Transactions/   # Component liên quan đến giao dịch
│   │   ├── Statistics/     # Component hiển thị thống kê và biểu đồ
│   │   ├── Auth/          # Component đăng nhập, đăng ký
│   │   └── AI/            # Component tính năng AI
│   ├── pages/             # Các trang chính của ứng dụng
│   │   ├── Dashboard/     # Trang tổng quan
│   │   ├── Transactions/  # Trang quản lý giao dịch
│   │   ├── Statistics/    # Trang thống kê
│   │   ├── Profile/       # Trang hồ sơ người dùng
│   │   └── Settings/      # Trang cài đặt
│   ├── api/               # Các service gọi API
│   ├── context/           # React Context cho state management
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Các hàm tiện ích
│   └── styles/            # File CSS và Tailwind config
├── public/                # File tĩnh (images, icons...)
└── scripts/               # Script build và deploy
```

### ⚙️ Backend (Node.js + Express)

```
backend/
├── controllers/           # Xử lý logic nghiệp vụ
│   ├── authController.js      # Xử lý đăng nhập/đăng ký
│   ├── transactionController.js # Quản lý giao dịch
│   ├── aiController.js        # Tích hợp AI
│   ├── statisticsController.js # Thống kê và báo cáo
│   └── userController.js      # Quản lý người dùng
├── models/               # Định nghĩa schema MongoDB
│   ├── User.js           # Model người dùng
│   ├── Transaction.js    # Model giao dịch
│   ├── Category.js       # Model danh mục
│   ├── Account.js        # Model tài khoản
│   └── Goal.js           # Model mục tiêu tài chính
├── routes/               # Định nghĩa API endpoints
├── middleware/           # Middleware xử lý (auth, upload, validation...)
├── uploads/              # Thư mục lưu file upload
└── server.js            # File khởi tạo server
```

### 🗄️ Cơ Sở Dữ Liệu (MongoDB)

```
Collections:
├── users          # Thông tin người dùng
├── transactions   # Dữ liệu giao dịch
├── categories     # Danh mục chi tiêu
├── accounts       # Tài khoản ngân hàng/ví
├── goals          # Mục tiêu tài chính
└── loginhistory   # Lịch sử đăng nhập
```

## 🚀 Hướng Dẫn Cài Đặt và Chạy Dự Án

### 📋 Yêu Cầu Hệ Thống

- **Node.js** (phiên bản 16 trở lên)
- **MongoDB** (local hoặc MongoDB Atlas)
- **Docker** (tùy chọn, để chạy bằng container)
- **Git** để clone repository

### 🛠️ Các Bước Cài Đặt Chi Tiết

#### 1. **Clone Repository từ GitHub**

```bash
# Clone dự án về máy
git clone https://github.com/thhieu2904/ExpenseManagement.git
cd ExpenseManagement
```

#### 2. **Cài Đặt Dependencies**

```bash
# Cài đặt dependencies cho root project
npm install

# Cài đặt dependencies cho backend
cd backend
npm install

# Cài đặt dependencies cho frontend
cd ../frontend-vite
npm install
```

#### 3. **Thiết Lập Environment Variables**

Tạo file `.env` trong thư mục `backend/` với nội dung:

```env
# Cấu hình Server
PORT=5000
NODE_ENV=development

# Cấu hình Database
MONGODB_URI=mongodb://localhost:27017/expense-management

# Cấu hình JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Cấu hình Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Cấu hình CORS
CORS_ORIGIN=http://localhost:5173
```

#### 4. **Khởi Chạy Ứng Dụng**

**Phương pháp 1: Chạy từng service riêng biệt**

```bash
# Terminal 1: Chạy backend server
cd backend
npm run dev
# Server sẽ chạy tại http://localhost:5000

# Terminal 2: Chạy frontend development server
cd frontend-vite
npm run dev
# Frontend sẽ chạy tại http://localhost:5173
```

**Phương pháp 2: Sử dụng Docker (Khuyên dùng)**

```bash
# Chạy toàn bộ hệ thống với Docker Compose
docker-compose -f docker-compose.dev.yml up --build

# Hoặc chạy production mode
docker-compose up --build -d
```

#### 5. **Truy Cập Ứng Dụng**

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation (Swagger)**: http://localhost:5000/api-docs
- **MongoDB**: mongodb://localhost:27017 (nếu chạy local)

### 🔧 Cấu Hình Database

#### MongoDB Local

```bash
# Cài đặt MongoDB trên Windows
# Tải từ: https://www.mongodb.com/try/download/community

# Khởi động MongoDB service
net start MongoDB

# Hoặc chạy bằng command line
mongod --dbpath="C:\data\db"
```

#### MongoDB Atlas (Cloud)

1. Tạo tài khoản tại [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Tạo cluster mới
3. Lấy connection string và cập nhật vào `.env`

### 🧪 Chạy Testing

```bash
# Chạy các test backend
cd backend
node test_system_check.js
node test_ai_assistant.js
node test_registration.js

# Test kết nối database
node check_users.js
node check_categories.js
```

## 🐳 Triển Khai với Docker

### 🔨 Development Environment

```bash
# Chạy môi trường development với hot-reload
docker-compose -f docker-compose.dev.yml up --build

# Chạy ở background
docker-compose -f docker-compose.dev.yml up --build -d
```

### 🚀 Production Environment

```bash
# Chạy môi trường production
docker-compose up --build -d

# Kiểm tra logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### 💻 Sử dụng PowerShell Deploy Script

```powershell
# Chạy script deploy tự động (Windows)
.\deploy.ps1

# Hoặc với parameters
.\deploy.ps1 -Environment "production" -Build $true
```

## 📝 Scripts Có Sẵn

### 🎨 Frontend Scripts (Vite)

```bash
cd frontend-vite

# Chạy development server với hot-reload
npm run dev

# Build cho production (tối ưu hóa)
npm run build

# Preview build production
npm run preview

# Chạy ESLint để check code quality
npm run lint

# Format code với Prettier
npm run format
```

### ⚙️ Backend Scripts (Node.js)

```bash
cd backend

# Chạy production server
npm start

# Chạy development server với nodemon (auto-restart)
npm run dev

# Chạy với debug mode
npm run debug

# Test API endpoints
npm run test
```

## 🔧 Cấu Hình Chi Tiết

### 🎨 Frontend Configuration

- **Vite Config**: `vite.config.js` - Cấu hình build tool và development server
- **Tailwind CSS**: `tailwind.config.js` - Cấu hình utility-first CSS framework
- **ESLint**: `eslint.config.js` - Cấu hình linting rules cho code quality
- **PostCSS**: `postcss.config.js` - Cấu hình CSS processing
- **Package.json**: Dependencies và scripts configuration

### ⚙️ Backend Configuration

- **Server**: `server.js` - Entry point và middleware setup
- **Swagger Documentation**: `swagger.js` - API documentation configuration
- **MongoDB Models**: `models/` - Database schema definitions
- **Route Handlers**: `routes/` - API endpoints organization
- **Controllers**: `controllers/` - Business logic separation
- **Middleware**: `middleware/` - Authentication, validation, file upload

### 🗄️ Database Configuration

**MongoDB Connection Options:**

```javascript
// Local MongoDB
MONGODB_URI=mongodb://localhost:27017/expense-management

// MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-management

// Docker MongoDB
MONGODB_URI=mongodb://mongo:27017/expense-management
```

## 📚 Tài Liệu API

Tài liệu API đầy đủ có thể truy cập tại:

- **Tài Liệu Tương Tác (Swagger)**: http://localhost:5000/api-docs
- **Hướng Dẫn Chi Tiết**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### 🔗 API Endpoints Chính

#### 🔐 Authentication

- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập hệ thống
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/profile` - Lấy thông tin profile

#### 💰 Transaction Management

- `GET /api/transactions` - Lấy danh sách giao dịch của user
- `POST /api/transactions` - Tạo giao dịch mới
- `PUT /api/transactions/:id` - Cập nhật giao dịch
- `DELETE /api/transactions/:id` - Xóa giao dịch
- `GET /api/transactions/export` - Xuất dữ liệu Excel/CSV

#### 📊 Statistics & Analytics

- `GET /api/statistics/overview` - Tổng quan tài chính
- `GET /api/statistics/spending-trends` - Xu hướng chi tiêu
- `GET /api/statistics/category-breakdown` - Phân tích theo danh mục
- `GET /api/statistics/monthly-report` - Báo cáo tháng

#### 🤖 AI Features

- `POST /api/ai/analyze-spending` - Phân tích chi tiêu bằng AI
- `POST /api/ai/suggest-category` - Gợi ý danh mục cho giao dịch
- `POST /api/ai/financial-advice` - Tư vấn tài chính
- `GET /api/ai/spending-insights` - Insights chi tiêu thông minh

#### 🏷️ Category Management

- `GET /api/categories` - Lấy danh sách danh mục
- `POST /api/categories` - Tạo danh mục mới
- `PUT /api/categories/:id` - Cập nhật danh mục
- `DELETE /api/categories/:id` - Xóa danh mục

## 🧪 Testing và Quality Assurance

### 🔍 Backend Testing Files

- `test_ai_assistant.js` - Test tính năng AI và Gemini integration
- `test_registration.js` - Test đăng ký và authentication
- `test_system_check.js` - Test kết nối hệ thống và database
- `test_gemini_direct.js` - Test trực tiếp Google Gemini API
- `check_users.js` - Kiểm tra dữ liệu người dùng
- `check_categories.js` - Kiểm tra dữ liệu danh mục

### 🚀 Chạy Tests

```bash
# Chuyển vào thư mục backend
cd backend

# Test kết nối hệ thống tổng thể
node test_system_check.js

# Test tính năng AI
node test_ai_assistant.js

# Test đăng ký người dùng
node test_registration.js

# Test API endpoints
node test_gemini_direct.js

# Kiểm tra database
node check_users.js
node check_categories.js
```

### 📋 Test Coverage

- ✅ Authentication & Authorization
- ✅ CRUD Operations cho tất cả entities
- ✅ AI Integration (Google Gemini)
- ✅ Database Connections
- ✅ API Response Validation
- ✅ Error Handling
- ✅ File Upload/Download

## 🤝 Đóng Góp và Phát Triển

### 👥 Thành Viên Nhóm

- **Nguyễn Thanh Hiếu** - [thhieu2904](https://github.com/thhieu2904)
- **Phạm Hoàng Kha** - [Hoangkha1107](https://github.com/Hoangkha1107)
- **Nguyễn Trí Cường** - [NguyenTriCuong07](https://github.com/NguyenTriCuong07)

### 🔄 Quy Trình Phát Triển

1. **Fork repository** về tài khoản cá nhân
2. **Tạo branch mới** cho feature (`git checkout -b feature/ten-tinh-nang-moi`)
3. **Commit changes** với message rõ ràng (`git commit -m 'Thêm tính năng ABC'`)
4. **Push lên branch** (`git push origin feature/ten-tinh-nang-moi`)
5. **Tạo Pull Request** để review code

### 📋 Coding Standards

- **JavaScript**: Sử dụng ES6+ syntax
- **React**: Functional components với Hooks
- **CSS**: Tailwind CSS utility classes
- **API**: RESTful design principles
- **Database**: MongoDB với Mongoose ODM
- **Naming**: camelCase cho variables, PascalCase cho components

### � Git Workflow

```bash
# Cập nhật code mới nhất
git pull origin main

# Tạo branch mới cho feature
git checkout -b feature/expense-tracking

# Làm việc và commit
git add .
git commit -m "feat: thêm tính năng theo dõi chi tiêu"

# Push và tạo PR
git push origin feature/expense-tracking
```

## 📄 Tài Liệu Kỹ Thuật

### 📖 Hướng Dẫn Chi Tiết

- **[SETUP_SOLUTION_GUIDE.md](./SETUP_SOLUTION_GUIDE.md)** - Giải pháp setup cho người dùng mới
- **[AI_ASSISTANT_DEMO_SCRIPT.md](./frontend-vite/AI_ASSISTANT_DEMO_SCRIPT.md)** - Demo tính năng AI
- **[DARK_MODE_IMPLEMENTATION_GUIDE.md](./frontend-vite/DARK_MODE_IMPLEMENTATION_GUIDE.md)** - Hướng dẫn implement dark mode
- **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - Hướng dẫn deploy với container
- **[SPENDING_REMINDER_GUIDE.md](./SPENDING_REMINDER_GUIDE.md)** - Tính năng nhắc nhở chi tiêu

### 📋 Báo Cáo Kỹ Thuật

- **[STATISTICS_PAGE_FINAL_REPORT.md](./frontend-vite/STATISTICS_PAGE_FINAL_REPORT.md)** - Báo cáo trang thống kê
- **[PROFILE_PAGE_REFACTOR_SUMMARY.md](./PROFILE_PAGE_REFACTOR_SUMMARY.md)** - Refactor trang profile
- **[GEMINI_INTEGRATION_SUMMARY.md](./GEMINI_INTEGRATION_SUMMARY.md)** - Tích hợp Google Gemini AI
- **[AI_CONTROLLER_OPTIMIZATION_SUMMARY.md](./AI_CONTROLLER_OPTIMIZATION_SUMMARY.md)** - Tối ưu AI controller

## 🛠️ Công Nghệ Sử Dụng

### 🎨 Frontend Technologies

- **React 19** - Thư viện xây dựng giao diện người dùng hiện đại
- **Vite** - Build tool nhanh cho development và production
- **Tailwind CSS** - Utility-first CSS framework cho styling
- **Recharts** - Thư viện biểu đồ tương tác cho React
- **React Router Dom** - Routing cho single-page application
- **Axios** - HTTP client để gọi API
- **React Query (@tanstack/react-query)** - Server state management
- **React Icons** - Icon library phong phú
- **React DatePicker** - Component chọn ngày tháng
- **React Toastify** - Notification system đẹp mắt

### ⚙️ Backend Technologies

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework linh hoạt
- **MongoDB** - NoSQL database cho dữ liệu linh hoạt
- **Mongoose** - MongoDB object modeling cho Node.js
- **JSON Web Tokens (JWT)** - Authentication và authorization
- **Swagger (swagger-jsdoc, swagger-ui-express)** - API documentation
- **Google Generative AI (@google/generative-ai)** - Tích hợp AI Gemini
- **Bcrypt.js** - Hash password bảo mật
- **Multer** - Handle file upload
- **CORS** - Cross-Origin Resource Sharing
- **Dotenv** - Environment variables management

### 🚀 DevOps & Deployment

- **Docker & Docker Compose** - Containerization và orchestration
- **Nginx** - Reverse proxy và static file serving
- **MongoDB** - Database với replication support
- **PowerShell Scripts** - Automation scripts cho Windows
- **GitHub Actions** - CI/CD pipeline (sẽ implement)

### 🛠️ Development Tools

- **ESLint** - Code linting cho quality assurance
- **Prettier** - Code formatting tự động
- **Nodemon** - Auto-restart server khi development
- **Vite Dev Server** - Hot module replacement
- **PostCSS** - CSS processing với autoprefixer

## 📊 Thống Kê Dự Án

### 💻 Quy Mô Code Base

- **Ngôn Ngữ Chính**: JavaScript (ES6+), HTML5, CSS3
- **Frontend Components**: 50+ React components được tối ưu
- **API Endpoints**: 25+ RESTful endpoints hoàn chỉnh
- **Database Collections**: 6 MongoDB collections được thiết kế tốt
- **Core Features**: 20+ tính năng chính đã hoàn thành
- **Lines of Code**: ~15,000+ dòng code (ước tính)

### 🎯 Tính Năng Đã Hoàn Thành

✅ **Authentication System** - Đăng nhập/đăng ký bảo mật  
✅ **Transaction Management** - CRUD đầy đủ cho giao dịch  
✅ **AI Integration** - Tích hợp Google Gemini thành công  
✅ **Statistics Dashboard** - Biểu đồ và báo cáo chi tiết  
✅ **Category Management** - Quản lý danh mục linh hoạt  
✅ **Dark/Light Mode** - Switching theme mượt mà  
✅ **Responsive Design** - Tương thích mobile/desktop  
✅ **File Upload/Export** - Upload avatar, export Excel  
✅ **Real-time Updates** - Cập nhật dữ liệu tức thời  
✅ **Docker Deployment** - Container hóa hoàn chỉnh

### 🚧 Tính Năng Đang Phát Triển

� **Push Notifications** - Thông báo real-time  
🔄 **Advanced AI Analytics** - Phân tích AI sâu hơn  
🔄 **Multi-language Support** - Hỗ trợ đa ngôn ngữ  
🔄 **Mobile App** - Ứng dụng React Native

## 🎓 Kiến Thức Áp Dụng Trong Đồ Án

### 🧠 Frontend Development

- **React Hooks**: useState, useEffect, useContext, custom hooks
- **State Management**: Context API, React Query cho server state
- **Routing**: React Router Dom với protected routes
- **Responsive Design**: Tailwind CSS với mobile-first approach
- **Chart Integration**: Recharts cho data visualization
- **Form Handling**: Controlled components với validation
- **File Upload**: Multer integration với preview functionality

### ⚡ Backend Development

- **RESTful API Design**: Thiết kế API theo chuẩn REST
- **Database Modeling**: MongoDB schema design với Mongoose
- **Authentication**: JWT tokens với refresh token strategy
- **Middleware**: Custom middleware cho auth, validation, logging
- **Error Handling**: Centralized error handling với try-catch
- **File Management**: Upload, storage và serving static files
- **API Documentation**: Swagger/OpenAPI specification

### 🤖 AI Integration

- **Google Gemini API**: Integration với generative AI
- **Prompt Engineering**: Thiết kế prompt cho financial analysis
- **Error Handling**: Graceful fallback khi AI service down
- **Rate Limiting**: Quản lý quota API calls
- **Data Processing**: Format data cho AI analysis

### 🐳 DevOps & Deployment

- **Containerization**: Docker multi-stage builds
- **Orchestration**: Docker Compose cho development/production
- **Environment Management**: Multiple .env configurations
- **Reverse Proxy**: Nginx configuration
- **Process Management**: PM2 cho production deployment

## 🏆 Highlights của Dự Án

### 🌟 Điểm Mạnh Kỹ Thuật

1. **Kiến Trúc Modular**: Code được tổ chức rõ ràng, dễ maintain
2. **AI Integration**: Successful integration với Google Gemini AI
3. **Real-time Features**: WebSocket cho updates tức thời
4. **Security Best Practices**: JWT, bcrypt, input validation
5. **Performance Optimization**: Code splitting, lazy loading
6. **Cross-platform**: Responsive design hoạt động mọi thiết bị
7. **Developer Experience**: Hot reload, debugging tools, logging

### 📈 Business Value

1. **Practical Application**: Giải quyết vấn đề thực tế của user
2. **Scalable Architecture**: Có thể mở rộng cho nhiều user
3. **User Experience**: Interface đẹp, dễ sử dụng
4. **Data Insights**: AI-powered analytics có giá trị cao
5. **Maintainable Code**: Code quality cao, documentation đầy đủ

## 📞 Liên Hệ và Hỗ Trợ

### � Thông Tin Liên Hệ

- **Email**: thhieu2904@gmail.com
- **GitHub**: [thhieu2904](https://github.com/thhieu2904)
- **LinkedIn**: [Trần Hoàng Hiếu](https://linkedin.com/in/thhieu2904)

### 🆘 Báo Lỗi và Đóng Góp

- **Issues**: Tạo issue trên GitHub repository
- **Pull Requests**: Welcome mọi đóng góp cải thiện
- **Documentation**: Đóng góp cải thiện documentation

### 📚 Tài Nguyên Tham Khảo

- **React Documentation**: https://react.dev/
- **Node.js Guides**: https://nodejs.org/en/docs/
- **MongoDB Manual**: https://docs.mongodb.com/
- **Docker Documentation**: https://docs.docker.com/
- **Tailwind CSS**: https://tailwindcss.com/docs

## 📜 License và Bản Quyền

Dự án này được phát hành dưới **MIT License** - xem file [LICENSE](LICENSE) để biết chi tiết.

### 📋 MIT License Summary

✅ **Được phép**: Sử dụng, sao chép, chỉnh sửa, phân phối  
✅ **Yêu cầu**: Giữ lại copyright notice  
❌ **Không đảm bảo**: Warranty, liability

---

## 🎉 Lời Cảm Ơn

Cảm ơn tất cả thành viên nhóm đã đóng góp vào dự án này. Đây là kết quả của sự nỗ lực và collaboration tuyệt vời!

**Được phát triển với ❤️ bởi nhóm [Tên Nhóm] - [thhieu2904](https://github.com/thhieu2904)**

---

### 📈 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/thhieu2904/ExpenseManagement?style=social)
![GitHub Forks](https://img.shields.io/github/forks/thhieu2904/ExpenseManagement?style=social)
![GitHub Issues](https://img.shields.io/github/issues/thhieu2904/ExpenseManagement)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/thhieu2904/ExpenseManagement)

**⭐ Nếu dự án hữu ích, hãy cho chúng mình một star nhé! ⭐**
