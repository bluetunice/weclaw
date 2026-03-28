// ─── Dashboard 共享类型 ────────────────────────────────────────────────────

export interface WorkflowStep {
  id: string; type: string; name: string;
  description: string; config: Record<string, any>;
  enabled: boolean; order: number;
}

export interface Workflow {
  id: string; name: string; description: string;
  trigger: "manual" | "scheduled" | "file_change" | "api_call" | "webhook";
  triggerConfig: Record<string, any>;
  steps: WorkflowStep[];
  enabled: boolean;
  lastRun?: Date;
  lastRunStatus?: "success" | "failed" | "running";
  createdAt: Date;
  updatedAt: Date;
}

// ─── 辅助常量 ─────────────────────────────────────────────────────────────

export const wfRunCfg: Record<string, { cls: string }> = {
  success: { cls: "text-green-600 bg-green-50" },
  failed:  { cls: "text-red-600 bg-red-50" },
  running: { cls: "text-blue-600 bg-blue-50" },
};

export const taskStatusCfg: Record<string, { cls: string; dot: string }> = {
  pending:     { cls: "text-amber-700 bg-amber-50",  dot: "bg-amber-400" },
  in_progress: { cls: "text-blue-700 bg-blue-50",   dot: "bg-blue-500"  },
  completed:   { cls: "text-green-700 bg-green-50", dot: "bg-green-500" },
  cancelled:   { cls: "text-gray-500 bg-gray-50",   dot: "bg-gray-400"  },
};

export const taskPriCfg: Record<string, { cls: string }> = {
  low:      { cls: "text-gray-500 bg-gray-100"   },
  medium:   { cls: "text-blue-700 bg-blue-100"   },
  high:     { cls: "text-amber-700 bg-amber-100" },
  critical: { cls: "text-red-700 bg-red-100"     },
};

// ─── Mock 数据 ──────────────────────────────────────────────────────────────

export function getMockWorkflows(): Workflow[] {
  return [
    { id: "1", name: "代码审查自动化", description: "自动审查代码变更并生成报告",
      trigger: "file_change", triggerConfig: {}, enabled: true,
      steps: [{ id:"1-1", type:"ai_query", name:"质量分析", description:"", config:{}, enabled:true, order:1 },
              { id:"1-2", type:"notification", name:"发送报告", description:"", config:{}, enabled:true, order:2 }],
      lastRun: new Date(Date.now() - 3600000), lastRunStatus: "success",
      createdAt: new Date(Date.now() - 86400000 * 3), updatedAt: new Date(Date.now() - 3600000) },
    { id: "2", name: "文档自动生成", description: "根据代码自动生成 API 文档",
      trigger: "manual", triggerConfig: {}, enabled: true,
      steps: [{ id:"2-1", type:"code_generation", name:"提取注释", description:"", config:{}, enabled:true, order:1 },
              { id:"2-2", type:"ai_query", name:"优化文档", description:"", config:{}, enabled:true, order:2 }],
      lastRun: new Date(Date.now() - 86400000), lastRunStatus: "success",
      createdAt: new Date(Date.now() - 86400000 * 5), updatedAt: new Date(Date.now() - 86400000) },
    { id: "3", name: "日报自动生成", description: "每日自动生成工作日报",
      trigger: "scheduled", triggerConfig: {}, enabled: false,
      steps: [{ id:"3-1", type:"ai_query", name:"汇总进度", description:"", config:{}, enabled:true, order:1 }],
      createdAt: new Date(Date.now() - 86400000 * 2), updatedAt: new Date(Date.now() - 86400000 * 2) },
  ];
}

// ─── 工具函数 ───────────────────────────────────────────────────────────────

export function timeAgo(d: Date | string, tFn?: (k: string) => string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return tFn ? tFn('dashboard.time.justNow') : '刚刚';
  if (mins < 60) return `${mins} ${tFn ? tFn('dashboard.time.minutesAgo') : '分钟前'}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${tFn ? tFn('dashboard.time.hoursAgo') : '小时前'}`;
  return `${Math.floor(hours / 24)} ${tFn ? tFn('dashboard.time.daysAgo') : '天前'}`;
}
