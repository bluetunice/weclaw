export interface ModelConfig {
  id?: number;
  name: string;
  api_endpoint: string;
  api_key?: string;
  model_type: string;
  parameters: Record<string, any>;
  is_default: boolean;
  /** 文件上传接口地址（如 DeepSeek 的 /v1/files） */
  file_upload_endpoint?: string;
  /** 文件上传接口的 API Key（如果与主 API Key 不同） */
  file_upload_api_key?: string;
}

export interface Workspace {
  id?: number;
  path: string;
  name: string;
  created_at: string;
  is_active: boolean;
}

export interface OperationHistory {
  id: number;
  timestamp: string;
  operation_type: string;
  operation_target: string;
  operation_status: string;
  permission_check: string;
  details: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  workspace?: string;
  reason: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIModelResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  finish_reason: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  messages: Message[];
  modelId?: number;
  modelName: string;
  workspaceId?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
  metadata?: Record<string, any>;
}

export interface ModelCallOptions {
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  [key: string]: any;
}

// 节点类型枚举
export type WorkflowNodeType =
  | "start"
  | "end"
  | "ai_query"
  | "file_operation"
  | "code_generation"
  | "task_creation"
  | "notification"
  | "web_scraping"
  | "data_processing"
  | "command_execution"
  | "condition" // IF 条件节点
  | "skill" // 技能调用节点
  | "parallel" // 并行分支节点
  | "loop" // 循环节点
  | "tool_call"; // 工具调用节点

export interface WorkflowStep {
  id: string;
  type: WorkflowNodeType;
  name: string;
  description: string;
  config: Record<string, any>;
  enabled: boolean;
  order: number;
  outputs?: Record<string, any>;
  executionTime?: number;
}

// 画布节点（含位置）
export interface CanvasNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config: Record<string, any>;
    enabled?: boolean;
  };
}

// 画布边（含可选条件）
export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: "default" | "true" | "false";
  label?: string;
  condition?: string;
}

// 工作流画布数据（替代旧 WorkflowCanvasData）
export interface WorkflowCanvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: "manual" | "scheduled" | "file_change" | "api_call" | "webhook";
  triggerConfig: Record<string, any>;
  steps: WorkflowStep[];
  /** 可视化画布数据（节点+连线） */
  canvas?: WorkflowCanvas;
  enabled: boolean;
  lastRun?: Date;
  lastRunStatus?: "success" | "failed" | "running";
  lastRunOutput?: string;
  createdAt: Date;
  updatedAt: Date;
  outputLogs?: WorkflowExecutionLog[];
}

export interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  timestamp: Date;
  status: "success" | "failed" | "running";
  duration: number;
  steps: WorkflowStepExecutionLog[];
  output?: string;
  error?: string;
}

export interface WorkflowStepExecutionLog {
  stepId: string;
  stepName: string;
  startTime: Date;
  endTime?: Date;
  status: "success" | "failed" | "running";
  output?: Record<string, any>;
  error?: string;
}

export interface Node {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
    [key: string]: any;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowCanvasData {
  nodes: Node[];
  edges: Edge[];
}

export interface ElectronAPI {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
    removeListener: (channel: string, func: (...args: any[]) => void) => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

// 操作记录定时同步配置
export interface HistorySyncConfig {
  enabled: boolean;
  serverUrl: string; // 目标服务器地址，如 https://your-server.com/api/history/sync
  authType: "none" | "bearer" | "basic" | "apikey";
  authToken?: string; // Bearer Token / API Key
  authUsername?: string; // Basic Auth 用户名
  authPassword?: string; // Basic Auth 密码
  authHeaderName?: string; // API Key 自定义 Header 名，默认 X-API-Key
  scheduleType: "interval" | "cron";
  intervalMinutes?: number; // 间隔模式：每 N 分钟同步一次
  cronExpression?: string; // Cron 模式：标准 5 段 cron 表达式
  syncOnStartup: boolean; // 启动时立即同步
  lastSyncAt?: string; // 最后同步时间 ISO 字符串
  lastSyncStatus?: "success" | "failed" | "syncing";
  lastSyncMessage?: string; // 最后同步的结果信息
  maxRecords?: number; // 每次同步的最大记录条数，默认 200
}

// ─── 技能管理 ────────────────────────────────────────────────────────────────

export type SkillCategory =
  | "productivity" // 效率
  | "coding" // 编程
  | "writing" // 写作
  | "analysis" // 分析
  | "communication" // 沟通
  | "custom"; // 自定义

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  author: string;
  tags: string[];
  /** 技能提示词 / 脚本内容 */
  content: string;
  /** 是否启用 */
  enabled: boolean;
  /** 是否为内置技能（内置不可删除） */
  builtin: boolean;
  createdAt: string;
  updatedAt: string;
  /** 社区来源 URL（导入时记录） */
  sourceUrl?: string;
  /** 使用次数 */
  usageCount?: number;
}

export interface SkillPackage {
  version: string;
  exportedAt: string;
  skills: Skill[];
}

// ─── 工具管理 ────────────────────────────────────────────────────────────────

export type ToolType =
  | "builtin" // 内置工具
  | "script" // 本地脚本
  | "api"; // 外部 API

export type ToolPermission = "read_only" | "read_write" | "disabled";

export interface ToolParam {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  default?: any;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  /** 工具图标（emoji 或 icon key） */
  icon: string;
  /** 工具分组标签 */
  category: string;
  /** 参数定义 */
  params: ToolParam[];
  /** 权限设置 */
  permission: ToolPermission;
  /** 是否启用 */
  enabled: boolean;
  /** 是否为内置工具 */
  builtin: boolean;
  /** script 类型：脚本内容或路径 */
  scriptContent?: string;
  /** api 类型：接口地址 */
  apiEndpoint?: string;
  /** api 类型：HTTP 方法 */
  apiMethod?: "GET" | "POST" | "PUT" | "DELETE";
  /** api 类型：请求头 */
  apiHeaders?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

// ─── Chat 输出面板：代码计划 / Todo ────────────────────────────────────────────

/** 单个计划步骤的状态 */
export type PlanStepStatus = "pending" | "in_progress" | "done" | "skipped";

/** CodePlan 中的单个步骤 */
export interface CodePlanStep {
  id: string;
  index: number;
  title: string;
  description: string;
  status: PlanStepStatus;
  /** 关联的输出文件路径列表 */
  files?: string[];
  /** 子步骤（可选，最多一层） */
  children?: CodePlanStep[];
}

/** CodePlan 整体（AI 生成的代码实施计划） */
export interface CodePlan {
  id: string;
  /** 源自的消息 ID */
  messageId: string;
  title: string;
  description?: string;
  steps: CodePlanStep[];
  createdAt: string;
}

/** Todo 列表中的单条任务 */
export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  priority?: "low" | "medium" | "high";
  /** 关联文件 */
  file?: string;
}

/** Todo 列表整体 */
export interface TodoPlan {
  id: string;
  messageId: string;
  title: string;
  items: TodoItem[];
  createdAt: string;
}

// ─── Chat 输出面板：代码文件 ──────────────────────────────────────────────────

/** 输出的文件语言类型 */
export type FileLanguage =
  | "typescript"
  | "tsx"
  | "javascript"
  | "jsx"
  | "python"
  | "java"
  | "go"
  | "rust"
  | "cpp"
  | "c"
  | "csharp"
  | "html"
  | "css"
  | "scss"
  | "json"
  | "yaml"
  | "toml"
  | "xml"
  | "markdown"
  | "sql"
  | "shell"
  | "dockerfile"
  | "plaintext";

/** AI 生成的单个输出文件 */
export interface OutputFile {
  id: string;
  /** 显示用文件名（可含路径前缀，如 src/components/Foo.tsx） */
  path: string;
  language: FileLanguage;
  content: string;
  /** 源自的消息 ID */
  messageId: string;
  /** 是否已被用户手动修改 */
  modified?: boolean;
  createdAt: string;
}

/** 附件类型 */
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
}

/** 右侧面板的展示模式 */
export type ChatPanelMode =
  | "codeplan"
  | "todo"
  | "file"
  | "hidden"
  | "expanded"
  | "collapsed";
