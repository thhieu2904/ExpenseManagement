/**
 * Seed Data cho ExpenseManagement
 * Dựa trên backup_test2_2025-07-23.json
 */

// User mẫu (password: 123456)
const demoUser = {
  username: "demo",
  fullname: "Demo User",
  email: "demo@example.com",
  password: "$2b$10$YourHashedPasswordHere", // Sẽ được hash trong seed.js
};

// Accounts mẫu
const accounts = [
  {
    name: "Tiền mặt",
    type: "TIENMAT",
    initialBalance: 5000000,
    bankName: "",
    accountNumber: "",
  },
  {
    name: "Vietcombank",
    type: "THENGANHANG",
    initialBalance: 20000000,
    bankName: "Vietcombank",
    accountNumber: "1234567890",
  },
];

// Categories mẫu
const categories = [
  // Chi tiêu
  { name: "Ăn uống", type: "CHITIEU", icon: "fa-utensils" },
  { name: "Di chuyển", type: "CHITIEU", icon: "fa-car" },
  { name: "Mua sắm", type: "CHITIEU", icon: "fa-shopping-cart" },
  { name: "Giải trí", type: "CHITIEU", icon: "fa-gamepad" },
  { name: "Y tế", type: "CHITIEU", icon: "fa-medkit" },
  { name: "Học tập", type: "CHITIEU", icon: "fa-book" },
  { name: "Hóa đơn", type: "CHITIEU", icon: "fa-file-invoice" },
  { name: "Khác", type: "CHITIEU", icon: "fa-ellipsis-h" },
  // Thu nhập
  { name: "Lương", type: "THUNHAP", icon: "fa-money-bill-wave" },
  { name: "Thưởng", type: "THUNHAP", icon: "fa-gift" },
  { name: "Đầu tư", type: "THUNHAP", icon: "fa-chart-line" },
  { name: "Freelance", type: "THUNHAP", icon: "fa-laptop" },
  { name: "Bán hàng", type: "THUNHAP", icon: "fa-store" },
  { name: "Thu nhập khác", type: "THUNHAP", icon: "fa-plus-circle" },
];

// Transactions mẫu (sẽ được gán accountId và categoryId sau khi tạo)
const transactions = [
  // Tháng này
  {
    name: "Lương tháng 1",
    amount: 20000000,
    type: "THUNHAP",
    categoryName: "Lương",
    accountName: "Vietcombank",
    daysAgo: 5,
  },
  {
    name: "Ăn sáng",
    amount: 50000,
    type: "CHITIEU",
    categoryName: "Ăn uống",
    accountName: "Tiền mặt",
    daysAgo: 1,
  },
  {
    name: "Cà phê",
    amount: 35000,
    type: "CHITIEU",
    categoryName: "Ăn uống",
    accountName: "Tiền mặt",
    daysAgo: 1,
  },
  {
    name: "Đổ xăng",
    amount: 150000,
    type: "CHITIEU",
    categoryName: "Di chuyển",
    accountName: "Tiền mặt",
    daysAgo: 2,
  },
  {
    name: "Mua quần áo",
    amount: 500000,
    type: "CHITIEU",
    categoryName: "Mua sắm",
    accountName: "Vietcombank",
    daysAgo: 3,
  },
  {
    name: "Xem phim",
    amount: 150000,
    type: "CHITIEU",
    categoryName: "Giải trí",
    accountName: "Vietcombank",
    daysAgo: 4,
  },
  {
    name: "Tiền điện",
    amount: 300000,
    type: "CHITIEU",
    categoryName: "Hóa đơn",
    accountName: "Vietcombank",
    daysAgo: 5,
  },
  {
    name: "Thưởng tăng ca",
    amount: 500000,
    type: "THUNHAP",
    categoryName: "Thưởng",
    accountName: "Tiền mặt",
    daysAgo: 3,
  },

  // Tháng trước
  {
    name: "Lương tháng 12",
    amount: 20000000,
    type: "THUNHAP",
    categoryName: "Lương",
    accountName: "Vietcombank",
    daysAgo: 35,
  },
  {
    name: "Ăn tối gia đình",
    amount: 500000,
    type: "CHITIEU",
    categoryName: "Ăn uống",
    accountName: "Vietcombank",
    daysAgo: 30,
  },
  {
    name: "Grab",
    amount: 80000,
    type: "CHITIEU",
    categoryName: "Di chuyển",
    accountName: "Tiền mặt",
    daysAgo: 32,
  },
  {
    name: "Mua sách",
    amount: 200000,
    type: "CHITIEU",
    categoryName: "Học tập",
    accountName: "Tiền mặt",
    daysAgo: 33,
  },
  {
    name: "Khám bệnh",
    amount: 250000,
    type: "CHITIEU",
    categoryName: "Y tế",
    accountName: "Vietcombank",
    daysAgo: 34,
  },
  {
    name: "Freelance dự án web",
    amount: 3000000,
    type: "THUNHAP",
    categoryName: "Freelance",
    accountName: "Vietcombank",
    daysAgo: 28,
  },

  // 2 tháng trước
  {
    name: "Lương tháng 11",
    amount: 20000000,
    type: "THUNHAP",
    categoryName: "Lương",
    accountName: "Vietcombank",
    daysAgo: 65,
  },
  {
    name: "Bún bò Huế",
    amount: 50000,
    type: "CHITIEU",
    categoryName: "Ăn uống",
    accountName: "Tiền mặt",
    daysAgo: 60,
  },
  {
    name: "Tiền internet",
    amount: 200000,
    type: "CHITIEU",
    categoryName: "Hóa đơn",
    accountName: "Vietcombank",
    daysAgo: 62,
  },
  {
    name: "Cổ tức",
    amount: 1500000,
    type: "THUNHAP",
    categoryName: "Đầu tư",
    accountName: "Vietcombank",
    daysAgo: 55,
  },
];

// Goals mẫu
const goals = [
  {
    name: "Mua iPhone mới",
    targetAmount: 25000000,
    currentAmount: 5000000,
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 ngày sau
    icon: "📱",
    status: "in-progress",
    isPinned: true,
    archived: false,
  },
  {
    name: "Du lịch Đà Lạt",
    targetAmount: 5000000,
    currentAmount: 2000000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày sau
    icon: "✈️",
    status: "in-progress",
    isPinned: false,
    archived: false,
  },
];

module.exports = {
  demoUser,
  accounts,
  categories,
  transactions,
  goals,
};
