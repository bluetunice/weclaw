import {
  ChatBubbleLeftRightIcon,
  FolderIcon,
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ServerIcon,
  CommandLineIcon,
  Cog6ToothIcon,
  BoltIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  StopCircleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { WorkflowNodeType } from "../../types";

// ─── 节点元信息 ────────────────────────────────────────────────────────────────

export interface NodeMeta {
  label: string;
  color: string;
  border: string;
  textColor: string;
  Icon: React.FC<{ className?: string }>;
  description: string;
}

export const NODE_META: Record<WorkflowNodeType, NodeMeta> = {
  start:             { label: "开始",     color: "bg-green-50  dark:bg-green-900/30",  border: "border-green-400",  textColor: "text-green-700 dark:text-green-300",  Icon: CheckCircleIcon,         description: "工作流起始节点" },
  end:               { label: "结束",     color: "bg-gray-100  dark:bg-gray-700",       border: "border-gray-400",   textColor: "text-gray-600 dark:text-gray-300",    Icon: StopCircleIcon,          description: "工作流终止节点" },
  ai_query:          { label: "AI 对话", color: "bg-blue-50   dark:bg-blue-900/30",    border: "border-blue-400",   textColor: "text-blue-700 dark:text-blue-300",    Icon: ChatBubbleLeftRightIcon, description: "调用 AI 模型进行推理" },
  file_operation:    { label: "文件操作", color: "bg-green-50  dark:bg-green-900/30",  border: "border-green-400",  textColor: "text-green-700 dark:text-green-300",  Icon: FolderIcon,              description: "读写文件" },
  code_generation:   { label: "代码生成", color: "bg-purple-50 dark:bg-purple-900/30", border: "border-purple-400", textColor: "text-purple-700 dark:text-purple-300", Icon: DocumentTextIcon,        description: "生成或提取代码" },
  task_creation:     { label: "创建任务", color: "bg-amber-50  dark:bg-amber-900/30",  border: "border-amber-400",  textColor: "text-amber-700 dark:text-amber-300",  Icon: PlusIcon,                description: "创建任务记录" },
  notification:      { label: "通知",     color: "bg-red-50    dark:bg-red-900/30",     border: "border-red-400",    textColor: "text-red-700 dark:text-red-300",      Icon: MagnifyingGlassIcon,     description: "发送通知或消息" },
  web_scraping:      { label: "网页抓取", color: "bg-indigo-50 dark:bg-indigo-900/30", border: "border-indigo-400", textColor: "text-indigo-700 dark:text-indigo-300", Icon: ServerIcon,              description: "抓取网页内容" },
  data_processing:   { label: "数据处理", color: "bg-teal-50   dark:bg-teal-900/30",   border: "border-teal-400",   textColor: "text-teal-700 dark:text-teal-300",    Icon: Cog6ToothIcon,           description: "数据转换与处理" },
  command_execution: { label: "命令执行", color: "bg-gray-100  dark:bg-gray-700",       border: "border-gray-500",   textColor: "text-gray-700 dark:text-gray-300",    Icon: CommandLineIcon,         description: "执行 Shell 命令" },
  condition:         { label: "条件判断", color: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-400", textColor: "text-orange-700 dark:text-orange-300", Icon: ArrowsRightLeftIcon,     description: "IF 条件分支" },
  skill:             { label: "技能调用", color: "bg-violet-50 dark:bg-violet-900/30", border: "border-violet-400", textColor: "text-violet-700 dark:text-violet-300", Icon: BoltIcon,                description: "调用技能库中的技能" },
  parallel:          { label: "并行分支", color: "bg-cyan-50   dark:bg-cyan-900/30",   border: "border-cyan-400",   textColor: "text-cyan-700 dark:text-cyan-300",    Icon: ArrowsRightLeftIcon,     description: "并行执行多个分支" },
  loop:              { label: "循环",     color: "bg-pink-50   dark:bg-pink-900/30",   border: "border-pink-400",   textColor: "text-pink-700 dark:text-pink-300",    Icon: ArrowPathIcon,           description: "循环执行子流程" },
  tool_call:         { label: "工具调用", color: "bg-rose-50   dark:bg-rose-900/30",   border: "border-rose-400",   textColor: "text-rose-700 dark:text-rose-300",    Icon: WrenchScrewdriverIcon,   description: "调用本地工具库中的工具" },
};

// ─── 类型分组（用于节点库面板）─────────────────────────────────────────────────

export const NODE_GROUPS: { label: string; types: WorkflowNodeType[] }[] = [
  { label: "流程控制", types: ["start", "end", "condition", "parallel", "loop"] },
  { label: "AI 能力",  types: ["ai_query", "skill"] },
  { label: "数据操作", types: ["file_operation", "code_generation", "data_processing"] },
  { label: "外部集成", types: ["web_scraping", "notification", "command_execution", "task_creation", "tool_call"] },
];

// ─── 画布布局常量 ──────────────────────────────────────────────────────────────

export const NODE_W   = 160;
export const NODE_H   = 64;
export const PORT_R   = 6;

// ─── 辅助：贝塞尔路径 ──────────────────────────────────────────────────────────

export function bezierPath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = Math.abs(tx - sx) * 0.5;
  return `M${sx},${sy} C${sx + dx},${sy} ${tx - dx},${ty} ${tx},${ty}`;
}

// ─── 端口坐标计算 ──────────────────────────────────────────────────────────────

import { CanvasNode } from "../../types";

export function outPortPos(
  node: CanvasNode,
  handle: "default" | "true" | "false" = "default",
): { x: number; y: number } {
  if (node.type === "condition") {
    if (handle === "true")  return { x: node.position.x + NODE_W, y: node.position.y + 16 };
    if (handle === "false") return { x: node.position.x + NODE_W, y: node.position.y + NODE_H - 16 };
  }
  return { x: node.position.x + NODE_W, y: node.position.y + NODE_H / 2 };
}

export function inPortPos(node: CanvasNode): { x: number; y: number } {
  return { x: node.position.x, y: node.position.y + NODE_H / 2 };
}
