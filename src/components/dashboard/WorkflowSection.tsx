import React from "react";
import { BoltIcon, PlayIcon, PauseIcon } from "@heroicons/react/24/outline";
import { SectionCard, StatsRow } from "./SectionCard";
import { Workflow, wfRunCfg, timeAgo } from "./dashboardTypes";

interface Props {
  workflows: Workflow[];
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  t: (k: string) => string;
}

export const WorkflowSection: React.FC<Props> = ({ workflows, collapsed, onToggle, onNavigate, t }) => {
  const wfTotal   = workflows.length;
  const wfEnabled = workflows.filter((w) => w.enabled).length;
  const wfFailed  = workflows.filter((w) => w.lastRunStatus === "failed").length;
  const wfSuccess = workflows.filter((w) => w.lastRunStatus === "success").length;
  const recentWf  = [...workflows]
    .filter((w) => w.lastRun)
    .sort((a, b) => b.lastRun!.getTime() - a.lastRun!.getTime())
    .slice(0, 3);

  return (
    <SectionCard
      icon={<BoltIcon className="h-4 w-4 text-emerald-600" />}
      iconBg="bg-emerald-50"
      title={t("dashboard.workflow")}
      collapsed={collapsed}
      onToggle={onToggle}
      onNavigate={onNavigate}
      badge={wfFailed > 0 ? <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full">{wfFailed} {t("dashboard.status.failed")}</span> : undefined}
      summary={
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.total")} <strong className="text-gray-800 dark:text-gray-100">{wfTotal}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.enabled")} <strong className="text-emerald-600">{wfEnabled}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.status.success")} <strong className="text-green-600">{wfSuccess}</strong></span>
          {wfFailed > 0 && <><span className="text-gray-300 dark:text-gray-600">|</span><span className="text-red-500 font-medium">{wfFailed} {t("dashboard.status.failed")}</span></>}
        </div>
      }
    >
      <StatsRow items={[
        { label: t("dashboard.total"),    value: wfTotal,             cls: "text-gray-800 dark:text-gray-100" },
        { label: t("dashboard.enabled"),  value: wfEnabled,           cls: "text-emerald-600" },
        { label: t("dashboard.disabled"), value: wfTotal - wfEnabled, cls: "text-gray-400" },
        { label: t("dashboard.status.success"), value: wfSuccess,     cls: "text-green-600" },
      ]} />
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {recentWf.length === 0
          ? <p className="text-sm text-gray-400 text-center py-5">{t("dashboard.noWorkflow")}</p>
          : recentWf.map((wf) => {
              const rc = wf.lastRunStatus ? wfRunCfg[wf.lastRunStatus] : null;
              return (
                <div key={wf.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                  <div className={`flex-shrink-0 p-1.5 rounded-lg ${wf.enabled ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
                    {wf.enabled ? <PlayIcon className="h-3.5 w-3.5 text-emerald-500" /> : <PauseIcon className="h-3.5 w-3.5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{wf.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{t(`dashboard.trigger.${wf.trigger}`)}</span>
                      <span className="text-[11px] text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-[11px] text-gray-400">{wf.steps.length}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {rc && <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${rc.cls}`}>{t(`dashboard.status.${wf.lastRunStatus}`)}</span>}
                    {wf.lastRun && <span className="text-[11px] text-gray-400">{timeAgo(wf.lastRun, t)}</span>}
                  </div>
                </div>
              );
            })}
      </div>
      <div className="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-700/30 flex justify-between text-xs text-gray-400">
        <span>{recentWf.length}</span>
        {wfFailed > 0 && <span className="text-red-500 font-medium">{wfFailed} {t("dashboard.status.failed")}</span>}
      </div>
    </SectionCard>
  );
};
