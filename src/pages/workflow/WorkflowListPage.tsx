import React from "react";
import {
  PlayIcon, PauseIcon, TrashIcon, PlusIcon,
  Cog6ToothIcon, DocumentTextIcon, ArrowPathIcon,
  CheckCircleIcon, ClockIcon, EyeIcon, PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { Workflow } from "../../types";
import { NODE_META } from "../../components/workflow/nodeConstants";
import { CronConfig } from "./CronConfig";

interface WorkflowListPageProps {
  workflows:       Workflow[];
  runningWorkflow: string | null;
  isCreating:      boolean;
  draft:           Partial<Workflow>;
  onDraftChange:   (d: Partial<Workflow>) => void;
  onCreateSubmit:  () => void;
  onCreateCancel:  () => void;
  onCreateOpen:    () => void;
  onRun:           (id: string) => void;
  onToggle:        (id: string) => void;
  onDelete:        (id: string) => void;
  onEdit:          (id: string) => void;
  onViewOutput:    (id: string) => void;
  getTriggerLabel: (wf: Workflow) => string;
  t:               (k: string) => string;
}

export const WorkflowListPage: React.FC<WorkflowListPageProps> = ({
  workflows, runningWorkflow, isCreating, draft,
  onDraftChange, onCreateSubmit, onCreateCancel, onCreateOpen,
  onRun, onToggle, onDelete, onEdit, onViewOutput,
  getTriggerLabel, t,
}) => {
  const wfEnabled   = workflows.filter((w) => w.enabled).length;
  const wfScheduled = workflows.filter((w) => w.trigger === "scheduled").length;
  const wfSuccess   = workflows.filter((w) => w.lastRunStatus === "success").length;
  const wfWithRun   = workflows.filter((w) => w.lastRunStatus).length;
  const successRate = wfWithRun > 0 ? Math.round((wfSuccess / wfWithRun) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 页头 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("workflow.title")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("workflow.subtitle")}</p>
        </div>
        <button onClick={onCreateOpen} className="btn-primary flex items-center gap-1.5 text-xs">
          <PlusIcon className="h-3.5 w-3.5" />
          {t("workflow.createBtn")}
        </button>
      </div>

      {/* 统计卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("workflow.total"),       value: workflows.length,  color: "text-gray-800 dark:text-gray-100", Icon: Cog6ToothIcon,   iconCls: "text-gray-400"   },
          { label: t("workflow.enabled"),     value: wfEnabled,         color: "text-green-600",                   Icon: CheckCircleIcon, iconCls: "text-green-400"  },
          { label: t("workflow.scheduled"),   value: wfScheduled,       color: "text-blue-600",                    Icon: ClockIcon,       iconCls: "text-blue-400"   },
          { label: t("workflow.successRate"), value: `${successRate}%`, color: "text-purple-600",                  Icon: ArrowPathIcon,   iconCls: "text-purple-400" },
        ].map(({ label, value, color, Icon, iconCls }) => (
          <div key={label} className="card p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
              <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
            <Icon className={`h-6 w-6 ${iconCls} opacity-70`} />
          </div>
        ))}
      </div>

      {/* 新建表单 */}
      {isCreating && (
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t("workflow.createFormTitle")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("workflow.nameLabel2")}</label>
              <input
                className="input text-xs" value={draft.name ?? ""}
                onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
                placeholder={t("workflow.namePlaceholder")} autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("workflow.triggerLabel")}</label>
              <select
                className="input text-xs" value={draft.trigger ?? "manual"}
                onChange={(e) => onDraftChange({ ...draft, trigger: e.target.value as Workflow["trigger"] })}
              >
                <option value="manual">{t("workflow.trigger.manual")}</option>
                <option value="scheduled">{t("workflow.trigger.scheduled")}</option>
                <option value="file_change">{t("workflow.trigger.file_change")}</option>
                <option value="api_call">{t("workflow.trigger.api_call")}</option>
                <option value="webhook">{t("workflow.trigger.webhook")}</option>
              </select>
            </div>
          </div>
          {draft.trigger === "scheduled" && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-2.5">
              <CronConfig
                cronExpression={draft.triggerConfig?.schedule || "0 0 * * *"}
                onChange={(cron) => onDraftChange({ ...draft, triggerConfig: { schedule: cron } })}
                t={t}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("workflow.descLabel")}</label>
            <input
              className="input text-xs" value={draft.description ?? ""}
              onChange={(e) => onDraftChange({ ...draft, description: e.target.value })}
              placeholder={t("workflow.descPlaceholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox" id="draftEnabled"
              checked={draft.enabled !== false}
              onChange={(e) => onDraftChange({ ...draft, enabled: e.target.checked })}
              className="h-4 w-4 text-primary-600"
            />
            <label htmlFor="draftEnabled" className="text-xs text-gray-600 dark:text-gray-300">
              {t("workflow.enabledLabel")}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onCreateCancel} className="btn-secondary text-xs">{t("workflow.cancel")}</button>
            <button onClick={onCreateSubmit} className="btn-primary text-xs">{t("workflow.saveCreate")}</button>
          </div>
        </div>
      )}

      {/* 工作流列表 */}
      <div className="space-y-2">
        {workflows.length === 0 ? (
          <div className="card p-8 text-center">
            <Cog6ToothIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">{t("workflow.empty")}</p>
            <button onClick={onCreateOpen} className="mt-3 btn-primary text-xs">{t("workflow.createBtn")}</button>
          </div>
        ) : (
          workflows.map((wf) => (
            <div key={wf.id} className="card overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  {/* 信息区 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-xs">{wf.name}</h3>
                      <span className={`text-[10px] font-medium px-1 py-0.5 rounded-full ${wf.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {wf.enabled ? t("workflow.tagEnabled") : t("workflow.tagDisabled")}
                      </span>
                      {wf.lastRunStatus && (
                        <span className={`text-[10px] font-medium px-1 py-0.5 rounded-full ${
                          wf.lastRunStatus === "success" ? "bg-green-100 text-green-700" :
                          wf.lastRunStatus === "failed"  ? "bg-red-100 text-red-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {t(`workflow.status.${wf.lastRunStatus}`)}
                        </span>
                      )}
                    </div>
                    {wf.description && (
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 line-clamp-1">{wf.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {getTriggerLabel(wf)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DocumentTextIcon className="h-3 w-3" />
                        {wf.steps.length} 步骤
                      </span>
                      {wf.canvas?.nodes && (
                        <span className="text-gray-300 dark:text-gray-600">
                          {wf.canvas.nodes.length} 节点 · {wf.canvas.edges.length} 连线
                        </span>
                      )}
                      {wf.lastRun && (
                        <span>{t("workflow.lastRun")}: {wf.lastRun.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* 操作区 */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onRun(wf.id)}
                        disabled={runningWorkflow === wf.id || !wf.enabled}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {runningWorkflow === wf.id
                          ? <><ArrowPathIcon className="h-3 w-3 animate-spin" />{t("workflow.runningBtn")}</>
                          : <><PlayIcon className="h-3 w-3" />{t("workflow.runNow")}</>}
                      </button>
                      <button onClick={() => onViewOutput(wf.id)} className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title={t("workflow.viewOutput")}>
                        <EyeIcon className="h-3 w-3 text-gray-500" />
                      </button>
                      <button onClick={() => onEdit(wf.id)} className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title={t("workflow.editBtn")}>
                        <PencilSquareIcon className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onToggle(wf.id)}
                        className="flex-1 text-[10px] py-0.5 px-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-0.5"
                      >
                        {wf.enabled
                          ? <><PauseIcon className="h-2.5 w-2.5" />{t("workflow.disableBtn")}</>
                          : <><PlayIcon className="h-2.5 w-2.5" />{t("workflow.enableBtn")}</>}
                      </button>
                      <button
                        onClick={() => onDelete(wf.id)}
                        className="p-1 rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title={t("workflow.deleteTitle")}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 节点预览条 */}
              {wf.canvas?.nodes && wf.canvas.nodes.length > 0 && (
                <div className="px-3.5 pb-2.5 border-t border-gray-50 dark:border-gray-700 pt-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    {wf.canvas.nodes.slice(0, 8).map((node, i) => {
                      const meta = NODE_META[node.type];
                      return (
                        <React.Fragment key={node.id}>
                          {i > 0 && <span className="text-gray-300 dark:text-gray-600 text-[10px]">→</span>}
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded border ${meta.border} ${meta.color}`}>
                            <meta.Icon className={`h-2 w-2 ${meta.textColor}`} />
                            <span className={meta.textColor}>{node.data.label}</span>
                          </span>
                        </React.Fragment>
                      );
                    })}
                    {wf.canvas.nodes.length > 8 && (
                      <span className="text-[9px] text-gray-400">+{wf.canvas.nodes.length - 8}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkflowListPage;
