/**
 * Claw Agent 类型定义
 * 类似 OpenClaw 的自主 Agent 任务执行框架
 */

// ── 步骤状态 ────────────────────────────────────────────────────────────────────
export type ClawStepStatus =
  | "pending"     // 等待执行
  | "running"     // 执行中
  | "done"        // 已完成
  | "failed"      // 失败
  | "skipped";    // 已跳过

// ── 步骤类型 ────────────────────────────────────────────────────────────────────
export type ClawStepType =
  | "think"       // 思考/分析
  | "search"      // 搜索/查询
  | "write"       // 写作/生成内容
  | "code"        // 生成/执行代码
  | "file"        // 文件操作
  | "api"         // API 调用
  | "summarize"   // 总结
  | "custom";     // 自定义

// ── 自动化动作类型 ────────────────────────────────────────────────────────────
export type ClawActionType =
  | "write-file"   // 写入文件
  | "read-file"    // 读取文件
  | "exec-command" // 执行命令

export type ClawActionStatus = "pending" | "running" | "done" | "failed";

/** 单个自动化动作（写文件 / 执行命令）*/
export interface ClawAction {
  id: string;
  type: ClawActionType;
  /** write-file：目标路径；exec-command：命令字符串 */
  target: string;
  /** write-file：文件内容；exec-command：不使用 */
  content?: string;
  status: ClawActionStatus;
  /** 执行结果：stdout / 写入路径 / 错误信息 */
  result?: string;
  exitCode?: number;
  durationMs?: number;
}

// ── 单个执行步骤 ────────────────────────────────────────────────────────────────
export interface ClawStep {
  id: string;
  index: number;
  type: ClawStepType;
  title: string;
  description: string;
  status: ClawStepStatus;
  /** AI 对该步骤的输出内容 */
  output?: string;
  /** 该步骤实际执行的自动化动作列表 */
  actions?: ClawAction[];
  /** 步骤开始时间 */
  startedAt?: string;
  /** 步骤完成时间 */
  finishedAt?: string;
  /** 耗时(ms) */
  durationMs?: number;
  /** 该步骤消耗的 tokens */
  tokens?: number;
  /** 错误信息 */
  error?: string;
}

// ── Agent 任务整体状态 ────────────────────────────────────────────────────────
export type ClawTaskStatus =
  | "idle"        // 空闲/初始
  | "planning"    // 规划中（AI 拆解步骤）
  | "running"     // 执行中
  | "paused"      // 已暂停
  | "done"        // 完成
  | "failed"      // 失败
  | "cancelled";  // 已取消

// ── 附件信息 ────────────────────────────────────────────────────────────────────
export interface ClawAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  isImage: boolean;
  fileId?: string; // DeepSeek 官方上传后的 file_id
}

// ── 文件信息 ────────────────────────────────────────────────────────────────────
export interface ClawFile {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  createdAt: string;
}

// ── 对话消息 ─────────────────────────────────────────────────────────────────
export interface ClawMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  tokens?: number;
}

// ── Agent 任务 ────────────────────────────────────────────────────────────────
export interface ClawTask {
  id: string;
  /** 用户输入的目标描述 */
  goal: string;
  status: ClawTaskStatus;
  steps: ClawStep[];
  /** 文件列表 */
  files?: ClawFile[];
  /** 最终汇总输出 */
  finalOutput?: string;
  /** 使用的模型 */
  modelId?: number;
  modelName?: string;
  /** 对话历史（用于多轮对话/长记忆） */
  messages?: ClawMessage[];
  /** 附加上下文/背景信息 */
  context?: string;
  /** 上传的附件列表 */
  attachments?: ClawAttachment[];
  /** 文件内容（用于Kimi等需要将文件内容注入到system消息的模型） */
  fileContents?: { fileId: string; content: string }[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 完成时间 */
  finishedAt?: string;
  /** 总消耗 tokens */
  totalTokens?: number;
  /** 总耗时(ms) */
  totalDurationMs?: number;
  /** 错误信息 */
  error?: string;
  /** 会话 ID（用于任务列表隔离） */
  sessionId?: string;
  /** 会话目录名（YYYYMMDDhhmmss 格式） */
  sessionDirName?: string;
}

// ── 存储结构 ──────────────────────────────────────────────────────────────────
export interface ClawStorage {
  tasks: ClawTask[];
  activeTaskId: string | null;
}
