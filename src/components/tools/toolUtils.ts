import { Tool, ToolParam, ToolPermission, ToolType } from "../../types";

export const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  builtin: "内置",
  script: "脚本",
  api: "API",
};

export const TOOL_TYPE_COLORS: Record<ToolType, string> = {
  builtin: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700",
  script: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700",
  api: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
};

export const PERMISSION_LABELS: Record<ToolPermission, string> = {
  read_only: "只读",
  read_write: "读写",
  disabled: "已禁用",
};

export const PERMISSION_COLORS: Record<ToolPermission, string> = {
  read_only: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700",
  read_write: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700",
  disabled: "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600",
};

export const TOOLS_STORAGE_KEY = "claw_tools";

export function loadTools(): Tool[] {
  try {
    const raw = localStorage.getItem(TOOLS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Tool[];
  } catch {}
  return getBuiltinTools();
}

export function saveTools(tools: Tool[]): void {
  localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(tools));
}

export function newTool(): Tool {
  return {
    id: `tool_${Date.now()}`,
    name: "",
    description: "",
    type: "api",
    icon: "🔧",
    category: "自定义",
    params: [],
    permission: "read_write",
    enabled: true,
    builtin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function newParam(): ToolParam {
  return {
    name: "",
    type: "string",
    description: "",
    required: false,
  };
}

function getBuiltinTools(): Tool[] {
  const now = new Date().toISOString();
  return [
    {
      id: "builtin_file_read",
      name: "文件读取",
      description: "读取指定路径的文件内容，支持文本文件、JSON、CSV 等格式。",
      type: "builtin",
      icon: "📄",
      category: "文件系统",
      params: [
        { name: "path", type: "string", description: "文件路径（绝对路径或相对工作区路径）", required: true },
        { name: "encoding", type: "string", description: "文件编码，默认 utf-8", required: false, default: "utf-8" },
      ],
      permission: "read_only",
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_file_write",
      name: "文件写入",
      description: "向指定路径写入或追加文件内容。",
      type: "builtin",
      icon: "✏️",
      category: "文件系统",
      params: [
        { name: "path", type: "string", description: "目标文件路径", required: true },
        { name: "content", type: "string", description: "要写入的内容", required: true },
        { name: "append", type: "boolean", description: "是否追加模式，默认覆盖", required: false, default: false },
      ],
      permission: "read_write",
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_file_list",
      name: "目录列表",
      description: "列出指定目录下的文件和子目录。",
      type: "builtin",
      icon: "📁",
      category: "文件系统",
      params: [
        { name: "path", type: "string", description: "目录路径", required: true },
        { name: "recursive", type: "boolean", description: "是否递归列出子目录", required: false, default: false },
        { name: "pattern", type: "string", description: "文件名过滤模式（如 *.ts）", required: false },
      ],
      permission: "read_only",
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_browser_open",
      name: "浏览器控制",
      description: "打开指定 URL、截图页面或提取页面内容。",
      type: "builtin",
      icon: "🌐",
      category: "浏览器",
      params: [
        { name: "url", type: "string", description: "目标 URL", required: true },
        { name: "action", type: "string", description: "操作类型：open / screenshot / extract", required: true },
        { name: "selector", type: "string", description: "CSS 选择器（仅 extract 时有效）", required: false },
      ],
      permission: "read_write",
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_email_send",
      name: "邮件发送",
      description: "通过配置的 SMTP 发送邮件。",
      type: "builtin",
      icon: "✉️",
      category: "通信",
      params: [
        { name: "to", type: "string", description: "收件人邮箱（多个用逗号分隔）", required: true },
        { name: "subject", type: "string", description: "邮件主题", required: true },
        { name: "body", type: "string", description: "邮件正文（支持 HTML）", required: true },
        { name: "cc", type: "string", description: "抄送人（可选）", required: false },
      ],
      permission: "read_write",
      enabled: false,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_shell_exec",
      name: "命令执行",
      description: "在工作区目录下执行 Shell 命令。",
      type: "builtin",
      icon: "⌨️",
      category: "系统",
      params: [
        { name: "command", type: "string", description: "要执行的命令", required: true },
        { name: "cwd", type: "string", description: "工作目录（默认为当前工作区）", required: false },
        { name: "timeout", type: "number", description: "超时时间（秒），默认 30", required: false, default: 30 },
      ],
      permission: "read_write",
      enabled: false,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_search_web",
      name: "网络搜索",
      description: "调用搜索引擎检索实时信息。",
      type: "builtin",
      icon: "🔍",
      category: "搜索",
      params: [
        { name: "query", type: "string", description: "搜索关键词", required: true },
        { name: "num", type: "number", description: "返回结果数，默认 5", required: false, default: 5 },
      ],
      permission: "read_only",
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
  ];
}
