/**
 * parseChatOutput.ts
 * 从 AI 回复的 Markdown 内容中提取 CodePlan / TodoPlan / OutputFile 块。
 *
 * 支持以下格式（AI 生成时需遵循）：
 *
 * ────────────────────────────────────────────────────────────────────────────
 * 1. CodePlan 块（JSON 嵌入在 ```codeplan 代码块中）：
 *
 * ```codeplan
 * {
 *   "title": "实现用户鉴权模块",
 *   "description": "基于 JWT 的前后端鉴权方案",
 *   "steps": [
 *     { "title": "设计数据库表结构", "description": "...", "files": ["src/db/schema.sql"] },
 *     { "title": "实现 JWT 工具函数", "description": "..." }
 *   ]
 * }
 * ```
 *
 * ────────────────────────────────────────────────────────────────────────────
 * 2. TodoPlan 块（```todo 或 ```todolist）：
 *
 * ```todo
 * {
 *   "title": "本次任务清单",
 *   "items": [
 *     { "text": "安装依赖", "priority": "high" },
 *     { "text": "配置环境变量", "priority": "medium" }
 *   ]
 * }
 * ```
 *
 * ────────────────────────────────────────────────────────────────────────────
 * 3. 输出文件块：
 *    a. 带 FILE: 注释（优先）→ 使用注释中的路径
 *    b. 不带注释 → 自动推断文件名（lang.ext），标记为 auto-named
 *
 * ```typescript
 * // FILE: src/utils/auth.ts   ← 有此行则使用声明路径
 * import ...
 * ```
 *
 * ```python
 * def hello(): ...            ← 无 FILE: 注释也会收录，自动命名
 * ```
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import {
  CodePlan,
  CodePlanStep,
  TodoPlan,
  TodoItem,
  OutputFile,
  FileLanguage,
  PlanStepStatus,
} from "../../types";

// ── 辅助：生成唯一 ID ─────────────────────────────────────────────────────────

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ── 语言别名归一化 ────────────────────────────────────────────────────────────

const LANG_ALIAS: Record<string, FileLanguage> = {
  ts: "typescript", tsx: "tsx",
  js: "javascript", jsx: "jsx",
  py: "python", python: "python",
  java: "java",
  go: "go",
  rs: "rust", rust: "rust",
  "c++": "cpp", cpp: "cpp",
  c: "c",
  "c#": "csharp", cs: "csharp",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  yaml: "yaml", yml: "yaml",
  toml: "toml",
  xml: "xml",
  md: "markdown", markdown: "markdown",
  sql: "sql",
  sh: "shell", bash: "shell", shell: "shell", zsh: "shell",
  dockerfile: "dockerfile",
  txt: "plaintext", text: "plaintext", plaintext: "plaintext",
  typescript: "typescript",
  javascript: "javascript",
};

const LANG_EXT: Record<FileLanguage, string> = {
  typescript: "ts", tsx: "tsx",
  javascript: "js", jsx: "jsx",
  python: "py", java: "java", go: "go",
  rust: "rs", cpp: "cpp", c: "c", csharp: "cs",
  html: "html", css: "css", scss: "scss",
  json: "json", yaml: "yaml", toml: "toml", xml: "xml",
  markdown: "md", sql: "sql", shell: "sh",
  dockerfile: "Dockerfile", plaintext: "txt",
};

/** 需要跳过的特殊块（不当文件收录） */
const SKIP_LANGS = new Set(["codeplan", "todo", "todolist"]);

function normalizeLanguage(raw: string): FileLanguage {
  return LANG_ALIAS[raw.toLowerCase().trim()] ?? "plaintext";
}

// ── 解析 CodePlan ─────────────────────────────────────────────────────────────

interface RawStep {
  title?: string;
  description?: string;
  files?: string[];
  children?: RawStep[];
}

function parseSteps(rawSteps: RawStep[], offset = 0): CodePlanStep[] {
  return rawSteps.map((s, i) => ({
    id: uid(),
    index: offset + i + 1,
    title: s.title ?? `Step ${offset + i + 1}`,
    description: s.description ?? "",
    status: "pending" as PlanStepStatus,
    files: s.files,
    children: s.children ? parseSteps(s.children, 0) : undefined,
  }));
}

export function parseCodePlan(json: string, messageId: string): CodePlan | null {
  try {
    const raw = JSON.parse(json);
    if (!raw.steps || !Array.isArray(raw.steps)) return null;
    return {
      id: uid(),
      messageId,
      title: raw.title ?? "Code Plan",
      description: raw.description,
      steps: parseSteps(raw.steps),
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ── 解析 TodoPlan ─────────────────────────────────────────────────────────────

interface RawTodoItem {
  text?: string;
  done?: boolean;
  priority?: string;
  file?: string;
}

export function parseTodoPlan(json: string, messageId: string): TodoPlan | null {
  try {
    const raw = JSON.parse(json);
    if (!raw.items || !Array.isArray(raw.items)) return null;
    const items: TodoItem[] = raw.items.map((i: RawTodoItem) => ({
      id: uid(),
      text: i.text ?? "",
      done: i.done ?? false,
      priority: (["low", "medium", "high"].includes(i.priority ?? "")) ? (i.priority as any) : undefined,
      file: i.file,
    }));
    return {
      id: uid(),
      messageId,
      title: raw.title ?? "Todo List",
      items,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ── 文件路径注释提取 ───────────────────────────────────────────────────────────

const FILE_PATH_PATTERNS = [
  /^\/\/\s*FILE:\s*(.+)$/,          // // FILE: src/foo.ts
  /^#\s*FILE:\s*(.+)$/,             // # FILE: src/foo.ts
  /^<!--\s*FILE:\s*(.+?)\s*-->$/,   // <!-- FILE: index.html -->
  /^\/\*\s*FILE:\s*(.+?)\s*\*\//,  // /* FILE: style.css */
];

function extractFilePath(firstLine: string): string | null {
  for (const re of FILE_PATH_PATTERNS) {
    const m = firstLine.trim().match(re);
    if (m) return m[1].trim();
  }
  return null;
}

/** 给一个代码块自动生成唯一文件名（当没有 FILE: 注释时） */
function autoFileName(lang: FileLanguage, index: number): string {
  const ext = LANG_EXT[lang] ?? "txt";
  // Dockerfile 特殊处理
  if (lang === "dockerfile") return index === 1 ? "Dockerfile" : `Dockerfile.${index}`;
  const label = lang === "plaintext" ? "snippet" : lang;
  return index === 1 ? `${label}.${ext}` : `${label}_${index}.${ext}`;
}

// ── 解析输出文件（改进版：所有代码块均收录） ────────────────────────────────────

export function parseOutputFiles(
  content: string,
  messageId: string,
  /** 设为 true 时只收录带 FILE: 注释的块（严格模式） */
  strictMode = false
): OutputFile[] {
  const files: OutputFile[] = [];
  // 每种语言的序号计数（用于自动命名去重）
  const langCounter: Record<string, number> = {};

  const codeBlockRe = /```([\w+#.-]+)\n([\s\S]*?)```/g;
  let m;
  while ((m = codeBlockRe.exec(content)) !== null) {
    const langRaw = m[1].toLowerCase().trim();

    // 跳过特殊块
    if (SKIP_LANGS.has(langRaw)) continue;

    const blockContent = m[2];
    if (!blockContent.trim()) continue; // 跳过空块

    const firstLine = blockContent.split("\n")[0];
    const declaredPath = extractFilePath(firstLine);

    if (strictMode && !declaredPath) continue;

    const language = normalizeLanguage(langRaw);
    let filePath: string;
    let codeContent: string;

    if (declaredPath) {
      // 使用声明的路径，去掉第一行
      filePath = declaredPath;
      codeContent = blockContent.split("\n").slice(1).join("\n").trimEnd();
    } else {
      // 自动命名
      langCounter[langRaw] = (langCounter[langRaw] ?? 0) + 1;
      filePath = autoFileName(language, langCounter[langRaw]);
      codeContent = blockContent.trimEnd();
    }

    files.push({
      id: uid(),
      path: filePath,
      language,
      content: codeContent,
      messageId,
      createdAt: new Date().toISOString(),
    });
  }
  return files;
}

// ── 主入口：解析 AI 回复 ────────────────────────────────────────────────────────

export interface ParsedChatOutput {
  codePlans: CodePlan[];
  todoPlan: TodoPlan | null;
  files: OutputFile[];
  /** 清洗后的显示内容（去除 codeplan/todo 块，保留普通代码块） */
  displayContent: string;
}

export function parseChatOutput(content: string, messageId: string): ParsedChatOutput {
  const codePlans: CodePlan[] = [];
  let todoPlan: TodoPlan | null = null;
  let displayContent = content;

  // 提取并解析 codeplan 块
  const planRe = /```codeplan\n([\s\S]*?)```/g;
  let pm;
  while ((pm = planRe.exec(content)) !== null) {
    const plan = parseCodePlan(pm[1], messageId);
    if (plan) codePlans.push(plan);
  }
  displayContent = displayContent.replace(/```codeplan\n[\s\S]*?```/g, "");

  // 提取并解析 todo 块
  const todoRe = /```(?:todo|todolist)\n([\s\S]*?)```/g;
  let tm;
  while ((tm = todoRe.exec(content)) !== null) {
    const parsed = parseTodoPlan(tm[1], messageId);
    if (parsed && !todoPlan) todoPlan = parsed;
  }
  displayContent = displayContent.replace(/```(?:todo|todolist)\n[\s\S]*?```/g, "");

  // 提取所有代码块作为文件（包括无 FILE: 注释的，即宽松模式）
  const files = parseOutputFiles(content, messageId, false);

  return {
    codePlans,
    todoPlan,
    files,
    displayContent: displayContent.trim(),
  };
}

// ── 快捷提示词：告诉 AI 如何生成结构化输出 ────────────────────────────────────────

export const CODEPLAN_SYSTEM_HINT = `
当用户请求生成代码计划时，请在回复中嵌入以下格式的代码块：

\`\`\`codeplan
{
  "title": "计划标题",
  "description": "可选的计划描述",
  "steps": [
    { "title": "步骤1标题", "description": "步骤1描述", "files": ["path/to/file.ts"] },
    { "title": "步骤2标题", "description": "步骤2描述" }
  ]
}
\`\`\`

当用户请求生成待办清单时，请在回复中嵌入：

\`\`\`todo
{
  "title": "清单标题",
  "items": [
    { "text": "任务1", "priority": "high" },
    { "text": "任务2", "priority": "medium" }
  ]
}
\`\`\`

当输出代码文件时，请在每个代码块的第一行注明文件路径（可选，有助于更精确定位文件）：

\`\`\`typescript
// FILE: src/components/MyComponent.tsx
import React from 'react';
...
\`\`\`
`.trim();
