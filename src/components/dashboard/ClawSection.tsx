import React from "react";
import { BoltIcon, CheckCircleIcon, XCircleIcon, ClockIcon, NoSymbolIcon } from "@heroicons/react/24/outline";
import { SectionCard, StatsRow } from "./SectionCard";
import { ClawTask } from "../../types/claw";

interface Props {
  tasks: ClawTask[];
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  t: (k: string) => string;
}

// 计算相对时间
function timeAgo(dateStr: string, t: (k: string) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return t("dashboard.justNow") || "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}${t("dashboard.minutesAgo") || "分钟前"}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}${t("dashboard.hoursAgo") || "小时前"}`;
  return `${Math.floor(diff / 86400)}${t("dashboard.daysAgo") || "天前"}`;
}

// 任务状态配置
const taskStatusCfg: Record<string, { cls: string; dot: string }> = {
  idle:       { cls: "text-gray-500 bg-gray-50",        dot: "bg-gray-400" },
  planning:   { cls: "text-purple-600 bg-purple-50",   dot: "bg-purple-400" },
  running:    { cls: "text-blue-600 bg-blue-50",        dot: "bg-blue-500 animate-pulse" },
  paused:     { cls: "text-amber-600 bg-amber-50",     dot: "bg-amber-400" },
  done:       { cls: "text-green-600 bg-green-50",      dot: "bg-green-500" },
  failed:     { cls: "text-red-600 bg-red-50",          dot: "bg-red-500" },
  cancelled:  { cls: "text-gray-400 bg-gray-100",       dot: "bg-gray-300" },
};

export const ClawSection: React.FC<Props> = ({ tasks, collapsed, onToggle, onNavigate, t }) => {
  const total       = tasks.length;
  const done        = tasks.filter((tk) => tk.status === "done").length;
  const running     = tasks.filter((tk) => tk.status === "running" || tk.status === "planning").length;
  const failed      = tasks.filter((tk) => tk.status === "failed").length;
  const idle        = tasks.filter((tk) => tk.status === "idle").length;
  const totalTokens = tasks.reduce((s, tk) => s + (tk.totalTokens ?? 0), 0);
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <SectionCard
      icon={<BoltIcon className="h-4 w-4 text-indigo-600" />}
      iconBg="bg-indigo-50"
      title={t("dashboard.claw") || "Claw 概览"}
      collapsed={collapsed}
      onToggle={onToggle}
      onNavigate={onNavigate}
      badge={
        failed > 0
          ? <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full">{failed} {t("dashboard.status.failed")}</span>
          : running > 0
          ? <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded-full animate-pulse">{running} {t("dashboard.status.running")}</span>
          : undefined
      }
      summary={
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.total")} <strong className="text-gray-800 dark:text-gray-100">{total}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.status.success")} <strong className="text-green-600">{done}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.claw.running")} <strong className="text-blue-600">{running}</strong></span>
          {failed > 0 && <><span className="text-gray-300 dark:text-gray-600">|</span><span className="text-red-500 font-medium">{failed} {t("dashboard.status.failed")}</span></>}
        </div>
      }
    >
      <StatsRow items={[
        { label: t("dashboard.total"),        value: total,       cls: "text-gray-800 dark:text-gray-100" },
        { label: t("dashboard.status.success"), value: done,    cls: "text-green-600" },
        { label: t("dashboard.claw.running"),   value: running,  cls: "text-blue-600" },
        { label: t("dashboard.status.failed"),  value: failed,   cls: "text-red-500" },
      ]} />
      <div className="px-5 py-2.5 border-b border-gray-50 dark:border-gray-700">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t("dashboard.totalTokens")}</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {totalTokens > 0 ? (totalTokens / 1000).toFixed(1) + "K" : "—"}
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {recentTasks.length === 0
          ? <p className="text-sm text-gray-400 text-center py-5">{t("dashboard.noClaw") || "暂无 Claw 任务"}</p>
          : recentTasks.map((task) => {
              const sc = taskStatusCfg[task.status] ?? taskStatusCfg["idle"];
              const stepDone = task.steps.filter((s) => s.status === "done").length;
              const stepTotal = task.steps.length;
              return (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                  <div className={`flex-shrink-0 h-2 w-2 rounded-full ${sc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.goal}</p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${sc.cls}`}>
                        {task.status === "planning" ? t("dashboard.claw.planning") : t(`dashboard.status.${task.status}`) || task.status}
                      </span>
                      {stepTotal > 0 && (
                        <span className="text-[11px] text-gray-400 px-1.5 py-0.5 bg-gray-50 dark:bg-gray-700 rounded">
                          {stepDone}/{stepTotal} {t("dashboard.claw.steps") || "步"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(task.updatedAt, t)}</span>
                </div>
              );
            })}
      </div>
      <div className="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-700/30 flex justify-between text-xs text-gray-400">
        <span>{recentTasks.length}</span>
        {idle > 0 && <span>{idle} {t("dashboard.status.pending") || "待处理"}</span>}
      </div>
    </SectionCard>
  );
};
