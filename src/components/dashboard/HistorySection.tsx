import React from "react";
import { ClockIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon, CheckIcon, XMarkIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { SectionCard, StatsRow } from "./SectionCard";
import { OperationHistory } from "../../types";
import { timeAgo } from "./dashboardTypes";

const statusCfgMap: Record<string, { icon: React.ReactNode; cls: string }> = {
  completed: { icon: <CheckCircleIcon className="h-3.5 w-3.5" />,       cls: "text-green-600 bg-green-50" },
  success:   { icon: <CheckCircleIcon className="h-3.5 w-3.5" />,       cls: "text-green-600 bg-green-50" },
  failed:    { icon: <XMarkIcon className="h-3.5 w-3.5" />,             cls: "text-red-600 bg-red-50" },
  error:     { icon: <XMarkIcon className="h-3.5 w-3.5" />,             cls: "text-red-600 bg-red-50" },
  warning:   { icon: <ExclamationCircleIcon className="h-3.5 w-3.5" />, cls: "text-amber-600 bg-amber-50" },
  pending:   { icon: <ClockIcon className="h-3.5 w-3.5" />,             cls: "text-gray-500 bg-gray-50" },
  allowed:   { icon: <CheckIcon className="h-3.5 w-3.5" />,             cls: "text-green-600 bg-green-50" },
};

interface Props {
  history: OperationHistory[];
  loading: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  t: (k: string) => string;
}

export const HistorySection: React.FC<Props> = ({ history, loading, collapsed, onToggle, onNavigate, t }) => {
  const histTotal   = history.length;
  const histSuccess = history.filter((h) => ["completed","success","allowed"].includes((h.operation_status||"").toLowerCase())).length;
  const histFailed  = history.filter((h) => ["failed","error"].includes((h.operation_status||"").toLowerCase())).length;
  const recentHist  = history.slice(0, 5);
  const histTypes   = history.reduce<Record<string, number>>((acc, h) => {
    const tp = h.operation_type || "other"; acc[tp] = (acc[tp] || 0) + 1; return acc;
  }, {});

  return (
    <SectionCard
      icon={<ClockIcon className="h-4 w-4 text-gray-500" />}
      iconBg="bg-gray-100 dark:bg-gray-700"
      title={t("dashboard.history")}
      collapsed={collapsed}
      onToggle={onToggle}
      onNavigate={onNavigate}
      badge={histFailed > 0 ? <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full">{histFailed} {t("dashboard.status.failed")}</span> : undefined}
      summary={
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.total")} <strong className="text-gray-800 dark:text-gray-100">{histTotal}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.status.success")} <strong className="text-green-600">{histSuccess}</strong></span>
          {histFailed > 0 && <><span className="text-gray-300 dark:text-gray-600">|</span><span className="text-red-500 font-medium">{histFailed} {t("dashboard.status.failed")}</span></>}
        </div>
      }
    >
      <StatsRow items={[
        { label: t("dashboard.total"),          value: histTotal,   cls: "text-gray-800 dark:text-gray-100" },
        { label: t("dashboard.status.success"), value: histSuccess, cls: "text-green-600" },
        { label: t("dashboard.status.failed"),  value: histFailed,  cls: histFailed > 0 ? "text-red-500" : "text-gray-400" },
        { label: "Types",                        value: Object.keys(histTypes).length, cls: "text-gray-600" },
      ]} />
      {Object.keys(histTypes).length > 0 && (
        <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-700">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(histTypes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, cnt]) => (
              <span key={type} className="text-[11px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-medium">
                {t(`dashboard.op.${type}`) !== `dashboard.op.${type}` ? t(`dashboard.op.${type}`) : type} · {cnt}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {loading
          ? <div className="flex items-center justify-center py-8"><ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" /></div>
          : recentHist.length === 0
            ? <p className="text-sm text-gray-400 text-center py-5">{t("dashboard.noHistory")}</p>
            : recentHist.map((h) => {
                const rawStatus = (h.operation_status || "").toLowerCase();
                const sc = statusCfgMap[rawStatus] ?? { icon: <InformationCircleIcon className="h-3.5 w-3.5" />, cls: "text-blue-600 bg-blue-50" };
                const statusLabel = t(`dashboard.status.${rawStatus}`) !== `dashboard.status.${rawStatus}` ? t(`dashboard.status.${rawStatus}`) : h.operation_status;
                const opKey = `dashboard.op.${h.operation_type}`;
                const opLabel = t(opKey) !== opKey ? t(opKey) : h.operation_type;
                return (
                  <div key={h.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                    <div className={`flex-shrink-0 p-1.5 rounded-lg ${sc.cls}`}>{sc.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{opLabel}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{h.details}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${sc.cls}`}>{statusLabel}</span>
                      <span className="text-[11px] text-gray-400">{timeAgo(h.timestamp, t)}</span>
                    </div>
                  </div>
                );
              })}
      </div>
      <div className="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-700/30 flex justify-between text-xs text-gray-400">
        <span>{recentHist.length}</span>
        {histFailed > 0 && <span className="text-red-500 font-medium">{histFailed} {t("dashboard.status.failed")}</span>}
      </div>
    </SectionCard>
  );
};
