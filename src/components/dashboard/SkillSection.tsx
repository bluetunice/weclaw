import React from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { SectionCard, StatsRow } from "./SectionCard";
import { Skill } from "../../types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../skills/skillUtils";

interface Props {
  skills: Skill[];
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  t: (k: string) => string;
}

export const SkillSection: React.FC<Props> = ({ skills, collapsed, onToggle, onNavigate, t }) => {
  const skillTotal      = skills.length;
  const skillEnabled    = skills.filter((s) => s.enabled).length;
  const skillByCategory = skills.reduce<Record<string, number>>((acc, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {});
  const recentSkills    = [...skills].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4);

  return (
    <SectionCard
      icon={<SparklesIcon className="h-4 w-4 text-violet-600" />}
      iconBg="bg-violet-50 dark:bg-violet-900/30"
      title={t("dashboard.skills")}
      collapsed={collapsed}
      onToggle={onToggle}
      onNavigate={onNavigate}
      summary={
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.total")} <strong className="text-gray-800 dark:text-gray-100">{skillTotal}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.enabled")} <strong className="text-violet-600">{skillEnabled}</strong></span>
        </div>
      }
    >
      <StatsRow items={[
        { label: t("dashboard.total"),   value: skillTotal,               cls: "text-gray-800 dark:text-gray-100" },
        { label: t("dashboard.enabled"), value: skillEnabled,             cls: "text-violet-600" },
        { label: t("dashboard.disabled"),value: skillTotal - skillEnabled, cls: "text-gray-400" },
        { label: t("dashboard.skills.categories"), value: Object.keys(skillByCategory).length, cls: "text-violet-500" },
      ]} />
      {Object.keys(skillByCategory).length > 0 && (
        <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-700">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(skillByCategory).sort((a, b) => b[1] - a[1]).map(([cat, cnt]) => (
              <span key={cat} className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat} · {cnt}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {recentSkills.length === 0
          ? <p className="text-sm text-gray-400 text-center py-5">{t("dashboard.noSkills")}</p>
          : recentSkills.map((sk) => (
              <div key={sk.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                <div className={`flex-shrink-0 p-1.5 rounded-lg ${sk.enabled ? "bg-violet-50 dark:bg-violet-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
                  <SparklesIcon className={`h-3.5 w-3.5 ${sk.enabled ? "text-violet-500" : "text-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{sk.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[sk.category] ?? ""}`}>
                      {CATEGORY_LABELS[sk.category] ?? sk.category}
                    </span>
                    {sk.builtin && <span className="text-[10px] text-gray-400 dark:text-gray-500">{t("dashboard.skills.builtin")}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${sk.enabled ? "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" : "bg-gray-100 dark:bg-gray-700 text-gray-400"}`}>
                    {sk.enabled ? t("dashboard.enabled") : t("dashboard.disabled")}
                  </span>
                  {(sk.usageCount ?? 0) > 0 && <span className="text-[11px] text-gray-400">{sk.usageCount} {t("dashboard.skills.used")}</span>}
                </div>
              </div>
            ))}
      </div>
      <div className="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-700/30 flex justify-between text-xs text-gray-400">
        <span>{recentSkills.length}</span>
        <span>{skillEnabled} {t("dashboard.enabled")}</span>
      </div>
    </SectionCard>
  );
};
