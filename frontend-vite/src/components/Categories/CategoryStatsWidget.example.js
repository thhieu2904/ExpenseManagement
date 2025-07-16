// Example usage trong CategoriesPage.jsx

// Thêm vào component CategoriesPage
const [categoryStats, setCategoryStats] = useState(null);

// Hàm tính toán stats (có thể đặt trong useEffect)
const calculateCategoryStats = (categories, transactions) => {
  if (!categories || categories.length === 0) {
    return {
      totalCategories: 0,
      incomeCategories: 0,
      expenseCategories: 0,
      usedCategories: 0,
      mostUsedCategory: null,
      recentlyCreated: 0
    };
  }

  const incomeCategories = categories.filter(cat => cat.type === 'THUNHAP').length;
  const expenseCategories = categories.filter(cat => cat.type === 'CHITIEU').length;
  
  // Tính số danh mục đã được sử dụng trong giao dịch
  const usedCategoryIds = new Set(
    transactions?.map(t => t.categoryId).filter(Boolean) || []
  );
  const usedCategories = categories.filter(cat => usedCategoryIds.has(cat.id)).length;

  // Tìm danh mục được sử dụng nhiều nhất
  const categoryUsage = {};
  transactions?.forEach(transaction => {
    if (transaction.categoryId) {
      categoryUsage[transaction.categoryId] = (categoryUsage[transaction.categoryId] || 0) + 1;
    }
  });

  let mostUsedCategory = null;
  if (Object.keys(categoryUsage).length > 0) {
    const mostUsedCategoryId = Object.keys(categoryUsage).reduce((a, b) => 
      categoryUsage[a] > categoryUsage[b] ? a : b
    );
    const category = categories.find(cat => cat.id === mostUsedCategoryId);
    if (category) {
      mostUsedCategory = {
        name: category.name,
        icon: category.icon,
        usageCount: categoryUsage[mostUsedCategoryId]
      };
    }
  }

  // Đếm danh mục tạo gần đây (7 ngày qua)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentlyCreated = categories.filter(cat => 
    new Date(cat.createdAt) > weekAgo
  ).length;

  return {
    totalCategories: categories.length,
    incomeCategories,
    expenseCategories, 
    usedCategories,
    mostUsedCategory,
    recentlyCreated
  };
};

// Trong useEffect khi categories và transactions load xong
useEffect(() => {
  if (categories && transactions) {
    const stats = calculateCategoryStats(categories, transactions);
    setCategoryStats(stats);
  }
}, [categories, transactions]);

// Trong JSX
<CategoryPageHeader
  // ... existing props
  categoryStats={categoryStats}
/>

// Hoặc example data để test:
const exampleStats = {
  totalCategories: 30,
  incomeCategories: 12,
  expenseCategories: 18,
  usedCategories: 25,
  mostUsedCategory: {
    name: "Ăn uống",
    icon: "🍔",
    usageCount: 45
  },
  recentlyCreated: 3
};
