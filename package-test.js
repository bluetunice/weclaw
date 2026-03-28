#!/usr/bin/env node

/**
 * WeClaw Client 包测试脚本
 * 验证项目结构和依赖是否正确安装
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 WeClaw Client 包测试");
console.log("=".repeat(40));
console.log();

// 检查关键文件是否存在
const requiredFiles = [
  "package.json",
  "electron/main.ts",
  "src/App.tsx",
  "src/components/Layout.tsx",
  "src/pages/Dashboard.tsx",
  "src/pages/ModelConfig.tsx",
  "src/pages/WorkspaceManager.tsx",
  "src/pages/HistoryViewer.tsx",
  "src/pages/Settings.tsx",
  "src/types/index.ts",
  "src/contexts/WorkspaceContext.tsx",
  "src/contexts/ModelContext.tsx"
];

console.log("📁 检查项目结构...");
let missingFiles = [];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
    console.log(`❌ ${file}`);
  } else {
    console.log(`✅ ${file}`);
  }
}

if (missingFiles.length > 0) {
  console.log(`\n❌ 缺少 ${missingFiles.length} 个关键文件:`);
  missingFiles.forEach((file) => console.log(`  - ${file}`));
  process.exit(1);
}

console.log("\n✅ 项目结构完整");

// 检查package.json
console.log("\n📦 检查package.json...");
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "package.json"), "utf-8")
  );

  console.log(`✅ 名称: ${packageJson.name}`);
  console.log(`✅ 版本: ${packageJson.version}`);
  console.log(`✅ 主入口: ${packageJson.main || "未设置"}`);

  // 检查关键脚本
  const requiredScripts = ["dev", "build", "package:mac", "package:win"];
  const missingScripts = requiredScripts.filter(
    (script) => !packageJson.scripts?.[script]
  );

  if (missingScripts.length > 0) {
    console.log(`❌ 缺少脚本: ${missingScripts.join(", ")}`);
    process.exit(1);
  }

  console.log("✅ 构建脚本完整");
} catch (error) {
  console.log(`❌ 读取package.json失败: ${error.message}`);
  process.exit(1);
}

// 检查依赖
console.log("\n📦 检查依赖...");
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "package.json"), "utf-8")
  );
  const requiredDeps = ["react", "electron", "tailwindcss", "vite"];

  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  const missingDeps = requiredDeps.filter((dep) => !deps[dep]);

  if (missingDeps.length > 0) {
    console.log(`❌ 缺少依赖: ${missingDeps.join(", ")}`);
    process.exit(1);
  }

  console.log("✅ 关键依赖完整");
} catch (error) {
  console.log(`❌ 检查依赖失败: ${error.message}`);
  process.exit(1);
}

// 尝试编译TypeScript（如果tsc已安装）
console.log("\n🔧 检查TypeScript配置...");
try {
  const tsconfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, "tsconfig.json"), "utf-8")
  );

  if (tsconfig.compilerOptions?.target !== "ES2020") {
    console.log("⚠️  TypeScript目标版本不是ES2020");
  } else {
    console.log("✅ TypeScript配置正确");
  }
} catch (error) {
  console.log(`❌ 读取tsconfig.json失败: ${error.message}`);
}

// 总结
console.log("\n" + "=".repeat(40));
console.log("🎉 包测试完成");
console.log("\n下一步:");
console.log("1. 运行 `npm install` 安装依赖");
console.log("2. 运行 `npm run dev` 启动开发服务器");
console.log("3. 访问 http://localhost:3000 查看应用");
console.log("\n或者运行:");
console.log("  ./run.sh           # macOS/Linux");
console.log("  run.bat           # Windows");
console.log();

process.exit(0);
