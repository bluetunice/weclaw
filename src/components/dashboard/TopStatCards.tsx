import React from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export interface StatCardItem {
  title: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action?: () => void;
  actionLabel?: string;
}

interface Props {
  items: StatCardItem[];
  t: (k: string) => string;
}

/**
 * 顶部统计卡片组：每行最多 4 列，超出自动换行。
 * 移动端 2 列，≥md 4 列（固定，超过 4 个自然换到第二行）。
 */
export const TopStatCards: React.FC<Props> = ({ items, t }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {items.map((s, i) => (
      <div
        key={i}
        onClick={s.action}
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 transition-all hover:shadow-md ${
          s.action ? "cursor-pointer hover:border-gray-200 dark:hover:border-gray-600" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide truncate">{s.title}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5 truncate">{s.value}</p>
            {s.sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{s.sub}</p>}
          </div>
          <div className={`flex-shrink-0 p-2 rounded-lg ${s.color}`}>
            <s.icon className="h-4 w-4" />
          </div>
        </div>
        {s.action && (
          <div className="mt-2 text-[11px] font-medium text-primary-600 flex items-center gap-0.5">
            {s.actionLabel ?? t("dashboard.lastRun")} <ChevronRightIcon className="h-3 w-3" />
          </div>
        )}
      </div>
    ))}
  </div>
);
