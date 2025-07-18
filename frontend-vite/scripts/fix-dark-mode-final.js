import fs from "fs";
import path from "path";

// Additional hardcoded colors to replace
const additionalColorMappings = {
  // Text colors
  "#1f2937": "var(--color-text-primary)",
  "color: #1f2937": "color: var(--color-text-primary)",
  "#111827": "var(--color-text-primary)",
  "color: #111827": "color: var(--color-text-primary)",

  // Border colors
  "#e0e7ef": "var(--color-border)",
  "border-color: #e0e7ef": "border-color: var(--color-border)",
  "#bfdbfe": "var(--color-border-light)",
  "#bbdefb": "var(--color-border-light)",

  // Background gradients that need updating
  "rgba(0, 0, 0, 0.1)": "var(--color-hover-overlay)",
  "rgba(255, 255, 255, 0.1)": "var(--color-hover-overlay)",

  // Specific component colors
  "#eff6ff": "var(--color-surface-secondary)",
  "#f8fafc": "var(--color-surface-secondary)",
  "#f1f5f9": "var(--color-surface-secondary)",

  // Charts and visualization colors
  "rgba(80, 80, 120, 0.15)": "rgba(var(--color-text-primary-rgb), 0.15)",
  "rgba(80, 80, 120, 0.07)": "rgba(var(--color-text-primary-rgb), 0.07)",
};

// Files that need manual color fixes
const problematicFiles = [
  "src/components/Statistics/FinancialInsights.module.css",
  "src/components/StatsOverview/StatsOverview.module.css",
  "src/components/Categories/AddEditCategoryModal.module.css",
  "src/components/Accounts/AddEditAccountModal.module.css",
  "src/components/Statistics/TransactionsList.module.css",
  "src/styles/StatisticsPage.module.css",
  "src/components/Statistics/CategoryStatsTable.module.css",
];

function fixHardcodedColors() {
  console.log("🔧 Starting final dark mode color fixes...\n");

  problematicFiles.forEach((filePath) => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    console.log(`🎨 Processing: ${filePath}`);

    let content = fs.readFileSync(fullPath, "utf8");
    let modified = false;

    // Apply color mappings
    Object.entries(additionalColorMappings).forEach(([oldColor, newColor]) => {
      if (content.includes(oldColor)) {
        content = content.replace(new RegExp(oldColor, "g"), newColor);
        modified = true;
      }
    });

    // Special fixes for specific files
    if (filePath.includes("FinancialInsights")) {
      content = content.replace(
        /color: #1f2937;/g,
        "color: var(--color-text-primary);"
      );
      content = content.replace(
        /background: linear-gradient\(135deg, #eff6ff 0%, #dbeafe 100%\);/g,
        "background: linear-gradient(135deg, var(--color-surface-secondary) 0%, var(--color-surface-primary) 100%);"
      );
      modified = true;
    }

    if (filePath.includes("StatsOverview")) {
      content = content.replace(
        /rgba\(0, 0, 0, 0\.1\)/g,
        "var(--color-hover-overlay)"
      );
      modified = true;
    }

    if (modified) {
      // Create backup
      fs.writeFileSync(fullPath + ".backup-final", fs.readFileSync(fullPath));

      // Write updated content
      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`   ✅ Updated with color fixes`);
    } else {
      console.log(`   ⏭️  No changes needed`);
    }
  });

  console.log("\n🎉 Final dark mode fixes completed!");
  console.log("\n📋 Next steps:");
  console.log("1. Test dark mode toggle in Profile page");
  console.log("2. Navigate through different pages to verify consistency");
  console.log("3. Check for any remaining visual inconsistencies");
}

// Add RGB color variables to theme.css
function addRGBVariables() {
  const themePath = path.join(process.cwd(), "src/styles/theme.css");

  if (!fs.existsSync(themePath)) {
    console.log("⚠️  theme.css not found");
    return;
  }

  let content = fs.readFileSync(themePath, "utf8");

  // Add RGB variables for better rgba() support
  const rgbVariables = `
  /* RGB Values for rgba() usage */
  --color-text-primary-rgb: 44, 62, 80;
  --color-background-rgb: 255, 255, 255;
  --color-border-rgb: 236, 236, 243;
`;

  const darkRgbVariables = `
  /* RGB Values for rgba() usage in dark theme */
  --color-text-primary-rgb: 249, 250, 251;
  --color-background-rgb: 17, 24, 39;
  --color-border-rgb: 75, 85, 99;
`;

  // Add RGB variables to light theme
  if (!content.includes("--color-text-primary-rgb")) {
    content = content.replace(
      "--color-hover-overlay: rgba(0, 0, 0, 0.05);",
      "--color-hover-overlay: rgba(0, 0, 0, 0.05);" + rgbVariables
    );

    // Add RGB variables to dark theme
    content = content.replace(
      "--color-hover-overlay: rgba(255, 255, 255, 0.1);",
      "--color-hover-overlay: rgba(255, 255, 255, 0.1);" + darkRgbVariables
    );

    fs.writeFileSync(themePath, content, "utf8");
    console.log("✅ Added RGB variables to theme.css");
  }
}

// Run the fixes
addRGBVariables();
fixHardcodedColors();
