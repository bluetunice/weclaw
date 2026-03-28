import React, { useState, useMemo, useCallback } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  PlayCircleIcon,
  MinusCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CheckIcon,
  DocumentTextIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { CodePlan, CodePlanStep, PlanStepStatus } from "../../../types";
import { useSettings } from "../../../contexts/SettingsContext";

interface CodePlanPanelProps {
  plan: CodePlan;
  onStepStatusChange: (stepId: string, status: PlanStepStatus) => void;
  onFileClick?: (filePath: string) => void;
}

// ── 状态配置 ─────────────────────────────────────────────────────────────────

const statusConfig: Record<
  PlanStepStatus,
  { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; bg: string; border: string }
> = {
  pending: {
    icon: ClockIcon,
    color: "text-gray-400 dark:text-gray-500",
    bg: "bg-gray-50 dark:bg-gray-800/60",
    border: "border-gray-200 dark:border-gray-700",
  },
  in_progress: {
    icon: PlayCircleIcon,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700/60",
  },
  done: {
    icon: CheckCircleIcon,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700/60",
  },
  skipped: {
    icon: MinusCircleIcon,
    color: "text-gray-300 dark:text-gray-600",
    bg: "bg-gray-50/50 dark:bg-gray-800/30",
    border: "border-gray-100 dark:border-gray-700/40",
  },
};

// ── 单步骤卡片 ───────────────────────────────────────────────────────────────

interface StepCardProps {
  step: CodePlanStep;
  depth: number;
  /** 当前步骤详情是否展开 */
  expanded: boolean;
  /** 切换自身展开状态 */
  onToggleExpand: (id: string) => void;
  /** 子步骤的展开 id 集合（向下传递） */
  expandedIds: Set<string>;
  onStatusChange: (stepId: string, status: PlanStepStatus) => void;
  onFileClick?: (filePath: string) => void;
  t: (key: string) => string;
}

const nextStatus = (cur: PlanStepStatus): PlanStepStatus => {
  if (cur === "pending") return "in_progress";
  if (cur === "in_progress") return "done";
  return "pending";
};

const StepCard: React.FC<StepCardProps> = ({
  step,
  depth,
  expanded,
  onToggleExpand,
  expandedIds,
  onStatusChange,
  onFileClick,
  t,
}) => {
  const cfg = statusConfig[step.status];
  const Icon = cfg.icon;
  const hasChildren = !!step.children?.length;
  const hasDetail = !!(step.description || (step.files && step.files.length > 0) || hasChildren);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${cfg.bg} ${cfg.border}`}
      style={{ marginLeft: depth * 14 }}
    >
      {/* ─ 标题行（可点击展开/折叠） ─ */}
      <div
        className={`flex items-center gap-2 px-3 py-2.5 ${hasDetail ? "cursor-pointer select-none" : ""}`}
        onClick={() => hasDetail && onToggleExpand(step.id)}
      >
        {/* 状态图标（独立可点击，阻止冒泡） */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(step.id, nextStatus(step.status));
          }}
          className={`flex-shrink-0 transition-transform duration-150 hover:scale-110 ${cfg.color}`}
          title={
            step.status === "done"
              ? t("chat.plan.markPending")
              : step.status === "in_progress"
              ? t("chat.plan.markDone")
              : t("chat.plan.setInProgress")
          }
        >
          <Icon style={{ width: 17, height: 17 }} />
        </button>

        {/* 步骤编号 */}
        <span
          className={`text-[10px] font-mono px-1.5 py-px rounded flex-shrink-0 ${cfg.bg} ${cfg.color} border ${cfg.border}`}
        >
          {t("chat.plan.step")} {step.index}
        </span>

        {/* 标题 */}
        <span
          className={`flex-1 text-xs font-semibold leading-5 min-w-0 truncate ${
            step.status === "done"
              ? "line-through text-gray-400 dark:text-gray-500"
              : step.status === "skipped"
              ? "line-through text-gray-300 dark:text-gray-600"
              : "text-gray-800 dark:text-gray-100"
          }`}
          title={step.title}
        >
          {step.title}
        </span>

        {/* 展开/折叠箭头 */}
        {hasDetail && (
          <span className={`flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${expanded ? "rotate-0" : "-rotate-90"}`}>
            <ChevronDownIcon style={{ width: 13, height: 13 }} />
          </span>
        )}

        {/* 状态 badge */}
        <span
          className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}
        >
          {t(`chat.plan.${step.status}`)}
        </span>
      </div>

      {/* ─ 详情区（可展开/折叠） ─ */}
      {hasDetail && expanded && (
        <div className="px-3 pb-2.5 space-y-2 border-t border-gray-100/60 dark:border-gray-700/40 pt-2">
          {step.description && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {step.description}
            </p>
          )}

          {/* 关联文件 */}
          {step.files && step.files.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-0.5">
                {t("chat.plan.relatedFiles")}:
              </span>
              {step.files.map((f) => (
                <button
                  key={f}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClick?.(f);
                  }}
                  className="text-[10px] px-1.5 py-px bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50 rounded hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors font-mono truncate max-w-[150px]"
                  title={f}
                >
                  {f.split("/").pop()}
                </button>
              ))}
            </div>
          )}

          {/* 子步骤 */}
          {hasChildren && (
            <div className="space-y-1.5 pt-1">
              {step.children!.map((child) => (
                <StepCard
                  key={child.id}
                  step={child}
                  depth={0}
                  expanded={expandedIds.has(child.id)}
                  onToggleExpand={onToggleExpand}
                  expandedIds={expandedIds}
                  onStatusChange={onStatusChange}
                  onFileClick={onFileClick}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── 主组件 ───────────────────────────────────────────────────────────────────

const CodePlanPanel: React.FC<CodePlanPanelProps> = ({
  plan,
  onStepStatusChange,
  onFileClick,
}) => {
  const { t } = useSettings();
  const [copied, setCopied] = useState(false);

  // 收集所有步骤 id（包含子步骤）
  const allIds = useMemo(() => {
    const collect = (steps: CodePlanStep[]): string[] =>
      steps.flatMap((s) => [s.id, ...(s.children ? collect(s.children) : [])]);
    return collect(plan.steps);
  }, [plan.steps]);

  // 默认全部展开
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(allIds));

  const isAllExpanded = expandedIds.size === allIds.length;

  const toggleExpandAll = useCallback(() => {
    if (isAllExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(allIds));
    }
  }, [isAllExpanded, allIds]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 进度统计
  const { doneCount, totalCount } = useMemo(() => {
    const flat = (steps: CodePlanStep[]): CodePlanStep[] =>
      steps.flatMap((s) => [s, ...(s.children ? flat(s.children) : [])]);
    const all = flat(plan.steps);
    return {
      doneCount: all.filter((s) => s.status === "done").length,
      totalCount: all.length,
    };
  }, [plan.steps]);

  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const handleCopyAll = () => {
    const text = plan.steps
      .map(
        (s, i) =>
          `${i + 1}. [${s.status.toUpperCase()}] ${s.title}` +
          (s.description ? `\n   ${s.description}` : "")
      )
      .join("\n");
    navigator.clipboard.writeText(`${plan.title}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {plan.title}
            </h3>
            {plan.description && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {plan.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* 全部展开/折叠 */}
            <button
              onClick={toggleExpandAll}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title={isAllExpanded ? t("chat.file.collapseAll") : t("chat.file.expandAll")}
            >
              <ChevronUpDownIcon className="h-3.5 w-3.5" />
              <span>{isAllExpanded ? t("chat.file.collapseAll") : t("chat.file.expandAll")}</span>
            </button>
            {/* 复制 */}
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title={t("chat.plan.copyAll")}
            >
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <ClipboardIcon className="h-3.5 w-3.5" />
              )}
              <span>{copied ? t("chat.plan.copied") : t("chat.plan.copyAll")}</span>
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {t("chat.plan.progressLabel")}
            </span>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
              {doneCount}/{totalCount} · {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
        {plan.steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
            <DocumentTextIcon className="h-8 w-8 mb-2" />
            <span className="text-xs">{t("chat.panel.noContent")}</span>
          </div>
        ) : (
          plan.steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              depth={0}
              expanded={expandedIds.has(step.id)}
              onToggleExpand={handleToggle}
              expandedIds={expandedIds}
              onStatusChange={onStepStatusChange}
              onFileClick={onFileClick}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CodePlanPanel;
