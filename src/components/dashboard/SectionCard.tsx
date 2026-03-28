import React from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

// ─── SectionCard ──────────────────────────────────────────────────────────────

export interface SectionCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  badge?: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  navigateLabel?: string;
  /** 折叠态摘要行 */
  summary: React.ReactNode;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  icon, iconBg, title, badge, collapsed, onToggle,
  onNavigate, navigateLabel = "全部", summary, children,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    {/* 标题栏 */}
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 dark:border-gray-700">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 flex-1 min-w-0 text-left group"
      >
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${iconBg}`}>{icon}</div>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{title}</span>
        {badge}
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
      </button>
      {onNavigate && (
        <button
          onClick={onNavigate}
          className="ml-3 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5 font-medium flex-shrink-0"
        >
          {navigateLabel} <ChevronRightIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>

    {/* 折叠摘要 */}
    {collapsed && (
      <div className="px-5 py-3 bg-gray-50/40 dark:bg-gray-700/40">{summary}</div>
    )}

    {/* 展开内容 */}
    {!collapsed && children}
  </div>
);

// ─── StatsRow ─────────────────────────────────────────────────────────────────

export interface StatsRowProps {
  items: { label: string; value: number | string; cls: string }[];
}

export const StatsRow: React.FC<StatsRowProps> = ({ items }) => (
  <div
    className="grid divide-x divide-gray-50 dark:divide-gray-700 border-b border-gray-50 dark:border-gray-700"
    style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
  >
    {items.map((s) => (
      <div key={s.label} className="flex flex-col items-center py-3">
        <span className={`text-xl font-bold ${s.cls}`}>{s.value}</span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</span>
      </div>
    ))}
  </div>
);
