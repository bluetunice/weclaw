import React from "react";
import { DocumentTextIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { SectionCard, StatsRow } from "./SectionCard";
import { taskStatusCfg, taskPriCfg, timeAgo } from "./dashboardTypes";

interface LocalTask { id: string; title: string; status: string; priority: string; updatedAt: Date; }

interface Props {
  tasks: LocalTask[];
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  t: (k: string) => string;
}

export const TaskSection: React.FC<Props> = ({ tasks, collapsed, onToggle, onNavigate, t }) => {
  const taskTotal      = tasks.length;
  const taskPending    = tasks.filter((t) => t.status === "pending").length;
  const taskInProgress = tasks.filter((t) => t.status === "in_progress").length;
  const taskCompleted  = tasks.filter((t) => t.status === "completed").length;
  const taskCritical   = tasks.filter((t) => t.priority === "critical").length;
  const completionRate = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;
  const recentTasks    = [...tasks].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 4);

  return (
    <SectionCard
      icon={<DocumentTextIcon className="h-4 w-4 text-amber-600" />}
      iconBg="bg-amber-50"
      title={t("dashboard.tasks")}
      collapsed={collapsed}
      onToggle={onToggle}
      onNavigate={onNavigate}
      badge={taskCritical > 0 ? <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full">{taskCritical} {t("dashboard.priority.critical")}</span> : undefined}
      summary={
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.total")} <strong className="text-gray-800 dark:text-gray-100">{taskTotal}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{t("tasks.inProgress")} <strong className="text-blue-600">{taskInProgress}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400"><strong className="text-green-600">{completionRate}%</strong></span>
          {taskCritical > 0 && <><span className="text-gray-300 dark:text-gray-600">|</span><span className="text-red-500 font-medium">{taskCritical} {t("dashboard.priority.critical")}</span></>}
        </div>
      }
    >
      <StatsRow items={[
        { label: t("dashboard.total"),  value: taskTotal,      cls: "text-gray-800 dark:text-gray-100" },
        { label: t("tasks.pending"),    value: taskPending,    cls: "text-amber-600" },
        { label: t("tasks.inProgress"), value: taskInProgress, cls: "text-blue-600" },
        { label: t("tasks.completed"),  value: taskCompleted,  cls: "text-green-600" },
      ]} />
      <div className="px-5 py-2.5 border-b border-gray-50 dark:border-gray-700">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t("tasks.completed")}</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{completionRate}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
        </div>
        {taskCritical > 0 && (
          <p className="text-[11px] text-red-500 font-medium mt-1.5 flex items-center gap-1">
            <ExclamationCircleIcon className="h-3.5 w-3.5" />{taskCritical} {t("dashboard.priority.critical")}
          </p>
        )}
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {recentTasks.length === 0
          ? <p className="text-sm text-gray-400 text-center py-5">{t("dashboard.noTask")}</p>
          : recentTasks.map((task) => {
              const sc = taskStatusCfg[task.status] ?? { cls: "text-gray-500 bg-gray-50", dot: "bg-gray-400" };
              const pc = taskPriCfg[task.priority]  ?? { cls: "text-gray-500 bg-gray-100" };
              return (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                  <div className={`flex-shrink-0 h-2 w-2 rounded-full ${sc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${sc.cls}`}>{t(`dashboard.status.${task.status}`)}</span>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${pc.cls}`}>{t(`dashboard.priority.${task.priority}`)}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(task.updatedAt, t)}</span>
                </div>
              );
            })}
      </div>
      <div className="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-700/30 flex justify-between text-xs text-gray-400">
        <span>{recentTasks.length}</span>
        <span>{taskPending} {t("tasks.pending")}</span>
      </div>
    </SectionCard>
  );
};
