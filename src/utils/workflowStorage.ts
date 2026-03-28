/**
 * 工作流本地持久化工具
 * 使用 localStorage 存储，与对话历史存储并列
 */

import { Workflow, WorkflowExecutionLog } from "../types";

const KEY_WORKFLOWS = "claw_workflows";
const KEY_VERSION   = "claw_workflow_version";
const VERSION       = "1.0.0";

// ─── 序列化 / 反序列化 ────────────────────────────────────────────────────────

function serialize(workflows: Workflow[]): string {
  return JSON.stringify(
    workflows.map((w) => ({
      ...w,
      createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : w.createdAt,
      updatedAt: w.updatedAt instanceof Date ? w.updatedAt.toISOString() : w.updatedAt,
      lastRun:   w.lastRun instanceof Date   ? w.lastRun.toISOString()   : w.lastRun,
    }))
  );
}

function deserialize(raw: string): Workflow[] {
  const arr = JSON.parse(raw) as any[];
  return arr.map((w) => ({
    ...w,
    createdAt: new Date(w.createdAt),
    updatedAt: new Date(w.updatedAt),
    lastRun:   w.lastRun ? new Date(w.lastRun) : undefined,
    outputLogs: (w.outputLogs ?? []).map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
      steps: (log.steps ?? []).map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime:   s.endTime ? new Date(s.endTime) : undefined,
      })),
    })) as WorkflowExecutionLog[],
  }));
}

// ─── 默认 Mock 数据（首次加载时写入） ─────────────────────────────────────────

export function getDefaultWorkflows(): Workflow[] {
  const now = Date.now();
  return [
    {
      id: "default-1",
      name: "代码审查自动化",
      description: "自动审查代码变更并生成审查报告",
      trigger: "scheduled",
      triggerConfig: { schedule: "0 9 * * 1-5" },
      steps: [
        { id: "d1-1", type: "ai_query",     name: "代码质量分析", description: "使用AI分析代码质量", config: { model: "deepseek", prompt: "分析代码质量" }, enabled: true, order: 1 },
        { id: "d1-2", type: "condition",    name: "质量判断",     description: "判断是否存在严重问题", config: { condition: "quality_score < 60" }, enabled: true, order: 2 },
        { id: "d1-3", type: "notification", name: "发送报告",     description: "发送审查报告", config: { channel: "email" }, enabled: true, order: 3 },
      ],
      canvas: {
        nodes: [
          { id: "d1-1", type: "ai_query",     position: { x: 80,  y: 120 }, data: { label: "代码质量分析", description: "使用AI分析代码质量", config: { model: "deepseek" }, enabled: true } },
          { id: "d1-2", type: "condition",    position: { x: 320, y: 120 }, data: { label: "质量判断",     description: "判断是否存在严重问题", config: { condition: "quality_score < 60" }, enabled: true } },
          { id: "d1-3", type: "notification", position: { x: 560, y: 120 }, data: { label: "发送报告",     description: "发送审查报告",  config: { channel: "email" }, enabled: true } },
        ],
        edges: [
          { id: "e-d1-1-2", source: "d1-1", target: "d1-2", sourceHandle: "default" },
          { id: "e-d1-2-3", source: "d1-2", target: "d1-3", sourceHandle: "true", label: "是" },
        ],
      },
      enabled: true,
      lastRun: new Date(now - 3600000),
      lastRunStatus: "success",
      lastRunOutput: "代码审查完成，发现3个建议性问题",
      createdAt: new Date(now - 86400000 * 3),
      updatedAt: new Date(now - 3600000),
    },
    {
      id: "default-2",
      name: "文档自动生成",
      description: "根据代码自动生成 API 文档",
      trigger: "manual",
      triggerConfig: {},
      steps: [
        { id: "d2-1", type: "code_generation", name: "提取代码注释", description: "从代码中提取注释", config: {}, enabled: true, order: 1 },
        { id: "d2-2", type: "ai_query",        name: "优化文档内容", description: "用AI优化文档", config: { model: "gpt-4" }, enabled: true, order: 2 },
        { id: "d2-3", type: "file_operation",  name: "保存文档",     description: "将文档写入文件", config: { path: "/docs/api.md" }, enabled: true, order: 3 },
      ],
      canvas: {
        nodes: [
          { id: "d2-1", type: "code_generation", position: { x: 80,  y: 120 }, data: { label: "提取代码注释", description: "从代码中提取注释", config: {}, enabled: true } },
          { id: "d2-2", type: "ai_query",        position: { x: 320, y: 120 }, data: { label: "优化文档内容", description: "用AI优化文档", config: { model: "gpt-4" }, enabled: true } },
          { id: "d2-3", type: "file_operation",  position: { x: 560, y: 120 }, data: { label: "保存文档",     description: "将文档写入文件", config: { path: "/docs/api.md" }, enabled: true } },
        ],
        edges: [
          { id: "e-d2-1-2", source: "d2-1", target: "d2-2" },
          { id: "e-d2-2-3", source: "d2-2", target: "d2-3" },
        ],
      },
      enabled: true,
      lastRun: new Date(now - 86400000),
      lastRunStatus: "success",
      lastRunOutput: "文档生成完成，保存到 /docs/api.md",
      createdAt: new Date(now - 86400000 * 5),
      updatedAt: new Date(now - 86400000),
    },
  ];
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function loadWorkflows(): Workflow[] {
  try {
    const raw = localStorage.getItem(KEY_WORKFLOWS);
    if (!raw) {
      // 首次加载写入默认数据
      const defaults = getDefaultWorkflows();
      saveWorkflows(defaults);
      return defaults;
    }
    return deserialize(raw);
  } catch {
    return getDefaultWorkflows();
  }
}

export function saveWorkflows(workflows: Workflow[]): void {
  try {
    localStorage.setItem(KEY_WORKFLOWS, serialize(workflows));
    localStorage.setItem(KEY_VERSION, VERSION);
  } catch (e) {
    console.error("saveWorkflows error", e);
  }
}

export function saveWorkflow(workflow: Workflow): void {
  const list = loadWorkflows();
  const idx  = list.findIndex((w) => w.id === workflow.id);
  if (idx >= 0) list[idx] = workflow;
  else list.unshift(workflow);
  saveWorkflows(list);
}

export function deleteWorkflow(id: string): void {
  saveWorkflows(loadWorkflows().filter((w) => w.id !== id));
}

export function clearWorkflows(): void {
  localStorage.removeItem(KEY_WORKFLOWS);
  localStorage.removeItem(KEY_VERSION);
}
