import React from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Tool, ToolPermission } from "../../types";
import {
  TOOL_TYPE_COLORS,
  PERMISSION_COLORS,
} from "./toolUtils";

interface ToolCardProps {
  tool: Tool;
  onEdit: (tool: Tool) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onPermissionChange: (id: string, perm: ToolPermission) => void;
  t: (key: string) => string;
}

const PERMISSIONS: ToolPermission[] = ["read_only", "read_write", "disabled"];

const ToolCard: React.FC<ToolCardProps> = ({
  tool, onEdit, onDelete, onToggle, onPermissionChange, t,
}) => {
  const typeColor = TOOL_TYPE_COLORS[tool.type];
  const typeLabel = t(`tools.type.${tool.type}`);
  const permColor = PERMISSION_COLORS[tool.permission];

  return (
    <div
      className={`group flex flex-col bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 ${
        tool.enabled && tool.permission !== "disabled"
          ? "border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
          : "border-dashed border-gray-200 dark:border-gray-700 opacity-60"
      }`}
    >
      {/* 头部：图标 + 名称 + 类型 */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <div className="flex-shrink-0 text-2xl leading-none mt-0.5">{tool.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {tool.name || t("tools.unnamed")}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border flex-shrink-0 ${typeColor}`}>
              {typeLabel}
            </span>
            {tool.builtin && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full flex-shrink-0">
                {t("tools.builtin")}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
            {tool.description || t("tools.noDesc")}
          </p>
        </div>
        {/* 启用开关 */}
        <button
          onClick={() => onToggle(tool.id)}
          className="flex-shrink-0 relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none mt-0.5"
          style={{ width: 32, height: 18 }}
          title={tool.enabled ? t("tools.toggleEnable") : t("tools.toggleDisable")}
        >
          <span
            className={`absolute inset-0 rounded-full transition-colors ${
              tool.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
          <span
            className={`relative inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${
              tool.enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* 参数数量 + 分类 */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {tool.category}
        </span>
        {tool.params.length > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {tool.params.length} {t("tools.paramCount")}
          </span>
        )}
        {(tool.usageCount ?? 0) > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            · {t("tools.callCount")} {tool.usageCount} {t("tools.callCountUnit")}
          </span>
        )}
      </div>

      {/* 底部：权限控制 + 操作 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
        <div className="flex items-center gap-1.5">
          <ShieldCheckIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          <select
            value={tool.permission}
            onChange={(e) => onPermissionChange(tool.id, e.target.value as ToolPermission)}
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border outline-none cursor-pointer bg-transparent ${permColor}`}
          >
            {PERMISSIONS.map((p) => (
              <option key={p} value={p} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {t(`tools.perm.${p}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(tool)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={t("tools.btnEdit")}
          >
            <PencilSquareIcon className="h-3.5 w-3.5" />
          </button>
          {!tool.builtin && (
            <button
              onClick={() => onDelete(tool.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={t("tools.btnDelete")}
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
