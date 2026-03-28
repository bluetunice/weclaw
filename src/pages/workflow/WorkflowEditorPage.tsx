import React, { useState, useEffect } from "react";
import {
  ArrowLeftIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { Workflow, WorkflowCanvas, WorkflowStep, CanvasNode } from "../../types";
import { WorkflowCanvasEditor } from "../../components/workflow/WorkflowCanvas";
import { NODE_META } from "../../components/workflow/nodeConstants";
import { CronConfig } from "./CronConfig";

interface WorkflowEditorPageProps {
  workflow: Workflow;
  onSave:   (w: Workflow) => void;
  onBack:   () => void;
  t:        (k: string) => string;
}

export const WorkflowEditorPage: React.FC<WorkflowEditorPageProps> = ({
  workflow, onSave, onBack, t,
}) => {
  const [wf, setWf]             = useState<Workflow>({ ...workflow });
  const [expanded, setExpanded] = useState(false);

  // 初始化空画布：自动添加开始节点
  useEffect(() => {
    if (!wf.canvas || wf.canvas.nodes.length === 0) {
      const startNode: CanvasNode = {
        id:       "start-node",
        type:     "start",
        position: { x: 60, y: 160 },
        data:     { label: NODE_META.start.label, config: {}, enabled: true },
      };
      setWf((prev) => ({ ...prev, canvas: { nodes: [startNode], edges: [] } }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCanvas = (canvas: WorkflowCanvas) => {
    const steps: WorkflowStep[] = canvas.nodes
      .filter((n) => n.type !== "start" && n.type !== "end")
      .map((n, idx) => ({
        id:          n.id,
        type:        n.type,
        name:        n.data.label,
        description: n.data.description ?? "",
        config:      n.data.config ?? {},
        enabled:     n.data.enabled !== false,
        order:       idx + 1,
      }));
    setWf((prev) => ({ ...prev, canvas, steps, updatedAt: new Date() }));
  };

  const handleSave = () => onSave({ ...wf, updatedAt: new Date() });

  return (
    <div className="flex flex-col h-full">
      {/* ── 顶部紧凑工具栏 ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-1 py-2 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shrink-0"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t("workflow.backList")}
        </button>
        <ChevronRightIcon className="h-3 w-3 text-gray-300 shrink-0" />

        {/* 名称 内联编辑 */}
        <input
          className="input text-sm flex-1 min-w-0 font-semibold"
          value={wf.name}
          onChange={(e) => setWf((p) => ({ ...p, name: e.target.value }))}
          placeholder={t("workflow.namePlaceholder")}
        />

        {/* 触发器 */}
        <select
          className="input text-sm w-36 shrink-0"
          value={wf.trigger}
          onChange={(e) => setWf((p) => ({ ...p, trigger: e.target.value as Workflow["trigger"] }))}
        >
          <option value="manual">{t("workflow.trigger.manual")}</option>
          <option value="scheduled">{t("workflow.trigger.scheduled")}</option>
          <option value="file_change">{t("workflow.trigger.file_change")}</option>
          <option value="api_call">{t("workflow.trigger.api_call")}</option>
          <option value="webhook">{t("workflow.trigger.webhook")}</option>
        </select>

        {/* 展开更多设置 */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shrink-0"
          title={expanded ? t("workflow.collapseSettings") : t("workflow.expandSettings")}
        >
          {expanded ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
          {t("workflow.moreSettings")}
        </button>

        <button onClick={handleSave} className="btn-primary text-sm px-4 py-1.5 shrink-0">
          {t("workflow.saveBtn")}
        </button>
      </div>

      {/* ── 可折叠的扩展设置区 ─────────────────────────────────────── */}
      {expanded && (
        <div className="card p-3 mb-2 shrink-0 space-y-3 border-t-0 rounded-t-none">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("workflow.descLabel")}
              </label>
              <input
                className="input text-sm w-full"
                value={wf.description}
                onChange={(e) => setWf((p) => ({ ...p, description: e.target.value }))}
                placeholder={t("workflow.descPlaceholder")}
              />
            </div>
            {wf.trigger === "scheduled" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("workflow.cronConfigLabel")}
                </label>
                <CronConfig
                  cronExpression={wf.triggerConfig?.schedule || "0 0 * * *"}
                  onChange={(cron) => setWf((p) => ({ ...p, triggerConfig: { ...p.triggerConfig, schedule: cron } }))}
                  t={t}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 画布铺满剩余高度 ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <WorkflowCanvasEditor
          canvas={wf.canvas ?? { nodes: [], edges: [] }}
          onChange={updateCanvas}
          t={t}
        />
      </div>
    </div>
  );
};

export default WorkflowEditorPage;
