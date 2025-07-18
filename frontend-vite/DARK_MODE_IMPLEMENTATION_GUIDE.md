# 🌙 Hướng Dẫn Triển Khai Dark Mode - Expense Management

## ✅ **Đã Hoàn Thành**

### 1. **Core Infrastructure**

- ✅ **ThemeContext** - Quản lý state theme toàn cục
- ✅ **useTheme Hook** - Hook tiện ích để sử dụng theme
- ✅ **Theme CSS Variables** - Định nghĩa màu sắc cho light/dark theme
- ✅ **ThemeProvider** - Wrap toàn bộ ứng dụng
- ✅ **ProfileInfo Component** - Component đầu tiên đã migrate hoàn chỉnh

### 2. **Theme Variables System**

```css
/* Light Theme */
:root {
  --color-primary: #3f51b5;
  --color-background: #ffffff;
  --color-text-primary: #2c3e50;
  /* ... */
}

/* Dark Theme */
.dark-theme {
  --color-primary: #6366f1;
  --color-background: #111827;
  --color-text-primary: #f9fafb;
  /* ... */
}
```

### 3. **Automatic Theme Detection**

- 🔄 Tự động phát hiện system preference
- 💾 Lưu trữ lựa chọn trong localStorage
- 🎛️ Toggle manual trong ProfilePage

---

## 🎯 **Kế Hoạch Tiếp Theo**

### **Phase 1: Core Components (Ưu tiên cao)**

```bash
# 1. Header & Navigation
src/components/Header/Header.module.css
src/components/Navbar/Navbar.module.css

# 2. Common Components
src/components/Common/HeaderCard.module.css
src/components/Common/Button.module.css
src/components/Common/Modal.module.css

# 3. Main Layouts
src/styles/HomePage.module.css
src/styles/AccountPage.module.css
```

### **Phase 2: Feature Components**

```bash
# Modal Components
src/components/Accounts/AddEditAccountModal.module.css
src/components/Categories/AddEditCategoryModal.module.css
src/components/Transactions/AddEditTransactionModal.module.css

# List Components
src/components/Accounts/AccountList.module.css
src/components/Categories/CategoryList.module.css
src/components/Transactions/TransactionList.module.css
```

### **Phase 3: Advanced Components**

```bash
# Charts & Statistics
src/components/Common/BasePieChart.module.css
src/components/Statistics/FinancialInsights.module.css

# AI & Interactive
src/components/AIAssistant/AIAssistant.module.css
```

---

## 🔧 **Migration Pattern cho CSS Modules**

### **Bước 1: Thay thế Hard-coded Colors**

```css
/* CŨ */
.button {
  background-color: #3f51b5;
  color: white;
  border: 1px solid #e5e7eb;
}

/* MỚI */
.button {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
```

### **Bước 2: Cập nhật Component sử dụng useTheme**

```jsx
import { useTheme } from "../hooks/useTheme";

const MyComponent = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return <div className={styles.container}>{/* Component content */}</div>;
};
```

---

## 📋 **Checklist Migration**

### **Header & Navigation**

- [ ] Header.module.css
- [ ] Navbar.module.css
- [ ] Update Header component to use useTheme

### **Common Components**

- [ ] Button.module.css ⭐ (Ưu tiên #1)
- [ ] HeaderCard.module.css
- [ ] Modal components
- [ ] Form components

### **Page Layouts**

- [ ] HomePage.module.css
- [ ] AccountPage.module.css
- [ ] CategoriesPage.module.css
- [ ] TransactionsPage.module.css

### **Feature Components**

- [ ] Account components
- [ ] Category components
- [ ] Transaction components
- [ ] Statistics components

---

## 🚀 **Automation Tools (Tùy chọn)**

### **Script tự động migration CSS**

```javascript
// scripts/migrate-css-variables.js
const fs = require("fs");
const path = require("path");

const colorMappings = {
  "#3f51b5": "var(--color-primary)",
  "#ffffff": "var(--color-background)",
  "#2c3e50": "var(--color-text-primary)",
  // ... thêm mappings
};

function migrateCSSFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  Object.entries(colorMappings).forEach(([oldColor, newVar]) => {
    content = content.replace(new RegExp(oldColor, "g"), newVar);
  });

  fs.writeFileSync(filePath, content);
}
```

---

## 🎨 **Dark Theme Color Palette**

### **Primary Colors**

- **Primary**: `#6366f1` (Indigo 500)
- **Primary Hover**: `#4f46e5` (Indigo 600)
- **Accent**: `#60a5fa` (Blue 400)

### **Background Colors**

- **Main Background**: `#111827` (Gray 900)
- **Surface Primary**: `#1f2937` (Gray 800)
- **Surface Secondary**: `#374151` (Gray 700)

### **Text Colors**

- **Primary Text**: `#f9fafb` (Gray 50)
- **Secondary Text**: `#d1d5db` (Gray 300)

### **Border Colors**

- **Primary Border**: `#4b5563` (Gray 600)
- **Light Border**: `#6b7280` (Gray 500)

---

## 📱 **Testing Strategy**

### **Manual Testing**

1. Test toggle functionality
2. Verify persistence across page reloads
3. Check all migrated components in both themes
4. Test system preference detection

### **Automated Testing (Future)**

```javascript
// cypress/integration/dark-mode.spec.js
describe("Dark Mode", () => {
  it("should toggle dark mode", () => {
    cy.visit("/profile");
    cy.get('[data-testid="dark-mode-toggle"]').click();
    cy.get("html").should("have.class", "dark-theme");
  });
});
```

---

## 📊 **Estimation**

- **✅ Completed**: ProfileInfo component (1 component)
- **🔄 Remaining**: ~40-50 CSS modules
- **⏱️ Time per component**: 10-20 minutes
- **📅 Total estimated time**: 8-15 hours

---

## 🎯 **Next Immediate Steps**

1. **Test current implementation** - Verify ProfileInfo dark mode works
2. **Migrate Button.module.css** - Most used component
3. **Migrate Header.module.css** - Visible on all pages
4. **Migrate HomePage.module.css** - Main landing page
5. **Create migration script** - Automate remaining components

**Bạn muốn bắt đầu với component nào tiếp theo?** 🚀
