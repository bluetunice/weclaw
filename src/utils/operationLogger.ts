/**
 * 统一操作记录记录工具
 * 所有操作写入 localStorage，与 Electron IPC history 并存
 */

export type OpCategory =
  | "chat" // 对话
  | "workflow" // 工作流
  | "task" // 任务
  | "skill" // 技能
  | "tool" // 工具
  | "model" // 模型配置
  | "claw" // Claw
  | "system"; // 系统

export type OpStatus = "success" | "warning" | "error" | "info";

export interface OperationLog {
  id: string;
  timestamp: string; // ISO 8601
  category: OpCategory;
  action: string; // 动作描述：create / update / delete / enable / disable / run / ...
  target: string; // 操作对象名称或 ID
  status: OpStatus;
  detail?: string; // 额外详情
}

const OP_LOGS_KEY = "claw_op_logs";
const MAX_LOGS = 500;

// ─── 读写 ──────────────────────────────────────────────────────────────────────

export function loadOpLogs(): OperationLog[] {
  try {
    const raw = localStorage.getItem(OP_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OperationLog[];
  } catch {
    return [];
  }
}

function persistLogs(logs: OperationLog[]) {
  localStorage.setItem(OP_LOGS_KEY, JSON.stringify(logs));
}

// ─── 写入新操作日志 ────────────────────────────────────────────────────────────

export function logOperation(
  category: OpCategory,
  action: string,
  target: string,
  status: OpStatus = "success",
  detail?: string
): void {
  try {
    const logs = loadOpLogs();
    const entry: OperationLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      category,
      action,
      target,
      status,
      detail
    };
    // 新的在最前面，超出上限时截断
    const next = [entry, ...logs].slice(0, MAX_LOGS);
    persistLogs(next);
  } catch {
    // 忽略存储错误，不影响主流程
  }
}

// ─── 便捷工厂函数（各模块直接调用）────────────────────────────────────────────

export const opLog = {
  // ── 对话 ──────────────────────────────────────────────────────────────────
  chatNew: (title: string) => logOperation("chat", "new_conversation", title),
  chatDelete: (title: string) =>
    logOperation("chat", "delete_conversation", title),
  chatSend: (convTitle: string, model: string, tokens?: number) =>
    logOperation(
      "chat",
      "send_message",
      convTitle,
      "success",
      `模型: ${model}${tokens ? ` | tokens: ${tokens}` : ""}`
    ),
  chatError: (convTitle: string, err: string) =>
    logOperation("chat", "send_message", convTitle, "error", err.slice(0, 120)),

  // ── 工作流 ────────────────────────────────────────────────────────────────
  wfCreate: (name: string) => logOperation("workflow", "create", name),
  wfSave: (name: string) => logOperation("workflow", "save", name),
  wfDelete: (name: string) => logOperation("workflow", "delete", name),
  wfToggle: (name: string, enabled: boolean) =>
    logOperation("workflow", enabled ? "enable" : "disable", name),
  wfRun: (name: string, status: OpStatus, detail?: string) =>
    logOperation("workflow", "run", name, status, detail),

  // ── 任务 ──────────────────────────────────────────────────────────────────
  taskCreate: (title: string) => logOperation("task", "create", title),
  taskUpdate: (title: string, from: string, to: string) =>
    logOperation("task", "update", title, "success", `${from} → ${to}`),
  taskDelete: (title: string) => logOperation("task", "delete", title),
  taskComplete: (title: string) => logOperation("task", "complete", title),

  // ── 技能 ──────────────────────────────────────────────────────────────────
  skillCreate: (name: string) => logOperation("skill", "create", name),
  skillSave: (name: string) => logOperation("skill", "save", name),
  skillDelete: (name: string) => logOperation("skill", "delete", name),
  skillToggle: (name: string, enabled: boolean) =>
    logOperation("skill", enabled ? "enable" : "disable", name),
  skillUse: (name: string) => logOperation("skill", "use", name),
  skillImport: (count: number) =>
    logOperation("skill", "import", `${count} 个技能`),

  // ── 工具 ──────────────────────────────────────────────────────────────────
  toolCreate: (name: string) => logOperation("tool", "create", name),
  toolSave: (name: string) => logOperation("tool", "save", name),
  toolDelete: (name: string) => logOperation("tool", "delete", name),
  toolToggle: (name: string, enabled: boolean) =>
    logOperation("tool", enabled ? "enable" : "disable", name),
  toolPermission: (name: string, perm: string) =>
    logOperation("tool", "permission_change", name, "info", `权限: ${perm}`),

  // ── 模型配置 ──────────────────────────────────────────────────────────────
  modelCreate: (name: string) => logOperation("model", "create", name),
  modelSave: (name: string) => logOperation("model", "save", name),
  modelDelete: (name: string) => logOperation("model", "delete", name),
  modelSetDefault: (name: string) => logOperation("model", "set_default", name),
  modelSwitch: (name: string) => logOperation("model", "switch", name),

  // ── Claw ──────────────────────────────────────────────────────────────────
  clawCreate: (goal: string) => logOperation("claw", "create", goal.slice(0, 50)),
  clawRun: (goal: string, status: OpStatus) =>
    logOperation("claw", "run", goal.slice(0, 50), status),
  clawStepStart: (goal: string, stepName: string) =>
    logOperation("claw", "step_start", `${goal.slice(0, 40)} / ${stepName}`),
  clawStepComplete: (goal: string, stepName: string) =>
    logOperation("claw", "step_complete", `${goal.slice(0, 40)} / ${stepName}`),
  clawStepFailed: (goal: string, stepName: string) =>
    logOperation("claw", "step_failed", `${goal.slice(0, 40)} / ${stepName}`, "error"),
  clawFileCreate: (goal: string, fileName: string, filePath: string) =>
    logOperation("claw", "file_create", `${goal.slice(0, 30)} / ${fileName}`, "success", filePath),
  clawFileError: (goal: string, fileName: string, error: string) =>
    logOperation("claw", "file_error", `${goal.slice(0, 30)} / ${fileName}`, "error", error),
  clawCommandExec: (goal: string, command: string) =>
    logOperation("claw", "command_exec", `${goal.slice(0, 30)} / ${command.slice(0, 40)}`),
  clawAbort: (goal: string) => logOperation("claw", "abort", goal.slice(0, 50), "warning"),
  clawDelete: (goal: string) => logOperation("claw", "delete", goal.slice(0, 50)),
  clawNew: (goal: string) => logOperation("claw", "new", goal.slice(0, 50)),
  clawError: (goal: string, error: string) =>
    logOperation("claw", "error", `${goal.slice(0, 40)}: ${error.slice(0, 50)}`, "error")
};

// ─── 操作类型展示名 ───────────────────────────────────────────────────────────

export const ACTION_LABELS: Record<string, string> = {
  new_conversation: "新建对话",
  delete_conversation: "删除对话",
  send_message: "发送消息",
  create: "创建",
  save: "保存",
  delete: "删除",
  enable: "启用",
  disable: "禁用",
  run: "运行",
  update: "更新",
  complete: "完成",
  use: "使用",
  import: "导入",
  permission_change: "权限变更",
  set_default: "设为默认",
  switch: "切换",
  step_complete: "步骤完成",
  step_failed: "步骤失败",
  abort: "中止"
};

export const CATEGORY_LABELS: Record<OpCategory, string> = {
  chat: "对话",
  workflow: "工作流",
  task: "任务",
  skill: "技能",
  tool: "工具",
  model: "模型",
  claw: "Claw",
  system: "系统"
};

export const CATEGORY_COLORS: Record<OpCategory, string> = {
  chat: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  workflow:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  task: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  skill:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  tool: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  model:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  claw:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  system: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
};
