import React from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Skill } from "../../types";
import { CATEGORY_COLORS } from "./skillUtils";

interface SkillCardProps {
  skill: Skill;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onExportSingle: (skill: Skill) => void;
  onUse: (skill: Skill) => void;
  t: (key: string) => string;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill, onEdit, onDelete, onToggle, onExportSingle, onUse, t,
}) => {
  const catColor = CATEGORY_COLORS[skill.category];
  const catLabel = t(`skills.cat.${skill.category}`);

  return (
    <div
      className={`group relative flex flex-col bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 ${
        skill.enabled
          ? "border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
          : "border-dashed border-gray-200 dark:border-gray-700 opacity-60"
      }`}
    >
      {/* 顶部：分类 + 内置标识 */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${catColor}`}>
          {catLabel}
        </span>
        <div className="flex items-center gap-1.5">
          {skill.builtin && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
              {t("skills.builtin")}
            </span>
          )}
          <button
            onClick={() => onToggle(skill.id)}
            className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none ${
              skill.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
            title={skill.enabled ? t("skills.toggleEnable") : t("skills.toggleDisable")}
            style={{ width: 32, height: 18 }}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${
                skill.enabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="px-4 pb-3 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {skill.name || t("skills.unnamed")}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
          {skill.description || t("skills.noDesc")}
        </p>

        {skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
            {skill.tags.length > 3 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                +{skill.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 底部：元信息 + 操作按钮 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
            v{skill.version} · {skill.author}
          </span>
          {(skill.usageCount ?? 0) > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              · {skill.usageCount} {t("skills.usageCount")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onUse(skill)}
            disabled={!skill.enabled}
            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-30"
            title={t("skills.btnUse")}
          >
            <SparklesIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onEdit(skill)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={t("skills.btnEdit")}
          >
            <PencilSquareIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onExportSingle(skill)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={t("skills.btnExport")}
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          </button>
          {!skill.builtin && (
            <button
              onClick={() => onDelete(skill.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={t("skills.btnDelete")}
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillCard;
