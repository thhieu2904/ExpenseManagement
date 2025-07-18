import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color mappings from hardcoded colors to CSS variables
const colorMappings = {
  // Primary colors
  "#3f51b5": "var(--color-primary)",
  "#3949ab": "var(--color-primary-hover)",
  "#32408f": "var(--color-primary-hover)",
  "#e8eaf6": "var(--color-primary-light)",

  // Background colors
  "#ffffff": "var(--color-background)",
  "#fff": "var(--color-background)",
  "#f8f9fa": "var(--color-surface-secondary)",
  "#f9fafb": "var(--color-surface-secondary)",

  // Text colors
  "#2c3e50": "var(--color-text-primary)",
  "#374151": "var(--color-text-primary)",
  "#6c757d": "var(--color-text-secondary)",
  "#6b7280": "var(--color-text-secondary)",

  // Border colors
  "#e5e7eb": "var(--color-border)",
  "#ececf3": "var(--color-border)",
  "#d1d5db": "var(--color-border)",
  "#f3f4f6": "var(--color-border-light)",

  // Success colors
  "#22c55e": "var(--color-success-primary)",
  "#16a34a": "var(--color-success-secondary)",
  "#dcfce7": "rgba(34, 197, 94, 0.1)",
  "#166534": "var(--color-success-primary)",

  // Error colors
  "#ef4444": "var(--color-error-primary)",
  "#dc2626": "var(--color-error-secondary)",
  "#fef2f2": "rgba(239, 68, 68, 0.1)",
  "#f8d7da": "rgba(239, 68, 68, 0.1)",
  "#721c24": "var(--color-error-primary)",

  // Warning colors
  "#f59e0b": "var(--color-warning-primary)",
  "#d97706": "var(--color-warning-secondary)",

  // Gray colors
  "#9ca3af": "var(--color-gray-400)",
  "#4b5563": "var(--color-gray-600)",
};

// Shadow mappings
const shadowMappings = {
  "0 1px 2px 0 rgba(0, 0, 0, 0.05)": "var(--shadow-sm)",
  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)":
    "var(--shadow-base)",
  "0 2px 8px rgba(0, 0, 0, 0.1)": "var(--shadow-base)",
  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)":
    "var(--shadow-md)",
  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)":
    "var(--shadow-lg)",
  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)":
    "var(--shadow-xl)",
};

function migrateCSSFile(filePath) {
  try {
    console.log(`🔄 Migrating: ${filePath}`);

    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;

    // Replace colors
    Object.entries(colorMappings).forEach(([oldColor, newVar]) => {
      const regex = new RegExp(
        oldColor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      if (content.includes(oldColor)) {
        content = content.replace(regex, newVar);
        changed = true;
      }
    });

    // Replace shadows
    Object.entries(shadowMappings).forEach(([oldShadow, newVar]) => {
      if (content.includes(oldShadow)) {
        content = content.replace(
          new RegExp(oldShadow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          newVar
        );
        changed = true;
      }
    });

    if (changed) {
      // Create backup
      const backupPath = filePath + ".backup";
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }

      // Write migrated content
      fs.writeFileSync(filePath, content);
      console.log(`✅ Migrated: ${filePath}`);
      return true;
    } else {
      console.log(`⚪ No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

function findCSSModules(dir) {
  const cssFiles = [];

  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);

    files.forEach((file) => {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !file.includes("node_modules") &&
        !file.includes(".git")
      ) {
        traverse(fullPath);
      } else if (file.endsWith(".module.css")) {
        cssFiles.push(fullPath);
      }
    });
  }

  traverse(dir);
  return cssFiles;
}

function main() {
  const projectRoot = path.join(__dirname, "..");
  const srcDir = path.join(projectRoot, "src");

  console.log("🚀 Starting CSS Dark Mode Migration...\n");

  // Find all CSS modules
  const cssFiles = findCSSModules(srcDir);
  console.log(`📁 Found ${cssFiles.length} CSS module files\n`);

  // Migrate each file
  let migratedCount = 0;
  cssFiles.forEach((filePath) => {
    if (migrateCSSFile(filePath)) {
      migratedCount++;
    }
  });

  console.log(`\n🎉 Migration completed!`);
  console.log(`📊 ${migratedCount}/${cssFiles.length} files were migrated`);
  console.log(`💾 Backup files created with .backup extension`);

  if (migratedCount > 0) {
    console.log(`\n⚠️  Next steps:`);
    console.log(`1. Test the application thoroughly`);
    console.log(`2. Check for any visual inconsistencies`);
    console.log(`3. Remove .backup files when satisfied`);
    console.log(`4. Commit the changes`);
  }
}

// Run the migration
main();

export { migrateCSSFile, findCSSModules, colorMappings, shadowMappings };
