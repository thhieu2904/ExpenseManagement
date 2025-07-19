# 🏦 Expense Management API Documentation

> **Comprehensive API Documentation for Personal Finance Management System**

## 📋 Table of Contents

- [🚀 Quick Start](#quick-start)
- [🔐 Authentication](#authentication)
- [📚 API Endpoints](#api-endpoints)
- [📝 Data Models](#data-models)
- [🔧 Usage Examples](#usage-examples)
- [❌ Error Handling](#error-handling)
- [📊 Rate Limiting](#rate-limiting)
- [🛠️ Development](#development)

## 🚀 Quick Start

### Base URL

```
Development: http://localhost:5000
Production: https://api.expensemanagement.com
```

### Interactive Documentation

Access the Swagger UI documentation at:

```
http://localhost:5000/api-docs
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the server: `npm start`
5. Access API docs at `http://localhost:5000/api-docs`

## 🔐 Authentication

All API endpoints (except auth endpoints) require JWT authentication.

### Get JWT Token

```javascript
// Login to get JWT token
POST /api/auth/login
{
  "username": "your_username",
  "password": "your_password"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "username": "username",
    "fullname": "Full Name"
  }
}
```

### Use JWT Token

Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📚 API Endpoints

### 🔐 Authentication

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | Register new user     |
| POST   | `/api/auth/login`    | Login user            |
| GET    | `/api/auth/me`       | Get current user info |

### 👤 User Management

| Method | Endpoint                     | Description         |
| ------ | ---------------------------- | ------------------- |
| GET    | `/api/users/profile`         | Get user profile    |
| PUT    | `/api/users/profile`         | Update user profile |
| PUT    | `/api/users/avatar`          | Update user avatar  |
| PUT    | `/api/users/change-password` | Change password     |
| GET    | `/api/users/login-history`   | Get login history   |
| DELETE | `/api/users/me`              | Delete user account |

### 📂 Categories

| Method | Endpoint               | Description           |
| ------ | ---------------------- | --------------------- |
| GET    | `/api/categories`      | Get all categories    |
| POST   | `/api/categories`      | Create new category   |
| PUT    | `/api/categories/{id}` | Update category       |
| DELETE | `/api/categories/{id}` | Delete category       |
| DELETE | `/api/categories/all`  | Delete all categories |

### 🏦 Accounts

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| GET    | `/api/accounts`      | Get all accounts    |
| POST   | `/api/accounts`      | Create new account  |
| PUT    | `/api/accounts/{id}` | Update account      |
| DELETE | `/api/accounts/{id}` | Delete account      |
| DELETE | `/api/accounts/all`  | Delete all accounts |

### 💸 Transactions

| Method | Endpoint                 | Description                   |
| ------ | ------------------------ | ----------------------------- |
| GET    | `/api/transactions`      | Get transactions with filters |
| POST   | `/api/transactions`      | Create new transaction        |
| PUT    | `/api/transactions/{id}` | Update transaction            |
| DELETE | `/api/transactions/{id}` | Delete transaction            |
| DELETE | `/api/transactions/all`  | Delete all transactions       |

### 🎯 Goals

| Method | Endpoint                    | Description           |
| ------ | --------------------------- | --------------------- |
| GET    | `/api/goals`                | Get all goals         |
| POST   | `/api/goals`                | Create new goal       |
| PUT    | `/api/goals/{id}`           | Update goal           |
| DELETE | `/api/goals/{id}`           | Delete goal           |
| DELETE | `/api/goals/all`            | Delete all goals      |
| POST   | `/api/goals/{id}/add-funds` | Add funds to goal     |
| PATCH  | `/api/goals/{id}/archive`   | Toggle archive status |
| PATCH  | `/api/goals/{id}/pin`       | Toggle pin status     |

### 📊 Statistics

| Method | Endpoint                      | Description                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/api/statistics/overview`    | Get overview statistics    |
| GET    | `/api/statistics/trend`       | Get income/expense trends  |
| GET    | `/api/statistics/by-category` | Get statistics by category |
| GET    | `/api/statistics/calendar`    | Get calendar data          |
| GET    | `/api/statistics/summary`     | Get summary report         |

### 🤖 AI Assistant

| Method | Endpoint                               | Description                |
| ------ | -------------------------------------- | -------------------------- |
| POST   | `/api/ai-assistant`                    | Send message to AI         |
| POST   | `/api/ai-assistant/create-transaction` | Create transaction from AI |
| POST   | `/api/ai-assistant/create-category`    | Create category from AI    |
| POST   | `/api/ai-assistant/create-account`     | Create account from AI     |
| POST   | `/api/ai-assistant/create-goal`        | Create goal from AI        |

## 📝 Data Models

### User

```json
{
  "_id": "string",
  "fullname": "string",
  "username": "string",
  "email": "string",
  "avatar": "string",
  "createdAt": "date"
}
```

### Category

```json
{
  "_id": "string",
  "name": "string",
  "type": "THUNHAP|CHITIEU",
  "icon": "string",
  "userId": "string",
  "isGoalCategory": "boolean",
  "goalId": "string",
  "totalAmount": "number",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Account

```json
{
  "_id": "string",
  "name": "string",
  "balance": "number",
  "bankName": "string",
  "accountNumber": "string",
  "userId": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Transaction

```json
{
  "_id": "string",
  "name": "string",
  "amount": "number",
  "type": "THUNHAP|CHITIEU",
  "categoryId": "string",
  "accountId": "string",
  "note": "string",
  "date": "date",
  "userId": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Goal

```json
{
  "_id": "string",
  "name": "string",
  "targetAmount": "number",
  "currentAmount": "number",
  "deadline": "date",
  "icon": "string",
  "archived": "boolean",
  "isPinned": "boolean",
  "user": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## 🔧 Usage Examples

### Create a Transaction

```javascript
// POST /api/transactions
const response = await fetch("/api/transactions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_JWT_TOKEN",
  },
  body: JSON.stringify({
    name: "Mua cà phê",
    amount: 50000,
    type: "CHITIEU",
    categoryId: "60f1b2b8b8f8f8f8f8f8f8f8",
    accountId: "60f1b2b8b8f8f8f8f8f8f8f9",
    note: "Cafe sáng ở quán quen",
    date: "2024-01-15T10:30:00.000Z",
  }),
});

const transaction = await response.json();
console.log(transaction);
```

### Get Transactions with Filters

```javascript
// GET /api/transactions?type=CHITIEU&categoryId=123&page=1&limit=10
const response = await fetch(
  "/api/transactions?" +
    new URLSearchParams({
      type: "CHITIEU",
      categoryId: "60f1b2b8b8f8f8f8f8f8f8f8",
      page: 1,
      limit: 10,
      dateFrom: "2024-01-01",
      dateTo: "2024-01-31",
    }),
  {
    headers: {
      Authorization: "Bearer YOUR_JWT_TOKEN",
    },
  }
);

const data = await response.json();
console.log(data.data); // Array of transactions
console.log(data.pagination); // Pagination info
```

### Use AI Assistant

```javascript
// POST /api/ai-assistant
const response = await fetch("/api/ai-assistant", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_JWT_TOKEN",
  },
  body: JSON.stringify({
    message: "Tôi muốn thêm giao dịch mua cafe 50000",
  }),
});

const aiResponse = await response.json();
console.log(aiResponse.response); // AI's response
console.log(aiResponse.action); // Suggested action
console.log(aiResponse.data); // Additional data
```

## ❌ Error Handling

### Standard Error Response

```json
{
  "message": "Error description",
  "error": "Technical error details (in development)",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Examples

```json
// 400 Bad Request
{
  "message": "Thiếu thông tin bắt buộc",
  "errors": ["name is required", "amount must be positive"]
}

// 401 Unauthorized
{
  "message": "Token không hợp lệ"
}

// 404 Not Found
{
  "message": "Không tìm thấy giao dịch"
}
```

## 📊 Rate Limiting

- **General API**: 100 requests per minute per IP
- **AI Assistant**: 20 requests per minute per user
- **File Upload**: 10 requests per minute per user

Rate limit headers included in response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🛠️ Development

### Environment Variables

```bash
# Database
MONGO_URL=mongodb://localhost:27017/expense_management

# JWT
JWT_SECRET=your_jwt_secret_key

# Gemini AI (for AI Assistant)
GEMINI_API_KEY=your_gemini_api_key

# Server
PORT=5000
NODE_ENV=development
```

### Running Tests

```bash
npm test                # Run all tests
npm run test:unit       # Run unit tests
npm run test:integration # Run integration tests
npm run test:coverage   # Run tests with coverage
```

### Database Setup

1. Install MongoDB
2. Create database: `expense_management`
3. The application will create collections automatically

### Swagger Documentation Update

After adding new endpoints:

1. Add Swagger comments to route files
2. Update schemas in `swagger.js`
3. Restart server to see changes

## 📞 Support

- **Email**: support@expensemanagement.com
- **GitHub**: [ExpenseManagement Repository](https://github.com/thhieu2904/ExpenseManagement)
- **Documentation**: [API Docs](http://localhost:5000/api-docs)

---

**Made with ❤️ by Expense Management Team**
