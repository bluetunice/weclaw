import React from "react";
import { WrenchScrewdriverIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { SectionCard, StatsRow } from "./SectionCard";
import { Tool } from "../../types";
import { TOOL_TYPE_LABELS, TOOL_TYPE_COLORS, PERMISSION_LABELS, PERMISSION_COLORS } from "../tools/toolUtils";

interface Props {
  tools: Tool[];
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  t: (k: string) => string;
}

export const ToolSection: React.FC<Props> = ({ tools, collapsed, onToggle, onNavigate, t }) => {
  const toolTotal     = tools.length;
  const toolEnabled   = tools.filter((t) => t.enabled).length;
  const toolReadWrite = tools.filter((t) => t.permission === "read_write" && t.enabled).length;
  const toolDisabled  = tools.filter((t) => t.permission === "disabled").length;
  const recentTools   = [...tools].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4);

  return (
    <SectionCard
      icon={<WrenchScrewdriverIcon className="h-4 w-4 text-teal-600" />}
      iconBg="bg-teal-50 dark:bg-teal-900/30"
      title={t("dashboard.tools")}
      collapsed={collapsed}
      onToggle={onToggle}
      onNavigate={onNavigate}
      badge={toolReadWrite > 0 ? <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full">{toolReadWrite} {t("dashboard.tools.readWrite")}</span> : undefined}
      summary={
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.total")} <strong className="text-gray-800 dark:text-gray-100">{toolTotal}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.enabled")} <strong className="text-teal-600">{toolEnabled}</strong></span>
          {toolReadWrite > 0 && <><span className="text-gray-300 dark:text-gray-600">|</span><span className="text-amber-600 font-medium">{toolReadWrite} {t("dashboard.tools.readWrite")}</span></>}
        </div>
      }
    >
      <StatsRow items={[
        { label: t("dashboard.total"),           value: toolTotal,     cls: "text-gray-800 dark:text-gray-100" },
        { label: t("dashboard.enabled"),         value: toolEnabled,   cls: "text-teal-600" },
        { label: t("dashboard.tools.readWrite"), value: toolReadWrite, cls: toolReadWrite > 0 ? "text-amber-500" : "text-gray-400" },
        { label: t("dashboard.tools.disabled"),  value: toolDisabled,  cls: toolDisabled > 0 ? "text-gray-500" : "text-gray-400" },
      ]} />
      {toolReadWrite > 0 && (
        <div className="flex items-start gap-2 mx-5 my-2.5 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
          <ShieldExclamationIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400">{t("dashboard.tools.securityHint")}</p>
        </div>
      )}
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {recentTools.length === 0
          ? <p className="text-sm text-gray-400 text-center py-5">{t("dashboard.noTools")}</p>
          : recentTools.map((tool) => (
              <div key={tool.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-base ${tool.enabled ? "bg-teal-50 dark:bg-teal-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{tool.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TOOL_TYPE_COLORS[tool.type]}`}>{TOOL_TYPE_LABELS[tool.type]}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${PERMISSION_COLORS[tool.permission]}`}>{PERMISSION_LABELS[tool.permission]}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${tool.enabled ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" : "bg-gray-100 dark:bg-gray-700 text-gray-400"}`}>
                    {tool.enabled ? t("dashboard.enabled") : t("dashboard.disabled")}
                  </span>
                  <span className="text-[11px] text-gray-400 truncate max-w-[80px]">{tool.category}</span>
                </div>
              </div>
            ))}
      </div>
      <div className="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-700/30 flex justify-between text-xs text-gray-400">
        <span>{recentTools.length}</span>
        <span>{toolEnabled} {t("dashboard.enabled")}</span>
      </div>
    </SectionCard>
  );
};
